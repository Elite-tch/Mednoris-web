import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesAlternating from "@/components/landing/FeaturesAlternating";
import CtaBanner from "@/components/landing/CtaBanner";
import ServicesGrid from "@/components/landing/ServicesGrid";
import LatestDoctors from "@/components/landing/LatestDoctors";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f7fb] font-serif text-foreground">
      <HeroSection />
      <div>
        <AboutSection />
        <ServicesGrid />
        <LatestDoctors />
      <FeaturesAlternating />
        <CtaBanner />
      </div>
    </main>
  );
}
