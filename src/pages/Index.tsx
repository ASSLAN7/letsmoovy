import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CarShowcase from "@/components/CarShowcase";
import HowItWorks from "@/components/HowItWorks";
import VehicleMap from "@/components/VehicleMap";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import SupportChat from "@/components/SupportChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CarShowcase />
      <VehicleMap />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
      <SupportChat />
    </div>
  );
};

export default Index;
