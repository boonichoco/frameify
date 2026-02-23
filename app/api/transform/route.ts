import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { transformToArtStyle } from "@/lib/ai";

// OpenAI peut prendre 30-60s — on monte la limite à 60s (Vercel hobby)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Image trop lourde (max 20 Mo)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pngBuffer = await transformToArtStyle(buffer, file.type);

    // Upload du PNG 1024px sur Vercel Blob — URL courte pour preview + metadata Stripe
    const filename = `preview-${Date.now()}.png`;
    const { url } = await put(filename, pngBuffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[/api/transform]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur lors de la transformation" },
      { status: 500 }
    );
  }
}
