"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { eventApi } from "@/lib/api";
import { Event, EventStatus } from "@/types";

// ============================================
// HELPERS
// ============================================
const toBangla = (num: number | string): string => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => banglaDigits[parseInt(d)]);
};

const getMonthBangla = (dateStr: string): string => {
    const months = [
        "জান", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন",
        "জুল", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে",
    ];
    const d = new Date(dateStr);
    return months[d.getMonth()] || "";
};

const getDayBangla = (dateStr: string): string => {
    const d = new Date(dateStr);
    return toBangla(d.getDate());
};

const getStatusInfo = (status: string) => {
    switch (status) {
        case "upcoming":
        return { bg: "bg-blue-500/90", text: "text-white", dot: "bg-white", label: "আসন্ন" };
        case "ongoing":
        return { bg: "bg-amber-500/90", text: "text-white", dot: "bg-white", label: "চলমান" };
        case "completed":
        return { bg: "bg-emerald-500/90", text: "text-white", dot: "bg-white", label: "সম্পন্ন" };
        default:
        return { bg: "bg-gray-500/90", text: "text-white", dot: "bg-white", label: status };
    }
};

const getCategoryIcon = (cat: string | null): string => {
    switch (cat) {
        case "পরিবেশ": return "🌿";
        case "নিরাপত্তা": return "🛡️";
        case "প্রশিক্ষণ": return "🎓";
        case "সচেতনতা": return "📢";
        case "কমিউনিটি": return "👥";
        default: return "🏷️";
    }
};

const getCategoryIconClass = (cat: string | null) => {
    switch (cat) {
        case "পরিবেশ": return <span className="text-emerald-500 text-[10px]">🌿</span>;
        case "নিরাপত্তা": return <span className="text-blue-500 text-[10px]">🛡️</span>;
        case "প্রশিক্ষণ": return <span className="text-purple-500 text-[10px]">🎓</span>;
        case "সচেতনতা": return <span className="text-amber-500 text-[10px]">📢</span>;
        case "কমিউনিটি": return <span className="text-cyan-500 text-[10px]">👥</span>;
        default: return <span className="text-gray-400 text-[10px]">🏷️</span>;
    }
    };

// ============================================
// SKELETON
// ============================================
const SkeletonCard = ({ hidden = false }: { hidden?: boolean }) => (
    <div
        className={`bg-white rounded-2xl overflow-hidden border border-gray-100 ${hidden ? "hidden md:block" : ""}`}
    >
        <div className="h-52 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="p-6 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="h-4 w-1/2 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="h-4 w-2/3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="h-4 w-1/3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        </div>
    </div>
);

