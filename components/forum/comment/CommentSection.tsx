"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const formatDateLong = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
};

// ---- Toast Type ----
interface ToastItem {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

export default function CommentSection({ id }: Props) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [post, setPost] = useState<ForumPost | null>(null);
    const [postLoading, setPostLoading] = useState(true);

    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(true);

    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastIdRef = useRef(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ---- Toast ----
    const showToast = useCallback(
        (message: string, type: "success" | "error" | "info" = "success") => {
        const newId = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id: newId, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newId));
        }, 3000);
        },
        []
    );

    // ---- Fetch Post ----
    useEffect(() => {
        const fetchPost = async () => {
        try {
            setPostLoading(true);
            const res = await forumApi.getById(id);
            setPost(res.data);
        } catch {
            showToast("পোস্ট লোড করতে সমস্যা হয়েছে।", "error");
        } finally {
            setPostLoading(false);
        }
        };
        fetchPost();
    }, [id, showToast]);

    // ---- Fetch Comments ----
    const fetchComments = useCallback(async () => {
        try {
        setCommentsLoading(true);
        const res = await forumApi.getComments(id);
        setComments(res.data);
        } catch {
        setComments([]);
        } finally {
        setCommentsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // ---- Submit Comment ----
    const handleSubmit = useCallback(async () => {
        if (!isAuthenticated) {
        showToast("মন্তব্য করতে লগইন করুন।", "error");
        router.push("/login");
        return;
        }
        const trimmed = content.trim();
        if (!trimmed) {
        showToast("অনুগ্রহ করে আপনার উত্তর লিখুন।", "error");
        textareaRef.current?.focus();
        return;
        }
        setSubmitting(true);
        try {
        await forumApi.createComment(id, { content: trimmed });
        setContent("");
        showToast("আপনার উত্তর সফলভাবে পাঠানো হয়েছে!", "success");
        await fetchComments();
        } catch {
        showToast("উত্তর পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
        } finally {
        setSubmitting(false);
        }
    }, [content, id, isAuthenticated, fetchComments, showToast, router]);

    // ---- Ctrl+Enter ----
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSubmit();
        }
    };

    // ---- Unique Participants ----
    const uniqueParticipants = new Set(
        comments.map((c) => c.user?.username || "unknown")
    ).size;

    // ---- Author Name ----
    const authorName =
        user?.username || "ব্যবহারকারী";
    const authorInitial = authorName[0]?.toUpperCase() || "U";

    return (
        <>
        <style>{`
            .cm-page { font-family: 'Noto Sans Bengali', 'Inter', sans-serif; background: #f8faf9; min-height: 100vh; }
            .cm-hero { background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); position: relative; overflow: hidden; }
            .cm-hero::before { content: ''; position: absolute; top: -40%; right: -20%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); pointer-events: none; }
            .cm-hero::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%); pointer-events: none; }
            .cm-comment-card { transition: all 0.3s ease; }
            .cm-comment-card:hover { background: #f9fafb; border-color: #d1fae5; }
            .cm-skeleton { background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: cmShimmer 1.5s infinite; }
            @keyframes cmShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .cm-empty-float { animation: cmFloat 3s ease-in-out infinite; }
            @keyframes cmFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            .cm-breadcrumb a { transition: color 0.2s ease; }
            .cm-breadcrumb a:hover { color: #059669; }
            .cm-textarea { transition: all 0.3s ease; }
            .cm-textarea:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1); outline: none; }
            .cm-submit-btn { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .cm-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3); }
            .cm-submit-btn:active:not(:disabled) { transform: translateY(0); }
            .cm-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .cm-stat-pill { transition: all 0.2s ease; }
            .cm-stat-pill:hover { background: #f0fdf4; }
            .cm-toast { animation: cmSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            @keyframes cmSlideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>

        <div className="cm-page">

            {/* ---- Toast Container ---- */}
            <div className="fixed top-24 right-6 z-50 space-y-3">
            {toasts.map((toast) => {
                const bgColor =
                toast.type === "success"
                    ? "bg-emerald-600"
                    : toast.type === "error"
                    ? "bg-red-600"
                    : "bg-amber-500";
                const icon =
                toast.type === "success"
                    ? "fa-check-circle"
                    : toast.type === "error"
                    ? "fa-exclamation-circle"
                    : "fa-info-circle";
                return (
                <div
                    key={toast.id}
                    className={`cm-toast flex items-center gap-3 px-5 py-3 ${bgColor} text-white rounded-xl shadow-lg text-sm font-medium`}
                >
                    <i className={`fa-solid ${icon}`} />
                    <span>{toast.message}</span>
                </div>
                );
            })}
            </div>

            {/* ===== HERO BANNER ===== */}
            <div className="cm-hero pt-24 pb-12 md:pt-28 md:pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

                {/* Breadcrumb */}
                <nav className="cm-breadcrumb flex items-center gap-2 text-emerald-200 text-xs mb-6">
                <Link href="/" className="flex items-center gap-1 hover:text-white">
                    <i className="fa-solid fa-house text-[10px]" />
                    <span>হোম</span>
                </Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-emerald-300/60" />
                <Link href="/forum" className="hover:text-white">ফোরাম</Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-emerald-300/60" />
                <Link
                    href={`/forum/${id}`}
                    className="hover:text-white truncate max-w-[180px]"
                >
                    {postLoading ? "..." : post?.title}
                </Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-emerald-300/60" />
                <span className="text-white/80">উত্তর দিন</span>
                </nav>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-comment-dots text-white text-lg" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    উত্তর দিন
                    </h1>
                    <p className="text-emerald-200 text-sm mt-0.5">আপনার মতামত শেয়ার করুন</p>
                </div>
                </div>

                {/* Post Reference */}
                {post && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                    <div className="flex items-center gap-2 text-emerald-100 text-sm">
                    <i className="fa-solid fa-quote-left text-emerald-300/60 text-xs" />
                    <span className="font-medium text-white truncate">{post.title}</span>
                    </div>
                </div>
                )}
            </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">

            {/* ===== WRITE COMMENT CARD ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">

                {/* Card Header */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-pen-fancy text-emerald-600 text-sm" />
                    </div>
                    <div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900">
                        আপনার উত্তর লিখুন
                    </h2>
                    <p className="text-xs text-gray-400">বিস্তারিতভাবে আপনার মতামত জানান</p>
                    </div>
                </div>
                </div>

                {/* Card Body */}
                <div className="p-6 md:p-8">
                {isAuthenticated ? (
                    <div className="flex items-start gap-4">

                    {/* Avatar - Desktop */}
                    <div className="flex-shrink-0 hidden sm:block">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {authorInitial}
                        </div>
                    </div>

                    {/* Textarea Area */}
                    <div className="flex-1">
                        {/* Mobile: author row */}
                        <div className="flex items-center gap-2 mb-3 sm:hidden">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                            {authorInitial}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{authorName}</span>
                        </div>

                        {/* Textarea */}
                        <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="cm-textarea w-full border-2 border-gray-200 rounded-xl p-4 text-gray-700 text-sm leading-relaxed resize-none placeholder-gray-400"
                        placeholder="আপনার উত্তর এখানে লিখুন... (Ctrl+Enter দিয়ে পাঠান)"
                        rows={5}
                        />

                        {/* Character Count + Actions */}
                        <div className="flex items-center justify-between mt-3">
                        <span
                            className={`text-xs ${
                            content.length > 0 ? "text-emerald-500" : "text-gray-400"
                            }`}
                        >
                            {toBangla(content.length)} অক্ষর
                        </span>
                        <div className="flex items-center gap-3">
                            <Link
                            href={`/forum/${id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                            <i className="fa-solid fa-arrow-left text-[10px]" />
                            ফিরে যান
                            </Link>
                            <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="cm-submit-btn inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm rounded-xl cursor-pointer"
                            >
                            {submitting ? (
                                <>
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    />
                                    <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <span>পাঠানো হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                <i className="fa-solid fa-paper-plane text-xs" />
                                <span>উত্তর দিন</span>
                                </>
                            )}
                            </button>
                        </div>
                        </div>
                    </div>
                    </div>
                ) : (
                    /* Not logged in */
                    <div className="text-center py-8">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-lock text-gray-300 text-2xl" />
                    </div>
                    <h3 className="text-base font-bold text-gray-600 mb-1">
                        লগইন করুন
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        উত্তর দিতে আপনাকে লগইন করতে হবে।
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                        <i className="fa-solid fa-right-to-bracket text-xs" />
                        লগইন করুন
                    </Link>
                    </div>
                )}
                </div>
            </div>

            {/* ===== STATS BAR ===== */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="cm-stat-pill bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-comments text-purple-500 text-sm" />
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">
                    {commentsLoading ? "—" : comments.length}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">মোট উত্তর</p>
                </div>
                </div>
                <div className="cm-stat-pill bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-users text-emerald-500 text-sm" />
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">
                    {commentsLoading ? "—" : uniqueParticipants}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">অংশগ্রহণকারী</p>
                </div>
                </div>
            </div>

            {/* ===== RECENT COMMENTS SECTION ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">

                {/* Comments Header */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-comments text-emerald-600 text-sm" />
                    </div>
                    <div>
                        <h2 className="text-base md:text-lg font-bold text-gray-900">
                        রিসেন্ট উত্তরসমূহ
                        </h2>
                        <p className="text-xs text-gray-400">
                        {commentsLoading
                            ? "মন্তব্য লোড হচ্ছে..."
                            : `${toBangla(comments.length)} টি উত্তর`}
                        </p>
                    </div>
                    </div>
                    {/* Refresh Button */}
                    <button
                    onClick={fetchComments}
                    disabled={commentsLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-medium hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                    <i
                        className={`fa-solid fa-arrows-rotate text-[10px] ${
                        commentsLoading ? "animate-spin" : ""
                        }`}
                    />
                    রিফ্রেশ
                    </button>
                </div>
                </div>

                {/* Skeleton Loading */}
                {commentsLoading && (
                <div className="p-6 md:p-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className="cm-skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                        <div className="cm-skeleton h-4 rounded-lg w-1/3" />
                        <div className="cm-skeleton h-3 rounded-lg w-full" />
                        <div className="cm-skeleton h-3 rounded-lg w-2/3" />
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
                        <div key={comment.id} className="cm-comment-card px-6 md:px-8 py-5">
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
                    <div className="cm-empty-float inline-block mb-4">
                    <div className="w-14 h-14 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center">
                        <i className="fa-solid fa-comment-slash text-gray-300 text-2xl" />
                    </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-600 mb-1">
                    এখনো কোনো উত্তর নেই
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                    প্রথম উত্তরকারী হোন! উপরে আপনার মতামত লিখুন।
                    </p>
                </div>
                )}

            </div>
            </div>
        </div>
        </>
    );
}