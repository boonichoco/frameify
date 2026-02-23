import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de diagnostic — liste les produits Gelato.
 * Usage :
 *   GET /api/gelato/catalog?q=framed+poster           → recherche par mot-clé
 *   GET /api/gelato/catalog?type=framed-poster        → filtre par type (côté client)
 * Permet de trouver les productUid exacts à utiliser dans lib/gelato.ts
 */
export async function GET(req: NextRequest) {
  if (!process.env.GELATO_API_KEY) {
    return NextResponse.json({ error: "GELATO_API_KEY manquant dans .env.local" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q") ?? "framed poster";
  const typeFilter = searchParams.get("type"); // ex: "framed-poster"

  const res = await fetch(
    `https://product.gelatoapis.com/v3/products?keyword=${encodeURIComponent(keyword)}&limit=100`,
    {
      headers: {
        "X-API-KEY": process.env.GELATO_API_KEY,
      },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error, httpStatus: res.status }, { status: res.status });
  }

  const data = await res.json();

  // Filtre optionnel par productTypeUid + extrait seulement les champs utiles
  const products: { productUid: string; productTypeUid: string; size: string; color: string; orientation: string }[] =
    (data.products ?? [])
      .filter((p: { productTypeUid: string }) => !typeFilter || p.productTypeUid === typeFilter)
      .map((p: { productUid: string; productTypeUid: string; dimensions: { name: string; valueFormatted: string }[] }) => ({
        productUid: p.productUid,
        productTypeUid: p.productTypeUid,
        size: p.dimensions?.find((d) => d.name === "size")?.valueFormatted ?? "",
        color: p.dimensions?.find((d) => d.name === "color")?.valueFormatted ?? "",
        orientation: p.dimensions?.find((d) => d.name === "orientation")?.valueFormatted ?? "",
      }));

  return NextResponse.json({ count: products.length, products });
}
