import Link from "next/link";

export default function SuccessPage() {
  return (
    <main
      style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        {/* Checkmark */}
        <div
          style={{
            width: 48,
            height: 48,
            border: "1px solid var(--fg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2.5rem",
          }}
        >
          <svg style={{ width: 18, height: 18, color: "var(--fg)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1
          className="font-serif mb-4"
          style={{ fontSize: "2rem", fontWeight: 300, color: "var(--fg)" }}
        >
          Commande confirmée
        </h1>

        <p
          className="text-sm leading-relaxed mb-2"
          style={{ color: "var(--muted)", lineHeight: 1.8 }}
        >
          Votre cadre est en cours de fabrication.
          Vous recevrez un email avec le numéro de suivi
          dès l&rsquo;expédition.
        </p>

        <p
          className="text-xs tracking-widest uppercase mb-10"
          style={{ color: "var(--border)" }}
        >
          Délai estimé : 5–7 jours ouvrés
        </p>

        <Link
          href="/"
          className="inline-block text-xs tracking-widest uppercase px-8 py-3 transition-opacity hover:opacity-70"
          style={{
            border: "1px solid var(--fg)",
            color: "var(--fg)",
            letterSpacing: "0.12em",
          }}
        >
          Créer un autre cadre
        </Link>
      </div>
    </main>
  );
}
