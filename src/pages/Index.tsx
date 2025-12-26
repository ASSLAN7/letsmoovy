import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CarShowcase from "@/components/CarShowcase";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CarShowcase />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
