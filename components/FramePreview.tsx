"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FrameColor, FrameSize, Passepartout } from "@/types";

interface FramePreviewProps {
  originalUrl: string | null;
  transformedUrl: string | null;
  isTransforming: boolean;
  frameColor: FrameColor;
  passepartout: Passepartout;
  size: FrameSize;
  customText?: string;
}

const ASPECT_RATIO: Record<FrameSize, number> = {
  "30x30": 1,
  "40x40": 1,
  "50x70": 7 / 5,
};

const FRAME_CONFIG: Record<FrameColor, {
  gradient: string;
  boxShadow: string;
  rabbet: string;
  innerShadow: string;
  glare: string;
}> = {
  noir: {
    gradient: "linear-gradient(150deg, #3E3B38 0%, #1E1C1A 45%, #0F0E0D 100%)",
    boxShadow: [
      "inset 3px 3px 4px rgba(255,255,255,0.08)",
      "inset -3px -3px 5px rgba(0,0,0,0.70)",
      "inset 6px 6px 12px rgba(255,255,255,0.03)",
      "inset -6px -6px 14px rgba(0,0,0,0.45)",
      "0 30px 80px rgba(0,0,0,0.60)",
      "0 8px 24px rgba(0,0,0,0.38)",
    ].join(", "),
    // ombre sur le rebord intérieur du cadre (la feuillure)
    rabbet: [
      "inset 0 0 0 1.5px rgba(0,0,0,0.55)",
      "inset 4px 4px 8px rgba(0,0,0,0.45)",
      "inset -2px -2px 5px rgba(0,0,0,0.25)",
    ].join(", "),
    // ombre portée de la moulure sur l'image
    innerShadow: [
      "inset 0 0 22px rgba(0,0,0,0.55)",
      "inset 6px 6px 14px rgba(0,0,0,0.65)",
      "inset -3px -3px 9px rgba(0,0,0,0.38)",
    ].join(", "),
    glare: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 35%, transparent 55%, rgba(0,0,0,0.06) 100%)",
  },
  blanc: {
    gradient: "linear-gradient(150deg, #FFFFFF 0%, #F2EEE7 50%, #E4DED5 100%)",
    boxShadow: [
      "inset 3px 3px 4px rgba(255,255,255,0.98)",
      "inset -3px -3px 5px rgba(0,0,0,0.12)",
      "inset 6px 6px 12px rgba(255,255,255,0.65)",
      "inset -6px -6px 14px rgba(0,0,0,0.07)",
      "0 30px 80px rgba(0,0,0,0.30)",
      "0 8px 24px rgba(0,0,0,0.18)",
    ].join(", "),
    // ombre sur le rebord intérieur du cadre
    rabbet: [
      "inset 0 0 0 1.5px rgba(0,0,0,0.18)",
      "inset 4px 4px 8px rgba(0,0,0,0.14)",
      "inset -2px -2px 5px rgba(0,0,0,0.07)",
    ].join(", "),
    // ombre portée de la moulure sur l'image
    innerShadow: [
      "inset 0 0 18px rgba(0,0,0,0.28)",
      "inset 6px 6px 14px rgba(0,0,0,0.32)",
      "inset -3px -3px 9px rgba(0,0,0,0.16)",
    ].join(", "),
    glare: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 35%, transparent 55%, rgba(0,0,0,0.02) 100%)",
  },
};

const FRAME_THICKNESS = 20;
const MATTE_PADDING = 24;

export default function FramePreview({
  originalUrl,
  transformedUrl,
  isTransforming,
  frameColor,
  passepartout,
  size,
  customText,
}: FramePreviewProps) {
  const displayUrl = transformedUrl || originalUrl;
  const frame = FRAME_CONFIG[frameColor];
  // padding-bottom trick for reliable aspect ratio
  const paddingBottom = `${ASPECT_RATIO[size] * 100}%`;
  const matte = passepartout === "oui" ? MATTE_PADDING : 0;

  return (
    <div
      style={{
        background: "#B0AAA2",
        padding: "3rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      {/* Wrapper fixe la largeur max */}
      <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>

        {/* Aspect-ratio holder (padding-bottom trick) */}
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ paddingBottom }}
        />

        {/* Cadre — positionné par-dessus le holder */}
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            background: frame.gradient,
            boxShadow: frame.boxShadow,
          }}
        >
          {/* Zone intérieure du cadre (feuillure) */}
          <div
            style={{
              position: "absolute",
              top: FRAME_THICKNESS,
              right: FRAME_THICKNESS,
              bottom: FRAME_THICKNESS,
              left: FRAME_THICKNESS,
              background: passepartout === "oui" ? "#FAFAF8" : "#2E2C2A",
              boxShadow: frame.rabbet,
              transition: "background 0.3s ease",
            }}
          >
            {/* Zone image (passepartout optionnel) */}
            <div
              style={{
                position: "absolute",
                top: matte,
                right: matte,
                bottom: matte,
                left: matte,
                overflow: "hidden",
                background: "#2E2C2A",
                boxShadow: frame.innerShadow,
                transition: "top 0.3s ease, right 0.3s ease, bottom 0.3s ease, left 0.3s ease",
              }}
            >
              {displayUrl ? (
                <>
                  <Image
                    src={displayUrl}
                    alt="Aperçu"
                    fill
                    className={`object-cover transition-all duration-700 ${
                      isTransforming ? "opacity-20 scale-105" : "opacity-100 scale-100"
                    }`}
                    sizes="(max-width: 768px) 100vw, 360px"
                    unoptimized
                  />
                  {customText && !isTransforming && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "12px 8px 10px",
                        background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
                        zIndex: 2,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "#FFFFFF",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          letterSpacing: "0.08em",
                          textAlign: "center",
                          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                        }}
                      >
                        {customText}
                      </span>
                    </div>
                  )}
                  {isTransforming && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        background: "rgba(35,34,32,0.7)",
                        backdropFilter: "blur(4px)",
                        zIndex: 1,
                      }}
                    >
                      <svg
                        className="animate-spin"
                        style={{ width: 24, height: 24, color: "#F7F4EF" }}
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-20"
                          cx="12" cy="12" r="10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          className="opacity-80"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <p
                        className="text-xs tracking-widest uppercase"
                        style={{ color: "rgba(247,244,239,0.7)" }}
                      >
                        Transformation IA
                      </p>
                    </motion.div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p className="text-xs tracking-widest uppercase" style={{ color: "#4A4845" }}>
                    Aperçu
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reflet vitre — au-dessus de tout, y compris l'image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: frame.glare,
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        </motion.div>
      </div>

      {/* Avant / Après */}
      {originalUrl && transformedUrl && !isTransforming && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <Thumb src={originalUrl} label="Original" dim />
          <svg
            style={{ width: 14, height: 14, color: "#5A5855", flexShrink: 0 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
          <Thumb src={transformedUrl} label="Résultat IA" />
        </motion.div>
      )}
    </div>
  );
}

function Thumb({ src, label, dim }: { src: string; label: string; dim?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
      <div
        style={{
          position: "relative",
          width: 36,
          height: 36,
          overflow: "hidden",
          opacity: dim ? 0.5 : 1,
          border: dim ? "1px solid #3A3836" : "1px solid #5A5855",
        }}
      >
        <Image src={src} alt={label} fill className="object-cover" unoptimized />
      </div>
      <span className="text-xs tracking-widest uppercase" style={{ color: "#5A5855" }}>
        {label}
      </span>
    </div>
  );
}
