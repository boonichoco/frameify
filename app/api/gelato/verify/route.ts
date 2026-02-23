import { NextResponse } from "next/server";

/**
 * Vérifie quels productUid sont valides dans le catalogue Gelato global.
 * Usage : GET /api/gelato/verify
 */

// UIDs construits d'après le pattern confirmé :
// framed_poster_{WxH-mm-WxH-inch}_{color}_wood_w12xt22-mm_plexiglass_{WxH-mm-WxH-inch}_200-gsm-80lb-uncoated_4-0_{orientation}
const CANDIDATES: { label: string; uid: string }[] = [
  // Blanc bois — tailles restantes
  { label: "40x40 blanc", uid: "framed_poster_400x400-mm-16x16-inch_white_wood_w12xt22-mm_plexiglass_400x400-mm-16x16-inch_200-gsm-80lb-uncoated_4-0_hor" },
  // Naturel bois — toutes tailles
  { label: "30x30 naturel", uid: "framed_poster_300x300-mm-12x12-inch_natural_wood_w12xt22-mm_plexiglass_300x300-mm-12x12-inch_200-gsm-80lb-uncoated_4-0_hor" },
  { label: "40x40 naturel", uid: "framed_poster_400x400-mm-16x16-inch_natural_wood_w12xt22-mm_plexiglass_400x400-mm-16x16-inch_200-gsm-80lb-uncoated_4-0_hor" },
  { label: "50x70 naturel", uid: "framed_poster_500x700-mm-20x28-inch_natural_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver" },
  // 20x20 variantes (le 8x8-inch était 404)
  { label: "20x20 noir v2", uid: "framed_poster_200x200-mm_black_wood_w12xt22-mm_plexiglass_200x200-mm_200-gsm-80lb-uncoated_4-0_hor" },
  { label: "20x20 noir v3 (7-9x7-9)", uid: "framed_poster_200x200-mm-7-9x7-9-inch_black_wood_w12xt22-mm_plexiglass_200x200-mm-7-9x7-9-inch_200-gsm-80lb-uncoated_4-0_hor" },
  // Noir bois — confirmés (contrôle)
  { label: "30x30 noir ✓", uid: "framed_poster_300x300-mm-12x12-inch_black_wood_w12xt22-mm_plexiglass_300x300-mm-12x12-inch_200-gsm-80lb-uncoated_4-0_hor" },
  { label: "40x40 blanc ✓", uid: "framed_poster_300x400-mm-12x16-inch_white_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_200-gsm-80lb-uncoated_4-0_hor" },
];

export async function GET() {
  if (!process.env.GELATO_API_KEY) {
    return NextResponse.json({ error: "GELATO_API_KEY manquant" }, { status: 500 });
  }

  const results = await Promise.all(
    CANDIDATES.map(async ({ label, uid }) => {
      const res = await fetch(
        `https://product.gelatoapis.com/v3/products/${encodeURIComponent(uid)}`,
        { headers: { "X-API-KEY": process.env.GELATO_API_KEY! } }
      );
      return {
        label,
        uid,
        valid: res.ok,
        status: res.status,
      };
    })
  );

  return NextResponse.json({
    valid: results.filter((r) => r.valid).map((r) => r.label),
    results,
  });
}
