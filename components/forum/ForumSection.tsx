"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { forumApi } from "@/lib/api";
import { ForumPost, Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface Props {
    id: number;
}

const gradients = [
    "from-emerald-500 to-green-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-violet-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-red-600",
    "from-cyan-500 to-teal-600",
];

// ---- Helpers ----
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const getTimeSince = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "এইমাত্র";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return toBangla(minutes) + " মিনিট আগে";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return toBangla(hours) + " ঘণ্টা আগে";
    const days = Math.floor(hours / 24);
    if (days < 30) return toBangla(days) + " দিন আগে";
    const months = Math.floor(days / 30);
    if (months < 12) return toBangla(months) + " মাস আগে";
    return toBangla(Math.floor(months / 12)) + " বছর আগে";
};

const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatDateLong = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
};

// ---- Category Badge ----
const CategoryBadge = ({ category }: { category: string | null }) => {
    if (!category) return null;
    const map: Record<string, { cls: string; icon: string }> = {
        প্রশ্ন: { cls: "fd-cat-question", icon: "fa-circle-question" },
        টিপস: { cls: "fd-cat-tips", icon: "fa-lightbulb" },
        ঘোষণা: { cls: "fd-cat-announce", icon: "fa-bullhorn" },
        আলোচনা: { cls: "fd-cat-discussion", icon: "fa-comments" },
        সহায়তা: { cls: "fd-cat-help", icon: "fa-hands-helping" },
    };
    const style = map[category] || {
        cls: "bg-white/20 text-white border-white/30",
        icon: "fa-tag",
    };
    return (
        <span
        className={`inline-flex items-center gap-1.5 ${style.cls} border px-3 py-1 rounded-full text-xs font-semibold`}
        >
        <i className={`fa-solid ${style.icon} text-[10px]`} />
        {category}
        </span>
    );
};

