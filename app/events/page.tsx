import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import EventsSection from "@/components/events/EventsSection";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <EventsSection />
      <Footer />
    </main>
  );
}