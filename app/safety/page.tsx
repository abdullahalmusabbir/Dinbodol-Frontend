import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SafetySection from "@/components/safety/SafetySection";

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <SafetySection />
      <Footer />
    </main>
  );
}