import HeroSection from "./components/HeroSection";
import EventOverviewSection from "./components/EventOverviewSection";
import InvitationSection from "./components/InvitationSection";
import CountdownSection from "./components/CountdownSection";
import ScheduleSection from "./components/ScheduleSection";
import SpeakersSection from "./components/SpeakerSection";
import MerchSection from "./components/MerchSection";
import TestimoniesSection from "./components/TestimoniesSection";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection />
      <EventOverviewSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
      <SpeakersSection />
      <MerchSection />
      <TestimoniesSection />
      <Footer />
    </main>
  );
}
