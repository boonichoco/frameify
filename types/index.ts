export type ArtStyle = "ghibli" | "flat";
export type FrameSize = "A4" | "12x16" | "A3" | "A2" | "18x24";
export type FrameColor = "noir" | "blanc" | "naturel" | "marron" | "gris-fonce" | "gris-clair" | "or-antique" | "argent-antique";

export interface FrameOption {
  size: FrameSize;
  color: FrameColor;
}

export interface ProductConfig extends FrameOption {
  originalImageUrl: string;
  transformedImageUrl: string;
  customText?: string;
  price: number;
}

export const FRAME_PRICES: Record<FrameSize, number> = {
  "A4": 49,
  "12x16": 59,
  "A3": 69,
  "A2": 89,
  "18x24": 99,
};

export function computePrice(options: FrameOption): number {
  return FRAME_PRICES[options.size];
}
