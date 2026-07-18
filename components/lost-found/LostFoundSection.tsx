"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { lostReportApi } from "@/lib/api";
import { LostReport, LostReportStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// ============================================
// CONSTANTS
// ============================================
const CATEGORIES = [
    "ওয়ালেট",
    "মোবাইল ফোন",
    "চাবি",
    "দলিল/ডকুমেন্ট",
    "গহনা",
    "ব্যাগ/পার্স",
    "অন্যান্য",
];

const POSTS_PER_PAGE = 6;

// ============================================
// HELPERS
// ============================================
function toBangla(num: number): string {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
}

function truncateText(text: string, max: number): string {
    if (!text) return "";
    return text.length > max ? text.substring(0, max) + "..." : text;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    }

function timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return toBangla(interval) + " বছর";
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return toBangla(interval) + " মাস";
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return toBangla(interval) + " দিন";
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return toBangla(interval) + " ঘণ্টা";
    interval = Math.floor(seconds / 60);
    if (interval > 1) return toBangla(interval) + " মিনিট";
    return toBangla(Math.floor(seconds)) + " সেকেন্ড";
}

// ============================================
// POST CARD COMPONENT
// ============================================
function PostCard({ post }: { post: LostReport }) {
    function getMediaUrl(path: string | null): string {
        if (!path) return "/images/icon.png";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
    }
    const isLost = post.status === "হারানো";

    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-350 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        {/* Image */}
        <div className="relative overflow-hidden h-48">
            <img
                src={getMediaUrl(post.image)}
                alt={post.item_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/icon.png";
                }}
            />
            {/* Status badge */}
            <div className="absolute top-3 left-3">
            {isLost ? (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                হারানো
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                পাওয়া
                </span>
            )}
            </div>
            {/* Time */}
            <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                🕐 {timeSince(new Date(post.reported_at))} আগে
            </span>
            </div>
        </div>

        {/* Content */}
        <div className="p-5">
            <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">
            {post.item_name}
            </h3>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {truncateText(post.description, 60)}
            </p>

            <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-[9px]">📍</span>
                </div>
                <span className="truncate">{post.location || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 text-[9px]">📅</span>
                </div>
                <span>{formatDate(post.date)}</span>
            </div>
            </div>

            <Link 
                href={`/lostfoundDetails/${post.id}`}
                className="w-full text-white py-2.5 rounded-xl text-center font-semibold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
            বিস্তারিত দেখুন
            </Link>
        </div>
        </div>
    );
}