export default function ForumSection({ id }: Props) {
    const { user, isAuthenticated } = useAuth();

    const [post, setPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [reacting, setReacting] = useState(false);

    // ---- Fetch Post ----
    useEffect(() => {
        const fetchPost = async () => {
        try {
            setLoading(true);
            const res = await forumApi.getById(id);
            const data: ForumPost = res.data;
            setPost(data);
            setLikes(data.total_likes);
            setDislikes(data.total_dislikes);
        } catch {
            setError("পোস্ট লোড করতে সমস্যা হয়েছে।");
        } finally {
            setLoading(false);
        }
        };
        fetchPost();
    }, [id]);

    // ---- Fetch Comments ----
    useEffect(() => {
        const fetchComments = async () => {
        try {
            setCommentsLoading(true);
            const res = await forumApi.getComments(id);
            setComments(res.data);
        } catch {
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
        };
        fetchComments();
    }, [id]);

    // ---- Like ----
    const handleLike = useCallback(async () => {
        if (!isAuthenticated || reacting) return;
        setReacting(true);
        try {
        const res = await forumApi.like(id);
        const data = res.data;
        setLikes(data.total_likes);
        if (data.message?.includes("সরানো") || data.message?.includes("removed")) {
            setLiked(false);
        } else {
            setLiked(true);
            setDisliked(false);
        }
        } catch {
        // ignore
        } finally {
        setReacting(false);
        }
    }, [id, isAuthenticated, reacting]);

    // ---- Dislike ----
    const handleDislike = useCallback(async () => {
        if (!isAuthenticated || reacting) return;
        setReacting(true);
        try {
        const res = await forumApi.dislike(id);
        const data = res.data;
        setDislikes(data.total_dislikes);
        if (data.message?.includes("সরানো") || data.message?.includes("removed")) {
            setDisliked(false);
        } else {
            setDisliked(true);
            setLiked(false);
        }
        } catch {
        // ignore
        } finally {
        setReacting(false);
        }
    }, [id, isAuthenticated, reacting]);

    // ---- Loading ----
    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
            <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm">লোড হচ্ছে...</p>
            </div>
        </div>
        );
    }

    // ---- Error ----
    if (error || !post) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
            <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl" />
            </div>
            <p className="text-gray-700 font-semibold">{error || "পোস্ট পাওয়া যায়নি।"}</p>
            <Link
                href="/forum"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium"
            >
                <i className="fa-solid fa-arrow-left text-xs" />
                ফিরে যান
            </Link>
            </div>
        </div>
        );
    }

    const authorName =
        post.user?.first_name && post.user?.last_name
        ? `${post.user.first_name} ${post.user.last_name}`
        : post.user?.username || "ব্যবহারকারী";

    const authorInitial = authorName[0]?.toUpperCase() || "U";

    return (
        <>
        <style>{`
            .fd-page { font-family: 'Noto Sans Bengali', 'Inter', sans-serif; background: #f8faf9; min-height: 100vh; }
            .fd-hero { background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); position: relative; overflow: hidden; }
            .fd-hero::before { content: ''; position: absolute; top: -40%; right: -20%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); pointer-events: none; }
            .fd-hero::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%); pointer-events: none; }
            .fd-react-btn { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .fd-react-btn:hover { transform: scale(1.05); }
            .fd-react-btn:active { transform: scale(0.95); }
            .fd-react-btn.liked { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
            .fd-react-btn.disliked { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
            .fd-comment-card { transition: all 0.3s ease; }
            .fd-comment-card:hover { background: #f9fafb; border-color: #d1fae5; }
            .fd-skeleton { background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: fdShimmer 1.5s infinite; }
            @keyframes fdShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .fd-empty-float { animation: fdFloat 3s ease-in-out infinite; }
            @keyframes fdFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            .fd-cat-question { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
            .fd-cat-tips { background: #fffbeb; color: #b45309; border-color: #fde68a; }
            .fd-cat-announce { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
            .fd-cat-discussion { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
            .fd-cat-help { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .fd-breadcrumb a { transition: color 0.2s ease; }
            .fd-breadcrumb a:hover { color: #059669; }
            .fd-content p { margin-bottom: 1rem; line-height: 1.8; }
            .fd-stat-pill { transition: all 0.2s ease; }
            .fd-stat-pill:hover { background: #f0fdf4; }
        `}</style>

        <div className="fd-page">

            {/* ===== HERO BANNER ===== */}
            <div className="fd-hero pt-24 pb-12 md:pt-28 md:pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

                {/* Breadcrumb */}
                <nav className="fd-breadcrumb flex items-center gap-2 text-emerald-200 text-xs mb-6">
                <Link href="/" className="flex items-center gap-1 hover:text-white">
                    <i className="fa-solid fa-house text-[10px]" />
                    <span>হোম</span>
                </Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-emerald-300/60" />
                <Link href="/forum" className="hover:text-white">ফোরাম</Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-emerald-300/60" />
                <span className="text-white/80 truncate max-w-[200px]">{post.title}</span>
                </nav>

                {/* Category Badge */}
                <div className="mb-4">
                <CategoryBadge category={post.category} />
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
                {post.title}
                </h1>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-4 text-emerald-100 text-sm">
                {/* Author */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                    {authorInitial}
                    </div>
                    <span className="font-medium text-white">{authorName}</span>
                </div>
                <span className="text-emerald-300/50">•</span>
                {/* Date */}
                <div className="flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar text-[11px]" />
                    <span>{formatDate(post.created_at)}</span>
                </div>
                <span className="text-emerald-300/50">•</span>
                {/* Time Since */}
                <div className="flex items-center gap-1.5">
                    <i className="fa-regular fa-clock text-[11px]" />
                    <span>{getTimeSince(post.created_at)}</span>
                </div>
                <span className="text-emerald-300/50">•</span>
                {/* Views */}
                <div className="flex items-center gap-1.5">
                    <i className="fa-regular fa-eye text-[11px]" />
                    <span>{post.view_count} ভিউ</span>
                </div>
                </div>
            </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">

            {/* Post Content Card */}
            <div className="fd-post-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                {/* Content Body */}
                <div className="p-6 md:p-8">
                <div className="fd-content text-gray-700 text-base leading-relaxed">
                    {post.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                    ))}
                </div>
                </div>

                {/* Footer: Reactions + Actions */}
                <div className="border-t border-gray-50 px-6 md:px-8 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    {/* Left: Like / Dislike */}
                    <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            disabled={reacting}
                            className={`fd-react-btn flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 bg-white cursor-pointer ${liked ? "liked" : ""}`}
                        >
                            <i className="fa-solid fa-thumbs-up text-sm" />
                            <span className="text-sm font-bold">{likes}</span>
                            <span className="text-xs font-medium hidden sm:inline">পছন্দ</span>
                        </button>

                        {/* Dislike Button */}
                        <button
                            onClick={handleDislike}
                            disabled={reacting}
                            className={`fd-react-btn flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 bg-white cursor-pointer ${disliked ? "disliked" : ""}`}
                        >
                            <i className="fa-solid fa-thumbs-down text-sm" />
                            <span className="text-sm font-bold">{dislikes}</span>
                            <span className="text-xs font-medium hidden sm:inline">অপছন্দ</span>
                        </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 px-4 py-2.5 rounded-xl">
                        <i className="fa-solid fa-lock text-xs" />
                        <span>লাইক/ডিসলাইক করতে লগইন করুন</span>
                        </div>
                    )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                    <Link
                        href={`/forum/${id}/comment`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                        <i className="fa-solid fa-comment-dots text-xs" />
                        উত্তর দিন
                    </Link>
                    </div>
                </div>
                </div>
            </div>

            {/* ===== STATS BAR ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {/* Likes */}
                <div className="fd-stat-pill bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-thumbs-up text-blue-500 text-sm" />
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">{likes}</p>
                    <p className="text-[11px] text-gray-400 font-medium">পছন্দ</p>
                </div>
                </div>

                {/* Dislikes */}
                <div className="fd-stat-pill bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-thumbs-down text-red-500 text-sm" />
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">{dislikes}</p>
                    <p className="text-[11px] text-gray-400 font-medium">অপছন্দ</p>
                </div>
                </div>

                {/* Views */}
                <div className="fd-stat-pill bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-eye text-emerald-500 text-sm" />
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">{post.view_count}</p>
                    <p className="text-[11px] text-gray-400 font-medium">ভিউ</p>
                </div>
                </div>

                {/* Comments */}
                <div className="fd-stat-pill bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-comment text-purple-500 text-sm" />
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">
                    {commentsLoading ? "—" : comments.length}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">উত্তর</p>
                </div>
                </div>
            </div>

            {/* ===== COMMENTS SECTION ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">

                {/* Comments Header */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-comments text-emerald-600 text-sm" />
                    </div>
                    <div>
                        <h2 className="text-base md:text-lg font-bold text-gray-900">উত্তরসমূহ</h2>
                        <p className="text-xs text-gray-400">
                        {commentsLoading
                            ? "মন্তব্য লোড হচ্ছে..."
                            : `${toBangla(comments.length)} টি উত্তর`}
                        </p>
                    </div>
                    </div>
                    <Link
                    href={`/forum/${id}/comment`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                    <i className="fa-solid fa-plus text-[10px]" />
                    উত্তর দিন
                    </Link>
                </div>
                </div>

                {/* Skeleton Loading */}
                {commentsLoading && (
                <div className="p-6 md:p-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className="fd-skeleton w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                        <div className="fd-skeleton h-4 rounded-lg w-1/3" />
                        <div className="fd-skeleton h-3 rounded-lg w-full" />
                        <div className="fd-skeleton h-3 rounded-lg w-2/3" />
                        </div>
                    </div>
                    ))}
                </div>
                )}

                {/* Comments List */}
                {!commentsLoading && comments.length > 0 && (
                <div className="divide-y divide-gray-50">
                    {comments.map((comment, index) => {
                    const name =
                        comment.user?.first_name && comment.user?.last_name
                        ? `${comment.user.first_name} ${comment.user.last_name}`
                        : comment.user?.username || "ব্যবহারকারী";
                    const initial = name[0]?.toUpperCase() || "U";
                    const gradient = gradients[index % gradients.length];

                    return (
                        <div
                        key={comment.id}
                        className="fd-comment-card px-6 md:px-8 py-5"
                        >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                            <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                            >
                                {initial}
                            </div>
                            </div>

                            {/* Comment Body */}
                            <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h4 className="text-sm font-bold text-gray-900">{name}</h4>
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <i className="fa-regular fa-clock text-[9px]" />
                                {getTimeSince(comment.created_at)}
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-xl rounded-tl-none p-4 border border-gray-100">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                {comment.content}
                                </p>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 ml-1">
                                {formatDateLong(comment.created_at)}
                            </p>
                            </div>
                        </div>
                        </div>
                    );
                    })}
                </div>
                )}

                {/* Empty State */}
                {!commentsLoading && comments.length === 0 && (
                <div className="py-14 text-center">
                    <div className="fd-empty-float inline-block mb-4">
                    <div className="w-14 h-14 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center">
                        <i className="fa-solid fa-comment-slash text-gray-300 text-2xl" />
                    </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-600 mb-1">
                    এখনো কোনো উত্তর নেই
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">প্রথম উত্তরকারী হোন!</p>
                    <Link
                    href={`/forum/${id}/comment`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all cursor-pointer"
                    >
                    <i className="fa-solid fa-pen text-xs" />
                    উত্তর লিখুন
                    </Link>
                </div>
                )}

            </div>
            </div>
        </div>
        </>
    );
}