"use client";
import { Target, GitBranch, BarChart3, Shield } from "lucide-react";

const cards = [
  { Icon: Target, title: "Shared Goals, One Truth", body: "Push departmental KPIs to your entire team. Achievement data cascades automatically. No copy-paste, no drift.", hasViz: true },
  { Icon: GitBranch, title: "Org-aware approvals", body: "Every goal flows up the reporting line. Managers review, edit inline, and approve in one click — without a single email." },
  { Icon: BarChart3, title: "Score, not sentiment", body: "Achievement is computed — not negotiated. Our weighted formula removes bias from every appraisal conversation." },
  { Icon: Shield, title: "Enterprise-grade access", body: "Microsoft Entra ID SSO, role-based permissions, and an immutable audit trail. Ready for your security team." },
];

export function WhySaarthi() {
  return (
    <section id="product" style={{ padding: "96px 28px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <span className="kicker-rule" />
        <h2 className="serif-italic" style={{ fontSize: 32, color: "var(--gold)", margin: 0, letterSpacing: "-0.01em" }}>Built different.</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12 }}>Four design decisions that change how performance management feels.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 880, margin: "0 auto" }}>
        {cards.map(({ Icon, title, body, hasViz }) => (
          <Card key={title} Icon={Icon} title={title} body={body} hasViz={hasViz} />
        ))}
      </div>
    </section>
  );
}

function Card({ Icon, title, body, hasViz }: { Icon: typeof Target; title: string; body: string; hasViz?: boolean }) {
  return (
    <div
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-lg)",
        padding: 28,
        transition: "all 180ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.background = "var(--bg-float)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.background = "var(--bg-raised)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon — naked, with offset saffron-dim square */}
      <div style={{ position: "relative", width: 24, height: 24 }}>
        <span aria-hidden style={{ position: "absolute", left: -4, top: -4, width: 24, height: 24, border: "1px solid var(--saffron-dim)", borderRadius: 2, background: "var(--saffron-dim)" }} />
        <Icon size={20} strokeWidth={1.5} color="var(--saffron)" style={{ position: "relative" }} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginTop: 22, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{body}</p>

      {hasViz && <CascadeViz />}
    </div>
  );
}

function CascadeViz() {
  return (
    <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px dashed var(--border-ghost)", display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        { label: "Org", w: 100, c: "var(--gold)" },
        { label: "Dept", w: 72, c: "var(--saffron)" },
        { label: "Team", w: 48, c: "var(--indigo)" },
      ].map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-tertiary)", width: 28, letterSpacing: "0.05em", textTransform: "uppercase" }}>{r.label}</span>
          <div style={{ flex: 1, height: 4, background: "var(--border-subtle)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${r.w}%`, height: "100%", background: r.c, transition: "width 600ms ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
