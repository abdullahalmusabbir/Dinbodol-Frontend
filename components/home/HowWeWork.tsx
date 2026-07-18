"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function HowWeWork() {
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
        <section ref={sectionRef} className="py-24 px-6 md:px-20 bg-gradient-to-b from-amber-50/50 to-orange-50/30">
        <style>{`
            .service-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
            .service-card:hover { transform: translate3d(0,-8px,0); box-shadow:0 25px 60px rgba(0,0,0,0.12); }
            .gradient-text {
            background: linear-gradient(135deg,#065f46,#10b981);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
            }
            .step-connector { position: relative; }
            .step-connector::after {
            content:''; position:absolute; top:32px; right:-5%;
            width:10%; height:2px;
            background:linear-gradient(90deg,#d1fae5,#059669);
            display:none;
            }
            @media (min-width:768px) { .step-connector::after { display:block; } }
        `}</style>

        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20 reveal">
            <div className="inline-flex items-center space-x-2 bg-amber-100 rounded-full px-4 py-2 mb-4">
                <i className="fa-solid fa-route text-amber-700 text-sm" />
                <span className="text-amber-700 text-sm font-semibold">প্রক্রিয়া</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                কীভাবে <span className="gradient-text">কাজ করে</span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto">
                তিনটি সহজ ধাপে আপনার এলাকার সমস্যা সমাধান করুন
            </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">

            {/* Step 1 */}
            <div className="step-connector reveal reveal-delay-1">
                <div className="service-card bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 lg:p-10 rounded-3xl relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 border border-white/10">
                    ১
                    </div>
                    <h3 className="text-2xl font-bold mb-3">রিপোর্ট করুন</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-8">
                    আপনার এলাকার সমস্যা সম্পর্কে বিস্তারিত তথ্য দিয়ে রিপোর্ট জমা দিন
                    </p>
                    <Image
                    src="/images/home-5.png"
                    alt="রিপোর্ট"
                    width={400}
                    height={250}
                    className="rounded-xl w-full shadow-lg"
                    loading="lazy"
                    />
                </div>
                </div>
            </div>

            {/* Step 2 */}
            <div className="step-connector reveal reveal-delay-2">
                <div className="service-card bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-full">
                <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-1.5 text-emerald-700 text-sm font-semibold mb-6">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    প্রক্রিয়াধীন
                </div>
                <Image
                    src="/images/home-6.png"
                    alt="যাচাই"
                    width={400}
                    height={250}
                    className="rounded-xl mb-8 w-full shadow-sm"
                    loading="lazy"
                />
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-emerald-700 mb-4">
                    ২
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">যাচাইকরণ</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    আমাদের টিম রিপোর্টটি যাচাই করে এবং সঠিক বিভাগে পৌঁছে দেয়
                </p>
                </div>
            </div>

            {/* Step 3 */}
            <div className="reveal reveal-delay-3">
                <div className="service-card bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-full">
                <Image
                    src="/images/home-7.png"
                    alt="সমাধান"
                    width={400}
                    height={250}
                    className="rounded-xl w-full mb-8 shadow-sm"
                    loading="lazy"
                />
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-emerald-700 mb-4">
                    ৩
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">সমাধান</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    সংশ্লিষ্ট কর্তৃপক্ষ দ্রুত সমস্যার সমাধানে কাজ করে
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-full text-sm">
                    <i className="fa-solid fa-circle-check" />
                    সম্পন্ন
                </div>
                </div>
            </div>
            </div>
        </div>
        </section>
    );
}