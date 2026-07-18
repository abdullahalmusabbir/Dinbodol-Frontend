"use client";

import { useEffect, useRef } from "react";

export default function AboutSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const els = sectionRef.current?.querySelectorAll(".reveal");
        if (!els?.length) return;
        const obs = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add("active");
                obs.unobserve(e.target);
            }
            });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    const features = [
        {
        icon: "fa-chart-line",
        bg: "bg-emerald-50",
        color: "text-emerald-600",
        title: "স্বচ্ছতা",
        desc: "প্রতিটি রিপোর্ট ট্র্যাক করুন",
        delay: "reveal-delay-1",
        mt: "",
        },
        {
        icon: "fa-gauge-high",
        bg: "bg-blue-50",
        color: "text-blue-600",
        title: "দ্রুততা",
        desc: "দ্রুত সমস্যা চিহ্নিত করুন",
        delay: "reveal-delay-2",
        mt: "mt-8",
        },
        {
        icon: "fa-handshake",
        bg: "bg-amber-50",
        color: "text-amber-600",
        title: "সহযোগিতা",
        desc: "একসাথে কাজ করুন",
        delay: "reveal-delay-3",
        mt: "",
        },
        {
        icon: "fa-shield-halved",
        bg: "bg-purple-50",
        color: "text-purple-600",
        title: "নিরাপত্তা",
        desc: "সুরক্ষিত পরিবেশ",
        delay: "reveal-delay-4",
        mt: "mt-8",
        },
    ];

    return (
        <section ref={sectionRef} className="py-24 px-6 md:px-20 bg-gradient-to-b from-gray-50 to-white">
        <style>{`
            .gradient-text {
            background: linear-gradient(135deg, #065f46, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            }
            .feature-icon-box { transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .feature-card:hover .feature-icon-box {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 8px 30px rgba(5,150,105,0.25);
            }
        `}</style>

        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Left */}
            <div className="lg:w-1/2 reveal">
                <div className="inline-flex items-center space-x-2 bg-emerald-50 rounded-full px-4 py-2 mb-6">
                <i className="fa-solid fa-seedling text-emerald-600 text-sm" />
                <span className="text-emerald-700 text-sm font-semibold">আমাদের সম্পর্কে</span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                কমিউনিটি প্ল্যাটফর্ম
                <br />
                <span className="gradient-text">যেখানে প্রতিটি</span>
                <br />
                <span className="gradient-text">কণ্ঠস্বর গুরুত্বপূর্ণ</span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                আমরা বিশ্বাস করি যে প্রতিটি নাগরিকের কণ্ঠস্বর গুরুত্বপূর্ণ। আমাদের প্ল্যাটফর্ম
                আপনার এলাকার সমস্যা চিহ্নিত করতে, রিপোর্ট করতে এবং সমাধানের পথে এগিয়ে যেতে সাহায্য করে।
                </p>
                <div className="flex flex-wrap gap-4">
                {["বিনামূল্যে ব্যবহার", "দ্রুত সমাধান", "সম্পূর্ণ স্বচ্ছ"].map((t) => (
                    <div key={t} className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                    <i className="fa-solid fa-check-circle text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">{t}</span>
                    </div>
                ))}
                </div>
            </div>

            {/* Right — Feature Cards */}
            <div className="lg:w-1/2 grid grid-cols-2 gap-5">
                {features.map((f) => (
                <div
                    key={f.title}
                    className={`feature-card bg-white rounded-2xl p-6 shadow-sm border border-gray-100 reveal ${f.delay} ${f.mt}`}
                >
                    <div className={`feature-icon-box w-14 h-14 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <i className={`fa-solid ${f.icon} ${f.color} text-xl`} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
                ))}
            </div>
            </div>
        </div>
        </section>
    );
}