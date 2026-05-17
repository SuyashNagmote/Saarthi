"use client";
const cols = [
  { title: "Product", links: ["Goals", "Appraisals", "Analytics", "Integrations"] },
  { title: "Company", links: ["About", "Customers", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "DPA", "Security"] },
];

export function Footer() {
  return (
    <footer id="resources" style={{ background: "var(--bg-void)", borderTop: "1px solid var(--border-ghost)", padding: "40px 28px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 40 }} className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, color: "var(--gold)", transform: "translateY(1px)", display: "inline-block", lineHeight: 1 }}>स</span>
            <span style={{ width: 1, height: 18, background: "var(--border-default)" }} />
            <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>Saarthi</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", maxWidth: 280, marginTop: 14, lineHeight: 1.6 }}>
            The charioteer for modern Indian enterprises. Goals aligned. Performance calibrated. Results trusted.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{c.title}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" style={{ fontSize: 12, color: "var(--text-tertiary)", textDecoration: "none", transition: "color 150ms ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1280, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid var(--border-ghost)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>© {new Date().getFullYear()} Saarthi. All rights reserved.</span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Enterprise Performance Management</span>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
