"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { forumApi } from "@/lib/api";
import { ForumPost } from "@/types";

// ============================================
// TYPES
// ============================================
type FilterCategory =
    | "all"
    | "প্রশ্ন"
    | "টিপস"
    | "ঘোষণা"
    | "আলোচনা"
    | "সহায়তা";

// ============================================
// CONFIGS
// ============================================
const categoryConfig: Record<
  string,
    { bg: string; text: string; dot: string }
> = {
    প্রশ্ন: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-400",
    },
    টিপস: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-400",
    },
    ঘোষণা: {
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-400",
    },
    আলোচনা: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-400",
    },
    সহায়তা: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
    },
};

const filterButtons: {
    category: FilterCategory;
    label: string;
    dot?: string;
    icon?: string;
}[] = [
    { category: "all", label: "সকল", icon: "☰" },
    { category: "প্রশ্ন", label: "প্রশ্ন", dot: "bg-blue-400" },
    { category: "টিপস", label: "টিপস", dot: "bg-amber-400" },
    { category: "ঘোষণা", label: "ঘোষণা", dot: "bg-red-400" },
    { category: "আলোচনা", label: "আলোচনা", dot: "bg-purple-400" },
    { category: "সহায়তা", label: "সহায়তা", dot: "bg-emerald-400" },
];

const PER_PAGE = 5;

// ============================================
// HELPERS
// ============================================
function toBangla(num: number): string {
    const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (x) => d[parseInt(x)]);
}

