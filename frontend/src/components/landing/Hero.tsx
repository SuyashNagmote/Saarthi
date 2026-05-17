"use client";
import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { CtaButton } from "./Navbar";

export function Hero() {
  const mockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!mockRef.current) return;
      const y = Math.min(window.scrollY, 600);
      const t = y / 600; // 0 -> 1
      const ry = -6 * (1 - t);
      const rx = 2 * (1 - t);
      mockRef.current.style.transform = `perspective(1200px) rotateY(${ry}deg) rotateX(${rx}deg)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: "100vh", paddingTop: 56, overflow: "hidden", background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 40%), var(--bg-void)" }}>
      {/* Background layers */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 12% 18%, rgba(201,168,76,0.10), transparent 16%), radial-gradient(circle at 82% 12%, rgba(124,138,255,0.08), transparent 13%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 72% 78%, rgba(255,255,255,0.03), transparent 20%)" }} />
      <div className="grid-layer" />
      <div className="noise-layer" />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "80px 28px 96px", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 64, alignItems: "center" }}
        className="hero-grid">
        {/* Left */}
        <div style={{ minWidth: 0 }}>
          {/* Pill */}
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "1px solid var(--border-default)", background: "var(--bg-raised)", borderRadius: "var(--r-pill)" }}>
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--saffron)", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Built for modern Indian enterprises</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(52px, 7vw, 88px)", lineHeight: 0.95, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "28px 0 0", animationDelay: "0.05s" }}>
            <span style={{ display: "block" }}>Goals,</span>
            <span style={{ display: "block" }}>Perfectly</span>
            <span style={{ display: "inline-block", position: "relative", color: "var(--gold)" }}>
              Aligned.
              <svg width="100%" height="14" viewBox="0 0 280 14" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -6, width: "100%", overflow: "visible" }}>
                <path className="draw-underline" d="M4 8 Q70 2, 140 7 T276 6" fill="none" stroke="var(--saffron)" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
                {/* tiny chariot wheel glyph at stroke end */}
                <g transform="translate(276 6)" opacity="0.35" style={{ animation: "fade-up 0.6s ease-out 1.1s both" }}>
                  <circle r="4" fill="none" stroke="var(--gold)" strokeWidth="0.8" />
                  <circle r="1" fill="var(--gold)" />
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="var(--gold)" strokeWidth="0.5" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--gold)" strokeWidth="0.5" />
                </g>
              </svg>
            </span>
          </h1>

          {/* Sub */}
          <p className="fade-up balance" style={{ fontSize: 16, fontWeight: 300, color: "var(--text-secondary)", maxWidth: 440, lineHeight: 1.7, marginTop: 32, animationDelay: "0.15s" }}>
            Saarthi replaces scattered spreadsheets with a single trusted performance hub — where every goal is aligned, every outcome is measured, and every review is transparent.
          </p>

          {/* CTAs */}
          <div className="fade-up" style={{ display: "flex", gap: 12, marginTop: 32, alignItems: "center", flexWrap: "wrap", animationDelay: "0.25s" }}>
            <CtaButton large onClick={() => window.location.href = '/login'}>Start your pilot</CtaButton>
            <SecondaryLink>See how it works</SecondaryLink>
          </div>

          {/* Customer line — specific, no avatars */}
          <div className="fade-up" style={{ marginTop: 36, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.01em", animationDelay: "0.35s" }}>
            From the teams at{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Razorpay</span>
            <span style={{ margin: "0 8px", color: "var(--text-ghost)" }}>·</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Zerodha</span>
            <span style={{ margin: "0 8px", color: "var(--text-ghost)" }}>·</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Postman</span>
            <span style={{ margin: "0 8px", color: "var(--text-ghost)" }}>·</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Freshworks</span>
          </div>
        </div>

        {/* Right — mockup */}
        <div style={{ position: "relative", minHeight: 480, paddingRight: 24, paddingLeft: 8 }}>
          {/* Peeking content fragments */}
          <div style={{ position: "absolute", top: -14, left: -18, width: 220, padding: "10px 14px", background: "var(--bg-base)", border: "1px solid var(--border-ghost)", borderRadius: "var(--r-md)", opacity: 0.85, transform: "rotate(-3deg)" }}>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Cascaded KPI</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Engineering · Reliability</div>
          </div>

          <div
            ref={mockRef}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "perspective(1200px) rotateY(-3deg) rotateX(0deg)")}
            className="glass-panel"
            style={{
              position: "relative",
              transformStyle: "preserve-3d",
              transform: "perspective(1200px) rotateY(-6deg) rotateX(2deg)",
              transition: "transform 250ms ease",
              padding: 20,
              width: "100%",
              maxWidth: 480,
            }}
          >
            <DashboardMockup />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 960px) {
          .hero-grid { grid-template-columns: 55% 45% !important; }
        }
      `}</style>
    </section>
  );
}

function SecondaryLink({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent",
        border: "none",
        fontSize: 13,
        color: hover ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 6px",
        height: 40,
        transition: "color 150ms ease",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
      <span style={{ display: "inline-block", transition: "transform 150ms ease", transform: hover ? "translateX(3px)" : "translateX(0)" }}>→</span>
    </button>
  );
}

function DashboardMockup() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>My Dashboard</span>
        <span style={{ fontSize: 10, padding: "3px 9px", border: "1px solid var(--saffron)", color: "var(--saffron)", borderRadius: "var(--r-pill)", fontWeight: 500, letterSpacing: "0.04em" }}>FY 2025</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 18 }}>
        <span className="mono" style={{ fontSize: 40, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>73</span>
        <span className="mono" style={{ fontSize: 16, color: "var(--text-tertiary)" }}>/ 100</span>
        <span style={{ marginLeft: "auto", fontSize: 10, padding: "4px 9px", background: "var(--success-dim)", color: "var(--success)", borderRadius: "var(--r-pill)", fontWeight: 500 }}>Meets expectations</span>
      </div>
      <p style={{ marginTop: 8, fontSize: 10, color: "var(--text-tertiary)" }}>Top score this cycle: 92 / 100</p>

      <div style={{ marginTop: 14, height: 4, background: "var(--border-subtle)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: "73%", height: "100%", background: "var(--indigo)" }} />
      </div>

      <div style={{ height: 1, background: "var(--border-ghost)", margin: "20px 0" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <GoalRow title="Platform Reliability — 99.9% Uptime" weight="30%" status="Approved" progress={82} statusBg="var(--success-dim)" statusColor="var(--success)" />
        <GoalRow title="API Response Time < 200ms" weight="25%" status="Pending" progress={64} statusBg="var(--warning-dim)" statusColor="var(--warning)" />
        <GoalRow title="Revenue Enablement Q1" weight="20%" status="Draft" progress={28} statusBg="var(--bg-overlay)" statusColor="var(--text-tertiary)" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20, fontSize: 11, color: "var(--warning)" }}>
        <Clock size={12} strokeWidth={1.7} />
        Q1 Check-in due in 3 days
      </div>
    </div>
  );
}

function GoalRow({ title, weight, status, progress, statusBg, statusColor }: { title: string; weight: string; status: string; progress: number; statusBg: string; statusColor: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 450, color: "var(--text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{weight}</span>
        <span style={{ fontSize: 9, fontWeight: 500, padding: "3px 7px", background: statusBg, color: statusColor, borderRadius: "var(--r-xs)", letterSpacing: "0.05em" }}>{status}</span>
      </div>
      <div style={{ marginTop: 6, height: 2, background: "var(--border-subtle)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--saffron)" }} />
      </div>
    </div>
  );
}