// ============================================
// FORM COMPONENT (Lost / Found)
// ============================================
function PostForm({
    type,
    onSuccess,
}: {
    type: "lost" | "found";
    onSuccess: () => void;
}) {
    const { isAuthenticated } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form fields
    const [category, setCategory] = useState("");
    const [itemName, setItemName] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");

    const isLost = type === "lost";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
        const formData = new FormData();
        formData.append("status", isLost ? "হারানো" : "পাওয়া");
        formData.append("item_name", itemName);
        formData.append("description", description);
        formData.append("location", location);
        formData.append("date", date);
        if (category) formData.append("category", category);
        if (imageFile) formData.append("image", imageFile);

        await lostReportApi.create(formData);

        // Reset
        setCategory("");
        setItemName("");
        setDescription("");
        setLocation("");
        setDate("");
        setImageFile(null);
        onSuccess();
        } catch {
        setError("সমস্যা হয়েছে, আবার চেষ্টা করুন");
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length) {
        setImageFile(e.dataTransfer.files[0]);
        }
    };

    const inputClass =
        "w-full px-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            ক্যাটাগরি
            </label>
            <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            >
            <option value="">— নির্বাচন করুন —</option>
            {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                {cat}
                </option>
            ))}
            </select>
        </div>

        {/* Item Name */}
        <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            শিরোনাম
            </label>
            <input
            type="text"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className={inputClass}
            placeholder={
                isLost ? "যেমন: কালো ওয়ালেট হারানো" : "যেমন: কালো ওয়ালেট পাওয়া গেছে"
            }
            />
        </div>

        {/* Description */}
        <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            বর্ণনা
            </label>
            <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} h-20 resize-none`}
            placeholder={
                isLost
                ? "হারানো জিনিসের বিস্তারিত বর্ণনা..."
                : "পাওয়া জিনিসের বিস্তারিত বর্ণনা..."
            }
            />
        </div>

        {/* Location */}
        <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            স্থান
            </label>
            <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                📍
            </span>
            <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder={isLost ? "যেখানে হারিয়েছে" : "যেখানে পাওয়া গেছে"}
            />
            </div>
        </div>

        {/* Date */}
        <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            তারিখ
            </label>
            <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            />
        </div>

        {/* Image Upload */}
        <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            ছবি
            </label>
            <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-xl p-4 text-center border-2 border-dashed cursor-pointer transition-all ${
                isDragOver
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
            }`}
            >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <div className="text-gray-300 text-2xl mb-2">☁️</div>
            <p className="text-xs text-gray-500">ক্লিক করুন বা ড্র্যাগ করুন</p>
            <p className="text-[10px] text-gray-400 mt-1">PNG, JPG (সর্বোচ্চ 5MB)</p>
            {imageFile && (
                <p className="text-xs text-emerald-600 font-medium mt-2">
                📎 {imageFile.name}
                </p>
            )}
            </div>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* Submit */}
        {isAuthenticated ? (
            <button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
            {isSubmitting ? (
                <>
                <span className="animate-spin">⏳</span> পোস্ট হচ্ছে...
                </>
            ) : (
                <>✈️ পোস্ট করুন</>
            )}
            </button>
        ) : (
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-red-600 text-sm font-medium">
                🔒 পোস্ট করতে{" "}
                <a href="/login" className="underline font-bold">
                লগইন করুন
                </a>
            </p>
            </div>
        )}
        </form>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function LostFoundSection() {
    const [allPosts, setAllPosts] = useState<LostReport[]>([]);
    const [displayedPosts, setDisplayedPosts] = useState<LostReport[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState<"all" | LostReportStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeFormTab, setActiveFormTab] = useState<"lost" | "found">("lost");
    const [showToast, setShowToast] = useState(false);

    // Stats
    const totalCount = allPosts.length;
    const lostCount = allPosts.filter((p) => p.status === "হারানো").length;
    const foundCount = allPosts.filter((p) => p.status === "পাওয়া").length;

    // ---- Fetch posts ----
    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
        const res = await lostReportApi.getAll();
        const posts: LostReport[] = res.data;
        const sorted = [...posts].sort(
            (a, b) =>
            new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
        );
        setAllPosts(sorted);
        setDisplayedPosts(sorted);
        } catch (err) {
        console.error(err);
        } finally {
        setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // ---- Filter + Search ----
    useEffect(() => {
        let filtered = [...allPosts];

        // শুধুমাত্র অনুমোদিত পোস্ট পাবলিক পেজে দেখান
        filtered = filtered.filter((p) => (p as any).typePost === "অনুমোদিত");

        if (activeFilter !== "all") {
            filtered = filtered.filter((p) => p.status === activeFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.item_name?.toLowerCase().includes(q) ||
                    p.location?.toLowerCase().includes(q) ||
                    p.category?.toLowerCase().includes(q)
            );
        }

        setDisplayedPosts(filtered);
        setCurrentPage(1);
    }, [activeFilter, searchQuery, allPosts]);

    // ---- Pagination ----
    const totalPages = Math.ceil(displayedPosts.length / POSTS_PER_PAGE);
    const paginatedPosts = displayedPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    // ---- Toast ----
    const handlePostSuccess = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
        fetchPosts();
    };

    return (
        <>
        {/* ==================== HERO ==================== */}
        <section className="relative bg-emerald-950 min-h-[420px] flex items-center overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
            <div className="absolute top-20 left-1/4 w-2 h-2 bg-emerald-400/30 rounded-full" />
            <div className="absolute top-32 right-1/3 w-3 h-3 bg-emerald-400/20 rounded-full" />

            <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20 w-full">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-6 border border-white/15">
                <span className="text-emerald-100 text-sm font-medium">
                হারানো-পাওয়া সিস্টেম সক্রিয়
                </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
                হারানো{" "}
                <span className="text-emerald-300">পাওয়া</span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
                হারানো জিনিস খুঁজুন বা পাওয়া জিনিস পোস্ট করুন — একসাথে সাহায্য করি
            </p>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap justify-center gap-8">
                <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-300">
                    {isLoading ? "—" : toBangla(totalCount)}
                </p>
                <p className="text-emerald-100/70 text-sm mt-1">মোট পোস্ট</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-300">
                    {isLoading ? "—" : toBangla(lostCount)}
                </p>
                <p className="text-emerald-100/70 text-sm mt-1">হারানো</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-300">
                    {isLoading ? "—" : toBangla(foundCount)}
                </p>
                <p className="text-emerald-100/70 text-sm mt-1">পাওয়া</p>
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
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ========== LEFT: Posts (8 cols) ========== */}
            <div className="lg:col-span-8">
                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                    {[
                        { key: "all", label: "সব কিছু", icon: "🗂️" },
                        { key: "হারানো", label: "হারানো", dot: "bg-red-400" },
                        { key: "পাওয়া", label: "পাওয়া গেছে", dot: "bg-emerald-400" },
                    ].map((f) => (
                        <button
                        key={f.key}
                        onClick={() =>
                            setActiveFilter(f.key as "all" | LostReportStatus)
                        }
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all hover:-translate-y-px ${
                            activeFilter === f.key
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-transparent shadow-[0_4px_12px_rgba(5,150,105,0.25)]"
                            : "border-gray-200 text-gray-600 bg-white hover:border-emerald-200"
                        }`}
                        >
                        {f.icon && <span className="text-xs">{f.icon}</span>}
                        {f.dot && (
                            <span className={`w-2 h-2 ${f.dot} rounded-full`} />
                        )}
                        {f.label}
                        </button>
                    ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                        🔍
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="নাম বা স্থান দিয়ে খুঁজুন..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                    />
                    </div>
                </div>
                </div>

                {/* Posts Grid */}
                {isLoading ? (
                <div className="text-center py-16 text-gray-400">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p>লোড হচ্ছে...</p>
                </div>
                ) : paginatedPosts.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="animate-bounce inline-block mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">
                        📦
                    </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-1">
                    কোনো পোস্ট পাওয়া যায়নি
                    </h3>
                    <p className="text-gray-400 text-sm">
                    ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                    </p>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                    ))}
                </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5">
                    {/* Prev */}
                    {currentPage > 1 && (
                    <button
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs transition-all hover:-translate-y-px"
                    >
                        ‹
                    </button>
                    )}

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((i) => {
                        const start = Math.max(currentPage - 1, 1);
                        const end = Math.min(currentPage + 1, totalPages);
                        return i >= start && i <= end;
                    })
                    .map((i) => (
                        <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:-translate-y-px ${
                            i === currentPage
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_4px_12px_rgba(5,150,105,0.2)]"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                        >
                        {toBangla(i)}
                        </button>
                    ))}

                    {/* Next */}
                    {currentPage < totalPages && (
                    <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs transition-all hover:-translate-y-px"
                    >
                        ›
                    </button>
                    )}
                </div>
                )}
            </div>

            {/* ========== RIGHT: Sidebar (4 cols) ========== */}
            <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                {/* Post Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 border-b border-emerald-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white text-sm">
                        ➕
                        </div>
                        <div>
                        <h3 className="font-bold text-gray-900">নতুন পোস্ট</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            হারানো বা পাওয়া জিনিস পোস্ট করুন
                        </p>
                        </div>
                    </div>
                    </div>

                    <div className="p-6">
                    {/* Tab Buttons */}
                    <div className="flex bg-gray-50 rounded-xl p-1 mb-6 border border-gray-100">
                        <button
                        onClick={() => setActiveFormTab("lost")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-center cursor-pointer transition-all ${
                            activeFormTab === "lost"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "text-gray-500"
                        }`}
                        >
                        ❗ হারানো
                        </button>
                        <button
                        onClick={() => setActiveFormTab("found")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-center cursor-pointer transition-all ${
                            activeFormTab === "found"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "text-gray-500"
                        }`}
                        >
                        ✅ পাওয়া গেছে
                        </button>
                    </div>

                    {/* Form */}
                    <PostForm
                        key={activeFormTab}
                        type={activeFormTab}
                        onSuccess={handlePostSuccess}
                    />
                    </div>
                </div>

                {/* Guidelines Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
                        💡
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">
                        পোস্ট করার নির্দেশিকা
                        </h4>
                    </div>
                    </div>
                    <div className="p-4 space-y-2">
                    {[
                        {
                        icon: "📷",
                        bg: "bg-emerald-50",
                        text: "স্পষ্ট ছবি যুক্ত করুন যাতে সহজে চেনা যায়",
                        },
                        {
                        icon: "✏️",
                        bg: "bg-blue-50",
                        text: "বিস্তারিত বর্ণনা দিন — রঙ, আকার, বৈশিষ্ট্য",
                        },
                        {
                        icon: "📍",
                        bg: "bg-purple-50",
                        text: "সঠিক স্থান ও তারিখ উল্লেখ করুন",
                        },
                    ].map((g, i) => (
                        <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl border-l-4 border-l-transparent hover:bg-emerald-50 hover:border-l-emerald-400 hover:translate-x-1 transition-all cursor-default"
                        >
                        <div
                            className={`w-6 h-6 ${g.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs`}
                        >
                            {g.icon}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {g.text}
                        </p>
                        </div>
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
                <p className="font-bold text-gray-900 text-sm">পোস্ট সফল!</p>
                <p className="text-gray-500 text-xs mt-0.5">
                    আপনার পোস্ট সফলভাবে জমা হয়েছে
                </p>
                </div>
            </div>
            </div>
        )}
        </>
    );
}