function timeAgo(dateStr: string): string {
    if (!dateStr) return "—";
    try {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${toBangla(days)} দিন`;
        if (hours > 0) return `${toBangla(hours)} ঘণ্টা`;
        if (minutes > 0) return `${toBangla(minutes)} মিনিট`;
        return "এইমাত্র";
    } catch {
        return "—";
    }
    }

function getInitial(username: string): string {
    return (username || "?").charAt(0).toUpperCase();
}

// ============================================
// CATEGORY BADGE
// ============================================
function CategoryBadge({ category }: { category: string | null }) {
    const cfg = category
        ? categoryConfig[category] ?? {
            bg: "bg-gray-100",
            text: "text-gray-600",
            dot: "bg-gray-400",
        }
        : { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

    return (
        <span
        className={`inline-flex items-center gap-1 ${cfg.bg} ${cfg.text} px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200`}
        >
        <span className={`w-1.5 h-1.5 ${cfg.dot} rounded-full`} />
        {category || "অন্যান্য"}
        </span>
    );
}

// ============================================
// SKELETON CARD
// ============================================
const SkeletonCard = () => (
    <div
        className="h-32 rounded-2xl"
        style={{
        background:
            "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        }}
    />
);

// ============================================
// PAGINATION
// ============================================
interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
}

function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    let s = Math.max(page - 1, 1);
    let e = Math.min(page + 1, totalPages);
    if (page === 1) e = Math.min(3, totalPages);
    if (page === totalPages) s = Math.max(totalPages - 2, 1);

    const pages: number[] = [];
    for (let i = s; i <= e; i++) pages.push(i);

    return (
        <div className="flex items-center gap-1.5">
        {page > 1 && (
            <button
            onClick={() => onChange(page - 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer transition-all duration-300 hover:-translate-y-px"
            >
            ‹
            </button>
        )}
        {pages.map((p) => (
            <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 hover:-translate-y-px ${
                p === page
                ? "text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={
                p === page
                ? {
                    background: "linear-gradient(135deg, #059669, #047857)",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
                    }
                : {}
            }
            >
            {toBangla(p)}
            </button>
        ))}
        {page < totalPages && (
            <button
            onClick={() => onChange(page + 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer transition-all duration-300 hover:-translate-y-px"
            >
            ›
            </button>
        )}
        </div>
    );
}

// ============================================
// FORUM POST CARD
// ============================================
interface ForumPostCardProps {
    post: ForumPost;
}

function ForumPostCard({ post }: ForumPostCardProps) {
    return (
        <Link href={`/forum/${post.id}`} className="block group">
        <div
            className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 transition-all duration-300 group-hover:-translate-y-0.5"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.06)";
            el.style.borderColor = "#d1fae5";
            }}
            onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
            el.style.borderColor = "rgb(243 244 246)";
            }}
        >
            <div className="flex flex-col gap-4">
            {/* Top: Category + Title */}
            <div>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <CategoryBadge category={post.category} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                {post.title}
                </h3>
            </div>

            {/* Bottom: Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* User Info */}
                <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitial(post.user.username)}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-700">
                    {post.user.username}
                    </p>
                    <p className="text-[11px] text-gray-400">
                    {timeAgo(post.created_at)} আগে
                    </p>
                </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                {/* Comments */}
                <span className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-blue-400 transition-colors duration-200 group-hover:text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    </div>
                    <span className="font-medium text-gray-500">
                    {toBangla(post.comments?.length ?? 0)}
                    </span>
                </span>

                {/* Views */}
                <span className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-emerald-400 transition-colors duration-200 group-hover:text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                    </div>
                    <span className="font-medium text-gray-500">
                    {toBangla(post.view_count ?? 0)}
                    </span>
                </span>

                {/* Likes */}
                <span className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-rose-400 transition-colors duration-200 group-hover:text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    </div>
                    <span className="font-medium text-gray-500">
                    {toBangla(post.total_likes ?? 0)}
                    </span>
                </span>

                {/* Time - hidden on mobile */}
                <span className="hidden sm:flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-gray-400 transition-colors duration-200 group-hover:text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    </div>
                    <span className="font-medium text-gray-500">
                    {timeAgo(post.created_at)}
                    </span>
                </span>
                </div>
            </div>
            </div>
        </div>
        </Link>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Forumv() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    // ============================================
    // FETCH
    // ============================================
    useEffect(() => {
        (async () => {
        try {
            const res = await forumApi.getAll();
            setPosts(res.data as ForumPost[]);
        } catch {
            // handle silently
        } finally {
            setLoading(false);
        }
        })();
    }, []);

    // ============================================
    // SEARCH HANDLER
    // ============================================
    const handleSearch = useCallback((val: string) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
        setSearch(val);
        setPage(1);
        }, 250);
    }, []);

    // ============================================
    // FILTER
    // ============================================
    const filtered = posts
        .filter((p) => {
        if (filterCategory === "all") return true;
        return p.category === filterCategory;
        })
        .filter((p) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            (p.title || "").toLowerCase().includes(term) ||
            (p.content || "").toLowerCase().includes(term) ||
            (p.user?.username || "").toLowerCase().includes(term) ||
            (p.category || "").toLowerCase().includes(term)
        );
        })
        .sort((a, b) => b.id - a.id);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const paginated = filtered.slice(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE
    );

    // ============================================
    // RENDER
    // ============================================
    return (
        <>
        {/* Shimmer + Float animation */}
        <style>{`
            @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
            }
            @keyframes forumFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
            }
        `}</style>

        <div className="mt-2">
            {/* ===== SECTION HEADER ===== */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                </svg>
                </div>
                <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    ফোরাম
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    কমিউনিটির আলোচনা, প্রশ্ন এবং টিপস
                </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                {loading ? "—" : toBangla(filtered.length)} টি পোস্ট
                </span>
            </div>
            </div>

            {/* ===== FILTER BAR ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-2">
                {filterButtons.map((fb) => {
                    const isActive = filterCategory === fb.category;
                    return (
                    <button
                        key={fb.category}
                        onClick={() => {
                        setFilterCategory(fb.category);
                        setPage(1);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-300 cursor-pointer hover:-translate-y-px ${
                        isActive
                            ? "text-white border-transparent font-semibold"
                            : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                        }`}
                        style={
                        isActive
                            ? {
                                background:
                                "linear-gradient(135deg, #059669, #047857)",
                                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
                            }
                            : {}
                        }
                    >
                        {fb.dot ? (
                        <span
                            className={`w-2 h-2 ${
                            isActive ? "bg-white" : fb.dot
                            } rounded-full`}
                        />
                        ) : (
                        <span className="text-xs">{fb.icon}</span>
                        )}
                        {fb.label}
                    </button>
                    );
                })}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="পোস্ট খুঁজুন..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-100 focus:border-emerald-400 focus:outline-none transition-colors"
                />
                </div>
            </div>
            </div>

            {/* ===== LOADING SKELETON ===== */}
            {loading && (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
            )}

            {/* ===== POSTS LIST ===== */}
            {!loading && filtered.length > 0 && (
            <div className="space-y-4">
                {paginated.map((post) => (
                <ForumPostCard key={post.id} post={post} />
                ))}
            </div>
            )}

            {/* ===== EMPTY STATE ===== */}
            {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
                <div
                className="inline-block mb-4"
                style={{ animation: "forumFloat 3s ease-in-out infinite" }}
                >
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <svg
                    className="w-8 h-8 text-emerald-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                    </svg>
                </div>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                কোনো পোস্ট পাওয়া যায়নি
                </h3>
                <p className="text-gray-400 text-sm">
                ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                </p>
            </div>
            )}

            {/* ===== PAGINATION ===== */}
            {!loading && filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                {toBangla((currentPage - 1) * PER_PAGE + 1)}–
                {toBangla(
                    Math.min(currentPage * PER_PAGE, filtered.length)
                )}{" "}
                / {toBangla(filtered.length)} টি
                </p>
                <Pagination
                page={currentPage}
                totalPages={totalPages}
                onChange={(p) => setPage(p)}
                />
            </div>
            )}
        </div>
        </>
    );
}