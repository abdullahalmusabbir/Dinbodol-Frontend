import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PaymentForm from "@/components/payments/PaymentForm";

export const metadata = {
    title: "ডোনেশন — দিনবদল",
};

export default function PaymentPage() {
    return (
        <main>
        <Navbar />
        <PaymentForm />
        <Footer />
        </main>
    );
}