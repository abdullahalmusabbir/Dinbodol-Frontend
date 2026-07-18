"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SLIDES = [
    "/images/home-1.png",
    "/images/home-9.png",
    "/images/home-11.png",
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
        <style>{`
            .float-badge {
            animation: floatBadge 3s ease-in-out infinite;
            }
            @keyframes floatBadge {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
            }
            .slide { transition: opacity 1.5s ease; }
            .stats-bar {
            background: linear-gradient(135deg, #064e3b, #065f46);
            }
            .stat-number { font-variant-numeric: tabular-nums; }
            .reveal {
            opacity: 0;
            transform: translate3d(0, 30px, 0);
            transition: opacity 0.6s ease, transform 0.6s ease;
            will-change: opacity, transform;
            }
            .reveal.active {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            }
            .reveal-delay-1 { transition-delay: 0.1s; }
            .reveal-delay-2 { transition-delay: 0.2s; }
            .reveal-delay-3 { transition-delay: 0.3s; }
            .reveal-delay-4 { transition-delay: 0.4s; }
        `}</style>

        {/* ── Hero ── */}
        <section className="relative w-full h-screen overflow-hidden">
            {/* Slides */}
            <div className="absolute inset-0 w-full h-full">
            {SLIDES.map((src, i) => (
                <div
                key={i}
                className="slide absolute inset-0 w-full h-full bg-cover bg-center"
                style={{
                    backgroundImage: `url('${src}')`,
                    opacity: i === current ? 1 : 0,
                }}
                />
            ))}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="float-badge inline-flex items-center space-x-2 bg-white/15 rounded-full px-5 py-2 mb-8 border border-white/20">
                <span className="text-sm font-medium text-emerald-100">
                কমিউনিটি প্ল্যাটফর্ম সক্রিয়
                </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.15] tracking-tight">
                আপনার এলাকার
                <br />
                <span className="text-emerald-400">সমস্যা জানান</span>
                <br />
                পরিবর্তন আনুন
            </h1>

            <p className="mt-6 text-lg md:text-xl font-light text-gray-200 max-w-2xl leading-relaxed">
                একসাথে গড়ি নিরাপদ ও সুন্দর সমাজ — প্রতিটি কণ্ঠস্বর এখানে গুরুত্বপূর্ণ
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                href="/reports"
                className="group bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                >
                <i className="fa-solid fa-bullhorn text-sm" />
                সমস্যা রিপোর্ট করুন
                <i className="fa-solid fa-arrow-right text-sm transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                href="#aboutSection"
                className="border-2 border-white/40 hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                <i className="fa-solid fa-play text-xs" />
                আরো জানুন
                </a>
            </div>
            </div>
        </section>

        {/* ── Stats Bar ── */}
        <StatsBar />
        </>
    );
}

// ── Stats Counter ──
function StatsBar() {
    const stats = [
        { target: 1200, label: "সমস্যা সমাধান" },
        { target: 850,  label: "স্বেচ্ছাসেবক", delay: "reveal-delay-1" },
        { target: 50,   label: "এলাকা কভারেজ", delay: "reveal-delay-2" },
        { target: 5000, label: "সক্রিয় ব্যবহারকারী", delay: "reveal-delay-3" },
    ];

    return (
        <section className="stats-bar py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {stats.map((s, i) => (
            <StatItem key={i} target={s.target} label={s.label} delay={s.delay} />
            ))}
        </div>
        </section>
    );
}

function StatItem({ target, label, delay = "" }: { target: number; label: string; delay?: string }) {
    const [count, setCount] = useState(0);
    const [ref, setRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!ref) return;
        const obs = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
            let current = 0;
            const step = Math.ceil(target / 50);
            const timer = setInterval(() => {
                current += step;
                if (current >= target) { current = target; clearInterval(timer); }
                setCount(current);
            }, 35);
            obs.disconnect();
            }
        },
        { threshold: 0.5 }
        );
        obs.observe(ref);
        return () => obs.disconnect();
    }, [ref, target]);

    return (
        <div ref={setRef} className={`reveal ${delay}`}>
        <p className="stat-number text-3xl md:text-4xl font-bold text-emerald-300">
            {count.toLocaleString("bn-BD")}+
        </p>
        <p className="text-emerald-100/70 text-sm mt-1">{label}</p>
        </div>
    );
}