import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createProdigiOrder } from "@/lib/prodigi";
import { put } from "@vercel/blob";
import sharp from "sharp";
import satori from "satori";
import Stripe from "stripe";
import React from "react";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] Signature invalide", err);
    return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleOrderCompleted(session);
  }

  return NextResponse.json({ received: true });
}

async function handleOrderCompleted(session: Stripe.Checkout.Session) {
  const { metadata, customer_details } = session;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipping = (session as any).shipping_details ?? (session as any).shipping as {
    address?: { line1?: string; city?: string; postal_code?: string; country?: string } | null;
    name?: string | null;
  } | null;

  console.log("[webhook] session:", session.id);

  if (!metadata || !shipping?.address || !customer_details?.email) {
    console.error("[webhook] Données manquantes");
    return;
  }

  const addr = shipping.address;
  const name = shipping.name ?? customer_details.name ?? "Client";
  const imageUrl = metadata.transformedImageUrl;

  if (!imageUrl) {
    console.error("[webhook] Pas de transformedImageUrl dans metadata");
    return;
  }

  // Upscale 4× + texte personnalisé pour impression
  const printImageUrl = await upscaleForPrint(imageUrl, session.id, metadata.customText);

  // Créer la commande Prodigi
  try {
    const order = await createProdigiOrder(
      [
        {
          imageUrl: printImageUrl,
          size: metadata.size,
          color: metadata.color,
          quantity: 1,
        },
      ],
      {
        name,
        email: customer_details.email,
        address: addr.line1 ?? "",
        city: addr.city ?? "",
        postCode: addr.postal_code ?? "",
        country: addr.country ?? "FR",
      },
      session.id
    );

    console.log("[webhook] Prodigi OK:", JSON.stringify(order));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] Prodigi ERREUR:", msg);
  }
}

// ── Upscale + text overlay ──────────────────────────────────────────

async function upscaleForPrint(
  previewUrl: string,
  sessionId: string,
  customText?: string
): Promise<string> {
  try {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const sourceBuffer = Buffer.from(await res.arrayBuffer());

    const { width = 1024, height = 1024 } = await sharp(sourceBuffer).metadata();
    const printW = width * 4;
    const printH = height * 4;

    let pipeline = sharp(sourceBuffer).resize(printW, printH, { kernel: "lanczos3" });

    // Graver le texte personnalisé via satori → SVG → sharp
    if (customText?.trim()) {
      try {
        const textPng = await renderTextOverlay(customText.trim(), printW, printH);
        pipeline = pipeline.composite([{ input: textPng, top: 0, left: 0 }]);
        console.log("[webhook] Text overlay OK");
      } catch (textErr) {
        console.warn("[webhook] Text overlay échoué:", textErr instanceof Error ? textErr.message : textErr);
      }
    }

    const printBuffer = await pipeline.png().toBuffer();

    const { url } = await put(`print-${sessionId}.png`, printBuffer, {
      access: "public",
      contentType: "image/png",
    });

    console.log("[webhook] Upscale OK");
    return url;
  } catch (err) {
    console.warn("[webhook] Upscale échoué, fallback preview:", err instanceof Error ? err.message : err);
    return previewUrl;
  }
}

// ── Rendu texte via satori (supporte les polices custom sur Vercel) ──

let fontData: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  // Récupérer l'URL du TTF depuis Google Fonts CSS
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css2?family=Titan+One&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
  );
  const css = await cssRes.text();
  const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!urlMatch) throw new Error("Font URL introuvable");
  const fontRes = await fetch(urlMatch[1]);
  fontData = await fontRes.arrayBuffer();
  return fontData;
}

async function renderTextOverlay(text: string, w: number, h: number): Promise<Buffer> {
  const font = await loadFont();
  const fontSize = Math.round(w * 0.04);
  const lines = text.split("\n").map((l) => l.trim().toUpperCase()).filter(Boolean);

  // Générer le SVG via satori (gère les polices custom)
  const svg = await satori(
    React.createElement(
      "div",
      {
        style: {
          width: w,
          height: h,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          paddingTop: Math.round(h * 0.05),
          background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 20%)",
        },
      },
      ...lines.map((line) =>
        React.createElement("span", {
          style: {
            color: "#F5F0E8",
            fontSize,
            fontFamily: "TitanOne",
            letterSpacing: Math.round(fontSize * 0.1),
          },
          children: line,
        })
      )
    ),
    {
      width: w,
      height: h,
      fonts: [
        {
          name: "TitanOne",
          data: font,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  // Convertir SVG → PNG transparent via sharp
  return sharp(Buffer.from(svg)).png().toBuffer();
}
