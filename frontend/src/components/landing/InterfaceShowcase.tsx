"use client";
import { useEffect, useState } from "react";

const tabs = ["Employee", "Manager", "Admin"] as const;
type Tab = typeof tabs[number];

export function InterfaceShowcase() {
  const [tab, setTab] = useState<Tab>("Employee");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const idx = tabs.indexOf(tab);
      if (e.key === "ArrowRight") setTab(tabs[(idx + 1) % tabs.length]);
      if (e.key === "ArrowLeft") setTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab]);

  return (
    <section id="workflow" style={{ padding: "96px 28px", background: "var(--bg-void)", position: "relative" }}>
      <div className="noise-layer" />
      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <span className="kicker-rule" />
        <h2 className="serif-italic" style={{ fontSize: 40, color: "var(--text-primary)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>One platform, every level aligned.</h2>
        <p className="balance" style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>Operational teams, managers, and executives see the same priorities, progress, and approvals with confidence.</p>

        {/* Tabs */}
        <div role="tablist" style={{ display: "inline-flex", marginTop: 40, background: "var(--bg-raised)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-pill)", padding: 4 }}>
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  padding: "8px 18px",
                  background: active ? "rgba(212,163,97,0.98)" : "transparent",
                  color: active ? "#070708" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: "var(--r-pill)",
                  cursor: "pointer",
                  transition: "all 180ms ease",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div key={tab} style={{ marginTop: 40, animation: "fade-up 200ms ease-out" }}>
          {tab === "Employee" && <EmployeePanel />}
          {tab === "Manager" && <ManagerPanel />}
          {tab === "Admin" && <AdminPanel />}
        </div>

        {/* Keyboard hint */}
        <div className="mono" style={{ marginTop: 18, fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          <span style={{ padding: "2px 5px", border: "1px solid var(--border-subtle)", borderRadius: 3, marginRight: 4 }}>←</span>
          <span style={{ padding: "2px 5px", border: "1px solid var(--border-subtle)", borderRadius: 3 }}>→</span>
          <span style={{ marginLeft: 8 }}>to switch views</span>
        </div>
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-raised)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--r-xl)",
  padding: 24,
  textAlign: "left",
  boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
};

function EmployeePanel() {
  return (
    <div style={{ ...cardStyle, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>My Goals — FY 2025</span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }} className="mono">5 active</span>
      </div>
      {[
        { t: "Ship checkout v2", w: "25%", p: 88, s: "ON TRACK", sb: "var(--success-dim)", sc: "var(--success)" },
        { t: "Reduce p95 latency to 180ms", w: "20%", p: 54, s: "AT RISK", sb: "var(--warning-dim)", sc: "var(--warning)" },
        { t: "Mentor 2 junior engineers", w: "15%", p: 70, s: "ON TRACK", sb: "var(--success-dim)", sc: "var(--success)" },
      ].map((r, i) => (
        <div key={i} style={{ padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-ghost)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{r.t}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.w}</span>
            <span style={{ fontSize: 9, padding: "3px 7px", background: r.sb, color: r.sc, borderRadius: "var(--r-xs)", letterSpacing: "0.05em", fontWeight: 500 }}>{r.s}</span>
          </div>
          <div style={{ marginTop: 8, height: 3, background: "var(--border-subtle)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${r.p}%`, height: "100%", background: "var(--indigo)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ManagerPanel() {
  return (
    <div style={{ ...cardStyle, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Team Approvals</span>
        <span className="mono" style={{ fontSize: 11, padding: "3px 9px", background: "var(--warning-dim)", color: "var(--warning)", borderRadius: "var(--r-pill)" }}>7 pending</span>
      </div>
      {[
        { n: "Ananya R.", role: "SDE II", g: 4 },
        { n: "Pranav K.", role: "SDE III", g: 5 },
        { n: "Meera N.", role: "EM", g: 6 },
      ].map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-ghost)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>{p.n[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{p.n}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.role} · {p.g} goals</div>
          </div>
          <button style={{ fontSize: 12, color: "var(--text-secondary)", background: "transparent", border: "1px solid var(--border-default)", borderRadius: "var(--r-sm)", padding: "5px 11px", cursor: "pointer" }}>Review</button>
          <button style={{ fontSize: 12, color: "#070708", background: "var(--saffron)", border: "none", borderRadius: "var(--r-sm)", padding: "5px 11px", cursor: "pointer", fontWeight: 500 }}>Approve</button>
        </div>
      ))}
    </div>
  );
}

function AdminPanel() {
  return (
    <div style={{ ...cardStyle, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Org-wide Cycle — FY 2025</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>1,284 employees</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Goals set", v: "1,201", c: "var(--text-primary)" },
          { l: "Cascaded KPIs", v: "47", c: "var(--indigo)" },
          { l: "Awaiting approval", v: "83", c: "var(--warning)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: 14, background: "var(--bg-base)", border: "1px solid var(--border-ghost)", borderRadius: "var(--r-md)" }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 500, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>Distribution</div>
      <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", border: "1px solid var(--border-ghost)" }}>
        <div style={{ width: "12%", background: "var(--success)" }} title="Exceeds" />
        <div style={{ width: "48%", background: "var(--indigo)" }} title="Meets" />
        <div style={{ width: "28%", background: "var(--saffron)" }} title="Partial" />
        <div style={{ width: "12%", background: "var(--danger)" }} title="Needs Improvement" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, color: "var(--text-tertiary)" }} className="mono">
        <span>EXCEEDS 12%</span><span>MEETS 48%</span><span>PARTIAL 28%</span><span>NI 12%</span>
      </div>
    </div>
  );
}
