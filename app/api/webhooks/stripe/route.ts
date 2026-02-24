import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createProdigiOrder } from "@/lib/prodigi";
import { put } from "@vercel/blob";
import sharp from "sharp";
import Stripe from "stripe";

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
  console.log("[webhook] metadata:", JSON.stringify(metadata));

  if (!metadata || !shipping?.address || !customer_details?.email) {
    console.error("[webhook] Données manquantes", { metadata: !!metadata, shipping: !!shipping?.address, email: !!customer_details?.email });
    return;
  }

  const addr = shipping.address;
  const name = shipping.name ?? customer_details.name ?? "Client";
  const imageUrl = metadata.transformedImageUrl;

  if (!imageUrl) {
    console.error("[webhook] Pas de transformedImageUrl dans metadata");
    return;
  }

  // Upscale 4× pour impression — si ça échoue, on utilise l'image preview
  const printImageUrl = await upscaleForPrint(imageUrl, session.id);
  console.log("[webhook] printImageUrl:", printImageUrl.slice(0, 100));

  // Créer la commande Prodigi
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

    console.log("[webhook] Prodigi OK:", JSON.stringify(order));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] Prodigi ERREUR:", msg);
  }
}

async function upscaleForPrint(previewUrl: string, sessionId: string): Promise<string> {
  try {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const sourceBuffer = Buffer.from(await res.arrayBuffer());

    const { width = 1024, height = 1024 } = await sharp(sourceBuffer).metadata();

    const printBuffer = await sharp(sourceBuffer)
      .resize(width * 4, height * 4, { kernel: "lanczos3" })
      .png({ quality: 90 })
      .toBuffer();

    const { url } = await put(`print-${sessionId}.png`, printBuffer, {
      access: "public",
      contentType: "image/png",
    });

    console.log("[webhook] Upscale OK:", url.slice(0, 80));
    return url;
  } catch (err) {
    console.warn("[webhook] Upscale échoué, fallback preview:", err instanceof Error ? err.message : err);
    return previewUrl;
  }
}
