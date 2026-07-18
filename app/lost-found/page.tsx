import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import LostFoundSection from "@/components/lost-found/LostFoundSection";

export default function LostFoundPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <LostFoundSection />
      <Footer />
    </main>
  );
}