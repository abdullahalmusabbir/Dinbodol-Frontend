"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { reportApi } from "@/lib/api";
import { Report, ReportStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";

// ============================================
// TYPES
// ============================================
interface ProblemType {
    value: string;
    label: string;
    icon: string;
    iconColor: string;
    bgColor: string;
}

interface TrackStep {
    title: string;
    desc: string;
    key: string;
    icon: string;
}

// ============================================
// CONSTANTS
// ============================================
const PROBLEM_TYPES: ProblemType[] = [
    {
        value: "রাস্তা ও যোগাযোগ",
        label: "রাস্তা ও যোগাযোগ",
        icon: "🛣️",
        iconColor: "text-orange-500",
        bgColor: "bg-orange-50",
    },
    {
        value: "বিদ্যুৎ",
        label: "বিদ্যুৎ",
        icon: "⚡",
        iconColor: "text-yellow-500",
        bgColor: "bg-yellow-50",
    },
    {
        value: "পানি সরবরাহ",
        label: "পানি সরবরাহ",
        icon: "💧",
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50",
    },
    {
        value: "আবর্জনা ব্যবস্থাপনা",
        label: "আবর্জনা ব্যবস্থাপনা",
        icon: "🗑️",
        iconColor: "text-green-500",
        bgColor: "bg-green-50",
    },
    {
        value: "নর্দমা",
        label: "নর্দমা",
        icon: "🌊",
        iconColor: "text-cyan-500",
        bgColor: "bg-cyan-50",
    },
    {
        value: "অন্যান্য",
        label: "অন্যান্য",
        icon: "•••",
        iconColor: "text-purple-500",
        bgColor: "bg-purple-50",
    },
];

const TRACK_STEPS: TrackStep[] = [
    {
        title: "রিপোর্ট গৃহীত",
        desc: "আপনার রিপোর্ট সফলভাবে গৃহীত হয়েছে",
        key: "pending",
        icon: "📥",
    },
    {
        title: "পর্যালোচনা চলছে",
        desc: "রিপোর্টটি বিস্তারিত পর্যালোচনা করা হচ্ছে",
        key: "under_analysis",
        icon: "🔍",
    },
    {
        title: "সমাধান প্রক্রিয়া",
        desc: "সমস্যা সমাধানের কাজ চলমান আছে",
        key: "in_progress",
        icon: "⚙️",
    },
    {
        title: "সম্পন্ন",
        desc: "সমস্যাটি সফলভাবে সমাধান করা হয়েছে",
        key: "solved",
        icon: "✅",
    },
];

// ============================================
// STATUS HELPERS
// ============================================
function getStatusInfo(status: ReportStatus) {
    switch (status) {
        case "pending":
        return {
            text: "পেন্ডিং",
            bg: "bg-gray-100",
            color: "text-gray-600",
            dot: "bg-gray-400",
        };
        case "under_analysis":
        return {
            text: "পর্যালোচনা",
            bg: "bg-amber-50",
            color: "text-amber-700",
            dot: "bg-amber-400",
        };
        case "in_progress":
        return {
            text: "চলমান",
            bg: "bg-blue-50",
            color: "text-blue-700",
            dot: "bg-blue-400",
        };
        case "solved":
        return {
            text: "সমাধান",
            bg: "bg-emerald-50",
            color: "text-emerald-700",
            dot: "bg-emerald-400",
        };
        case "closed":
        return {
            text: "বন্ধ",
            bg: "bg-red-50",
            color: "text-red-700",
            dot: "bg-red-400",
        };
        default:
        return {
            text: "অজানা",
            bg: "bg-gray-100",
            color: "text-gray-600",
            dot: "bg-gray-400",
        };
    }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReportSection() {
    const { isAuthenticated } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState<"new" | "track">("new");

    // Form state
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [submitError, setSubmitError] = useState<string>("");

    // Track state
    const [trackId, setTrackId] = useState("");
    const [trackResult, setTrackResult] = useState<Report | null>(null);
    const [trackError, setTrackError] = useState(false);
    const [isTracking, setIsTracking] = useState(false);

    // Recent reports
    const [recentReports, setRecentReports] = useState<Report[]>([]);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---- Fetch recent reports ----
    const fetchRecentReports = useCallback(async () => {
        try {
        const res = await reportApi.getAll();
        const data: Report[] = res.data;
        const sorted = [...data]
            .sort(
            (a, b) =>
                new Date(b.reported_at).getTime() -
                new Date(a.reported_at).getTime()
            )
            .slice(0, 5);
        setRecentReports(sorted);
        } catch (err) {
        console.error("Recent reports fetch error:", err);
        }
    }, []);

    useEffect(() => {
        fetchRecentReports();
    }, [fetchRecentReports]);

    // ---- Submit report ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!selectedCategory) {
        setSubmitError("অনুগ্রহ করে সমস্যার ধরন নির্বাচন করুন");
        return;
        }

        setIsSubmitting(true);
        try {
        const formData = new FormData();
        formData.append("category", selectedCategory);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("location", location);
        if (imageFile) formData.append("image", imageFile);

        await reportApi.create(formData);

        // Success
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);

        // Reset form
        setSelectedCategory("");
        setTitle("");
        setDescription("");
        setLocation("");
        setImageFile(null);

        // Refresh sidebar
        fetchRecentReports();
        } catch {
        setSubmitError("সমস্যা হয়েছে, আবার চেষ্টা করুন");
        } finally {
        setIsSubmitting(false);
        }
    };

    // ---- Track report ----
    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackId.trim()) return;

        setIsTracking(true);
        setTrackResult(null);
        setTrackError(false);

        try {
        const res = await reportApi.getById(Number(trackId.trim()));
        setTrackResult(res.data);
        } catch {
        setTrackError(true);
        } finally {
        setIsTracking(false);
        }
    };

    // ---- File upload ----
    const handleFileChange = (file: File | null) => {
        if (file) setImageFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length) {
        handleFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <>
        {/* ==================== HERO ==================== */}
        <section className="relative bg-emerald-950 min-h-[420px] flex items-center overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

            <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20 w-full">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/15">
                <span className="text-emerald-100 text-sm font-medium">
                রিপোর্টিং সিস্টেম সক্রিয়
                </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
                সমস্যা{" "}
                <span className="text-emerald-300">রিপোর্ট</span> করুন
            </h1>
            <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
                আপনার এলাকার যেকোনো সমস্যা জানান এবং সমাধানের অগ্রগতি ট্র্যাক
                করুন
            </p>

            {/* Quick Stats */}
            <div className="mt-10 flex flex-wrap justify-center gap-8">
                <div className="text-center">
                <p className="text-2xl font-bold text-white">১২০০+</p>
                <p className="text-emerald-200/60 text-sm">সমস্যা সমাধান</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                <p className="text-2xl font-bold text-white">৯৫%</p>
                <p className="text-emerald-200/60 text-sm">সন্তুষ্টির হার</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                <p className="text-2xl font-bold text-white">৪৮ ঘণ্টা</p>
                <p className="text-emerald-200/60 text-sm">গড় সমাধান সময়</p>
                </div>
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

        {/* ==================== MAIN CONTENT ==================== */}
        <section className="py-12 px-4 bg-gray-50">
            {/* Tab Buttons */}
            <div className="max-w-7xl mx-auto mb-10">
            <div className="flex justify-center">
                <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
                <button
                    onClick={() => setActiveTab("new")}
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-[15px] transition-all ${
                    activeTab === "new"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    ➕ নতুন রিপোর্ট
                </button>
                <button
                    onClick={() => setActiveTab("track")}
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-[15px] transition-all ${
                    activeTab === "track"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    🔍 রিপোর্ট ট্র্যাক করুন
                </button>
                </div>
            </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ========== LEFT: Forms (8 cols) ========== */}
            <div className="lg:col-span-8">
                {/* ===== NEW REPORT FORM ===== */}
                {activeTab === "new" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                        📋
                        </div>
                        <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            নতুন সমস্যা রিপোর্ট করুন
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5">
                            সমস্ত তথ্য সঠিকভাবে পূরণ করুন
                        </p>
                        </div>
                    </div>
                    </div>

                    {/* Form Body */}
                    <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* STEP 1: Problem Type */}
                        <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm font-bold text-emerald-700">
                            ১
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">
                            সমস্যার ধরন নির্বাচন করুন
                            </h4>
                        </div>

                        {submitError && selectedCategory === "" && (
                            <p className="text-red-500 text-sm mb-3">
                            {submitError}
                            </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {PROBLEM_TYPES.map((type) => (
                            <div
                                key={type.value}
                                onClick={() => setSelectedCategory(type.value)}
                                className={`relative border-2 rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer text-center transition-all duration-300 ${
                                selectedCategory === type.value
                                    ? "border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)] bg-emerald-50/50"
                                    : "border-gray-100 hover:border-emerald-200"
                                }`}
                            >
                                <div
                                className={`w-14 h-14 ${type.bgColor} rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 ${
                                    selectedCategory === type.value
                                    ? "scale-110"
                                    : ""
                                }`}
                                >
                                {type.icon}
                                </div>
                                <p className="text-gray-700 text-sm font-medium">
                                {type.label}
                                </p>
                                {selectedCategory === type.value && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
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
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm font-bold text-emerald-700">
                            ২
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">
                            সমস্যার বিবরণ
                            </h4>
                        </div>

                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                                সমস্যার শিরোনাম{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl bg-gray-50 text-[15px] border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                                placeholder="সংক্ষেপে সমস্যাটি লিখুন"
                            />
                            </div>

                            {/* Description */}
                            <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                                বিস্তারিত বর্ণনা{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl bg-gray-50 text-[15px] border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all resize-none"
                                placeholder="সমস্যার বিস্তারিত বর্ণনা লিখুন... কখন থেকে সমস্যা, কতটুকু এলাকা প্রভাবিত ইত্যাদি"
                            />
                            </div>

                            {/* Location */}
                            <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                                স্থান <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-gray-50 text-[15px] border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                                placeholder="সমস্যার সঠিক অবস্থান/ঠিকানা"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                                📍
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* STEP 3: Image */}
                        <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm font-bold text-emerald-700">
                            ৩
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">
                            ছবি সংযুক্ত করুন
                            </h4>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            ঐচ্ছিক
                            </span>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                            }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            className={`rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all ${
                            isDragOver
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50"
                            }`}
                        >
                            <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                                handleFileChange(e.target.files?.[0] || null)
                            }
                            />
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                            ☁️
                            </div>
                            <p className="text-gray-700 font-medium mb-1">
                            ক্লিক করুন বা ড্র্যাগ করুন
                            </p>
                            <p className="text-gray-400 text-sm">
                            PNG, JPG, JPEG (সর্বোচ্চ ৫MB)
                            </p>
                            {imageFile && (
                            <p className="text-emerald-600 text-sm font-medium mt-3">
                                📎 {imageFile.name}
                            </p>
                            )}
                        </div>
                        </div>

                        {/* Submit error */}
                        {submitError && selectedCategory !== "" && (
                        <p className="text-red-500 text-sm">{submitError}</p>
                        )}

                        {/* Submit Button */}
                        {isAuthenticated ? (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 rounded-xl font-bold text-white text-[16px] flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                জমা দেওয়া হচ্ছে...
                            </>
                            ) : (
                            <>✈️ রিপোর্ট জমা দিন</>
                            )}
                        </button>
                        ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                            🔒
                            </div>
                            <div>
                            <p className="text-amber-800 font-semibold text-sm">
                                রিপোর্ট জমা দিতে লগইন করুন
                            </p>
                            <p className="text-amber-600 text-xs mt-0.5">
                                আপনার অ্যাকাউন্টে লগইন করে রিপোর্ট সাবমিট করুন
                            </p>
                            </div>
                            <a
                            href="/login"
                            className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors flex-shrink-0"
                            >
                            লগইন
                            </a>
                        </div>
                        )}
                    </form>
                    </div>
                </div>
                )}

                {/* ===== TRACK REPORT FORM ===== */}
                {activeTab === "track" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Track Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-100/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                        🔍
                        </div>
                        <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            রিপোর্ট ট্র্যাক করুন
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5">
                            আপনার রিপোর্টের বর্তমান অবস্থা জানুন
                        </p>
                        </div>
                    </div>
                    </div>

                    {/* Track Body */}
                    <div className="p-8">
                    <form onSubmit={handleTrack} className="space-y-5">
                        <div>
                        <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                            # রিপোর্ট আইডি
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                            <input
                                type="text"
                                value={trackId}
                                onChange={(e) => setTrackId(e.target.value)}
                                className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-gray-50 text-[15px] border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                                placeholder="আপনার রিপোর্ট আইডি লিখুন"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                                📊
                            </div>
                            </div>
                            <button
                            type="submit"
                            disabled={isTracking}
                            className="px-6 py-3.5 rounded-xl text-white font-semibold flex items-center gap-2 text-[15px] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-60"
                            >
                            {isTracking ? "⏳" : "🔍"} ট্র্যাক করুন
                            </button>
                        </div>
                        </div>

                        {/* Help text */}
                        <div className="flex items-start gap-3 bg-blue-50/50 rounded-xl p-4">
                        <span className="text-blue-400 mt-0.5">ℹ️</span>
                        <p className="text-sm text-gray-600">
                            রিপোর্ট জমা দেওয়ার সময় প্রাপ্ত আইডি নম্বর দিয়ে
                            আপনার রিপোর্টের বর্তমান অবস্থা জানতে পারবেন
                        </p>
                        </div>
                    </form>

                    {/* Track Result */}
                    {(trackResult || trackError) && (
                        <div className="mt-8">
                        {trackError ? (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                                ❌
                            </div>
                            <div>
                                <p className="text-red-800 font-semibold text-sm">
                                রিপোর্ট খুঁজে পাওয়া যায়নি
                                </p>
                                <p className="text-red-600 text-xs mt-0.5">
                                অনুগ্রহ করে সঠিক আইডি দিয়ে আবার চেষ্টা করুন
                                </p>
                            </div>
                            </div>
                        ) : trackResult ? (
                            <TrackResultView report={trackResult} />
                        ) : null}
                        </div>
                    )}
                    </div>
                </div>
                )}
            </div>

            {/* ========== RIGHT: Sidebar (4 cols) ========== */}
            <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                {/* Recent Reports */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-lg">
                        🕐
                        </div>
                        <h4 className="font-bold text-gray-800 text-[15px]">
                        সাম্প্রতিক রিপোর্ট
                        </h4>
                    </div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <div className="p-4">
                    {recentReports.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                        <div className="text-2xl mb-2">📭</div>
                        <p className="text-sm">কোনো রিপোর্ট নেই</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                        {recentReports.map((report) => {
                            const statusInfo = getStatusInfo(report.status);
                            const shortTitle = report.title
                            .split(" ")
                            .slice(0, 4)
                            .join(" ");
                            const date = new Date(
                            report.reported_at
                            ).toLocaleDateString("bn-BD", {
                            day: "numeric",
                            month: "short",
                            });
                            return (
                            <div
                                key={report.id}
                                className="border-l-4 border-l-gray-200 bg-gray-50 rounded-lg p-4 hover:bg-gray-100/80 hover:border-l-emerald-400 hover:translate-x-1 transition-all cursor-default"
                            >
                                <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-semibold text-gray-800 line-clamp-1 flex-1">
                                    {shortTitle}
                                </p>
                                <span
                                    className={`text-[11px] ${statusInfo.bg} ${statusInfo.color} px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ml-2 flex-shrink-0`}
                                >
                                    <span
                                    className={`w-1.5 h-1.5 ${statusInfo.dot} rounded-full`}
                                    />
                                    {statusInfo.text}
                                </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    📍{" "}
                                    {report.location
                                    ? report.location
                                        .split(" ")
                                        .slice(0, 2)
                                        .join(" ")
                                    : ""}
                                </span>
                                <span className="flex items-center gap-1">
                                    🕐 {date}
                                </span>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    )}
                    </div>
                </div>

                {/* Tips Card */}
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-xl">
                        💡
                    </div>
                    <h4 className="font-bold mb-2">রিপোর্ট করার টিপস</h4>
                    <ul className="space-y-2.5 text-emerald-100/80 text-sm">
                        {[
                        "সমস্যার সঠিক অবস্থান উল্লেখ করুন",
                        "পরিষ্কার ছবি সংযুক্ত করুন",
                        "বিস্তারিত বর্ণনা দিন",
                        "রিপোর্ট আইডি সংরক্ষণ করুন",
                        ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 text-xs mt-1">
                            ✓
                            </span>
                            <span>{tip}</span>
                        </li>
                        ))}
                    </ul>
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-lg">
                        🎧
                    </div>
                    <h4 className="font-bold text-gray-800 text-[15px]">
                        সাহায্য প্রয়োজন?
                    </h4>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                    যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন
                    </p>
                    <a
                    href="tel:+8801100000000"
                    className="flex items-center gap-2 text-emerald-700 font-semibold text-sm hover:text-emerald-800 transition-colors"
                    >
                    📞 +৮৮০ ১১০০-০০০০০
                    </a>
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* ==================== TOAST ==================== */}
        {showToast && (
            <div className="fixed top-[90px] right-6 z-50 pointer-events-none animate-in slide-in-from-right">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 px-6 py-4 flex items-center gap-4 max-w-sm">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                ✅
                </div>
                <div>
                <p className="font-bold text-gray-900 text-sm">রিপোর্ট সফল!</p>
                <p className="text-gray-500 text-xs mt-0.5">
                    আপনার রিপোর্ট সফলভাবে জমা হয়েছে
                </p>
                </div>
            </div>
            </div>
        )}
        </>
    );
}

// ============================================
// TRACK RESULT COMPONENT
// ============================================
function TrackResultView({ report }: { report: Report }) {
    const currentStepIndex = TRACK_STEPS.findIndex(
        (s) => s.key === report.status
    );

    return (
        <div>
        {/* Report found banner */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm">
            ✓
            </div>
            <div>
            <p className="text-emerald-800 font-semibold text-sm">
                রিপোর্ট পাওয়া গেছে
            </p>
            <p className="text-emerald-600 text-xs">আইডি: #{report.id}</p>
            </div>
        </div>

        {/* Steps */}
        <div className="space-y-0">
            {TRACK_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isLast = index === TRACK_STEPS.length - 1;

            return (
                <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-400 ${
                        isCompleted
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
                        : "bg-gray-200"
                    }`}
                    >
                    <span className="text-sm">
                        {isCompleted ? "✓" : step.icon}
                    </span>
                    </div>
                    {!isLast && (
                    <div
                        className={`w-0.5 h-12 mt-1 transition-all duration-600 ${
                        isCompleted && index < currentStepIndex
                            ? "bg-gradient-to-b from-emerald-400 to-emerald-300"
                            : "bg-gray-200"
                        }`}
                    />
                    )}
                </div>

                <div className="flex-1 pb-6">
                    <div
                    className={`bg-gray-50 rounded-xl p-4 border ${
                        isCompleted ? "border-emerald-100" : "border-gray-100"
                    }`}
                    >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800 text-sm">
                        {step.title}
                        </span>
                        <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                            isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                        >
                        {isCompleted ? "সম্পন্ন" : "অপেক্ষমান"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                </div>
                </div>
            );
            })}
        </div>
        </div>
    );
}