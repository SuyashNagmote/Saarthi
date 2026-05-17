import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { WhySaarthi } from "@/components/landing/WhySaarthi";
import { InterfaceShowcase } from "@/components/landing/InterfaceShowcase";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main style={{ background: "var(--bg-void)", color: "var(--text-primary)", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
      <StatsBar />
      <WhySaarthi />
      <InterfaceShowcase />
      <FinalCta />
      <Footer />
    </main>
  );
}
