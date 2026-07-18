"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function JoinUs() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
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
    }, []);

    return (
        <section
        ref={sectionRef}
        className="relative w-full min-h-[90vh] flex items-center overflow-hidden"
        style={{
            backgroundImage: "url('/images/home-8.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}
        >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl px-8 md:px-16 py-20">
            <div className="reveal">
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-5 py-2 mb-8 border border-white/20">
                <i className="fa-solid fa-rocket text-emerald-400" />
                <span className="text-white/90 text-sm font-medium">আজই শুরু করুন</span>
            </div>

            <h2 className="text-white text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
                আজই যোগ দিন
                <br />
                <span className="text-emerald-400">পরিবর্তনের</span>
                <br />
                অংশীদার হন
            </h2>

            <p className="text-white/70 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
                হাজারো মানুষ ইতিমধ্যে তাদের এলাকা পরিবর্তন করছে। আপনিও যুক্ত হন আমাদের সাথে।
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                href="/register"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold text-gray-900 bg-white shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300"
                >
                শুরু করুন
                <span className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <i className="fa-solid fa-arrow-right text-white text-sm" />
                </span>
                </Link>

                <Link
                href="/reports"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-semibold text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
                >
                <i className="fa-solid fa-bullhorn text-sm" />
                রিপোর্ট করুন
                </Link>
            </div>
            </div>
        </div>
        </section>
    );
}