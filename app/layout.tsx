import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Cormorant_Garamond, Titan_One } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const titanOne = Titan_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Frameify — Ta photo, transformée en œuvre d'art",
  description:
    "Uploadez votre photo, notre IA la transforme en illustration unique. Imprimée sur un cadre premium, livrée chez vous.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={`${geist.variable} ${cormorant.variable} ${titanOne.variable} font-sans antialiased`}
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        {children}
      </body>
    </html>
  );
}
