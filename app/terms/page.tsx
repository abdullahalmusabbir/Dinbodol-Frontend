import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import TermsSection from "@/components/terms/TermsSection";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white">
        <Navbar />
        <TermsSection />
        <Footer />
        </main>
    );
}