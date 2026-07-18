import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ReportSection from "@/components/report/ReportSection";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <ReportSection />
      <Footer />
    </main>
  );
}