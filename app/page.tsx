"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadZone from "@/components/UploadZone";
import FramePreview from "@/components/FramePreview";
import ProductConfigurator from "@/components/ProductConfigurator";
import CheckoutButton from "@/components/CheckoutButton";
import { ArtStyle, FrameOption, ProductConfig, computePrice } from "@/types";

const DEFAULT_OPTIONS: FrameOption = {
  size: "30x30",
  finish: "mat",
  color: "noir",
  passepartout: "oui",
};

type Step = "upload" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [options, setOptions] = useState<FrameOption>(DEFAULT_OPTIONS);
  const [artStyle, setArtStyle] = useState<ArtStyle>("ghibli");
  const [customText, setCustomText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File, previewUrl: string) => {
    setOriginalUrl(previewUrl);
    setTransformedUrl(null);
    setError(null);
    setIsTransforming(true);
    setStep("result");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("style", artStyle);
      const res = await fetch("/api/transform", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransformedUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de transformation");
      setTransformedUrl(previewUrl);
    } finally {
      setIsTransforming(false);
    }
  }, []);

  const productConfig: ProductConfig = {
    ...options,
    originalImageUrl: originalUrl ?? "",
    transformedImageUrl: transformedUrl ?? "",
    price: computePrice(options),
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-center px-8 py-5"
      >
        <a
          href="/"
          className="font-serif text-xl tracking-[0.15em] transition-opacity hover:opacity-60"
          style={{ color: "var(--fg)", fontWeight: 400, textDecoration: "none" }}
        >
          FRAMEIFY
        </a>
      </nav>

      <AnimatePresence mode="wait">
        {step === "upload" ? (
          <motion.section
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="px-8 pt-24 pb-20 max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              {/* Texte */}
              <div>
                <p
                  className="text-xs tracking-widest uppercase mb-8"
                  style={{ color: "var(--muted)" }}
                >
                  Intelligence artificielle · Impression fine art
                </p>
                <h1
                  className="font-serif leading-[1.1] mb-7"
                  style={{
                    fontSize: "clamp(2.8rem, 5vw, 4.2rem)",
                    fontWeight: 300,
                    color: "var(--fg)",
                  }}
                >
                  Votre photo,
                  <br />
                  <em style={{ fontStyle: "italic", fontWeight: 400 }}>
                    réinventée
                  </em>
                  <br />
                  en œuvre d&rsquo;art.
                </h1>
                <p
                  className="text-base leading-loose mb-10 max-w-xs"
                  style={{ color: "var(--muted)", lineHeight: 1.75 }}
                >
                  Notre IA transforme votre photo en illustration
                  style dessin ou bande dessinée. Encadrée, imprimée
                  sur papier fine art, livrée chez vous.
                </p>
                <div
                  className="flex items-start gap-8 pt-8"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {[
                    { value: "2 341", label: "cadres livrés" },
                    { value: "4.9 / 5", label: "note client" },
                    { value: "100%", label: "remboursé si insatisfait" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div
                        className="font-serif text-2xl mb-0.5"
                        style={{ fontWeight: 400, color: "var(--fg)" }}
                      >
                        {s.value}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Style + Upload */}
              <div id="configurateur" className="flex flex-col gap-6">
                <div>
                  <p
                    className="text-xs tracking-widest uppercase mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    Style artistique
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      {
                        value: "ghibli" as ArtStyle,
                        label: "Ghibli",
                        desc: "Aquarelle douce, trait Miyazaki",
                      },
                      {
                        value: "flat" as ArtStyle,
                        label: "Illustration Flat",
                        desc: "Formes nettes, couleurs pastel",
                      },
                    ]).map((s) => {
                      const selected = artStyle === s.value;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setArtStyle(s.value)}
                          className="text-left px-4 py-3 transition-all duration-200"
                          style={{
                            background: selected ? "#1A1917" : "#FFFFFF",
                            color: selected ? "#FFFFFF" : "#1A1917",
                            border: selected
                              ? "2px solid #1A1917"
                              : "2px solid var(--border)",
                            borderRadius: 8,
                          }}
                        >
                          <span
                            className="block text-sm"
                            style={{ fontWeight: selected ? 600 : 400 }}
                          >
                            {s.label}
                          </span>
                          <span
                            className="block text-xs mt-0.5"
                            style={{
                              color: selected ? "rgba(255,255,255,0.7)" : "var(--muted)",
                            }}
                          >
                            {s.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <UploadZone onUpload={handleUpload} isLoading={isTransforming} />
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="px-8 pt-10 pb-24 max-w-5xl mx-auto"
            id="configurateur"
          >
            {/* Breadcrumb */}
            <div
              className="flex items-center gap-4 mb-12 pb-6"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <button
                onClick={() => {
                  setStep("upload");
                  setOriginalUrl(null);
                  setTransformedUrl(null);
                }}
                className="flex items-center gap-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-50"
                style={{ color: "var(--muted)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
                </svg>
                Nouvelle photo
              </button>
              <span style={{ color: "var(--border)" }}>/</span>
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--fg)" }}
              >
                Configuration du cadre
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
              <div className="flex flex-col gap-4">
                <FramePreview
                  originalUrl={originalUrl}
                  transformedUrl={transformedUrl}
                  isTransforming={isTransforming}
                  frameColor={options.color}
                  passepartout={options.passepartout}
                  size={options.size}
                  customText={customText}
                />
                {error && (
                  <p className="text-xs text-center mt-2" style={{ color: "#B0403A" }}>{error}</p>
                )}
              </div>

              <div className="flex flex-col gap-10">
                <ProductConfigurator
                  options={options}
                  onChange={setOptions}
                  customText={customText}
                  onCustomTextChange={setCustomText}
                />
                <CheckoutButton
                  config={productConfig}
                  disabled={isTransforming || !transformedUrl}
                />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer
        style={{ borderTop: "1px solid var(--border)" }}
        className="px-8 py-8"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="font-serif tracking-[0.15em]"
            style={{ color: "var(--muted)", fontSize: "0.8rem" }}
          >
            FRAMEIFY
          </span>
          <div
            className="flex items-center gap-6 text-xs tracking-widest uppercase"
            style={{ color: "var(--muted)" }}
          >
            <span>Fabriqué en Europe</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>Fine art 300g</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>Livraison 5–7 jours</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
