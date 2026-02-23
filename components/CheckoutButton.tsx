"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProductConfig } from "@/types";

interface CheckoutButtonProps {
  config: ProductConfig;
  disabled?: boolean;
}

export default function CheckoutButton({ config, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du paiement");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = disabled || loading;

  return (
    <div className="flex flex-col gap-3">
      <motion.button
        onClick={handleCheckout}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.99 } : {}}
        style={{
          width: "100%",
          padding: "1rem 2rem",
          background: isDisabled ? "var(--surface)" : "var(--fg)",
          color: isDisabled ? "var(--muted)" : "var(--bg)",
          border: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
          fontSize: "0.75rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontFamily: "inherit",
          transition: "opacity 0.2s ease, background 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
        }}
        onMouseEnter={(e) => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              style={{ width: 14, height: 14 }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirection…
          </>
        ) : disabled ? (
          "Transformation en cours…"
        ) : (
          <>
            Commander
            <span style={{ opacity: 0.6 }}>·</span>
            <span className="font-serif" style={{ fontSize: "1rem", fontWeight: 400, letterSpacing: "0.05em", textTransform: "none" }}>
              {config.price} €
            </span>
          </>
        )}
      </motion.button>

      {error && (
        <p
          className="text-xs text-center"
          style={{ color: "#B0403A" }}
        >
          {error}
        </p>
      )}

      <div
        className="flex items-center justify-center gap-4 text-xs tracking-widest uppercase"
        style={{ color: "var(--muted)" }}
      >
        <span className="flex items-center gap-1.5">
          <svg style={{ width: 10, height: 10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Paiement sécurisé
        </span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>5–7 jours ouvrés</span>
      </div>
    </div>
  );
}
