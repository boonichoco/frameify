"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onUpload: (file: File, previewUrl: string) => void;
  isLoading: boolean;
}

export default function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      onUpload(file, previewUrl);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled: isLoading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
  });

  const isActive = isDragActive || dragActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        {...getRootProps()}
        style={{
          borderWidth: "2px",
          borderStyle: "dashed",
          borderColor: isActive ? "var(--fg)" : "#C8C3BA",
          background: isActive ? "rgba(26,25,23,0.04)" : "var(--surface)",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.5 : 1,
          transition: "all 0.2s ease",
          padding: "4rem 3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
            >
              {/* Spinner fin */}
              <svg
                className="animate-spin"
                style={{ width: 28, height: 28, color: "var(--fg)" }}
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
                style={{ color: "var(--muted)" }}
              >
                Transformation en cours…
              </p>
            </motion.div>
          ) : isActive ? (
            <motion.div
              key="drag"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
            >
              <svg
                style={{ width: 28, height: 28, color: "var(--fg)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--fg)" }}
              >
                Déposer
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", textAlign: "center" }}
            >
              {/* Icône photo */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  style={{ width: 22, height: 22, color: "var(--muted)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h.008v.008H3V9.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM6.75 6.75h10.5a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z" />
                </svg>
              </div>

              <div>
                <p
                  className="font-serif text-lg mb-1"
                  style={{ fontWeight: 300, color: "var(--fg)" }}
                >
                  Déposez votre photo
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  ou{" "}
                  <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                    parcourir vos fichiers
                  </span>
                </p>
              </div>

              <p
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--border)", marginTop: "0.25rem" }}
              >
                JPG · PNG · WebP · Max 20 Mo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
