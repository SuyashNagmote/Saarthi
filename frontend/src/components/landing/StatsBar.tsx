"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 1, suffix: "", label: "Full goal lifecycle", display: () => "One place" },
  { value: 3, suffix: "", label: "Roles unified", display: () => "3 roles" },
  { value: 1, suffix: "", label: "Audit-ready", display: () => "Day one" },
  { value: 1, suffix: "", label: "Deploy fast", display: () => "< 1 day" },
];

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(true); }),
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border-ghost)", borderBottom: "1px solid var(--border-ghost)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", height: 96, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", alignItems: "center" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
            {i !== 0 && (
              <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, transparent 0%, var(--border-default) 30%, var(--border-default) 70%, transparent 100%)" }} />
            )}
            <Counter target={s.value} active={active} display={s.display} />
            <span style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Counter({ target, active, display }: { target: number; active: boolean; display: (n: number) => string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 0) { setN(0); return; }
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return <span className="mono" style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>{display(n)}</span>;
}
