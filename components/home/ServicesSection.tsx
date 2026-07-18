"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ServicesSection() {
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
        id="aboutSection"
        ref={sectionRef}
        className="bg-gradient-to-b from-gray-50 to-white py-24 px-6 md:px-20"
        >
        <style>{`
            .service-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
            .service-card:hover { transform: translate3d(0,-8px,0); box-shadow:0 25px 60px rgba(0,0,0,0.12); }
            .gradient-text {
            background: linear-gradient(135deg,#065f46,#10b981);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
            }
        `}</style>

        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 reveal">
            <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-50 rounded-full px-4 py-2 mb-4">
                <i className="fa-solid fa-cubes text-emerald-600 text-sm" />
                <span className="text-emerald-700 text-sm font-semibold">সেবাসমূহ</span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                আমাদের
                <br />
                <span className="gradient-text">সেবাসমূহ</span>
                </h2>
            </div>
            <p className="text-gray-500 max-w-md mt-4 md:mt-0 text-lg">
                আপনার কমিউনিটিকে আরও ভালো করতে আমরা যে সেবাগুলো প্রদান করি
            </p>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Large Card */}
            <div className="lg:col-span-2 service-card group relative bg-gradient-to-br from-emerald-800 to-emerald-950 p-10 md:p-12 rounded-3xl overflow-hidden reveal">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/30 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/20 rounded-full translate-y-1/3 -translate-x-1/3" />
                <div className="relative z-10">
                <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                    <i className="fa-solid fa-flag text-emerald-300 text-sm" />
                    <span className="text-emerald-200 text-sm font-medium">প্রধান সেবা</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">সমস্যা রিপোর্টিং সিস্টেম</h3>
                <p className="text-emerald-100/80 text-base leading-relaxed mb-10 max-w-lg">
                    রাস্তা, বিদ্যুৎ, পানি — যেকোনো সমস্যার রিপোর্ট করুন এবং সমাধানের অগ্রগতি ট্র্যাক করুন
                </p>
                <Image
                    src="/images/home-4.png"
                    alt="রিপোর্টিং সিস্টেম"
                    width={500}
                    height={300}
                    className="rounded-2xl w-full max-w-md shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                />
                </div>
            </div>

            {/* Small Card */}
            <div className="service-card bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center reveal reveal-delay-1">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-8">
                <i className="fa-solid fa-shield-heart text-red-500 text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">মহিলা নিরাপত্তা</h3>
                <p className="text-gray-500 leading-relaxed">
                জরুরি সহায়তা এবং নিরাপত্তা অধিকার সচেতনতা প্রদান করি আমরা
                </p>
                <Link
                href="/safety"
                className="mt-6 inline-flex items-center gap-2 text-red-600 font-semibold text-sm hover:gap-3 transition-all"
                >
                বিস্তারিত <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
            </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Small Card */}
            <div className="service-card bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center reveal reveal-delay-2">
                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-8">
                <i className="fa-solid fa-magnifying-glass-location text-purple-500 text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">হারানো-পাওয়া</h3>
                <p className="text-gray-500 leading-relaxed">
                হারানো জিনিস খুঁজে পেতে এবং পাওয়া জিনিস ফেরত দিতে সাহায্য করি
                </p>
                <Link
                href="/lost-found"
                className="mt-6 inline-flex items-center gap-2 text-purple-600 font-semibold text-sm hover:gap-3 transition-all"
                >
                বিস্তারিত <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
            </div>

            {/* Large Card */}
            <div className="lg:col-span-2 service-card group relative bg-gradient-to-br from-emerald-800 to-emerald-950 p-10 md:p-12 rounded-3xl overflow-hidden reveal reveal-delay-3">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/30 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative z-10">
                <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                    <i className="fa-solid fa-people-group text-emerald-300 text-sm" />
                    <span className="text-emerald-200 text-sm font-medium">দল গঠন</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">স্বেচ্ছাসেবক দল</h3>
                <p className="text-emerald-100/80 text-base leading-relaxed mb-10 max-w-lg">
                    আমাদের নিবেদিত স্বেচ্ছাসেবকরা প্রতিদিন কমিউনিটির সেবায় কাজ করছেন
                </p>
                <Image
                    src="/images/home-1.png"
                    alt="স্বেচ্ছাসেবক"
                    width={500}
                    height={300}
                    className="rounded-2xl w-full max-w-md shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                />
                </div>
            </div>
            </div>
        </div>
        </section>
    );
}