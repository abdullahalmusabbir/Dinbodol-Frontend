import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import VolunteerSection from "@/components/volunteer/VolunteerSection";

export default function VolunteerPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <VolunteerSection />
      <Footer />
    </main>
  );
}