/**
 * Prodigi Print API v4.0
 * Docs : https://www.prodigi.com/print-api/docs/reference/
 *
 * SKU format :
 *   GLOBAL-CFP-{size}   → Classic Frame (sans passepartout)
 *   GLOBAL-CFPM-{size}  → Classic Frame with Mount (avec passepartout)
 *
 * Couleur du cadre passée via attributes.color ("black" | "white")
 */

const PRODIGI_API_URL = process.env.PRODIGI_SANDBOX === "true"
  ? "https://api.sandbox.prodigi.com"
  : "https://api.prodigi.com";

/** Correspondance taille Frameify → taille Prodigi (inches) */
const SIZE_MAP: Record<string, string> = {
  "30x30": "12x12",
  "40x40": "16x16",
  "50x70": "20x28",
};

/** Correspondance couleur Frameify → attribut Prodigi */
const COLOR_MAP: Record<string, string> = {
  noir: "black",
  blanc: "white",
};

function buildSku(size: string, passepartout: string): string {
  const inches = SIZE_MAP[size] ?? "16x16";
  const prefix = passepartout === "oui" ? "GLOBAL-CFPM" : "GLOBAL-CFP";
  return `${prefix}-${inches}`;
}

export interface ProdigiOrderItem {
  imageUrl: string;
  size: string;
  color: string;
  passepartout: string;
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
      sku: buildSku(item.size, item.passepartout),
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
