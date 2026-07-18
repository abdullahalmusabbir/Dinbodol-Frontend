import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AdminDashboard from "@/components/dashboard/admin_dashboard/AdminDashboard";

export default function CustomerDashboardPage() {
    
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navbar />
        <AdminDashboard />
        <Footer />
        </main>
    );
}