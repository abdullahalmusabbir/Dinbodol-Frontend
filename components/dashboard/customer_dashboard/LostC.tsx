"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { lostReportApi } from "@/lib/api";
import { LostReport, LostReportStatus } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
import { useAuth } from "@/context/AuthContext";

// ===== TYPES =====
type FilterStatus = LostReportStatus | "all";

// ===== HELPERS =====
const toBangla = (num: number): string => {
    const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (x) => d[parseInt(x)]);
};

const getStatusConfig = (status: string) => {
    const map: Record<string, { cls: string; dot: string }> = {
        হারানো: { cls: "bg-red-50 text-red-700", dot: "bg-red-400" },
        পাওয়া: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
        "ফেরত পাওয়া": { cls: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
    };
    return map[status] || { cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
};

const getStatusConfigLarge = (status: string) => {
    const map: Record<string, { cls: string; dot: string }> = {
        হারানো: { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400 animate-pulse" },
        পাওয়া: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
        "ফেরত পাওয়া": { cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
    };
    return map[status] || { cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
};

const getColorBar = (status: string) => {
    const map: Record<string, string> = {
        হারানো: "bg-gradient-to-r from-red-400 to-rose-500",
        পাওয়া: "bg-gradient-to-r from-emerald-400 to-green-500",
        "ফেরত পাওয়া": "bg-gradient-to-r from-blue-400 to-indigo-500",
    };
    return map[status] || "bg-gradient-to-r from-gray-300 to-gray-400";
};

// ===== STATUS BADGE =====
const StatusBadge = ({ status }: { status: string }) => {
    const cfg = getStatusConfig(status);
    return (
        <span className={`inline-flex items-center gap-1.5 ${cfg.cls} px-2.5 py-1 rounded-full text-[11px] font-semibold`}>
        <span className={`w-1.5 h-1.5 ${cfg.dot} rounded-full`} />
        {status}
        </span>
    );
};

// ===== TYPE BADGE =====
const TypeBadge = ({ typePost }: { typePost: string | null }) => {
    if (typePost === "হারানো") {
        return (
        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            🔍 হারানো
        </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full text-[11px] font-semibold">
        🤲 পাওয়া
        </span>
    );
};

// ===== SKELETON =====
const SkeletonRow = () => (
    <tr>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <td key={i} className="px-5 py-3.5">
            <div
            className="h-8 rounded-lg"
            style={{
                background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
            }}
            />
        </td>
        ))}
    </tr>
);

// ===== PAGE SIZE =====
const PAGE_SIZE = 8;

export default function LostC() {
    const [reports, setReports] = useState<LostReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentStatus, setCurrentStatus] = useState<FilterStatus>("all");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);

    // Detail Panel
    const [selectedReport, setSelectedReport] = useState<LostReport | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);

    // Delete Modal
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Image Modal
    const [imageModalSrc, setImageModalSrc] = useState("");
    const [imageModalOpen, setImageModalOpen] = useState(false);

    // Copy link
    const [copyMsg, setCopyMsg] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { user, isLoading: authLoading } = useAuth();
    // ===== FETCH =====
    useEffect(() => {
        if (authLoading) return;

        if (!user?.id) {
            setReports([]);
            setLoading(false);
            return;
        }

        const fetchReports = async () => {
            try {
            const res = await lostReportApi.getAll();
            const mine = (res.data as LostReport[]).filter((r) => r.user?.id === user.id);
            setReports(mine);
            } catch {
            // handle error
            } finally {
            setLoading(false);
            }
        };

        fetchReports();
    }, [user?.id, authLoading]);

    // ===== KEYBOARD =====
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setPanelOpen(false);
            setDeleteTargetId(null);
            setImageModalOpen(false);
        }
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, []);

    // ===== BODY SCROLL LOCK =====
    useEffect(() => {
        document.body.style.overflow = panelOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [panelOpen]);

    // ===== FILTER =====
    const getFiltered = useCallback(() => {
        let filtered =
        currentStatus === "all"
            ? reports
            : reports.filter((r) => r.status === currentStatus);

        const term = search.trim().toLowerCase();
        if (term) {
        filtered = filtered.filter(
            (r) =>
            `#${r.id}`.toLowerCase().includes(term) ||
            (r.item_name || "").toLowerCase().includes(term) ||
            (r.category || "").toLowerCase().includes(term) ||
            (r.location || "").toLowerCase().includes(term)
        );
        }

        if (typeFilter !== "all") {
        filtered = filtered.filter((r) => r.typePost === typeFilter);
        }

        if (dateFilter) {
        filtered = filtered.filter((r) => r.date === dateFilter);
        }

        return filtered.sort((a, b) => b.id - a.id);
    }, [reports, currentStatus, search, typeFilter, dateFilter]);

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ===== DELETE =====
    const handleDelete = async () => {
        if (!deleteTargetId) return;
        setDeleting(true);
        try {
        await lostReportApi.delete(deleteTargetId);
        setReports((prev) => prev.filter((r) => r.id !== deleteTargetId));
        setDeleteTargetId(null);
        if (selectedReport?.id === deleteTargetId) {
            setPanelOpen(false);
            setSelectedReport(null);
        }
        } catch {
        alert("মুছে ফেলতে সমস্যা হয়েছে");
        } finally {
        setDeleting(false);
        }
    };

    // ===== SHARE =====
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = selectedReport?.item_name || "হারানো-পাওয়া";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyMsg(true);
        setTimeout(() => setCopyMsg(false), 2500);
        });
    };

    // ===== PAGINATION BUTTONS =====
    const getPaginationRange = () => {
        let s = Math.max(currentPage - 1, 1);
        let e = Math.min(currentPage + 1, totalPages);
        if (currentPage === 1) e = Math.min(3, totalPages);
        if (currentPage === totalPages) s = Math.max(totalPages - 2, 1);
        const range = [];
        for (let i = s; i <= e; i++) range.push(i);
        return range;
    };

    return (
        <div id="content-lost" className="mt-2">

        {/* Shimmer keyframe */}
        <style>{`
            @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
            }
            @keyframes lostDeletePop {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
            }
            .lost-delete-card { animation: lostDeletePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .lost-detail-panel { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .lost-row:hover { background: #fef9f0; }
            .lost-stat-card { transition: all 0.3s ease; }
            .lost-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
            .lost-info-row:hover { background: #f9fafb; }
            .lost-share-btn:hover { transform: scale(1.1); }
            .lost-img-preview:hover { transform: scale(1.03); }
            .lost-contact-glow { animation: lostContactGlow 3s ease-in-out infinite; }
            @keyframes lostContactGlow {
            0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.08); }
            50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.15); }
            }
        `}</style>

        {/* ===== Section Header ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89
                    3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd" />
                </svg>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                আমার হারানো-পাওয়া রিপোর্টসমূহ
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                আপনার জমা দেওয়া সকল হারানো ও পাওয়া আইটেম দেখুন ও পরিচালনা করুন
                </p>
            </div>
            </div>
            <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
                {toBangla(filtered.length)} টি আইটেম
            </span>
            </div>
        </div>

        {/* ===== Filter Bar ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {(["all", "হারানো", "পাওয়া", "ফেরত পাওয়া"] as const).map((s) => (
                <button
                    key={s}
                    onClick={() => { setCurrentStatus(s); setPage(1); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                    border-2 transition-all
                    ${currentStatus === s
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:text-amber-600"
                    }`}
                >
                    {s === "all" && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L13
                        10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293
                        6.707A1 1 0 013 6V4z" />
                    </svg>
                    )}
                    {s === "হারানো" && <span className="w-2 h-2 bg-red-400 rounded-full" />}
                    {s === "পাওয়া" && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
                    {s === "ফেরত পাওয়া" && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
                    {s === "all" ? "সব" : s}
                </button>
                ))}
            </div>

            {/* Search + Type + Date */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                    fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0
                    1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0
                    012 8z" clipRule="evenodd" />
                </svg>
                <input
                    type="text"
                    placeholder="আইটেম, ক্যাটাগরি, এলাকা দিয়ে খুঁজুন..."
                    value={search}
                    onChange={(e) => {
                    if (searchTimer.current) clearTimeout(searchTimer.current);
                    searchTimer.current = setTimeout(() => {
                        setSearch(e.target.value);
                        setPage(1);
                    }, 250);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border
                    border-gray-200 focus:outline-none focus:border-amber-400
                    focus:ring-2 focus:ring-amber-100 transition-all"
                />
                </div>

                {/* Type Filter */}
                <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-gray-50 text-sm border border-gray-200
                    focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                    transition-all"
                >
                <option value="all">সব ধরন</option>
                <option value="হারানো">হারানো</option>
                <option value="পাওয়া">পাওয়া</option>
                </select>

                {/* Date Filter */}
                <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                    fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0
                    002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0
                    00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border
                    border-gray-200 focus:outline-none focus:border-amber-400
                    focus:ring-2 focus:ring-amber-100 transition-all"
                />
                </div>
            </div>
            </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {loading ? (
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-lg"
                    style={{
                    background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    }}
                />
                ))}
            </div>
            ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
                <div className="inline-block mb-4">
                <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center
                    justify-center">
                    <svg className="w-8 h-8 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0
                        1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0
                        012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                কোনো হারানো-পাওয়া আইটেম পাওয়া যায়নি
                </h3>
                <p className="text-gray-400 text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                    {[
                        { icon: "#", label: "আইডি" },
                        { icon: "□", label: "আইটেম" },
                        { icon: "🏷", label: "ক্যাটাগরি" },
                        { icon: "↻", label: "ধরন", center: true },
                        { icon: "📍", label: "অবস্থান" },
                        { icon: "◉", label: "স্ট্যাটাস", center: true },
                        { icon: "📅", label: "তারিখ" },
                        { label: "অ্যাকশন", center: true },
                    ].map((h, i) => (
                        <th key={i}
                        className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase
                            tracking-wider ${h.center ? "text-center" : "text-left"}`}
                        >
                        {h.label}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginated.map((r) => {
                    const nameShort = r.item_name
                        ? r.item_name.length > 22
                        ? r.item_name.slice(0, 22) + "..."
                        : r.item_name
                        : "—";

                    return (
                        <tr key={r.id} className="lost-row transition-all duration-200">
                        {/* ID */}
                        <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8
                            bg-amber-50 rounded-lg text-xs font-bold text-amber-600">
                            #{r.id}
                            </span>
                        </td>

                        {/* Item */}
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 ${r.typePost === "হারানো"
                                ? "bg-red-50" : "bg-emerald-50"}
                                rounded-full flex items-center justify-center flex-shrink-0`}>
                                <span className="text-[10px]">
                                {r.typePost === "হারানো" ? "🔍" : "🤲"}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 truncate
                                max-w-[130px]" title={r.item_name}>
                                {nameShort}
                            </span>
                            </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 bg-gray-100
                            text-gray-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                            {r.category || "—"}
                            </span>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-3.5 text-center">
                            <TypeBadge typePost={r.typePost} />
                        </td>

                        {/* Location */}
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <svg className="w-3 h-3 text-gray-300 flex-shrink-0"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10
                                18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0
                                000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate max-w-[100px]">{r.location || "—"}</span>
                            </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 text-center">
                            <StatusBadge status={r.status} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500">{r.date || "—"}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                            {/* View Detail */}
                            <button
                                onClick={() => { setSelectedReport(r); setPanelOpen(true); }}
                                title="বিস্তারিত"
                                className="w-8 h-8 bg-amber-50 hover:bg-amber-100 rounded-lg
                                flex items-center justify-center text-amber-600 cursor-pointer
                                transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10
                                    3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542
                                    7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => setDeleteTargetId(r.id)}
                                title="মুছুন"
                                className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg
                                flex items-center justify-center text-red-500 cursor-pointer
                                transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382
                                    4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0
                                    000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0
                                    012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0
                                    102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
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
        </div>

        {/* ===== Pagination ===== */}
        {!loading && filtered.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-gray-400">
                {toBangla((currentPage - 1) * PAGE_SIZE + 1)}–
                {toBangla(Math.min(currentPage * PAGE_SIZE, filtered.length))} /
                {toBangla(filtered.length)} টি
            </p>
            <div className="flex items-center gap-1.5">
                {currentPage > 1 && (
                <button
                    onClick={() => setPage((p) => p - 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center
                    justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414
                        10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1
                        1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                )}
                {getPaginationRange().map((i) => (
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs
                    font-bold cursor-pointer
                    ${i === currentPage
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    {toBangla(i)}
                </button>
                ))}
                {currentPage < totalPages && (
                <button
                    onClick={() => setPage((p) => p + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center
                    justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586
                        10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1
                        1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                )}
            </div>
            </div>
        )}

        {/* ==================== DETAIL SLIDE-OVER PANEL ==================== */}
        {/* Overlay */}
        <Portal>
        <div
            onClick={() => setPanelOpen(false)}
            className={`fixed inset-0 bg-black/30 z-[9998] transition-opacity duration-300
            ${panelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ backdropFilter: "blur(6px)" }}
        />

        {/* Panel */}
        <div
            className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl
            lost-detail-panel z-[9999] overflow-y-auto
            ${panelOpen ? "translate-x-0" : "translate-x-full"}`}
        >
            {selectedReport && (
            <>
                {/* Panel Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center
                        justify-center">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6
                            0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6
                            6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">আইটেম বিবরণ</h3>
                        <p className="text-xs text-gray-400">আইডি: #{selectedReport.id}</p>
                    </div>
                    </div>
                    <button
                    onClick={() => setPanelOpen(false)}
                    className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center
                        justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1
                        1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10
                        11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1
                        1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                </div>

                {/* Panel Body */}
                <div className="p-5 space-y-6">

                {/* Header Center */}
                <div className="text-center py-4">
                    <div className={`h-1.5 rounded-full w-32 mx-auto mb-4
                    ${getColorBar(selectedReport.status)}`} />

                    {/* Icon */}
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center
                    justify-center shadow-lg mb-4
                    ${selectedReport.typePost === "হারানো"
                        ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25"
                        : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25"
                    }`}>
                    <span className="text-white text-3xl">
                        {selectedReport.typePost === "হারানো" ? "🔍" : "🤲"}
                    </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedReport.item_name || "—"}
                    </h2>

                    {/* Type Badge Large */}
                    <div className="mb-2">
                    {selectedReport.typePost === "হারানো" ? (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700
                        border-red-200 px-4 py-1.5 rounded-full text-sm font-semibold border">
                        🔍 হারানো আইটেম
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700
                        border-teal-200 px-4 py-1.5 rounded-full text-sm font-semibold border">
                        🤲 পাওয়া আইটেম
                        </span>
                    )}
                    </div>

                    {/* Status Badge Large */}
                    <div className="mb-2">
                    {(() => {
                        const cfg = getStatusConfigLarge(selectedReport.status);
                        return (
                        <span className={`inline-flex items-center gap-2 ${cfg.cls} px-4
                            py-1.5 rounded-full text-sm font-semibold border`}>
                            <span className={`w-2 h-2 ${cfg.dot} rounded-full`} />
                            {selectedReport.status}
                        </span>
                        );
                    })()}
                    </div>

                    <p className="text-xs text-gray-400">{selectedReport.date || "—"}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="lost-stat-card bg-gradient-to-br from-amber-50 to-orange-50
                    rounded-2xl p-4 border border-amber-100/50 text-center">
                    <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center
                        justify-center shadow-sm mb-2 text-lg">📊</div>
                    <p className="text-sm font-bold text-gray-900">{selectedReport.status || "—"}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">স্ট্যাটাস</p>
                    </div>
                    <div className="lost-stat-card bg-gradient-to-br from-purple-50 to-fuchsia-50
                    rounded-2xl p-4 border border-purple-100/50 text-center">
                    <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center
                        justify-center shadow-sm mb-2 text-lg">🏷</div>
                    <p className="text-sm font-bold text-gray-900 truncate">
                        {selectedReport.category || "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">ক্যাটাগরি</p>
                    </div>
                    <div className="lost-stat-card bg-gradient-to-br from-blue-50 to-indigo-50
                    rounded-2xl p-4 border border-blue-100/50 text-center">
                    <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center
                        justify-center shadow-sm mb-2 text-lg">↻</div>
                    <p className="text-sm font-bold text-gray-900">
                        {selectedReport.typePost || "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">পোস্টের ধরন</p>
                    </div>
                </div>

                {/* Info List */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                    divide-y divide-gray-50">

                    {/* Item Name */}
                    <div className="lost-info-row flex items-center gap-4 px-5 py-4
                    transition-colors duration-200">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-sm">📦</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider
                        font-medium">আইটেমের নাম</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                        {selectedReport.item_name || "—"}
                        </p>
                    </div>
                    </div>

                    {/* Category */}
                    <div className="lost-info-row flex items-center gap-4 px-5 py-4
                    transition-colors duration-200">
                    <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-sm">🏷</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider
                        font-medium">ক্যাটাগরি</p>
                        <p className="text-sm font-semibold text-gray-800">
                        {selectedReport.category || "নির্দিষ্ট নয়"}
                        </p>
                    </div>
                    </div>

                    {/* Type */}
                    <div className="lost-info-row flex items-center gap-4 px-5 py-4
                    transition-colors duration-200">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-sm">
                        {selectedReport.typePost === "হারানো" ? "🔍" : "🤲"}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider
                        font-medium">পোস্টের ধরন</p>
                        <p className="text-sm font-semibold text-gray-800">
                        {selectedReport.typePost || "—"}
                        </p>
                    </div>
                    </div>

                    {/* Location */}
                    <div className="lost-info-row flex items-center gap-4 px-5 py-4
                    transition-colors duration-200">
                    <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-sm">📍</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider
                        font-medium">অবস্থান</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                        {selectedReport.location || "উল্লেখ করা হয়নি"}
                        </p>
                    </div>
                    </div>

                    {/* Date */}
                    <div className="lost-info-row flex items-center gap-4 px-5 py-4
                    transition-colors duration-200">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-sm">📅</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider
                        font-medium">তারিখ</p>
                        <p className="text-sm font-semibold text-gray-800">
                        {selectedReport.date || "—"}
                        </p>
                    </div>
                    </div>

                    {/* Reported At */}
                    <div className="lost-info-row flex items-center gap-4 px-5 py-4
                    transition-colors duration-200">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-sm">🕐</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider
                        font-medium">রিপোর্ট সময়</p>
                        <p className="text-sm font-semibold text-gray-800">
                        {selectedReport.reported_at || "—"}
                        </p>
                    </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center
                        justify-center shadow-sm">
                        <span className="text-xs">📝</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-700">বিবরণ</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {selectedReport.description || "কোনো বিবরণ দেওয়া হয়নি"}
                    </p>
                </div>

                {/* Image */}
                {selectedReport.image && (
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center
                        justify-center shadow-sm">
                        <span className="text-xs">🖼</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-700">সংযুক্ত ছবি</h4>
                    </div>
                    <div
                        className="relative group cursor-pointer rounded-2xl overflow-hidden
                        border border-gray-100"
                        onClick={() => {
                        setImageModalSrc(selectedReport.image!);
                        setImageModalOpen(true);
                        }}
                    >
                        <img
                        src={selectedReport.image}
                        alt="Item Image"
                        className="lost-img-preview w-full h-52 object-cover transition-transform
                            duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50
                        via-transparent to-transparent opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 flex items-end justify-center pb-5">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl
                            text-sm font-semibold text-gray-800 shadow-lg flex items-center gap-2">
                            🔍 বড় করে দেখুন
                        </span>
                        </div>
                    </div>
                    </div>
                )}

                {/* Reporter Card */}
                <div className="lost-contact-glow bg-white rounded-2xl border border-gray-100
                    overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center
                        justify-center">
                        <span className="text-sm">👤</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">রিপোর্টকারী</h4>
                    </div>
                    <div className="p-5">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600
                        rounded-full flex items-center justify-center text-white text-xl
                        font-bold shadow-md">
                        {(selectedReport.user?.first_name?.[0] ||
                            selectedReport.user?.username?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                        <p className="font-bold text-gray-900">
                            {selectedReport.user?.first_name && selectedReport.user?.last_name
                            ? `${selectedReport.user.first_name} ${selectedReport.user.last_name}`
                            : selectedReport.user?.username || "অজানা"}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <span className="text-emerald-500">✓</span>
                            যাচাইকৃত ব্যবহারকারী
                        </p>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Share Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center
                        justify-center shadow-sm">
                        <span className="text-xs">🔗</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-700">শেয়ার করুন</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">অন্যদের জানাতে শেয়ার করুন</p>
                    <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                        "_blank"
                        )}
                        className="lost-share-btn w-10 h-10 bg-blue-50 rounded-xl flex items-center
                        justify-center text-blue-600 hover:bg-blue-100 cursor-pointer
                        transition-all duration-300"
                    >
                        f
                    </button>
                    <button
                        onClick={() => window.open(
                        `https://wa.me/?text=${encodeURIComponent(shareTitle + " — " + shareUrl)}`,
                        "_blank"
                        )}
                        className="lost-share-btn w-10 h-10 bg-green-50 rounded-xl flex items-center
                        justify-center text-green-600 hover:bg-green-100 cursor-pointer
                        transition-all duration-300"
                    >
                        W
                    </button>
                    <button
                        onClick={() => window.open(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
                        "_blank"
                        )}
                        className="lost-share-btn w-10 h-10 bg-sky-50 rounded-xl flex items-center
                        justify-center text-sky-600 hover:bg-sky-100 cursor-pointer
                        transition-all duration-300"
                    >
                        X
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className="lost-share-btn w-10 h-10 bg-gray-50 rounded-xl flex items-center
                        justify-center text-gray-600 hover:bg-gray-100 cursor-pointer
                        transition-all duration-300"
                    >
                        🔗
                    </button>
                    </div>
                    {copyMsg && (
                    <p className="text-xs text-emerald-600 font-medium mt-2">✓ লিংক কপি হয়েছে!</p>
                    )}
                </div>

                {/* Quick Info Dark Card */}
                <div className="bg-gradient-to-br from-amber-800 to-amber-950 rounded-2xl p-5
                    text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-700/30 rounded-full
                    -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-600/20 rounded-full
                    translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center
                        justify-center mb-4 text-lg">ℹ</div>
                    <h4 className="font-bold text-sm mb-4">সংক্ষিপ্ত তথ্য</h4>
                    <div className="space-y-3">
                        {[
                        { icon: "📦", value: selectedReport.item_name || "—" },
                        { icon: "📍", value: selectedReport.location || "—" },
                        { icon: "📅", value: selectedReport.date || "—" },
                        {
                            icon: selectedReport.typePost === "হারানো" ? "🔍" : "🤲",
                            value: selectedReport.typePost === "হারানো" ? "হারানো আইটেম" : "পাওয়া আইটেম",
                        },
                        ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-amber-100/80 text-sm">
                            <span className="text-xs w-4 text-center">{item.icon}</span>
                            <span className={item.icon === "🔍" || item.icon === "🤲"
                            ? "text-red-300" : ""}>{item.value}</span>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pb-6">
                    <button
                    onClick={() => { setPanelOpen(false); setDeleteTargetId(selectedReport.id); }}
                    className="w-full py-3 rounded-2xl bg-red-50 border border-red-200
                        text-red-600 font-semibold text-sm flex items-center justify-center
                        gap-2 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                    🗑 এই আইটেম মুছুন
                    </button>
                    <button
                    onClick={() => setPanelOpen(false)}
                    className="w-full py-3 rounded-2xl bg-white border-2 border-gray-200
                        text-gray-700 font-semibold text-sm flex items-center justify-center
                        gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                    ← ফিরে যান
                    </button>
                </div>
                </div>
            </>
            )}
        </div>
        </Portal>
        {/* ==================== IMAGE FULLSCREEN MODAL ==================== */}
        <Portal>
        {imageModalOpen && (
            <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center
                justify-center z-[10001] p-4"
            onClick={() => setImageModalOpen(false)}
            >
            <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                <button
                onClick={() => setImageModalOpen(false)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/30
                    backdrop-blur-sm rounded-full flex items-center justify-center text-white
                    text-xl transition-colors cursor-pointer"
                >
                ✕
                </button>
                <img src={imageModalSrc} alt="Item Image" className="w-full rounded-2xl shadow-2xl" />
            </div>
            </div>
        )}
        </Portal>
        {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
        <Portal>
        {deleteTargetId !== null && (
            <div className="fixed inset-0 bg-black/40 z-[10000] flex items-center
            justify-center p-4" style={{ backdropFilter: "blur(8px)" }}>
            <div className="lost-delete-card bg-white rounded-2xl shadow-2xl max-w-sm w-full
                p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center
                justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0
                    000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1
                    1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1
                    1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">আইটেম মুছে ফেলুন?</h3>
                <p className="text-sm text-gray-500 mb-6">
                এই হারানো-পাওয়া আইটেমটি স্থায়ীভাবে মুছে ফেলা হবে। এটি পুনরুদ্ধারযোগ্য নয়।
                </p>
                <div className="flex gap-3">
                <button
                    onClick={() => setDeleteTargetId(null)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600
                    font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    বাতিল
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold
                    text-sm hover:bg-red-700 transition-colors cursor-pointer
                    disabled:opacity-70 disabled:cursor-not-allowed flex items-center
                    justify-center gap-1.5"
                >
                    {deleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white
                        rounded-full animate-spin" />
                    ) : (
                    <>🗑 মুছুন</>
                    )}
                </button>
                </div>
            </div>
            </div>
        )}
        </Portal>
        </div>
        
    );
}