export type ArtStyle = "ghibli" | "flat";
export type FrameSize = "11x14" | "12x16" | "18x24" | "24x32" | "28x40";
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
  "11x14": 49,
  "12x16": 59,
  "18x24": 79,
  "24x32": 99,
  "28x40": 129,
};

export function computePrice(options: FrameOption): number {
  return FRAME_PRICES[options.size];
}
