"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import EventDetailsSection from "@/components/eventdetails/EventDetailsSection";

export default function EventDetailsPage() {
    const params = useParams();
    const id = Number(params.id);

    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <EventDetailsSection eventId={id} />
            <Footer />
        </main>
    );
}