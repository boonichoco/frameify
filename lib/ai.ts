import OpenAI, { toFile } from "openai";
import type { ArtStyle } from "@/types";

/**
 * Transforme une image en illustration artistique via OpenAI gpt-image-1.
 * Retourne un Buffer PNG 1024px — l'upscale 4× pour impression se fait
 * dans le webhook Stripe, uniquement lors d'une vraie commande.
 *
 * Sans OPENAI_API_KEY → mode mock (retourne l'image originale après 1.5s)
 */

const PROMPTS: Record<ArtStyle, string> = {
  ghibli:
    "Transform this photo into Studio Ghibli anime style. " +
    "Stay as faithful as possible to the original image: " +
    "keep every person, object, animal and element exactly where they are, " +
    "preserve the exact framing, angles, proportions and spatial relationships, " +
    "keep the same lighting direction and atmosphere. " +
    "Only change the visual rendering: apply soft watercolor painting, " +
    "hand-drawn illustration style with clean outlines, " +
    "and the warm natural colour palette typical of Hayao Miyazaki films. " +
    "Do not add, remove or move any element from the original scene.",

  flat:
    "Transform this photo into a flat illustration style. " +
    "Stay as faithful as possible to the original image: " +
    "keep every person, object, animal and element exactly where they are, " +
    "preserve the exact framing, angles, proportions and spatial relationships. " +
    "Only change the visual rendering: use warm, slightly pastel colours, " +
    "simple stylised shadows with minimal gradients, " +
    "clean sharp vector-like shapes with smooth edges, " +
    "a soft and simplified perspective, " +
    "and a sunny, idealised atmosphere. " +
    "Do not add, remove or move any element from the original scene.",
};

export async function transformToArtStyle(
  imageBuffer: Buffer,
  mimeType = "image/jpeg",
  style: ArtStyle = "ghibli"
): Promise<Buffer> {
  // Mode mock — pas de clé API
  if (!process.env.OPENAI_API_KEY) {
    await new Promise((r) => setTimeout(r, 1500));
    return imageBuffer;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const ext = mimeType.split("/")[1] || "jpg";
  const imageFile = await toFile(imageBuffer, `image.${ext}`, { type: mimeType });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt: PROMPTS[style],
    n: 1,
    size: "1024x1024",
    quality: "medium",
  });

  const images = response.data ?? [];
  const b64 = images[0]?.b64_json;
  if (!b64) throw new Error("OpenAI n'a retourné aucun résultat");

  return Buffer.from(b64, "base64");
}
