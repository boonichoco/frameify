export type ArtStyle = "ghibli" | "flat";
export type FrameSize = "30x30" | "40x40" | "50x70";
export type FrameFinish = "mat" | "brillant" | "fine-art";
export type FrameColor = "blanc" | "noir";
export type Passepartout = "oui" | "non";

export interface FrameOption {
  size: FrameSize;
  finish: FrameFinish;
  color: FrameColor;
  passepartout: Passepartout;
}

export interface ProductConfig extends FrameOption {
  originalImageUrl: string;
  transformedImageUrl: string;
  customText?: string;
  price: number;
}

export const FRAME_PRICES: Record<FrameSize, number> = {
  "30x30": 59,
  "40x40": 79,
  "50x70": 99,
};

export const FINISH_SURCHARGE: Record<FrameFinish, number> = {
  mat: 0,
  brillant: 5,
  "fine-art": 15,
};

export const PASSEPARTOUT_SURCHARGE: Record<Passepartout, number> = {
  oui: 10,
  non: 0,
};

export function computePrice(options: FrameOption): number {
  return (
    FRAME_PRICES[options.size] +
    FINISH_SURCHARGE[options.finish] +
    PASSEPARTOUT_SURCHARGE[options.passepartout]
  );
}
