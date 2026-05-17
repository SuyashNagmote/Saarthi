"use client";
import { CtaButton } from "./Navbar";

export function FinalCta() {
  return (
    <section id="enterprise" style={{ position: "relative", background: "var(--bg-raised)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 60% at 50% 50%, var(--saffron-glow) 0%, transparent 70%)", opacity: 0.5 }} />
      {/* Horizon line */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: "60%", height: 1, background: "linear-gradient(to right, transparent 0%, var(--saffron) 50%, transparent 100%)", opacity: 0.35 }} />
      <div className="noise-layer" />
      <div style={{ position: "relative", padding: "120px 28px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <span className="kicker-rule" />
        <h2 className="serif-italic balance" style={{ fontSize: 40, color: "var(--text-primary)", margin: 0, maxWidth: 560, marginInline: "auto", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Your goals deserve better than a spreadsheet.
        </h2>
        <p className="balance" style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 440, margin: "20px auto 0", lineHeight: 1.7 }}>
          One polished platform for goal-setting, performance calibration, and audit-ready reviews.
        </p>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 28, letterSpacing: "0.02em" }}>
          Pilot-ready for HR and business leaders. Fast setup, clear ownership.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 40, position: "relative", zIndex: 10 }}>
          <CtaButton large onClick={() => window.location.href = '/login'}>Start your pilot</CtaButton>
          <button
            style={{
              background: "var(--bg-float)", border: "none", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", height: 40, padding: "0 12px" }}>
            Request a briefing →
          </button>
        </div>
      </div>
    </section>
  );
}
