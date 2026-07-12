import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesAlternating from "@/components/landing/FeaturesAlternating";
import CtaBanner from "@/components/landing/CtaBanner";
import ServicesGrid from "@/components/landing/ServicesGrid";
import StatsBar from "@/components/landing/StatsBar";
import Testimonials from "@/components/landing/Testimonials";
import Newsletter from "@/components/landing/Newsletter";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f7fb]  font-serif text-foreground">
    
      <HeroSection />
     <div>
       <AboutSection />
       <ServicesGrid />
      <FeaturesAlternating />
      
      
      <CtaBanner />
     
     </div>
    </main>
  );
}
