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

    // Upload sur Vercel Blob si disponible, sinon fallback data URL
    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const filename = `preview-${Date.now()}.png`;
        const result = await put(filename, pngBuffer, {
          access: "public",
          contentType: "image/png",
        });
        url = result.url;
      } catch (blobErr) {
        console.warn("[/api/transform] Blob upload échoué, fallback data URL:", blobErr);
        url = `data:image/png;base64,${pngBuffer.toString("base64")}`;
      }
    } else {
      url = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[/api/transform]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur lors de la transformation" },
      { status: 500 }
    );
  }
}
