"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { eventApi } from "@/lib/api";
import { Event } from "@/types";

function statusBangla(status: string) {
    if (status === "upcoming") return "🟢 আসন্ন";
    if (status === "ongoing") return "🟡 চলমান";
    if (status === "completed") return "✅ সম্পন্ন";
    return "";
}

export default function LatestEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        eventApi.getAll()
        .then((res) => setEvents(res.data.slice(0, 3)))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (loading) return;
        const els = sectionRef.current?.querySelectorAll(".reveal");
        if (!els?.length) return;
        const obs = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add("active"); obs.unobserve(e.target); }
            });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [loading]);

    return (
        <section ref={sectionRef} className="px-6 md:px-16 lg:px-24 py-24 bg-white">
        <style>{`
            .event-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .event-card:hover { transform: translate3d(0,-6px,0); box-shadow:0 20px 50px rgba(0,0,0,0.1); }
            .event-card:hover .event-image img { transform: scale(1.05); }
            .event-image img { transition: transform 0.4s ease; }
            .gradient-text {
            background: linear-gradient(135deg,#065f46,#10b981);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            }
        `}</style>

        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 reveal">
            <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-50 rounded-full px-4 py-2 mb-4">
                <i className="fa-solid fa-calendar-star text-emerald-600 text-sm" />
                <span className="text-emerald-700 text-sm font-semibold">ইভেন্টস</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                আসন্ন <span className="gradient-text">ইভেন্টসমূহ</span>
                </h2>
                <p className="text-gray-500 mt-3 max-w-lg">
                কমিউনিটির সাথে যুক্ত হন এবং পরিবর্তনের অংশীদার হন
                </p>
            </div>
            <Link
                href="/events"
                className="mt-6 md:mt-0 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold py-3 px-6 rounded-xl transition duration-300 text-sm"
            >
                সব ইভেন্ট দেখুন
                <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
            </div>

            {/* Cards */}
            {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-96" />
                ))}
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {events.map((event, idx) => (
                <div
                    key={event.id}
                    className={`event-card bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm reveal reveal-delay-${idx + 1}`}
                >
                    {/* Image */}
                    <div className="event-image relative overflow-hidden h-52">
                    <img
                        src={
                            event.photo 
                            ? `${process.env.NEXT_PUBLIC_API_URL}${event.photo}` 
                            : "/images/event-default.png"
                        }
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                        <span className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                        {event.category ?? "সাধারণ"}
                        </span>
                    </div>
                    <div className="absolute top-4 right-4">
                        <span className="bg-white/90 text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                        {statusBangla(event.status)}
                        </span>
                    </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2">{event.title}</h3>
                    <div className="space-y-2.5 mb-5">
                        {[
                        { bg: "bg-emerald-50", icon: "fa-calendar-day", color: "text-emerald-600", val: event.date },
                        { bg: "bg-blue-50", icon: "fa-clock", color: "text-blue-600", val: event.time },
                        { bg: "bg-amber-50", icon: "fa-location-dot", color: "text-amber-600", val: event.location ?? "" },
                        { bg: "bg-purple-50", icon: "fa-users", color: "text-purple-600", val: `${event.needed_people} জন প্রয়োজন` },
                        ].map((row, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                            <div className={`w-8 h-8 ${row.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <i className={`fa-solid ${row.icon} ${row.color} text-xs`} />
                            </div>
                            <span>{row.val}</span>
                        </div>
                        ))}
                    </div>
                    <Link
                        href={`/eventdetails/${event.id}`}
                        className="inline-flex items-center gap-2 text-emerald-700 font-semibold text-sm hover:gap-3 transition-all"
                    >
                        আরো জানুন
                        <i className="fa-solid fa-arrow-right text-xs" />
                    </Link>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
        </section>
    );
}