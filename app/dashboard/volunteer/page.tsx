import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import VolunteerDashboard from "@/components/dashboard/volunteer_dashboard/VolunteerDashboard";

export default function VolunteerDashboardPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navbar />
        <VolunteerDashboard />
        <Footer />
        </main>
    );
}