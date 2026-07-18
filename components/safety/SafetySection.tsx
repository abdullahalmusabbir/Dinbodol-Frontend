"use client";

import React, { useState } from "react";
import { securityReportApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ============================================
// TYPES
// ============================================
interface ComplaintType {
    value: string;
    label: string;
    icon: string;
    bgColor: string;
}

interface EmergencyNumber {
    number: string;
    label: string;
    displayNumber: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    hoverBorder: string;
    hoverText: string;
}

interface Guideline {
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    desc: string;
}

// ============================================
// CONSTANTS
// ============================================
const COMPLAINT_TYPES: ComplaintType[] = [
    {
        value: "হয়রানি",
        label: "হয়রানি",
        icon: "😤",
        bgColor: "bg-red-50",
    },
    {
        value: "পিছুনেওয়া",
        label: "পিছুনেওয়া",
        icon: "🚶",
        bgColor: "bg-amber-50",
    },
    {
        value: "সহিংসতা",
        label: "সহিংসতা",
        icon: "✊",
        bgColor: "bg-rose-50",
    },
    {
        value: "হুমকি",
        label: "হুমকি",
        icon: "⚠️",
        bgColor: "bg-orange-50",
    },
    {
        value: "অনিরাপদ স্থান",
        label: "অনিরাপদ স্থান",
        icon: "📍",
        bgColor: "bg-violet-50",
    },
    {
        value: "অন্যান্য",
        label: "অন্যান্য",
        icon: "•••",
        bgColor: "bg-gray-50",
    },
];

const EMERGENCY_NUMBERS: EmergencyNumber[] = [
    {
        number: "999",
        displayNumber: "৯৯৯",
        label: "জাতীয় জরুরি সেবা",
        icon: "📞",
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        hoverBorder: "hover:border-red-200",
        hoverText: "group-hover:text-red-600",
    },
    {
        number: "100",
        displayNumber: "১০০",
        label: "পুলিশ সুপার",
        icon: "🛡️",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        hoverBorder: "hover:border-blue-200",
        hoverText: "group-hover:text-blue-600",
    },
    {
        number: "102",
        displayNumber: "১০২",
        label: "ফায়ার সার্ভিস",
        icon: "🔥",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
        hoverBorder: "hover:border-orange-200",
        hoverText: "group-hover:text-orange-600",
    },
    {
        number: "103",
        displayNumber: "১০৩",
        label: "অ্যাম্বুলেন্স",
        icon: "🚑",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        hoverBorder: "hover:border-emerald-200",
        hoverText: "group-hover:text-emerald-600",
    },
];

const GUIDELINES: Guideline[] = [
    {
        icon: "📞",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        title: "জরুরি নম্বর সংরক্ষণ করুন",
        desc: "সব জরুরি নম্বর ফোনে সেভ রাখুন",
    },
    {
        icon: "📍",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        title: "অবস্থান শেয়ার করুন",
        desc: "বিশ্বস্ত কারো সাথে লোকেশন শেয়ার করুন",
    },
    {
        icon: "👥",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        title: "জনবহুল এলাকায় থাকুন",
        desc: "রাতে নির্জন জায়গা এড়িয়ে চলুন",
    },
    {
        icon: "👁️",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        title: "সতর্ক থাকুন",
        desc: "আশেপাশের পরিবেশ সম্পর্কে সচেতন থাকুন",
    },
    {
        icon: "📷",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        title: "প্রমাণ সংরক্ষণ করুন",
        desc: "সম্ভব হলে ছবি বা ভিডিও রাখুন",
    },
    ];

// ============================================
// MAIN COMPONENT
// ============================================
export default function SafetySection() {
    const { isAuthenticated } = useAuth();

    // Form state
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // ---- Handle submit ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!selectedCategory) {
        setSubmitError("অনুগ্রহ করে অভিযোগের ধরন নির্বাচন করুন");
        window.scrollTo({ top: 400, behavior: "smooth" });
        return;
        }

        setIsSubmitting(true);
        try {
        await securityReportApi.create({
            category: selectedCategory,
            description,
            location,
        });

        // Success
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);

        // Reset
        setSelectedCategory("");
        setDescription("");
        setLocation("");
        setIsAnonymous(false);
        } catch {
        setSubmitError("সমস্যা হয়েছে, আবার চেষ্টা করুন");
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <>
        {/* ==================== HERO ==================== */}
        <section className="relative bg-red-900 min-h-[440px] flex items-center overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-800/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-700/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
            <div className="absolute top-20 left-1/4 w-2 h-2 bg-red-400/30 rounded-full" />
            <div className="absolute top-32 right-1/3 w-3 h-3 bg-red-400/20 rounded-full" />

            <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20 w-full">
            {/* Shield Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/10 animate-pulse">
                <span className="text-4xl">🛡️</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
                নিরাপত্তা{" "}
                <span className="text-red-300">সহায়তা</span>
            </h1>
            <p className="text-lg md:text-xl text-red-100/80 max-w-2xl mx-auto leading-relaxed">
                আপনার নিরাপত্তা আমাদের অগ্রাধিকার। যেকোনো সমস্যায় আমরা আছি
                আপনার পাশে
            </p>

            {/* Quick action */}
            <div className="mt-8">
                <a
                href="tel:999"
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/20 transition-all"
                >
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-sm">📞</span>
                </div>
                <span className="font-semibold">জরুরি কল করুন ৯৯৯</span>
                </a>
            </div>
            </div>

            {/* Wave */}
            <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full">
                <path
                d="M0 40L48 36C96 32 192 24 288 28C384 32 480 48 576 52C672 56 768 48 864 40C960 32 1056 24 1152 28C1248 32 1344 48 1392 56L1440 64V80H0V40Z"
                fill="#f9fafb"
                />
            </svg>
            </div>
        </section>

        {/* ==================== EMERGENCY NUMBERS ==================== */}
        <section className="bg-gray-50 py-16 px-4">
            <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center space-x-2 bg-red-50 rounded-full px-4 py-2 mb-4">
                <span className="text-red-600 text-sm">📞</span>
                <span className="text-red-700 text-sm font-semibold">
                    জরুরি যোগাযোগ
                </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                জরুরি{" "}
                <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                    হেল্পলাইন
                </span>{" "}
                নম্বর
                </h2>
                <p className="text-gray-500 mt-3 max-w-lg mx-auto">
                যেকোনো জরুরি পরিস্থিতিতে নিচের নম্বরগুলোতে কল করুন
                </p>
            </div>

            {/* Emergency Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
                {EMERGENCY_NUMBERS.map((item) => (
                <a key={item.number} href={`tel:${item.number}`}>
                    <div
                    className={`group bg-white rounded-2xl p-6 md:p-8 text-center shadow-sm border border-gray-100 hover:shadow-xl ${item.hoverBorder} transition-all duration-400 hover:-translate-y-1.5 cursor-pointer`}
                    >
                    <div
                        className={`w-16 h-16 mx-auto ${item.iconBg} rounded-2xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-400`}
                    >
                        {item.icon}
                    </div>
                    <p
                        className={`text-4xl md:text-5xl font-black text-gray-900 mb-2 transition-colors duration-300 ${item.hoverText}`}
                    >
                        {item.displayNumber}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                        {item.label}
                    </p>
                    <div
                        className={`mt-4 inline-flex items-center gap-1.5 text-xs ${item.iconColor} font-semibold opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                        📞 কল করুন
                    </div>
                    </div>
                </a>
                ))}
            </div>
            </div>
        </section>

        {/* ==================== COMPLAINT FORM + SIDEBAR ==================== */}
        <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ===== LEFT: Form (8 cols) ===== */}
            <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 px-8 py-6 border-b border-red-100/50">
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">
                        🛡️
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                        নিরাপত্তা অভিযোগ জানান
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5">
                        আপনার তথ্য সম্পূর্ণ গোপনীয় থাকবে
                        </p>
                    </div>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                    {/* STEP 1: Complaint Type */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm font-bold text-red-700">
                            ১
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">
                            অভিযোগের ধরন নির্বাচন করুন
                        </h4>
                        </div>

                        {submitError && !selectedCategory && (
                        <p className="text-red-500 text-sm mb-3">
                            {submitError}
                        </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {COMPLAINT_TYPES.map((type) => (
                            <div
                            key={type.value}
                            onClick={() => setSelectedCategory(type.value)}
                            className={`relative border-2 rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer text-center transition-all duration-300 ${
                                selectedCategory === type.value
                                ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)] bg-red-50/50"
                                : "border-gray-100 hover:border-red-200"
                            }`}
                            >
                            <div
                                className={`w-14 h-14 ${type.bgColor} rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 ${
                                selectedCategory === type.value ? "scale-110" : ""
                                }`}
                            >
                                {type.icon}
                            </div>
                            <p className="text-gray-700 text-sm font-medium">
                                {type.label}
                            </p>
                            {selectedCategory === type.value && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                                </div>
                            )}
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* STEP 2: Details */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm font-bold text-red-700">
                            ২
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">
                            ঘটনার বিবরণ
                        </h4>
                        </div>

                        <div className="space-y-5">
                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                            ঘটনার বিস্তারিত{" "}
                            <span className="text-red-400">*</span>
                            </label>
                            <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl bg-gray-50 text-[15px] border-2 border-gray-200 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all resize-none"
                            placeholder="কী ঘটেছে, কখন ঘটেছে, কারা জড়িত — যতটুকু পারেন বিস্তারিত লিখুন..."
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                            ঘটনার স্থান{" "}
                            <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                            <input
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-gray-50 text-[15px] border-2 border-gray-200 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                                placeholder="ঘটনার সঠিক অবস্থান/ঠিকানা লিখুন"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                                📍
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* STEP 3: Privacy */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm font-bold text-red-700">
                            ৩
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">
                            গোপনীয়তা
                        </h4>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="mt-0.5">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 accent-red-600 focus:ring-red-500"
                            />
                            </div>
                            <div>
                            <p className="text-gray-800 font-semibold text-sm group-hover:text-red-700 transition-colors">
                                আমি নাম প্রকাশ না করে অভিযোগ করতে চাই
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                এই অপশন সিলেক্ট করলে আপনার পরিচয় সম্পূর্ণ গোপন
                                থাকবে
                            </p>
                            </div>
                            <div className="ml-auto flex-shrink-0">
                            <span className="text-amber-400 text-lg">🕵️</span>
                            </div>
                        </label>
                        </div>
                    </div>

                    {/* Submit error */}
                    {submitError && selectedCategory && (
                        <p className="text-red-500 text-sm">{submitError}</p>
                    )}

                    {/* Submit Button */}
                    {isAuthenticated ? (
                        <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl font-bold text-white text-[16px] flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(220,38,38,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                        {isSubmitting ? (
                            <>
                            <span className="animate-spin">⏳</span>
                            জমা দেওয়া হচ্ছে...
                            </>
                        ) : (
                            <>✈️ অভিযোগ জমা দিন</>
                        )}
                        </button>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                            🔒
                        </div>
                        <div>
                            <p className="text-red-800 font-semibold text-sm">
                            অভিযোগ জমা দিতে লগইন করুন
                            </p>
                            <p className="text-red-600 text-xs mt-0.5">
                            আপনার অ্যাকাউন্টে লগইন করে অভিযোগ সাবমিট করুন
                            </p>
                        </div>
                        <a
                            href="/login"
                            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex-shrink-0"
                        >
                            লগইন
                        </a>
                        </div>
                    )}
                    </form>
                </div>
                </div>
            </div>

            {/* ===== RIGHT: Sidebar (4 cols) ===== */}
            <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                {/* Safety Guidelines */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-lg">
                        🛡️
                    </div>
                    <h4 className="font-bold text-gray-800 text-[15px]">
                        নিরাপত্তা নির্দেশনা
                    </h4>
                    </div>
                    <div className="p-4 space-y-2">
                    {GUIDELINES.map((guide, index) => (
                        <div
                        key={index}
                        className="flex items-start gap-3.5 p-3.5 rounded-xl border-l-4 border-l-transparent bg-white hover:bg-red-50/50 hover:border-l-red-400 hover:translate-x-1 transition-all cursor-default"
                        >
                        <div
                            className={`w-9 h-9 ${guide.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-lg`}
                        >
                            {guide.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                            {guide.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                            {guide.desc}
                            </p>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* 24/7 Helpline */}
                <div className="bg-gradient-to-br from-red-800 to-red-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-700/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-red-600/20 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 text-center">
                    <div className="w-14 h-14 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/10 text-2xl">
                        🎧
                    </div>
                    <h4 className="font-bold text-lg mb-1">২৪/৭ হেল্পলাইন</h4>
                    <p className="text-red-200/70 text-sm mb-5">
                        যেকোনো সময় আমাদের সাথে যোগাযোগ করুন
                    </p>
                    <a
                        href="tel:10920"
                        className="inline-flex items-center gap-3 bg-white text-red-700 px-6 py-3 rounded-xl font-bold hover:bg-red-50 transition-all shadow-lg"
                    >
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm animate-pulse">
                            📞
                        </span>
                        </div>
                        ১০৯২০
                    </a>
                    <p className="text-red-200/50 text-xs mt-4">
                        মহিলা ও শিশু নির্যাতন প্রতিরোধ সেল
                    </p>
                    </div>
                </div>

                {/* Additional Resources */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-lg">
                        🔗
                    </div>
                    <h4 className="font-bold text-gray-800 text-[15px]">
                        প্রয়োজনীয় লিঙ্ক
                    </h4>
                    </div>

                    <div className="space-y-3">
                    {[
                        {
                        icon: "⚖️",
                        bg: "bg-blue-50",
                        label: "আইনি সহায়তা",
                        hover: "group-hover:text-blue-600",
                        },
                        {
                        icon: "🏥",
                        bg: "bg-emerald-50",
                        label: "নিকটস্থ হাসপাতাল",
                        hover: "group-hover:text-emerald-600",
                        },
                        {
                        icon: "🏛️",
                        bg: "bg-amber-50",
                        label: "নিকটস্থ থানা",
                        hover: "group-hover:text-amber-600",
                        },
                    ].map((link, index) => (
                        <a
                        key={index}
                        href="#"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                        <div
                            className={`w-8 h-8 ${link.bg} rounded-lg flex items-center justify-center flex-shrink-0 text-sm`}
                        >
                            {link.icon}
                        </div>
                        <div className="flex-1">
                            <p
                            className={`text-sm font-medium text-gray-700 transition-colors ${link.hover}`}
                            >
                            {link.label}
                            </p>
                        </div>
                        <span className="text-gray-300 text-xs">↗</span>
                        </a>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* ==================== TOAST ==================== */}
        {showToast && (
            <div className="fixed top-[90px] right-6 z-50 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 px-6 py-4 flex items-center gap-4 max-w-sm animate-in slide-in-from-right">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                ✅
                </div>
                <div>
                <p className="font-bold text-gray-900 text-sm">অভিযোগ সফল!</p>
                <p className="text-gray-500 text-xs mt-0.5">
                    আপনার অভিযোগ সফলভাবে জমা হয়েছে
                </p>
                </div>
            </div>
            </div>
        )}
        </>
    );
}