"use client";

import { motion } from "framer-motion";
import {
  FrameOption,
  FrameSize,
  FrameFinish,
  FrameColor,
  Passepartout,
  computePrice,
} from "@/types";

interface ProductConfiguratorProps {
  options: FrameOption;
  onChange: (options: FrameOption) => void;
}

const SIZES: { value: FrameSize; label: string; desc: string }[] = [
  { value: "30x30", label: "30 × 30 cm", desc: "Compact" },
  { value: "40x40", label: "40 × 40 cm", desc: "Standard" },
  { value: "50x70", label: "50 × 70 cm", desc: "Grand format" },
];

const FINISHES: { value: FrameFinish; label: string; desc: string }[] = [
  { value: "mat", label: "Mat", desc: "Sans reflet" },
  { value: "brillant", label: "Brillant", desc: "Couleurs vives" },
  { value: "fine-art", label: "Fine Art", desc: "Qualité musée" },
];

const COLORS: { value: FrameColor; label: string; color: string }[] = [
  { value: "blanc", label: "Blanc", color: "#F0EDE6" },
  { value: "noir", label: "Noir", color: "#1A1917" },
];

// Couleurs fixes — indépendantes du thème — pour un contraste maximal
const SEL_BG = "#1A1917";
const SEL_TEXT = "#FFFFFF";
const IDLE_BG = "#FFFFFF";
const IDLE_TEXT = "#1A1917";
const IDLE_MUTED = "#8C887F";
const SEL_MUTED = "rgba(255,255,255,0.50)";
const DIVIDER = "rgba(0,0,0,0.10)";

export default function ProductConfigurator({ options, onChange }: ProductConfiguratorProps) {
  const price = computePrice(options);

  function update<K extends keyof FrameOption>(key: K, value: FrameOption[K]) {
    onChange({ ...options, [key]: value });
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Taille */}
      <Section label="Format">
        <div className="flex flex-col overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          {SIZES.map((s, i) => {
            const active = options.size === s.value;
            return (
              <button
                key={s.value}
                onClick={() => update("size", s.value)}
                className="flex items-center justify-between px-4 py-3.5 text-left"
                style={{
                  background: active ? SEL_BG : IDLE_BG,
                  borderTop: i > 0 ? `1px solid ${DIVIDER}` : "none",
                  color: active ? SEL_TEXT : IDLE_TEXT,
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Radio */}
                  <div style={{
                    width: 16, height: 16,
                    borderRadius: "50%",
                    border: active ? "none" : `1.5px solid ${IDLE_MUTED}`,
                    background: active ? SEL_TEXT : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}>
                    {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: SEL_BG }} />}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}>
                    {s.label}
                  </span>
                </div>
                <span style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? SEL_MUTED : IDLE_MUTED,
                }}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Finition */}
      <Section label="Finition">
        <div className="flex overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          {FINISHES.map((f, i) => {
            const active = options.finish === f.value;
            return (
              <button
                key={f.value}
                onClick={() => update("finish", f.value)}
                className="flex-1 py-3.5 px-2 text-center"
                style={{
                  background: active ? SEL_BG : IDLE_BG,
                  borderLeft: i > 0 ? `1px solid ${DIVIDER}` : "none",
                  color: active ? SEL_TEXT : IDLE_TEXT,
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                <div style={{
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                }}>
                  {f.label}
                </div>
                <div style={{
                  fontSize: "0.7rem",
                  marginTop: 3,
                  color: active ? SEL_MUTED : IDLE_MUTED,
                }}>
                  {f.desc}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Couleur cadre */}
      <Section label="Cadre">
        <div className="flex items-center gap-5">
          {COLORS.map((c) => {
            const active = options.color === c.value;
            return (
              <button
                key={c.value}
                onClick={() => update("color", c.value)}
                title={c.label}
                className="flex flex-col items-center gap-2"
                style={{ cursor: "pointer" }}
              >
                <div style={{
                  position: "relative",
                  width: 36, height: 36,
                  background: c.color,
                  border: active
                    ? "2px solid #1A1917"
                    : `1px solid ${c.color === "#F0EDE6" ? DIVIDER : c.color}`,
                  outline: active ? "3px solid #FFFFFF" : "none",
                  outlineOffset: -4,
                  transition: "all 0.15s ease",
                  transform: active ? "scale(1.12)" : "scale(1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke={c.value === "blanc" ? "#1A1917" : "#FFFFFF"}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: "0.75rem",
                  color: active ? IDLE_TEXT : IDLE_MUTED,
                  fontWeight: active ? 600 : 400,
                }}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Passepartout */}
      <Section label="Passepartout">
        <div className="flex overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          {(["non", "oui"] as Passepartout[]).map((p, i) => {
            const active = options.passepartout === p;
            return (
              <button
                key={p}
                onClick={() => update("passepartout", p)}
                className="flex-1 py-3.5 flex items-center justify-center"
                style={{
                  background: active ? SEL_BG : IDLE_BG,
                  borderLeft: i > 0 ? `1px solid ${DIVIDER}` : "none",
                  color: active ? SEL_TEXT : IDLE_TEXT,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  gap: "0.5rem",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {p === "oui" ? "Avec passepartout" : "Sans passepartout"}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Prix */}
      <div className="flex items-center justify-between pt-6" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: IDLE_MUTED }}>
            Total
          </p>
          <p style={{ fontSize: "0.7rem", marginTop: 2, color: IDLE_MUTED }}>
            Livraison offerte · Fabriqué en Europe
          </p>
        </div>
        <motion.div
          key={price}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-serif"
          style={{ fontSize: "2.2rem", fontWeight: 300, color: IDLE_TEXT }}
        >
          {price} €
        </motion.div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p style={{
        fontSize: "0.7rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#8C887F",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}
