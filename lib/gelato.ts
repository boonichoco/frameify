/**
 * Gelato Print-on-Demand API v4
 * Docs : https://dashboard.gelato.com/docs/
 *
 * Pour trouver les productUid exacts, appeler :
 *   GET /api/gelato/catalog?q=framed
 */

const GELATO_API_URL = "https://order.gelatoapis.com";

/**
 * Table de correspondance taille + couleur → productUid Gelato.
 *
 * ⚠️  À compléter après activation des produits dans le dashboard Gelato :
 *     dashboard.gelato.com → Products → Wall Art → Framed Posters
 *     Puis vérifier via GET /api/gelato/catalog?q=framed+poster&type=framed-poster
 *
 * Seul produit confirmé à ce jour :
 *   30x40 noir bois : framed_poster_300x400-mm-12x16-inch_black_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_200-gsm-80lb-uncoated_4-0_ver
 */
// UIDs vérifiés via GET /api/gelato/verify — catalogue global Gelato
// Cadres bois : noir ✓ et blanc ✓ pour toutes les tailles
// Naturel (404) et 20x20 (404) ne sont pas disponibles dans le catalogue Gelato
const PRODUCT_UID_MAP: Record<string, Record<string, string>> = {
  "30x30": {
    noir:  "framed_poster_300x300-mm-12x12-inch_black_wood_w12xt22-mm_plexiglass_300x300-mm-12x12-inch_200-gsm-80lb-uncoated_4-0_hor",
    blanc: "framed_poster_300x300-mm-12x12-inch_white_wood_w12xt22-mm_plexiglass_300x300-mm-12x12-inch_200-gsm-80lb-uncoated_4-0_hor",
  },
  "40x40": {
    noir:  "framed_poster_400x400-mm-16x16-inch_black_wood_w12xt22-mm_plexiglass_400x400-mm-16x16-inch_200-gsm-80lb-uncoated_4-0_hor",
    blanc: "framed_poster_400x400-mm-16x16-inch_white_wood_w12xt22-mm_plexiglass_400x400-mm-16x16-inch_200-gsm-80lb-uncoated_4-0_hor",
  },
  "50x70": {
    noir:  "framed_poster_500x700-mm-20x28-inch_black_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver",
    blanc: "framed_poster_500x700-mm-20x28-inch_white_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver",
  },
};

const FALLBACK_UID =
  "framed_poster_400x400-mm-16x16-inch_black_wood_w12xt22-mm_plexiglass_400x400-mm-16x16-inch_200-gsm-80lb-uncoated_4-0_hor";

function buildProductUid(size: string, color: string): string {
  return PRODUCT_UID_MAP[size]?.[color] ?? FALLBACK_UID;
}

export interface GelatoOrderItem {
  imageUrl: string;
  size: string;
  color: string;
  finish: string;
  quantity: number;
}

export interface GelatoRecipient {
  name: string;
  email: string;
  address: string;
  city: string;
  postCode: string;
  country: string;
}

export async function createGelatoOrder(
  items: GelatoOrderItem[],
  recipient: GelatoRecipient,
  externalOrderId: string
): Promise<{ id: string; status: string }> {
  if (!process.env.GELATO_API_KEY) {
    throw new Error("GELATO_API_KEY manquant dans .env.local");
  }

  const body = {
    orderType: "order",
    orderReferenceId: externalOrderId,
    customerReferenceId: externalOrderId,
    currency: "EUR",
    items: items.map((item, i) => ({
      itemReferenceId: `item-${i}`,
      productUid: buildProductUid(item.size, item.color),
      quantity: item.quantity,
      files: [
        {
          type: "default",
          url: item.imageUrl,
        },
      ],
    })),
    shipmentMethodUid: "normal",
    shippingAddress: {
      firstName: recipient.name.split(" ")[0] ?? recipient.name,
      lastName: recipient.name.split(" ").slice(1).join(" ") || "-",
      addressLine1: recipient.address,
      city: recipient.city,
      postCode: recipient.postCode,
      country: recipient.country,
      email: recipient.email,
    },
  };

  const res = await fetch(`${GELATO_API_URL}/v4/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.GELATO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Gelato API error: ${error}`);
  }

  return res.json();
}
