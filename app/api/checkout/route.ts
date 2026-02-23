import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ProductConfig, computePrice } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ProductConfig = await req.json();

    const expectedPrice = computePrice(body);
    if (body.price !== expectedPrice) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
              images: [body.transformedImageUrl],
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
        transformedImageUrl: body.transformedImageUrl,
        originalImageUrl: body.originalImageUrl,
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#configurateur`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
