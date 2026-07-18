"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const testimonials = [
    {
        name: "ফারজান মাহির",
        location: "ঢাকা, মোহাম্মাদপুর",
        avatar: "/images/farjan.jpeg",
        stars: 5,
        text: "আমাদের এলাকার রাস্তাঘাটের সমস্যা রিপোর্ট করার পর মাত্র ৫ দিনে সমাধান হয়েছে। দারুণ উদ্যোগ!",
        delay: "reveal-delay-1",
    },
    {
        name: "জিসান",
        location: "ঢাকা, মোহাম্মাদপুর",
        avatar: "/images/zisan.png",
        stars: 5,
        text: "স্বেচ্ছাসেবক হিসেবে কাজ করে আমি আমাদের কমিউনিটিকে সাহায্য করতে পেরে অসাধারণ অভিজ্ঞতা পেয়েছি।",
        delay: "reveal-delay-2",
    },
];

export default function CommunityVoice() {
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
        <section ref={sectionRef} className="py-24 bg-white">
        <style>{`
            .testimonial-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .testimonial-card:hover { transform: translate3d(0,-4px,0); box-shadow:0 20px 50px rgba(0,0,0,0.08); }
            .gradient-text {
            background: linear-gradient(135deg,#065f46,#10b981);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
            }
        `}</style>

        <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 rounded-full px-4 py-2 mb-4">
                <i className="fa-solid fa-quote-left text-emerald-600 text-sm" />
                <span className="text-emerald-700 text-sm font-semibold">মতামত</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                কমিউনিটির <span className="gradient-text">কণ্ঠস্বর</span>
            </h2>
            <p className="text-gray-500 mt-3">ব্যবহারকারীরা তাদের অভিজ্ঞতা শেয়ার করছেন</p>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8">
            {/* Text Cards */}
            {testimonials.map((t) => (
                <div
                key={t.name}
                className={`testimonial-card bg-white rounded-2xl p-7 shadow-sm border border-gray-100 reveal ${t.delay}`}
                >
                <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                    <Image
                        src={t.avatar}
                        alt={t.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-100"
                        loading="lazy"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-check text-white text-[8px]" />
                    </div>
                    </div>
                    <div>
                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <i className="fa-solid fa-location-dot" />
                        {t.location}
                    </p>
                    </div>
                </div>
                <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                    <i key={i} className="fa-solid fa-star text-amber-400 text-sm" />
                    ))}
                </div>
                <p className="text-gray-600 text-[15px] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                </div>
            ))}

            {/* Image Card */}
            <div className="testimonial-card relative rounded-2xl overflow-hidden shadow-sm h-72 sm:h-80 md:h-auto group reveal reveal-delay-3">
                <Image
                src="/images/musabbir.jpg"
                alt="মুসাব্বির"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6">
                <h4 className="text-white text-lg font-bold">মুসাব্বির</h4>
                <p className="text-white/70 text-sm flex items-center gap-1">
                    <i className="fa-solid fa-location-dot text-xs" />
                    ঢাকা, ধানমন্ডি
                </p>
                </div>
            </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Wide Image */}
            <div className="md:col-span-2 testimonial-card relative rounded-2xl overflow-hidden shadow-sm h-72 sm:h-80 md:h-96 group reveal reveal-delay-1">
                <Image
                src="/images/sajjad.png"
                alt="সাজ্জাদ"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6">
                <h4 className="text-white text-xl font-bold">সাজ্জাদ</h4>
                <p className="text-white/70 text-sm flex items-center gap-1">
                    <i className="fa-solid fa-location-dot text-xs" />
                    ঢাকা, মোহাম্মাদপুর
                </p>
                </div>
            </div>

            {/* Text Card */}
            <div className="testimonial-card bg-white rounded-2xl p-7 shadow-sm border border-gray-100 reveal reveal-delay-2">
                <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                    <Image
                    src="/images/ishtiak.jpg"
                    alt="ইশতিয়াক"
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-100"
                    loading="lazy"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-check text-white text-[8px]" />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">ইশতিয়াক</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                    <i className="fa-solid fa-location-dot" />
                    ঢাকা, মোহাম্মাদপুর
                    </p>
                </div>
                </div>
                <div className="flex gap-1 mb-4">
                {[1,2,3,4].map((i) => (
                    <i key={i} className="fa-solid fa-star text-amber-400 text-sm" />
                ))}
                <i className="fa-solid fa-star-half-stroke text-amber-400 text-sm" />
                </div>
                <p className="text-gray-600 text-[15px] leading-relaxed">
                &ldquo;আমাদের এলাকার রাস্তাঘাটের সমস্যা রিপোর্ট করার পর মাত্র ৫ দিনে সমাধান হয়েছে। দারুণ উদ্যোগ!&rdquo;
                </p>
            </div>
            </div>
        </div>
        </section>
    );
}