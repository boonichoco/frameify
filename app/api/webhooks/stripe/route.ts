import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createProdigiOrder } from "@/lib/prodigi";
import { put } from "@vercel/blob";
import sharp from "sharp";
import Stripe from "stripe";

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

  if (!metadata || !shipping?.address || !customer_details?.email) {
    console.error("[webhook] Données de commande manquantes", session.id);
    return;
  }

  const addr = shipping.address;
  const name = shipping.name ?? customer_details.name ?? "Client";

  // Upscale 4× + gravure du texte — uniquement sur commande confirmée
  const printImageUrl = await upscaleForPrint(
    metadata.transformedImageUrl,
    session.id,
    metadata.customText
  );

  try {
    const order = await createProdigiOrder(
      [
        {
          imageUrl: printImageUrl,
          size: metadata.size,
          color: metadata.color,
          passepartout: metadata.passepartout ?? "oui",
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

    console.log(`[webhook] Commande Prodigi créée: ${order.id} (session: ${session.id})`);
  } catch (err) {
    console.error("[webhook] Erreur création commande Prodigi:", err);
  }
}

/**
 * Charge la police Titan One depuis Google Fonts et la retourne en base64.
 * Mise en cache en mémoire pour éviter de re-télécharger à chaque appel.
 */
let fontCache: string | null = null;
async function getTitanOneBase64(): Promise<string> {
  if (fontCache) return fontCache;
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css2?family=Titan+One&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
  );
  const css = await cssRes.text();
  const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!urlMatch) throw new Error("Impossible de trouver l'URL de la police Titan One");
  const fontRes = await fetch(urlMatch[1]);
  const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
  fontCache = fontBuffer.toString("base64");
  return fontCache;
}

/**
 * Crée un overlay SVG avec le texte personnalisé.
 * Le texte est centré en haut de l'image, en majuscules, blanc cassé.
 */
async function createTextOverlay(
  text: string,
  width: number,
  height: number
): Promise<Buffer> {
  const fontBase64 = await getTitanOneBase64();
  const fontSize = Math.round(width * 0.045);
  const topPadding = Math.round(height * 0.06);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lineHeight = fontSize * 1.4;

  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${width / 2}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'Titan One';
        src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
      }
    </style>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="black" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.18)}" fill="url(#fade)"/>
  <text
    font-family="'Titan One', sans-serif"
    font-size="${fontSize}"
    fill="#F5F0E8"
    text-anchor="middle"
    letter-spacing="${Math.round(fontSize * 0.12)}"
    y="${topPadding + fontSize}"
  >${tspans}</text>
</svg>`;

  return Buffer.from(svg);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function upscaleForPrint(
  previewUrl: string,
  sessionId: string,
  customText?: string
): Promise<string> {
  try {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error(`Fetch image failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);

    const { width = 1024, height = 1024 } = await sharp(sourceBuffer).metadata();
    const printW = width * 4;
    const printH = height * 4;

    let pipeline = sharp(sourceBuffer).resize(printW, printH, { kernel: "lanczos3" });

    // Graver le texte personnalisé dans l'image
    if (customText?.trim()) {
      const textOverlay = await createTextOverlay(customText.trim(), printW, printH);
      pipeline = pipeline.composite([{ input: textOverlay, top: 0, left: 0 }]);
    }

    const printBuffer = await pipeline.webp({ quality: 90 }).toBuffer();

    const { url } = await put(`print-${sessionId}.webp`, printBuffer, {
      access: "public",
      contentType: "image/webp",
    });

    return url;
  } catch (err) {
    console.warn("[webhook] Upscale échoué, utilisation preview:", err);
    return previewUrl;
  }
}