// ============================================
// EVENT CARD
// ============================================
const EventCard = ({ event, idx }: { event: Event; idx: number }) => {
    const statusInfo = getStatusInfo(event.status);
    const getImageUrl = (path: string | null) => {
        if (!path) return "/images/event-placeholder.png";
        if (path.startsWith("http")) return path;
        return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`;
    };
    const imageUrl = getImageUrl(event.photo);
    const delays = ["", "delay-100", "delay-200"];

    return (
        <div
        className={`group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm 
            transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl`}
        style={{ animationDelay: `${idx * 0.1}s` }}
        >
        {/* Image */}
        <div className="relative overflow-hidden h-52">
            <img
            src={imageUrl}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={event.title}
            loading="lazy"
            onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/600x400/065f46/white?text=Event";
            }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Status Badge */}
            <div className="absolute top-4 left-4">
            <span
                className={`inline-flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.text} 
                text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm backdrop-blur-sm`}
            >
                <span
                className={`w-1.5 h-1.5 ${statusInfo.dot} rounded-full 
                    ${event.status === "upcoming" ? "animate-pulse" : ""}`}
                />
                {statusInfo.label}
            </span>
            </div>

            {/* Category Badge */}
            <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                {getCategoryIconClass(event.category)}
                {event.category || "সাধারণ"}
            </span>
            </div>

            {/* Date Pill */}
            <div className="absolute bottom-4 left-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="text-xs font-bold text-emerald-700 leading-none">
                {getMonthBangla(event.date)}
                </p>
                <p className="text-lg font-black text-gray-900 leading-none mt-0.5">
                {getDayBangla(event.date)}
                </p>
            </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 leading-snug">
            {event.title}
            </h3>

            <div className="space-y-2.5 mb-5">
            {/* Time */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-500 text-xs">🕐</span>
                </div>
                <span>{event.time}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-amber-500 text-xs">📍</span>
                </div>
                <span className="line-clamp-1">{event.location || "নির্ধারিত হয়নি"}</span>
            </div>

            {/* Needed People */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-500 text-xs">👥</span>
                </div>
                <span>{toBangla(event.needed_people)} জন প্রয়োজন</span>
            </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <Link
                href={`/eventdetails/${event.id}`}
                className="inline-flex items-center gap-2 text-emerald-700 font-semibold text-sm 
                hover:text-emerald-800 transition-colors group/link"
            >
                বিস্তারিত দেখুন
                <span className="text-xs transition-transform group-hover/link:translate-x-1 inline-block">→</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px]">👁</span>
                বিস্তারিত
            </div>
            </div>
        </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function EventsSection() {
    const [eventsData, setEventsData] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [currentStatus, setCurrentStatus] = useState<string>("upcoming");
    const [currentCategory, setCurrentCategory] = useState<string>("");
    const [currentSearch, setCurrentSearch] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const perPage = 6;
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const eventContainerRef = useRef<HTMLDivElement>(null);

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
        try {
            const res = await eventApi.getAll();
            setEventsData(res.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
        };
        fetchEvents();
    }, []);

    // Scroll to top button
    useEffect(() => {
        const handleScroll = () => {
        setShowScrollTop(window.scrollY > 500);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Stats
    const totalCount = eventsData.length;
    const upcomingCount = eventsData.filter((e) => e.status === "upcoming").length;
    const completedCount = eventsData.filter((e) => e.status === "completed").length;

    // Filter
    const filtered = eventsData
        .filter((e) => (currentStatus ? e.status === currentStatus : true))
        .filter((e) => (currentCategory ? e.category === currentCategory : true))
        .filter((e) =>
        currentSearch
            ? e.title.toLowerCase().includes(currentSearch) ||
            (e.location?.toLowerCase().includes(currentSearch) ?? false) ||
            (e.category?.toLowerCase().includes(currentSearch) ?? false)
            : true
        );

    // Pagination
    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    // Filter info
    const statusLabel =
        currentStatus === "upcoming" ? "আসন্ন" :
        currentStatus === "ongoing" ? "চলমান" :
        currentStatus === "completed" ? "সম্পন্ন" : "সকল";
    const categoryLabel = currentCategory || "সকল ক্যাটাগরি";
    const filterInfo = `${statusLabel} ইভেন্ট • ${categoryLabel}${currentSearch ? ` — "${currentSearch}"` : ""}`;

    // Handlers
    const handleStatusChange = (status: string) => {
        setCurrentStatus(status);
        setCurrentPage(1);
    };

    const handleCategoryChange = (cat: string) => {
        setCurrentCategory(cat);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
        setCurrentSearch(e.target.value.trim().toLowerCase());
        setCurrentPage(1);
        }, 300);
    };

    const resetFilters = () => {
        setCurrentStatus("upcoming");
        setCurrentCategory("");
        setCurrentSearch("");
        setCurrentPage(1);
        const input = document.getElementById("searchInput") as HTMLInputElement;
        if (input) input.value = "";
    };

    const scrollToEvents = () => {
        eventContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        scrollToEvents();
    };

    // Active button classes
    const activeFilterClass =
        "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-transparent shadow-lg shadow-emerald-500/25";
    const inactiveFilterClass =
        "bg-white text-gray-600 border-gray-200 hover:-translate-y-0.5";

    const statusButtons = [
        { status: "upcoming", icon: "🕐", label: "আসন্ন" },
        { status: "ongoing", icon: "⏳", label: "চলমান" },
        { status: "completed", icon: "✓", label: "সম্পন্ন" },
    ];

    const categoryButtons = [
        { cat: "", label: "সবগুলো", icon: null },
        { cat: "পরিবেশ", label: "পরিবেশ", icon: <span className="text-emerald-500">🌿</span> },
        { cat: "নিরাপত্তা", label: "নিরাপত্তা", icon: <span className="text-blue-500">🛡️</span> },
        { cat: "প্রশিক্ষণ", label: "প্রশিক্ষণ", icon: <span className="text-purple-500">🎓</span> },
        { cat: "সচেতনতা", label: "সচেতনতা", icon: <span className="text-amber-500">📢</span> },
        { cat: "কমিউনিটি", label: "কমিউনিটি", icon: <span className="text-cyan-500">👥</span> },
    ];

    return (
        <>
        <style>{`
            @keyframes emptyFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            }
            .empty-float { animation: emptyFloat 3s ease-in-out infinite; }
            .events-hero-pattern {
            background-image:
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(16,185,129,0.08) 0%, transparent 40%),
                radial-gradient(circle at 50% 90%, rgba(255,255,255,0.03) 0%, transparent 50%);
            }
        `}</style>

        {/* ==================== HERO ==================== */}
        <section className="relative bg-emerald-950 min-h-[400px] flex items-center overflow-hidden events-hero-pattern">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

            <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/15">
                <span className="text-emerald-300 text-sm">📅</span>
                <span className="text-emerald-100 text-sm font-medium">কমিউনিটি ইভেন্টস</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
                কমিউনিটি{" "}
                <span className="text-emerald-300">ইভেন্টসমূহ</span>
            </h1>

            <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
                আমাদের সাথে যুক্ত হন এবং পরিবর্তনের অংশীদার হন
            </p>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap justify-center gap-8">
                <div className="text-center">
                <p className="text-2xl font-bold text-white">
                    {loading ? "—" : toBangla(totalCount)}
                </p>
                <p className="text-emerald-200/60 text-sm">মোট ইভেন্ট</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                <p className="text-2xl font-bold text-white">
                    {loading ? "—" : toBangla(upcomingCount)}
                </p>
                <p className="text-emerald-200/60 text-sm">আসন্ন ইভেন্ট</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                <p className="text-2xl font-bold text-white">
                    {loading ? "—" : toBangla(completedCount)}
                </p>
                <p className="text-emerald-200/60 text-sm">সম্পন্ন ইভেন্ট</p>
                </div>
            </div>
            </div>

            {/* Wave */}
            <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path
                d="M0 40L48 36C96 32 192 24 288 28C384 32 480 48 576 52C672 56 768 48 864 40C960 32 1056 24 1152 28C1248 32 1344 48 1392 56L1440 64V80H0V40Z"
                fill="#f9fafb"
                />
            </svg>
            </div>
        </section>

        {/* ==================== FILTER ==================== */}
        <section className="bg-gray-50 pt-8 pb-4 px-4">
            <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Left: Status + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                    {statusButtons.map((btn) => (
                        <button
                        key={btn.status}
                        onClick={() => handleStatusChange(btn.status)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold 
                            border-2 transition-all duration-300
                            ${currentStatus === btn.status ? activeFilterClass : inactiveFilterClass}`}
                        >
                        <span className="text-xs">{btn.icon}</span>
                        {btn.label}
                        </button>
                    ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
                    <input
                        type="text"
                        id="searchInput"
                        placeholder="ইভেন্ট খুঁজুন..."
                        onChange={handleSearchChange}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 
                        focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] focus:outline-none transition-all"
                    />
                    </div>
                </div>

                {/* Right: Category */}
                <div className="flex flex-wrap gap-2">
                    {categoryButtons.map((btn) => (
                    <button
                        key={btn.cat}
                        onClick={() => handleCategoryChange(btn.cat)}
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold 
                        border-2 transition-all duration-300
                        ${currentCategory === btn.cat ? activeFilterClass : inactiveFilterClass}`}
                    >
                        {btn.icon && <span>{btn.icon}</span>}
                        {btn.label}
                    </button>
                    ))}
                </div>
                </div>

                {/* Filter Info */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-gray-300 text-xs">⚙</span>
                    <span>{filterInfo}</span>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                    {toBangla(filtered.length)} টি ইভেন্ট
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* ==================== EVENTS GRID ==================== */}
        <section className="max-w-7xl mx-auto px-4 py-10 bg-gray-50 min-h-[400px]">
            {/* Loading Skeleton */}
            {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard hidden />
                <SkeletonCard hidden />
            </div>
            )}

            {/* Error / Empty */}
            {!loading && (error || filtered.length === 0) && (
            <div className="py-20 text-center">
                <div className="empty-float inline-block mb-6">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-3xl flex items-center justify-center">
                    <span className="text-gray-300 text-4xl">📅</span>
                </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                কোনো ইভেন্ট পাওয়া যায়নি
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                </p>
                <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 
                    rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
                >
                <span className="text-xs">↩</span>
                ফিল্টার রিসেট করুন
                </button>
            </div>
            )}

            {/* Cards */}
            {!loading && !error && filtered.length > 0 && (
            <>
                <div
                ref={eventContainerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                {paginated.map((event, idx) => (
                    <EventCard key={event.id} event={event} idx={idx} />
                ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                    {/* Prev */}
                    {currentPage > 1 && (
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center 
                        justify-center text-gray-500 hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
                    >
                        ‹
                    </button>
                    )}

                    {/* Pages */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center 
                        transition-all hover:-translate-y-0.5
                        ${page === currentPage
                            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {toBangla(page)}
                    </button>
                    ))}

                    {/* Next */}
                    {currentPage < totalPages && (
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center 
                        justify-center text-gray-500 hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
                    >
                        ›
                    </button>
                    )}
                </div>
                )}
            </>
            )}
        </section>
        </>
    );
}