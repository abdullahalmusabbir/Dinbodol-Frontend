import Navbar from "@/components/landing/Navbar";
import HeroSlider from "@/components/home/HeroSlider";
import AboutSection from "@/components/home/AboutSection";
import LatestEvents from "@/components/home/LatestEvents";
import ServicesSection from "@/components/home/ServicesSection";
import HowWeWork from "@/components/home/HowWeWork";
import CommunityVoice from "@/components/home/CommunityVoice";
import JoinUs from "@/components/home/JoinUs";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSlider />
      <AboutSection />
      <LatestEvents />
      <ServicesSection />
      <HowWeWork />
      <CommunityVoice />
      <JoinUs />
      <Footer />
    </main>
  );
}