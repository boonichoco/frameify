import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createGelatoOrder } from "@/lib/gelato";
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

  // Upscale 4× pour l'impression — uniquement sur commande confirmée
  const printImageUrl = await upscaleForPrint(metadata.transformedImageUrl, session.id);

  try {
    const order = await createGelatoOrder(
      [
        {
          imageUrl: printImageUrl,
          size: metadata.size,
          color: metadata.color,
          finish: metadata.finish,
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

    console.log(`[webhook] Commande Gelato créée: ${order.id} (session: ${session.id})`);
  } catch (err) {
    console.error("[webhook] Erreur création commande Gelato:", err);
  }
}

async function upscaleForPrint(previewUrl: string, sessionId: string): Promise<string> {
  try {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error(`Fetch image failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);

    const { width = 1024, height = 1024 } = await sharp(sourceBuffer).metadata();

    const printBuffer = await sharp(sourceBuffer)
      .resize(width * 4, height * 4, { kernel: "lanczos3" })
      .webp({ quality: 90 })
      .toBuffer();

    const { url } = await put(`print-${sessionId}.webp`, printBuffer, {
      access: "public",
      contentType: "image/webp",
    });

    return url;
  } catch (err) {
    console.warn("[webhook] Upscale échoué, utilisation preview:", err);
    return previewUrl; // fallback sur la version preview
  }
}
