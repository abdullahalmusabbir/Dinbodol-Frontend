import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CustomerDashboard from "@/components/dashboard/customer_dashboard/CustomerDashboard";

export default function CustomerDashboardPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navbar />
        <CustomerDashboard />
        <Footer />
        </main>
    );
}