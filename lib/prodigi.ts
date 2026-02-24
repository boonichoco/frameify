/**
 * Prodigi Print API v4.0
 * Docs : https://www.prodigi.com/print-api/docs/reference/
 *
 * SKU format (Classic Frames with Mount — impression + cadre + passepartout) :
 *   GLOBAL-CFPM-{size}
 *
 * Couleur du cadre passée via attributes.color
 */

const isSandbox = (process.env.PRODIGI_SANDBOX ?? "").trim().toLowerCase() === "true";
const PRODIGI_API_URL = isSandbox
  ? "https://api.sandbox.prodigi.com"
  : "https://api.prodigi.com";

/** Tailles Frameify → SKU Prodigi */
const SKU_SIZE: Record<string, string> = {
  "11x14": "11X14",
  "12x16": "12X16",
  "18x24": "18X24",
  "24x32": "24X32",
  "28x40": "28X40",
};

/** Correspondance couleur Frameify → attribut Prodigi */
const COLOR_MAP: Record<string, string> = {
  noir: "black",
  blanc: "white",
  naturel: "natural",
  marron: "brown",
  "gris-fonce": "darkgrey",
  "gris-clair": "lightgrey",
  "or-antique": "antiquegold",
  "argent-antique": "antiquesilver",
};

function buildSku(size: string): string {
  const prodigiSize = SKU_SIZE[size] ?? "18X24";
  return `GLOBAL-CFPM-${prodigiSize}`;
}

export interface ProdigiOrderItem {
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
}

export interface ProdigiRecipient {
  name: string;
  email: string;
  address: string;
  city: string;
  postCode: string;
  country: string;
}

export async function createProdigiOrder(
  items: ProdigiOrderItem[],
  recipient: ProdigiRecipient,
  merchantReference: string
): Promise<{ id: string; status: string }> {
  if (!process.env.PRODIGI_API_KEY) {
    throw new Error("PRODIGI_API_KEY manquant dans .env.local");
  }

  const body = {
    merchantReference,
    shippingMethod: "Standard",
    recipient: {
      name: recipient.name,
      email: recipient.email,
      address: {
        line1: recipient.address,
        townOrCity: recipient.city,
        postalOrZipCode: recipient.postCode,
        countryCode: recipient.country,
      },
    },
    items: items.map((item, i) => ({
      merchantReference: `item-${i}`,
      sku: buildSku(item.size),
      copies: item.quantity,
      sizing: "fillPrintArea",
      attributes: {
        color: COLOR_MAP[item.color] ?? "black",
      },
      assets: [
        {
          printArea: "default",
          url: item.imageUrl,
        },
      ],
    })),
  };

  console.log("[prodigi] URL:", PRODIGI_API_URL, "SKU:", body.items?.[0]?.sku, "color:", body.items?.[0]?.attributes?.color);

  const res = await fetch(`${PRODIGI_API_URL}/v4.0/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.PRODIGI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Prodigi API error: ${error}`);
  }

  const data = await res.json();
  return { id: data.order?.id ?? data.id, status: data.outcome ?? "unknown" };
}
