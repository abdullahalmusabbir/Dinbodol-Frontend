"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { forumApi } from "@/lib/api";
import { ForumPost } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";

// ============================================
// TYPES
// ============================================
type Category = "all" | "প্রশ্ন" | "টিপস" | "সহায়তা" | "আলোচনা" | "ঘোষণা";

interface FormData {
    title: string;
    category: string;
    content: string;
}

interface ToastState {
    type: "success" | "error" | "";
    message: string;
}

// ============================================
// HELPERS
// ============================================
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const catIconMap: Record<string, string> = {
    প্রশ্ন: "fa-circle-question",
    টিপস: "fa-lightbulb",
    সহায়তা: "fa-hands-holding",
    আলোচনা: "fa-people-arrows",
    ঘোষণা: "fa-bullhorn",
};

const catColorMap: Record<string, string> = {
    প্রশ্ন: "bg-blue-50 text-blue-600",
    টিপস: "bg-green-50 text-green-600",
    সহায়তা: "bg-amber-50 text-amber-600",
    আলোচনা: "bg-purple-50 text-purple-600",
    ঘোষণা: "bg-red-50 text-red-600",
};

const CatBadge = ({ cat }: { cat: string | null }) => {
    if (!cat) return <span className="text-xs text-gray-400">—</span>;
    const icon = catIconMap[cat] || "fa-tag";
    const color = catColorMap[cat] || "bg-gray-50 text-gray-600";
    return (
        <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${color}`}
        >
        <i className={`fa-solid ${icon} text-[10px]`}></i>
        {cat}
        </span>
    );
};

const PAGE_SIZE = 10;

// ============================================
// MAIN COMPONENT
// ============================================
export default function ForumA() {
    const [forums, setForums] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category>("all");
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Detail Panel
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Form Panel
    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({
        title: "",
        category: "",
        content: "",
    });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formToast, setFormToast] = useState<ToastState>({
        type: "",
        message: "",
    });

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ============================================
    // LOAD FORUMS
    // ============================================
    const loadForums = useCallback(async () => {
        try {
        setLoading(true);
        const res = await forumApi.getAll();
        setForums(res.data);
        } catch (err) {
        console.error(err);
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadForums();
    }, [loadForums]);

    // ============================================
    // KEYBOARD ESC
    // ============================================
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setDeleteModalOpen(false);
            setDetailOpen(false);
            setFormOpen(false);
            document.body.style.overflow = "";
        }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Body overflow
    useEffect(() => {
        const anyOpen = detailOpen || formOpen || deleteModalOpen;
        document.body.style.overflow = anyOpen ? "hidden" : "";
        return () => {
        document.body.style.overflow = "";
        };
    }, [detailOpen, formOpen, deleteModalOpen]);

    // ============================================
    // FILTER
    // ============================================
    const getFiltered = () => {
        const term = search.trim().toLowerCase();
        return forums
        .filter((p) => {
            const catOk =
            activeCategory === "all" ||
            (p.category && p.category === activeCategory);
            let searchOk = true;
            if (term) {
            searchOk =
                `f${p.id}`.toLowerCase().includes(term) ||
                (p.title || "").toLowerCase().includes(term) ||
                (p.user?.username || "").toLowerCase().includes(term);
            }
            let dateOk = true;
            if (dateFilter) {
            if (!p.created_at) dateOk = false;
            else
                dateOk =
                new Date(p.created_at).toISOString().split("T")[0] ===
                dateFilter;
            }
            return catOk && searchOk && dateOk;
        })
        .sort((a, b) => b.id - a.id);
    };

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(1, totalPages));
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // ============================================
    // DETAIL PANEL
    // ============================================
    const openDetail = async (post: ForumPost) => {
        setSelectedPost(post);
        setDetailOpen(true);
        setComments([]);
        setCommentsLoading(true);
        try {
        const res = await forumApi.getComments(post.id);
        setComments(res.data);
        } catch {
        setComments([]);
        } finally {
        setCommentsLoading(false);
        }
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setTimeout(() => setSelectedPost(null), 400);
    };

    // ============================================
    // FORM PANEL
    // ============================================
    const openForm = (post?: ForumPost) => {
        setFormToast({ type: "", message: "" });
        if (post) {
        setEditId(post.id);
        setFormData({
            title: post.title || "",
            category: post.category || "",
            content: post.content || "",
        });
        } else {
        setEditId(null);
        setFormData({ title: "", category: "", content: "" });
        }
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
        setFormToast({
            type: "error",
            message: "শিরোনাম এবং বিষয়বস্তু দিতে হবে",
        });
        return;
        }
        setFormSubmitting(true);
        try {
        if (editId) {
            await forumApi.update(editId, formData);
            setFormToast({
            type: "success",
            message: "পোস্ট সফলভাবে আপডেট হয়েছে",
            });
        } else {
            await forumApi.create(formData);
            setFormToast({
            type: "success",
            message: "নতুন পোস্ট সফলভাবে তৈরি হয়েছে",
            });
        }
        await loadForums();
        setTimeout(() => closeForm(), 800);
        } catch (err) {
        console.error(err);
        setFormToast({
            type: "error",
            message: editId
            ? "আপডেট করা যায়নি"
            : "পোস্ট করা যায়নি। সব ফিল্ড চেক করুন",
        });
        } finally {
        setFormSubmitting(false);
        }
    };

    // ============================================
    // DELETE
    // ============================================
    const openDeleteModal = (id: number) => {
        setDeleteId(id);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteId(null);
        setDeleteModalOpen(false);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
        await forumApi.delete(deleteId);
        setForums((prev) => prev.filter((f) => f.id !== deleteId));
        closeDeleteModal();
        } catch (err) {
        console.error(err);
        alert("পোস্ট মুছতে সমস্যা হয়েছে");
        } finally {
        setDeleteLoading(false);
        }
    };

    // ============================================
    // PAGINATION
    // ============================================
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pages: number[] = [];
        let startP = Math.max(currentPage - 1, 1);
        let endP = Math.min(currentPage + 1, totalPages);
        if (currentPage === 1) endP = Math.min(3, totalPages);
        if (currentPage === totalPages) startP = Math.max(totalPages - 2, 1);
        for (let i = startP; i <= endP; i++) pages.push(i);

        return (
        <div className="flex items-center gap-1.5">
            {currentPage > 1 && (
            <button
                onClick={() => setPage(currentPage - 1)}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 text-xs cursor-pointer transition-all hover:-translate-y-px"
            >
                <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            )}
            {pages.map((i) => (
            <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:-translate-y-px ${
                i === currentPage
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/20"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50"
                }`}
            >
                {toBangla(i)}
            </button>
            ))}
            {currentPage < totalPages && (
            <button
                onClick={() => setPage(currentPage + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 text-xs cursor-pointer transition-all hover:-translate-y-px"
            >
                <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
            )}
        </div>
        );
    };

    // ============================================
    // RENDER
    // ============================================
    const categories: { key: Category; label: string; icon: string }[] = [
        { key: "all", label: "সব", icon: "fa-layer-group" },
        { key: "প্রশ্ন", label: "প্রশ্ন", icon: "fa-circle-question" },
        { key: "টিপস", label: "টিপস", icon: "fa-lightbulb" },
        { key: "সহায়তা", label: "সহায়তা", icon: "fa-hands-holding" },
        { key: "আলোচনা", label: "আলোচনা", icon: "fa-people-arrows" },
        { key: "ঘোষণা", label: "ঘোষণা", icon: "fa-bullhorn" },
    ];

    const getFullName = (post: ForumPost) => {
        if (!post.user) return "—";
        return (
        `${post.user.first_name || ""} ${post.user.last_name || ""}`.trim() ||
        post.user.username
        );
    };

    return (
        <div className="mt-2">
        <style>{`
            @keyframes modalPop {
            from { opacity:0; transform:scale(.95); }
            to { opacity:1; transform:scale(1); }
            }
            @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
            }
            @keyframes slideDown {
            from { opacity:0; transform:translateY(-12px); }
            to { opacity:1; transform:translateY(0); }
            }
            .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.16,1,0.3,1); }
            .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
            @keyframes fadeIn {
            from { opacity:0; transform:translateY(8px); }
            to { opacity:1; transform:translateY(0); }
            }
        `}</style>

        {/* ===== SECTION HEADER ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-comments text-emerald-600"></i>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                ফোরাম পরিচালনা
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                সব পোস্ট দেখুন, ফিল্টার করুন এবং পরিচালনা করুন
                </p>
            </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            <i className="fa-solid fa-layer-group text-[10px]"></i>
            {toBangla(forums.length)} টি পোস্ট
            </span>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                <button
                    key={cat.key}
                    onClick={() => {
                    setActiveCategory(cat.key);
                    setPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-300 hover:-translate-y-px ${
                    activeCategory === cat.key
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-transparent shadow-md shadow-emerald-500/25"
                        : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                >
                    <i className={`fa-solid ${cat.icon} text-xs`}></i>
                    {cat.label}
                </button>
                ))}
            </div>

            {/* Search + Date + New */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                <input
                    type="text"
                    placeholder="ID, টাইটেল বা পোস্টকারী দিয়ে খুঁজুন"
                    value={search}
                    onChange={(e) => {
                    if (searchTimer.current)
                        clearTimeout(searchTimer.current);
                    const val = e.target.value;
                    searchTimer.current = setTimeout(() => {
                        setSearch(val);
                        setPage(1);
                    }, 250);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] outline-none"
                />
                </div>
                <div className="relative">
                <i className="fa-solid fa-calendar-day absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                    }}
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 outline-none"
                />
                </div>
                <button
                onClick={() => openForm()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap"
                >
                <i className="fa-solid fa-plus text-xs"></i>
                নতুন টপিক
                </button>
            </div>
            </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Skeleton */}
            {loading && (
            <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="h-14 rounded-lg"
                    style={{
                    background:
                        "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    }}
                ></div>
                ))}
            </div>
            )}

            {/* Table */}
            {!loading && paginated.length > 0 && (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100/50">
                    {[
                        { icon: "fa-hashtag", label: "ID" },
                        { icon: "fa-tags", label: "ক্যাটাগরি" },
                        { icon: "fa-font", label: "টাইটেল" },
                        { icon: "fa-user", label: "পোস্টকারী" },
                        { icon: "fa-eye", label: "ভিউ", center: true },
                        { icon: "fa-heart", label: "লাইক", center: true },
                        { icon: "fa-calendar-day", label: "তারিখ" },
                    ].map((col) => (
                        <th
                        key={col.label}
                        className={`px-5 py-3.5 text-xs font-bold text-emerald-700 uppercase tracking-wider ${
                            col.center ? "text-center" : "text-left"
                        }`}
                        >
                        <div
                            className={`flex items-center gap-1.5 ${
                            col.center ? "justify-center" : ""
                            }`}
                        >
                            <i
                            className={`fa-solid ${col.icon} text-[10px] text-emerald-500`}
                            ></i>
                            {col.label}
                        </div>
                        </th>
                    ))}
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        অ্যাকশন
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginated.map((p) => {
                    const fullName = getFullName(p);
                    const initial = fullName.charAt(0).toUpperCase();
                    const date = p.created_at
                        ? new Date(p.created_at).toLocaleDateString("bn-BD")
                        : "—";
                    return (
                        <tr
                        key={p.id}
                        className="transition-all duration-200 hover:bg-emerald-50/40"
                        >
                        <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700">
                            F{p.id}
                            </span>
                        </td>
                        <td className="px-5 py-3.5">
                            <CatBadge cat={p.category} />
                        </td>
                        <td className="px-5 py-3.5">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                            {p.title || "—"}
                            </p>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {initial}
                            </div>
                            <span className="text-sm text-gray-600 truncate">
                                {fullName}
                            </span>
                            </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg text-xs font-bold text-blue-700">
                            {toBangla(p.view_count || 0)}
                            </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-heart text-rose-400 text-[10px]"></i>
                            <span className="text-xs font-bold text-rose-700">
                                {toBangla(p.total_likes || 0)}
                            </span>
                            </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                            {date}
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                            <button
                                onClick={() => openDetail(p)}
                                className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 cursor-pointer transition-colors"
                                title="বিবরণ দেখুন"
                            >
                                <i className="fa-solid fa-eye text-xs"></i>
                            </button>
                            <button
                                onClick={() => openForm(p)}
                                className="w-8 h-8 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 cursor-pointer transition-colors"
                                title="সম্পাদনা"
                            >
                                <i className="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button
                                onClick={() => openDeleteModal(p.id)}
                                className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer transition-colors"
                                title="মুছুন"
                            >
                                <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                            </div>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            )}

            {/* Empty State */}
            {!loading && paginated.length === 0 && (
            <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-comments text-emerald-300 text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                কোনো পোস্ট পাওয়া যায়নি
                </h3>
                <p className="text-gray-400 text-sm">
                ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                </p>
            </div>
            )}
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-gray-400">
            {filtered.length > 0
                ? `${toBangla(
                    (currentPage - 1) * PAGE_SIZE + 1
                )}–${toBangla(
                    Math.min(currentPage * PAGE_SIZE, filtered.length)
                )} / ${toBangla(filtered.length)} টি`
                : "—"}
            </p>
            {renderPagination()}
        </div>

        <Portal>
            {/* Backdrop */}
            <div
            className={`fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300 ${
                detailOpen
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            style={{ backdropFilter: "blur(6px)" }}
            onClick={closeDetail}
            />
            {/* Panel */}
            <div
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[9999] overflow-y-auto"
            style={{
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                transform: detailOpen ? "translateX(0)" : "translateX(100%)",
            }}
            >
            {selectedPost && (
                <>
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
                    <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <i className="fa-solid fa-newspaper text-white text-sm"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                        পোস্ট বিবরণ
                        </h3>
                    </div>
                    <button
                        onClick={closeDetail}
                        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">
                    {/* Post Header */}
                    <div className="py-4">
                    <div className="mb-3">
                        <CatBadge cat={selectedPost.category} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                        {selectedPost.title || "—"}
                    </h2>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getFullName(selectedPost).charAt(0).toUpperCase()}
                        </div>
                        <div>
                        <p className="text-sm font-semibold text-gray-800">
                            {getFullName(selectedPost)}
                        </p>
                        <p className="text-xs text-gray-400">
                            {selectedPost.created_at
                            ? new Date(
                                selectedPost.created_at
                                ).toLocaleString("bn-BD")
                            : "—"}
                        </p>
                        </div>
                    </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                        icon: "fa-eye",
                        color: "text-blue-500",
                        bg: "from-blue-50 to-indigo-50 border-blue-100/50",
                        value: selectedPost.view_count || 0,
                        label: "ভিউ",
                        },
                        {
                        icon: "fa-thumbs-up",
                        color: "text-rose-500",
                        bg: "from-rose-50 to-pink-50 border-rose-100/50",
                        value: selectedPost.total_likes || 0,
                        label: "লাইক",
                        },
                        {
                        icon: "fa-thumbs-down",
                        color: "text-amber-500",
                        bg: "from-amber-50 to-yellow-50 border-amber-100/50",
                        value: selectedPost.total_dislikes || 0,
                        label: "ডিসলাইক",
                        },
                    ].map((stat) => (
                        <div
                        key={stat.label}
                        className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-4 border text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                        >
                        <div className="w-9 h-9 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                            <i
                            className={`fa-solid ${stat.icon} ${stat.color} text-sm`}
                            ></i>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                            {toBangla(stat.value)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            {stat.label}
                        </p>
                        </div>
                    ))}
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <i className="fa-solid fa-align-left text-gray-400 text-xs"></i>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        পোস্টের বিষয়বস্তু
                        </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedPost.content || "কোনো বিষয়বস্তু নেই"}
                    </p>
                    </div>

                    {/* Info List */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {[
                        {
                        icon: "fa-user",
                        iconBg: "bg-emerald-50",
                        iconColor: "text-emerald-500",
                        label: "পোস্টকারী",
                        value: selectedPost.user?.username || "—",
                        },
                        {
                        icon: "fa-envelope",
                        iconBg: "bg-purple-50",
                        iconColor: "text-purple-500",
                        label: "ইমেইল",
                        value:
                            selectedPost.user?.email ||
                            "ইমেইল প্রদান করা হয়নি",
                        },
                        {
                        icon: "fa-tags",
                        iconBg: "bg-green-50",
                        iconColor: "text-green-500",
                        label: "ক্যাটাগরি",
                        value: selectedPost.category || "ক্যাটাগরি নেই",
                        },
                        {
                        icon: "fa-calendar-plus",
                        iconBg: "bg-indigo-50",
                        iconColor: "text-indigo-500",
                        label: "প্রকাশের তারিখ",
                        value: selectedPost.created_at
                            ? new Date(
                                selectedPost.created_at
                            ).toLocaleString("bn-BD", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "—",
                        },
                    ].map((row) => (
                        <div
                        key={row.label}
                        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/40"
                        >
                        <div
                            className={`w-9 h-9 ${row.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                            <i
                            className={`fa-solid ${row.icon} ${row.iconColor} text-sm`}
                            ></i>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                            {row.label}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 truncate">
                            {row.value}
                            </p>
                        </div>
                        </div>
                    ))}
                    </div>

                    {/* Comments */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-comments text-emerald-500 text-xs"></i>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                            মন্তব্যসমূহ
                        </span>
                        </div>
                        <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                        {commentsLoading
                            ? "..."
                            : toBangla(comments.length) + " টি"}
                        </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                        {commentsLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-xs text-gray-400">
                            মন্তব্য লোড হচ্ছে...
                            </span>
                        </div>
                        ) : comments.length === 0 ? (
                        <div className="py-6 text-center">
                            <i className="fa-solid fa-comment-slash text-gray-300 text-2xl mb-2"></i>
                            <p className="text-xs text-gray-400">
                            কোনো মন্তব্য নেই
                            </p>
                        </div>
                        ) : (
                        comments.map((c, idx) => (
                            <div
                            key={c.id || idx}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl animate-fadeIn"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2 border-white shadow-sm">
                                {(c.user?.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-gray-800 truncate">
                                    {c.user?.username || "Unknown"}
                                </span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                    {c.created_at
                                    ? new Date(
                                        c.created_at
                                        ).toLocaleString("bn-BD")
                                    : ""}
                                </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                {c.content}
                                </p>
                            </div>
                            </div>
                        ))
                        )}
                    </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pb-6">
                    <button
                        onClick={() => {
                        closeDetail();
                        setTimeout(() => openForm(selectedPost), 400);
                        }}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
                    >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                        পোস্ট সম্পাদনা করুন
                    </button>
                    <button
                        onClick={() => {
                        closeDetail();
                        setTimeout(
                            () => openDeleteModal(selectedPost.id),
                            400
                        );
                        }}
                        className="w-full py-3 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                        পোস্ট মুছে ফেলুন
                    </button>
                    </div>
                </div>
                </>
            )}
            </div>
        </Portal>

        {/* ===== FORM SLIDE-OVER — Portal দিয়ে ✅ ===== */}
        <Portal>
            {/* Backdrop */}
            <div
            className={`fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300 ${
                formOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ backdropFilter: "blur(6px)" }}
            onClick={closeForm}
            />
            {/* Panel */}
            <div
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9999] overflow-y-auto"
            style={{
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                transform: formOpen ? "translateX(0)" : "translateX(100%)",
            }}
            >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
                <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <i
                        className={`fa-solid ${
                        editId ? "fa-pen" : "fa-plus"
                        } text-white text-sm`}
                    ></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                    {editId ? "পোস্ট সম্পাদনা" : "নতুন টপিক তৈরি"}
                    </h3>
                </div>
                <button
                    onClick={closeForm}
                    className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
                {/* Toast */}
                {formToast.message && (
                <div
                    className={`rounded-xl p-3 text-sm flex items-center gap-2 animate-slideDown ${
                    formToast.type === "success"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-red-50 border border-red-200 text-red-600"
                    }`}
                >
                    <i
                    className={`fa-solid ${
                        formToast.type === "success"
                        ? "fa-circle-check"
                        : "fa-circle-exclamation"
                    }`}
                    ></i>
                    {formToast.message}
                </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Title */}
                <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-heading text-emerald-600 text-xs"></i>
                    </div>
                    শিরোনাম
                    </label>
                    <input
                    type="text"
                    required
                    placeholder="পোস্টের শিরোনাম লিখুন"
                    value={formData.title}
                    onChange={(e) =>
                        setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                        }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] outline-none"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-tags text-green-500 text-xs"></i>
                    </div>
                    ক্যাটাগরি
                    </label>
                    <select
                    value={formData.category}
                    onChange={(e) =>
                        setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                        }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                    >
                    <option value="">-- ক্যাটাগরি নির্বাচন করুন --</option>
                    {["প্রশ্ন", "টিপস", "সহায়তা", "আলোচনা", "ঘোষণা"].map(
                        (c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                        )
                    )}
                    </select>
                </div>

                {/* Content */}
                <div>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-align-left text-purple-500 text-xs"></i>
                    </div>
                    বিষয়বস্তু
                    </label>
                    <textarea
                    rows={8}
                    required
                    placeholder="পোস্টের বিস্তারিত লিখুন..."
                    value={formData.content}
                    onChange={(e) =>
                        setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                        }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] outline-none resize-none"
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pb-4">
                    <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-70"
                    >
                    {formSubmitting ? (
                        <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        প্রসেস হচ্ছে...
                        </>
                    ) : (
                        <>
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                        {editId ? "আপডেট করুন" : "পোস্ট করুন"}
                        </>
                    )}
                    </button>
                    <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                    >
                    বাতিল
                    </button>
                </div>
                </form>
            </div>
            </div>
        </Portal>

        {/* ===== DELETE MODAL — Portal দিয়ে ✅ ===== */}
        <Portal>
            <div
            className={`fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] p-4 transition-opacity duration-300 ${
                deleteModalOpen
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            style={{ backdropFilter: "blur(8px)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) closeDeleteModal();
            }}
            >
            <div
                className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl"
                style={
                deleteModalOpen
                    ? { animation: "modalPop 0.26s cubic-bezier(.34,1.56,.64,1)" }
                    : {}
                }
            >
                <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-trash-can text-red-500 text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                পোস্ট মুছে ফেলুন?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                এই পোস্ট স্থায়ীভাবে মুছে যাবে এবং ফিরিয়ে আনা যাবে না।
                </p>
                <div className="flex gap-3">
                <button
                    onClick={closeDeleteModal}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                >
                    বাতিল
                </button>
                <button
                    onClick={confirmDelete}
                    disabled={deleteLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                    {deleteLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                    <>
                        <i className="fa-solid fa-trash text-xs"></i>
                        মুছে ফেলুন
                    </>
                    )}
                </button>
                </div>
            </div>
            </div>
        </Portal>
        </div>
    );
}