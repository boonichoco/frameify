import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ProductConfig, computePrice } from "@/types";

function isHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export async function POST(req: NextRequest) {
  try {
    const body: ProductConfig = await req.json();

    const expectedPrice = computePrice(body);
    if (body.price !== expectedPrice) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Stripe n'accepte que des URLs HTTPS pour images et metadata (500 chars max par valeur)
    const transformedUrl = isHttpUrl(body.transformedImageUrl) ? body.transformedImageUrl : "";
    const originalUrl = isHttpUrl(body.originalImageUrl) ? body.originalImageUrl : "";

    console.log("[/api/checkout] appUrl:", appUrl);
    console.log("[/api/checkout] transformedUrl:", transformedUrl ? transformedUrl.slice(0, 80) : "(vide)");
    console.log("[/api/checkout] originalUrl:", originalUrl ? originalUrl.slice(0, 80) : "(vide)");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: body.price * 100,
            product_data: {
              name: `Cadre Frameify · ${body.size} cm · ${body.finish}`,
              description: `Cadre ${body.color} · Passepartout: ${body.passepartout}`,
              ...(transformedUrl ? { images: [transformedUrl] } : {}),
            },
          },
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "PT"],
      },
      metadata: {
        size: body.size,
        finish: body.finish,
        color: body.color,
        passepartout: body.passepartout,
        ...(transformedUrl ? { transformedImageUrl: transformedUrl } : {}),
        ...(originalUrl ? { originalImageUrl: originalUrl } : {}),
        ...(body.customText ? { customText: body.customText } : {}),
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#configurateur`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/checkout]", message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
