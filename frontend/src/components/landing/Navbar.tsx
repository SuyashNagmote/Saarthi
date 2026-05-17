"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const links = ["Product", "Workflow", "Enterprise", "Resources"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        zIndex: 50,
        background: "rgba(7,7,8,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "var(--border-subtle)" : "var(--border-ghost)"}`,
        transition: "border-color 150ms ease",
      }}
    >
      <div style={{ position: "relative", height: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, color: "var(--gold)", lineHeight: 1, transform: "translateY(1px)", display: "inline-block" }}>स</span>
          <span style={{ width: 1, height: 18, background: "var(--border-default)" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Saarthi</span>
        </Link>

        {/* Center nav (absolutely centered) */}
        <nav
          className="hidden md:flex"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            gap: 28,
            alignItems: "center",
          }}
        >
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              style={{ fontSize: 13, fontWeight: 450, color: "var(--text-secondary)", textDecoration: "none", transition: "color 120ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              {l}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 18 }}>
          <Link href="/login" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", transition: "color 120ms ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Sign in
          </Link>
          <CtaButton>Get early access</CtaButton>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{ background: "transparent", border: "none", color: "var(--text-primary)", padding: 6, cursor: "pointer" }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden"
          style={{
            background: "rgba(7,7,8,0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "20px 28px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>{l}</a>
          ))}
          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <Link href="/login" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>Sign in</Link>
          <CtaButton>Get early access</CtaButton>
        </div>
      )}
    </header>
  );
}

export function CtaButton({ children, large = false, onClick }: { children: React.ReactNode; large?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--saffron)",
        color: "#070708",
        fontSize: 13,
        fontWeight: 500,
        height: large ? 40 : 32,
        padding: large ? "0 20px" : "0 14px",
        borderRadius: "var(--r-sm)",
        border: "none",
        cursor: "pointer",
        transition: "all 150ms ease",
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}
