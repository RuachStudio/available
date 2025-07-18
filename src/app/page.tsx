import HeroSection from "./components/HeroSection";
import InvitationSection from "./components/InvitationSection";
import CountdownSection from "./components/CountdownSection";
import MerchSection from "./components/MerchSection";
import TestimoniesSection from "./components/TestimoniesSection";
import Footer from "./components/Footer";
export default function LandingPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <MerchSection />
      <TestimoniesSection />
      <Footer />
    </main>
  );
}