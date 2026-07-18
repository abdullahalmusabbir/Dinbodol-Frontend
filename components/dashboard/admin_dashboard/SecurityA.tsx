"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { securityReportApi } from "@/lib/api";
import { SecurityReport, SecurityReportStatus, SecurityImportance } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ============================================
// TYPES
// ============================================
type StatusFilter = "all" | SecurityReportStatus;

// ============================================
// HELPERS
// ============================================
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const statusMap: Record<string, { label: string; cls: string; dot: string; border: string }> = {
    pending: { label: "পেন্ডিং", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-400", border: "border-amber-200" },
    in_progress: { label: "প্রক্রিয়াধীন", cls: "bg-purple-50 text-purple-700", dot: "bg-purple-400", border: "border-purple-200" },
    solved: { label: "সমাধান", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200" },
    closed: { label: "বন্ধ", cls: "bg-red-50 text-red-700", dot: "bg-red-400", border: "border-red-200" },
};

const importanceMap: Record<string, { label: string; cls: string; icon: string }> = {
    high: { label: "উচ্চ", cls: "bg-red-50 text-red-700", icon: "fa-arrow-up" },
    medium: { label: "মাঝারি", cls: "bg-amber-50 text-amber-700", icon: "fa-minus" },
    low: { label: "নিম্ন", cls: "bg-blue-50 text-blue-700", icon: "fa-arrow-down" },
};

const categoryColors: Record<string, string> = {
    হয়রানি: "bg-red-50 text-red-700 border-red-200",
    পিছুনেওয়া: "bg-amber-50 text-amber-700 border-amber-200",
    সহিংসতা: "bg-rose-50 text-rose-700 border-rose-200",
    হুমকি: "bg-orange-50 text-orange-700 border-orange-200",
    "অনিরাপদ স্থান": "bg-violet-50 text-violet-700 border-violet-200",
    অন্যান্য: "bg-gray-100 text-gray-600 border-gray-200",
};

// Status Badge
const StatusBadge = ({ status, large = false }: { status: string; large?: boolean }) => {
    const s = statusMap[status] || { label: status || "—", cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400", border: "border-gray-200" };
    if (large) {
        return (
        <span className={`inline-flex items-center gap-2 ${s.cls} ${s.border} border px-4 py-1.5 rounded-full text-sm font-semibold`}>
            <span className={`w-2 h-2 ${s.dot} rounded-full ${status === "in_progress" ? "animate-pulse" : ""}`}></span>
            {s.label}
        </span>
        );
    }
    return (
        <span className={`inline-flex items-center gap-1.5 ${s.cls} px-2.5 py-1 rounded-full text-[11px] font-semibold`}>
        <span className={`w-1.5 h-1.5 ${s.dot} rounded-full`}></span>
        {s.label}
        </span>
    );
};

// Importance Badge
const ImportanceBadge = ({ importance }: { importance: string | null }) => {
    const i = importanceMap[importance || ""] || { label: importance || "—", cls: "bg-gray-100 text-gray-600", icon: "fa-minus" };
    return (
        <span className={`inline-flex items-center gap-1 ${i.cls} px-2.5 py-1 rounded-full text-[11px] font-semibold`}>
        <i className={`fa-solid ${i.icon} text-[8px]`}></i>
        {i.label}
        </span>
    );
};

// Category Badge
const CategoryBadge = ({ category, large = false }: { category: string | null; large?: boolean }) => {
    const cls = categoryColors[category || ""] || "bg-gray-100 text-gray-600 border-gray-200";
    if (large) {
        return (
        <span className={`inline-flex items-center gap-1.5 ${cls} border px-4 py-1.5 rounded-full text-sm font-semibold`}>
            <i className="fa-solid fa-tag text-[10px] opacity-50"></i>
            {category || "—"}
        </span>
        );
    }
    return (
        <span className={`inline-flex items-center gap-1 ${cls.split(" border-")[0]} px-2.5 py-1 rounded-full text-[11px] font-semibold`}>
        <i className="fa-solid fa-tag text-[8px] opacity-50"></i>
        {category || "—"}
        </span>
    );
};

const PAGE_SIZE = 10;

// ============================================
// MAIN COMPONENT
// ============================================
export default function SecurityA() {
    const [reports, setReports] = useState<SecurityReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

    // Detail Panel
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);
    const [selectedImportance, setSelectedImportance] = useState<string>("low");
    const [selectedStatus, setSelectedStatus] = useState<string>("pending");
    const [updateLoading, setUpdateLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ============================================
    // LOAD
    // ============================================
    const loadReports = useCallback(async () => {
        try {
        setLoading(true);
        const res = await securityReportApi.getAll();
        const data = res.data;
        setReports(Array.isArray(data) ? data : [data]);
        } catch (err) {
        console.error(err);
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // ESC key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setDeleteModalOpen(false);
            setDetailOpen(false);
            document.body.style.overflow = "";
        }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // ============================================
    // FILTER
    // ============================================
    const getFiltered = () => {
        let filtered =
        activeStatus === "all"
            ? reports
            : reports.filter((r) => r.status === activeStatus);

        const term = search.trim().toLowerCase();
        if (term) {
        filtered = filtered.filter((r) => {
            const name = r.user
            ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim()
            : "";
            return (
            `s${r.id}`.toLowerCase().includes(term) ||
            name.toLowerCase().includes(term) ||
            (r.location || "").toLowerCase().includes(term) ||
            (r.category || "").toLowerCase().includes(term)
            );
        });
        }

        if (dateFilter) {
        filtered = filtered.filter((r) => {
            if (!r.reported_at) return false;
            return new Date(r.reported_at).toISOString().split("T")[0] === dateFilter;
        });
        }

        return filtered.sort((a, b) => b.id - a.id);
    };

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(1, totalPages || 1));
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ============================================
    // DETAIL PANEL
    // ============================================
    const openDetail = (report: SecurityReport) => {
        setSelectedReport(report);
        setSelectedImportance((report as any).importance || "low");
        setSelectedStatus(report.status || "pending");
        setShowToast(false);
        setDetailOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeDetail = () => {
        setDetailOpen(false);
        document.body.style.overflow = "";
        setTimeout(() => setSelectedReport(null), 400);
    };

    // Auto-save importance
    const handleImportanceChange = async (value: string) => {
        setSelectedImportance(value);
        await updateSecField("importance", value);
    };

    // Auto-save status
    const handleStatusChange = async (value: string) => {
        setSelectedStatus(value);
        await updateSecField("status", value);
    };

    const updateSecField = async (field: string, value: string) => {
        if (!selectedReport) return;
        setUpdateLoading(true);
        try {
        await securityReportApi.update(selectedReport.id, { [field]: value });
        setReports((prev) =>
            prev.map((r) =>
            r.id === selectedReport.id ? { ...r, [field]: value } : r
            )
        );
        setSelectedReport((prev) => (prev ? { ...prev, [field]: value } : null));
        // Show toast
        setShowToast(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowToast(false), 2500);
        } catch (err) {
        console.error(err);
        alert("আপডেট করতে সমস্যা হয়েছে");
        } finally {
        setUpdateLoading(false);
        }
    };

    // ============================================
    // DELETE
    // ============================================
    const openDeleteModal = (id: number) => {
        setDeleteId(id);
        setDeleteModalOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeDeleteModal = () => {
        setDeleteId(null);
        setDeleteModalOpen(false);
        document.body.style.overflow = "";
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
        await securityReportApi.delete(deleteId);
        setReports((prev) => prev.filter((r) => r.id !== deleteId));
        closeDeleteModal();
        } catch (err) {
        console.error(err);
        alert("মুছতে সমস্যা হয়েছে");
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
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer transition-all hover:-translate-y-px"
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
                    ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-md shadow-emerald-500/20"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
                {toBangla(i)}
            </button>
            ))}
            {currentPage < totalPages && (
            <button
                onClick={() => setPage(currentPage + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer transition-all hover:-translate-y-px"
            >
                <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
            )}
        </div>
        );
    };

    // ============================================
    // FILTER BUTTONS
    // ============================================
    const filterButtons: { key: StatusFilter; label: string; dotColor: string; pulse?: boolean }[] = [
        { key: "all", label: "সব", dotColor: "" },
        { key: "pending", label: "পেন্ডিং", dotColor: "bg-amber-400" },
        { key: "in_progress", label: "প্রক্রিয়াধীন", dotColor: "bg-purple-400", pulse: true },
        { key: "solved", label: "সমাধান", dotColor: "bg-emerald-400" },
        { key: "closed", label: "বন্ধ", dotColor: "bg-red-400" },
    ];

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="mt-2">
        {/* ===== SECTION HEADER ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-red-600"></i>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">নিরাপত্তা অভিযোগ পরিচালনা</h2>
                <p className="text-xs text-gray-400 mt-0.5">সকল নিরাপত্তা সংক্রান্ত অভিযোগ ফিল্টার ও পরিচালনা করুন</p>
            </div>
            </div>
            <span className="text-xs text-gray-400">{toBangla(filtered.length)} টি অভিযোগ</span>
        </div>

        {/* ===== FILTER BAR ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {filterButtons.map((btn) => (
                <button
                    key={btn.key}
                    onClick={() => { setActiveStatus(btn.key); setPage(1); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-300 hover:-translate-y-px ${
                    activeStatus === btn.key
                        ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white border-transparent shadow-md shadow-emerald-500/25"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                >
                    {btn.key === "all" ? (
                    <i className="fa-solid fa-layer-group text-xs"></i>
                    ) : (
                    <span className={`w-2 h-2 rounded-full ${activeStatus === btn.key ? "bg-white" : btn.dotColor} ${btn.pulse && activeStatus !== btn.key ? "animate-pulse" : ""}`}></span>
                    )}
                    {btn.label}
                </button>
                ))}
            </div>

            {/* Search + Date */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[220px]">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                <input
                    type="text"
                    placeholder="ID, রিপোর্টার, এলাকা, ধরন দিয়ে খুঁজুন..."
                    onChange={(e) => {
                    if (searchTimer.current) clearTimeout(searchTimer.current);
                    const val = e.target.value;
                    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 250);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] outline-none"
                />
                </div>
                <div className="relative">
                <i className="fa-solid fa-calendar-day absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 outline-none w-full sm:w-auto"
                />
                </div>
            </div>
            </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Skeleton */}
            {loading && (
            <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg" style={{ background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                ))}
            </div>
            )}

            {/* Table */}
            {!loading && paginated.length > 0 && (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                    {[
                        { icon: "fa-hashtag", label: "আইডি", center: false },
                        { icon: "fa-user", label: "রিপোর্টার", center: false },
                        { icon: "fa-location-dot", label: "এলাকা", center: false },
                        { icon: "fa-tag", label: "ধরন", center: false },
                        { icon: "fa-align-left", label: "বিবরণ", center: false },
                        { icon: "fa-triangle-exclamation", label: "অগ্রাধিকার", center: true },
                        { icon: "fa-signal", label: "স্ট্যাটাস", center: true },
                        { icon: "fa-calendar", label: "তারিখ", center: false },
                    ].map((col) => (
                        <th key={col.label} className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${col.center ? "text-center" : "text-left"}`}>
                        <div className={`flex items-center gap-1.5 ${col.center ? "justify-center" : ""}`}>
                            <i className={`fa-solid ${col.icon} text-[10px] text-gray-400`}></i>
                            {col.label}
                        </div>
                        </th>
                    ))}
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginated.map((r) => {
                    const name = r.user ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() || r.user.username : "—";
                    const date = r.reported_at
                        ? new Date(r.reported_at).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })
                        : "—";
                    const desc = r.description
                        ? r.description.length > 35 ? r.description.slice(0, 35) + "..." : r.description
                        : "—";
                    const importance = (r as any).importance as string | null;

                    return (
                        <tr key={r.id} className="transition-all duration-200 hover:bg-red-50/30">
                        <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-50 rounded-lg text-xs font-bold text-red-600">S{r.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-user text-gray-400 text-[10px]"></i>
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[100px]">{name}</span>
                            </div>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <i className="fa-solid fa-location-dot text-gray-300 text-[10px]"></i>
                            <span className="truncate max-w-[100px]">{r.location || "—"}</span>
                            </div>
                        </td>
                        <td className="px-5 py-3.5">
                            <CategoryBadge category={r.category} />
                        </td>
                        <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500 max-w-[140px] truncate block" title={r.description || ""}>{desc}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                            <ImportanceBadge importance={importance} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                            <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500">{date}</span>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                            <button
                                onClick={() => openDetail(r)}
                                className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 cursor-pointer transition-all hover:scale-110"
                                title="সম্পাদনা"
                            >
                                <i className="fa-solid fa-eye text-xs"></i>
                            </button>
                            <button
                                onClick={() => openDeleteModal(r.id)}
                                className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer transition-all hover:scale-110"
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
                <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-shield-halved text-red-300 text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">কোনো অভিযোগ পাওয়া যায়নি</h3>
                <p className="text-gray-400 text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
            )}
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-gray-400">
            {filtered.length > 0
                ? `${toBangla((currentPage - 1) * PAGE_SIZE + 1)}–${toBangla(Math.min(currentPage * PAGE_SIZE, filtered.length))} / ${toBangla(filtered.length)} টি`
                : "—"}
            </p>
            {renderPagination()}
        </div>
        <Portal>
        {/* ===== DETAIL SLIDE-OVER PANEL ===== */}
        {detailOpen && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]" onClick={closeDetail} />
        )}
        <div
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9999] overflow-y-auto"
            style={{ transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)", transform: detailOpen ? "translateX(0)" : "translateX(100%)" }}
        >
            {selectedReport && (() => {
            const name = selectedReport.user
                ? `${selectedReport.user.first_name || ""} ${selectedReport.user.last_name || ""}`.trim() || selectedReport.user.username
                : "—";
            const dateShort = selectedReport.reported_at
                ? new Date(selectedReport.reported_at).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })
                : "—";
            const dateFull = selectedReport.reported_at
                ? new Date(selectedReport.reported_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "—";
            const importanceText = importanceMap[selectedImportance]?.label || selectedImportance || "—";
            const statusText = statusMap[selectedStatus]?.label || selectedStatus || "—";

            return (
                <>
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
                    <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-shield-halved text-red-600 text-sm"></i>
                        </div>
                        <div>
                        <h3 className="text-lg font-bold text-gray-900">অভিযোগ বিবরণ</h3>
                        <p className="text-xs text-gray-400">আইডি: S{selectedReport.id}</p>
                        </div>
                    </div>
                    <button onClick={closeDetail} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">
                    {/* Toast */}
                    {showToast && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl" style={{ animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                        <i className="fa-solid fa-circle-check text-emerald-500"></i>
                        <span className="text-sm font-medium text-emerald-700">সফলভাবে আপডেট হয়েছে!</span>
                    </div>
                    )}

                    {/* Header Card */}
                    <div className="text-center py-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 mb-4">
                        <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
                    </div>
                    <div className="mb-2">
                        <CategoryBadge category={selectedReport.category} large />
                    </div>
                    <div className="mb-2">
                        <StatusBadge status={selectedStatus} large />
                    </div>
                    <p className="text-xs text-gray-400">{dateShort}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-100/50 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{importanceText}</p>
                        <p className="text-xs text-gray-500 mt-0.5">অগ্রাধিকার</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <i className="fa-solid fa-signal text-blue-500"></i>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{statusText}</p>
                        <p className="text-xs text-gray-500 mt-0.5">স্ট্যাটাস</p>
                    </div>
                    </div>

                    {/* Info List */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {[
                        { icon: "fa-user", iconBg: "bg-blue-50", iconColor: "text-blue-500", label: "রিপোর্টার", value: name },
                        { icon: "fa-location-dot", iconBg: "bg-red-50", iconColor: "text-red-500", label: "অবস্থান", value: selectedReport.location || "উল্লেখ করা হয়নি" },
                        { icon: "fa-tag", iconBg: "bg-purple-50", iconColor: "text-purple-500", label: "ধরন", value: selectedReport.category || "—" },
                        { icon: "fa-calendar-days", iconBg: "bg-indigo-50", iconColor: "text-indigo-500", label: "রিপোর্ট তারিখ", value: dateFull },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50">
                        <div className={`w-9 h-9 ${row.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <i className={`fa-solid ${row.icon} ${row.iconColor} text-sm`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{row.label}</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{row.value}</p>
                        </div>
                        </div>
                    ))}
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <i className="fa-solid fa-align-left text-gray-500 text-xs"></i>
                        </div>
                        <h4 className="text-sm font-bold text-gray-700">বিবরণ</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedReport.description || "কোনো বিবরণ দেওয়া হয়নি"}</p>
                    </div>

                    {/* Admin Controls */}
                    <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-sliders text-blue-500 text-xs"></i>
                        </div>
                        <h4 className="text-sm font-bold text-gray-700">অ্যাডমিন কন্ট্রোল</h4>
                    </div>

                    {/* Importance Select */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-1"></i>
                        অগ্রাধিকার পরিবর্তন
                        </label>
                        <div className="relative">
                        <select
                            value={selectedImportance}
                            onChange={(e) => handleImportanceChange(e.target.value)}
                            disabled={updateLoading}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer transition-all disabled:opacity-60"
                        >
                            <option value="low">🟢 নিম্ন (Low)</option>
                            <option value="medium">🟡 মাঝারি (Medium)</option>
                            <option value="high">🔴 উচ্চ (High)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                            <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                        </div>
                        </div>
                    </div>

                    {/* Status Select */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <i className="fa-solid fa-signal text-blue-500 mr-1"></i>
                        স্ট্যাটাস পরিবর্তন
                        </label>
                        <div className="relative">
                        <select
                            value={selectedStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updateLoading}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer transition-all disabled:opacity-60"
                        >
                            <option value="pending">⏳ পেন্ডিং (Pending)</option>
                            <option value="in_progress">🔄 প্রক্রিয়াধীন (In Progress)</option>
                            <option value="solved">✅ সমাধান (Solved)</option>
                            <option value="closed">🔒 বন্ধ (Closed)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                            <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                        </div>
                        </div>
                    </div>

                    {/* Hint */}
                    <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 flex items-start gap-2">
                        <i className="fa-solid fa-circle-info mt-0.5"></i>
                        <span>অগ্রাধিকার বা স্ট্যাটাস পরিবর্তন করলে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।</span>
                        </p>
                    </div>
                    </div>

                    {/* Delete Button */}
                    <div className="space-y-3 pb-6">
                    <button
                        onClick={() => {
                        closeDetail();
                        setTimeout(() => openDeleteModal(selectedReport.id), 300);
                        }}
                        className="w-full py-3 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <i className="fa-solid fa-trash-can"></i>
                        অভিযোগ মুছে ফেলুন
                    </button>
                    </div>
                </div>
                </>
            );
            })()}
        </div>
        </Portal>
        <Portal>
        {/* ===== DELETE MODAL ===== */}
        {deleteModalOpen && (
            <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}
            >
            <div className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl" style={{ animation: "modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-shield-halved text-red-500 text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">অভিযোগ মুছে ফেলুন?</h3>
                <p className="text-gray-500 text-sm mb-6">এই নিরাপত্তা অভিযোগ স্থায়ীভাবে মুছে যাবে।</p>
                <div className="flex gap-3">
                <button onClick={closeDeleteModal} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer">
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
                    <><i className="fa-solid fa-trash text-xs"></i> মুছে ফেলুন</>
                    )}
                </button>
                </div>
            </div>
            </div>
        )}
        </Portal>
        {/* Keyframe Styles */}
        <style>{`
            @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            @keyframes modalPop { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
            @keyframes toastIn { from{opacity:0;transform:translateY(-10px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        `}</style>
        </div>
    );
}