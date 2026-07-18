"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { reportApi } from "@/lib/api";
import { Report, ReportStatus } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ============================================
// TYPES
// ============================================
type StatusFilter = "all" | ReportStatus;

// ============================================
// HELPERS
// ============================================
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const statusMap: Record<
    string,
    {
        label: string;
        bg: string;
        text: string;
        border: string;
        dot: string;
        gradient: string;
        pct: number;
    }
> = {
    pending: {
        label: "পেন্ডিং",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-400",
        gradient: "from-amber-400 to-orange-500",
        pct: 25,
    },
    under_analysis: {
        label: "পর্যবেক্ষণ",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-400",
        gradient: "from-blue-400 to-indigo-500",
        pct: 50,
    },
    in_progress: {
        label: "প্রক্রিয়াধীন",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-400",
        gradient: "from-purple-400 to-indigo-500",
        pct: 75,
    },
    solved: {
        label: "সমাধান",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-400",
        gradient: "from-emerald-400 to-green-500",
        pct: 100,
    },
    closed: {
        label: "বন্ধ",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-400",
        gradient: "from-red-400 to-rose-500",
        pct: 100,
    },
};

const categoryColors: Record<string, string> = {
    "রাস্তা ও যোগাযোগ": "bg-orange-50 text-orange-700",
    বিদ্যুৎ: "bg-yellow-50 text-yellow-700",
    "পানি সরবরাহ": "bg-blue-50 text-blue-700",
    "আবর্জনা ব্যবস্থাপনা": "bg-green-50 text-green-700",
    নর্দমা: "bg-cyan-50 text-cyan-700",
    অন্যান্য: "bg-gray-100 text-gray-700",
};

// ============================================
// STATUS BADGE
// ============================================
const StatusBadge = ({ status }: { status: string }) => {
    const s = statusMap[status] || {
        label: status,
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
    };
    return (
        <span
        className={`inline-flex items-center gap-1.5 ${s.bg} ${s.text} px-2.5 py-1 rounded-full text-[11px] font-semibold`}
        >
        <span className={`w-1.5 h-1.5 ${s.dot} rounded-full`}></span>
        {s.label}
        </span>
    );
};

// ============================================
// CATEGORY BADGE
// ============================================
const CategoryBadge = ({ category }: { category: string | null }) => {
    const cls = categoryColors[category || ""] || "bg-gray-100 text-gray-600";
    return (
        <span
        className={`inline-flex items-center gap-1 ${cls} px-2.5 py-1 rounded-full text-[11px] font-semibold`}
        >
        <i className="fa-solid fa-tag text-[8px] opacity-50"></i>
        {category || "—"}
        </span>
    );
};

// ============================================
// TIMELINE STEP
// ============================================
const TimelineStep = ({
    title,
    subtitle,
    completed,
    showLine,
}: {
    title: string;
    subtitle: string;
    completed: boolean;
    showLine: boolean;
}) => (
    <div className="flex gap-3">
        <div className="flex flex-col items-center">
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            completed
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-gray-100 text-gray-400"
            }`}
        >
            {completed ? (
            <i className="fa-solid fa-check text-xs"></i>
            ) : (
            <i className="fa-regular fa-circle text-xs"></i>
            )}
        </div>
        {showLine && (
            <div
            className={`w-0.5 h-10 ${completed ? "bg-emerald-300" : "bg-gray-200"}`}
            ></div>
        )}
        </div>
        <div className={`flex-1 ${showLine ? "pb-4" : ""}`}>
        <p className="font-semibold text-gray-800 text-xs">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        {completed ? (
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
            <i className="fa-solid fa-circle-check mr-1"></i>সম্পন্ন
            </span>
        ) : (
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-50 text-gray-400">
            <i className="fa-regular fa-clock mr-1"></i>অপেক্ষমান
            </span>
        )}
        </div>
    </div>
);

const PAGE_SIZE = 10;

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReportA() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

    // Detail Panel
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [progressWidth, setProgressWidth] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [updateMsg, setUpdateMsg] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ============================================
    // LOAD
    // ============================================
    const loadReports = useCallback(async () => {
        try {
        setLoading(true);
        const res = await reportApi.getAll();
        setReports(res.data);
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

    // Animate progress bar when detail opens
    useEffect(() => {
        if (detailOpen && selectedReport) {
        const si = statusMap[selectedReport.status];
        setTimeout(() => setProgressWidth(si?.pct || 0), 100);
        } else {
        setProgressWidth(0);
        }
    }, [detailOpen, selectedReport]);

    // ============================================
    // FILTER
    // ============================================
    const getFiltered = () => {
        const term = search.trim().toLowerCase();
        return reports
        .filter((r) => {
            const matchStatus =
            activeStatus === "all" || r.status === activeStatus;
            const name = [r.user?.first_name, r.user?.last_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
            const matchSearch =
            !term ||
            `r${r.id}`.toLowerCase().includes(term) ||
            (r.location || "").toLowerCase().includes(term) ||
            (r.category || "").toLowerCase().includes(term) ||
            (r.title || "").toLowerCase().includes(term) ||
            name.includes(term);
            let matchDate = true;
            if (dateFilter && r.reported_at) {
            matchDate =
                new Date(r.reported_at).toISOString().split("T")[0] === dateFilter;
            }
            return matchStatus && matchSearch && matchDate;
        })
        .sort((a, b) => b.id - a.id);
    };

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(1, totalPages || 1));
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // ============================================
    // DETAIL PANEL
    // ============================================
    const openDetail = (report: Report) => {
        setSelectedReport(report);
        setSelectedStatus(report.status);
        setUpdateMsg(null);
        setDetailOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeDetail = () => {
        setDetailOpen(false);
        document.body.style.overflow = "";
        setTimeout(() => setSelectedReport(null), 400);
    };

    const getStepStatus = (status: string) => {
        const order = ["pending", "under_analysis", "in_progress", "solved"];
        const idx = order.indexOf(status === "closed" ? "solved" : status);
        return {
        pending: idx >= 0,
        under_analysis: idx >= 1,
        in_progress: idx >= 2,
        solved: idx >= 3,
        };
    };

    const handleStatusUpdate = async () => {
        if (!selectedReport) return;
        setUpdateLoading(true);
        setUpdateMsg(null);
        try {
        await reportApi.update(selectedReport.id, { status: selectedStatus });
        setReports((prev) =>
            prev.map((r) =>
            r.id === selectedReport.id
                ? { ...r, status: selectedStatus as ReportStatus }
                : r
            )
        );
        setSelectedReport((prev) =>
            prev ? { ...prev, status: selectedStatus as ReportStatus } : null
        );
        setUpdateMsg({ type: "success", text: "স্ট্যাটাস সফলভাবে আপডেট হয়েছে!" });
        } catch (err) {
        console.error(err);
        setUpdateMsg({ type: "error", text: "আপডেট করতে সমস্যা হয়েছে।" });
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
        await reportApi.delete(deleteId);
        setReports((prev) => prev.filter((r) => r.id !== deleteId));
        closeDeleteModal();
        } catch (err) {
        console.error(err);
        alert("রিপোর্ট মুছতে সমস্যা হয়েছে");
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
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-xs cursor-pointer transition-all hover:-translate-y-px"
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
                    ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-500/25"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                }`}
            >
                {toBangla(i)}
            </button>
            ))}
            {currentPage < totalPages && (
            <button
                onClick={() => setPage(currentPage + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-xs cursor-pointer transition-all hover:-translate-y-px"
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
    const filterButtons: {
        key: StatusFilter;
        label: string;
        dotColor: string;
        pulse?: boolean;
    }[] = [
        { key: "all", label: "সব", dotColor: "" },
        { key: "pending", label: "পেন্ডিং", dotColor: "bg-amber-400" },
        { key: "under_analysis", label: "পর্যবেক্ষণ", dotColor: "bg-blue-400" },
        {
        key: "in_progress",
        label: "প্রক্রিয়াধীন",
        dotColor: "bg-purple-400",
        pulse: true,
        },
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
            {/* icon — emerald theme মিলিয়ে */}
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-file-circle-exclamation text-emerald-600"></i>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                সমস্যা রিপোর্ট পরিচালনা
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                সকল রিপোর্ট দেখুন, ফিল্টার করুন এবং পরিচালনা করুন
                </p>
            </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            <i className="fa-solid fa-layer-group text-[10px]"></i>
            {toBangla(filtered.length)} টি রিপোর্ট
            </span>
        </div>

        {/* ===== FILTER BAR ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
                {filterButtons.map((btn) => (
                <button
                    key={btn.key}
                    onClick={() => {
                    setActiveStatus(btn.key);
                    setPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-300 hover:-translate-y-px ${
                    activeStatus === btn.key
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-transparent shadow-md shadow-emerald-500/25"
                        : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                >
                    {btn.key === "all" ? (
                    <i className="fa-solid fa-layer-group text-xs"></i>
                    ) : (
                    <span
                        className={`w-2 h-2 rounded-full ${
                        activeStatus === btn.key ? "bg-white" : btn.dotColor
                        } ${
                        btn.pulse && activeStatus !== btn.key
                            ? "animate-pulse"
                            : ""
                        }`}
                    ></span>
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
                    placeholder="ID, এলাকা, ক্যাটাগরি দিয়ে খুঁজুন..."
                    onChange={(e) => {
                    if (searchTimer.current) clearTimeout(searchTimer.current);
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
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 transition-all focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] outline-none w-full sm:w-auto"
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
                <div
                    key={i}
                    className="h-12 rounded-lg"
                    style={{
                    background:
                        "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    }}
                />
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
                        { icon: "fa-hashtag", label: "আইডি" },
                        { icon: "fa-location-dot", label: "এলাকা" },
                        { icon: "fa-tag", label: "ক্যাটাগরি" },
                        { icon: "fa-circle-info", label: "সমস্যা" },
                        { icon: "fa-user", label: "রিপোর্টার" },
                        { icon: "fa-signal", label: "স্ট্যাটাস" },
                        { icon: "fa-calendar", label: "তারিখ" },
                    ].map((col) => (
                        <th
                        key={col.label}
                        className="px-5 py-3.5 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider"
                        >
                        <div className="flex items-center gap-1.5">
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
                    {paginated.map((report) => {
                    const reporterName =
                        [report.user?.first_name, report.user?.last_name]
                        .filter(Boolean)
                        .join(" ") || "—";
                    const date = report.reported_at
                        ? new Date(report.reported_at).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })
                        : "—";
                    return (
                        <tr
                        key={report.id}
                        className="transition-all duration-200 hover:bg-emerald-50/40"
                        >
                        <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700">
                            R{report.id}
                            </span>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                            <i className="fa-solid fa-location-dot text-emerald-400 text-[10px]"></i>
                            <span className="max-w-[120px] truncate">
                                {report.location || "—"}
                            </span>
                            </div>
                        </td>
                        <td className="px-5 py-3.5">
                            <CategoryBadge category={report.category} />
                        </td>
                        <td className="px-5 py-3.5">
                            <span className="text-sm text-gray-700 max-w-[150px] truncate block">
                            {report.title || "—"}
                            </span>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-user text-emerald-600 text-[10px]"></i>
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[100px]">
                                {reporterName}
                            </span>
                            </div>
                        </td>
                        <td className="px-5 py-3.5">
                            <StatusBadge status={report.status} />
                        </td>
                        <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500">{date}</span>
                        </td>
                        <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                            <button
                                onClick={() => openDetail(report)}
                                className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 cursor-pointer transition-all hover:scale-110"
                                title="দেখুন ও সম্পাদনা"
                            >
                                <i className="fa-solid fa-eye text-xs"></i>
                            </button>
                            <button
                                onClick={() => openDeleteModal(report.id)}
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
                <div
                className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4"
                style={{ animation: "emptyFloat 3s ease-in-out infinite" }}
                >
                <i className="fa-solid fa-file-circle-xmark text-emerald-300 text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                কোনো রিপোর্ট পাওয়া যায়নি
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
        {/* ===== DETAIL SLIDE-OVER BACKDROP ===== */}
        {detailOpen && (
            <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            onClick={closeDetail}
            />
        )}

        {/* ===== DETAIL SLIDE-OVER PANEL ===== */}
        <div
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[9999] overflow-y-auto"
            style={{
            transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
            transform: detailOpen ? "translateX(0)" : "translateX(100%)",
            }}
        >
            {selectedReport &&
            (() => {
                const si = statusMap[selectedReport.status] || {
                label: selectedReport.status,
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
                dot: "bg-gray-400",
                gradient: "from-gray-300 to-gray-400",
                pct: 0,
                };
                const steps = getStepStatus(selectedReport.status);
                const reporterName =
                [
                    selectedReport.user?.first_name,
                    selectedReport.user?.last_name,
                ]
                    .filter(Boolean)
                    .join(" ") ||
                selectedReport.user?.username ||
                "—";
                const reporterEmail =
                selectedReport.user?.email || "ইমেইল প্রদান করা হয়নি";
                const formattedDate = selectedReport.reported_at
                ? new Date(selectedReport.reported_at).toLocaleDateString(
                    "bn-BD",
                    { year: "numeric", month: "long", day: "numeric" }
                    )
                : "—";

                return (
                <>
                    {/* Slide-over Header */}
                    <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
                            <i className="fa-solid fa-file-lines text-white text-sm"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            রিপোর্ট বিবরণ
                        </h3>
                        </div>
                        <button
                        onClick={closeDetail}
                        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
                        >
                        <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    </div>

                    {/* Slide-over Body */}
                    <div className="p-5 space-y-5">
                    {/* Color Bar */}
                    <div
                        className={`-mx-5 -mt-5 h-1.5 bg-gradient-to-r ${si.gradient}`}
                    ></div>

                    {/* ID & Status */}
                    <div className="text-center pt-4 pb-2">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 mb-4">
                        <i className="fa-solid fa-file-lines text-white text-2xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                        #{selectedReport.id}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto truncate">
                        {selectedReport.title || "—"}
                        </p>
                        <div
                        className={`mt-3 inline-flex items-center gap-2 ${si.bg} ${si.text} ${si.border} border px-4 py-1.5 rounded-full text-xs font-semibold`}
                        >
                        <span className="relative flex h-2 w-2">
                            <span
                            className={`${si.dot} animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                            ></span>
                            <span
                            className={`${si.dot} relative inline-flex rounded-full h-2 w-2`}
                            ></span>
                        </span>
                        {si.label}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="w-8 h-8 mx-auto bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                            <i className="fa-solid fa-tag text-emerald-600 text-xs"></i>
                        </div>
                        <p className="text-xs text-gray-500 mb-0.5">ক্যাটাগরি</p>
                        <p className="text-sm font-bold text-gray-900">
                            {selectedReport.category || "—"}
                        </p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4 border border-teal-100/50 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="w-8 h-8 mx-auto bg-teal-100 rounded-xl flex items-center justify-center mb-2">
                            <i className="fa-solid fa-calendar-days text-teal-600 text-xs"></i>
                        </div>
                        <p className="text-xs text-gray-500 mb-0.5">তারিখ</p>
                        <p className="text-sm font-bold text-gray-900">
                            {formattedDate}
                        </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">
                            অগ্রগতি
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                            {toBangla(si.pct)}%
                        </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            style={{
                            width: `${progressWidth}%`,
                            transition:
                                "width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)",
                            }}
                        ></div>
                        </div>
                    </div>

                    {/* Info List */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        {[
                        {
                            icon: "fa-location-dot",
                            iconBg: "bg-emerald-50",
                            iconColor: "text-emerald-500",
                            label: "অবস্থান",
                            value: selectedReport.location || "—",
                        },
                        {
                            icon: "fa-user",
                            iconBg: "bg-teal-50",
                            iconColor: "text-teal-500",
                            label: "রিপোর্টার",
                            value: reporterName,
                        },
                        {
                            icon: "fa-envelope",
                            iconBg: "bg-cyan-50",
                            iconColor: "text-cyan-500",
                            label: "ইমেইল",
                            value: reporterEmail,
                        },
                        ].map((row) => (
                        <div
                            key={row.label}
                            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/40"
                        >
                            <div
                            className={`w-9 h-9 rounded-xl ${row.iconBg} flex items-center justify-center flex-shrink-0`}
                            >
                            <i
                                className={`fa-solid ${row.icon} ${row.iconColor} text-sm`}
                            ></i>
                            </div>
                            <div className="min-w-0">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                                {row.label}
                            </p>
                            <p className="text-sm font-semibold text-gray-700 truncate">
                                {row.value}
                            </p>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <i className="fa-solid fa-align-left text-white text-xs"></i>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">
                            বিবরণ
                        </h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedReport.description || "কোনো বিবরণ নেই"}
                        </p>
                    </div>

                    {/* Image */}
                    {selectedReport.image && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                            <i className="fa-solid fa-image text-white text-xs"></i>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                            সংযুক্ত ছবি
                            </h4>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-100">
                            <img
                            src={selectedReport.image}
                            alt="Report"
                            className="w-full h-48 object-cover"
                            />
                        </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <i className="fa-solid fa-timeline text-white text-xs"></i>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">
                            টাইমলাইন
                        </h4>
                        </div>
                        <div className="space-y-0">
                        <TimelineStep
                            title="রিপোর্ট গৃহীত"
                            subtitle="সফলভাবে গৃহীত হয়েছে"
                            completed={steps.pending}
                            showLine={true}
                        />
                        <TimelineStep
                            title="পর্যালোচনা সম্পন্ন"
                            subtitle="বিস্তারিত পর্যালোচনা"
                            completed={steps.under_analysis}
                            showLine={true}
                        />
                        <TimelineStep
                            title="সমাধান প্রক্রিয়া"
                            subtitle="সমস্যা সমাধান চলমান"
                            completed={steps.in_progress}
                            showLine={true}
                        />
                        <TimelineStep
                            title="সম্পন্ন"
                            subtitle="সমস্যা সমাধান সম্পূর্ণ"
                            completed={steps.solved}
                            showLine={false}
                        />
                        </div>
                    </div>

                    {/* Status Update */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <i className="fa-solid fa-pen-to-square text-white text-xs"></i>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">
                            স্ট্যাটাস আপডেট
                        </h4>
                        </div>

                        {updateMsg && (
                        <div
                            className={`mb-3 text-sm rounded-lg px-4 py-2 ${
                            updateMsg.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                            {updateMsg.text}
                        </div>
                        )}

                        <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all mb-4"
                        >
                        <option value="pending">পেন্ডিং</option>
                        <option value="under_analysis">পর্যবেক্ষণ</option>
                        <option value="in_progress">প্রক্রিয়াধীন</option>
                        <option value="solved">সমাধান</option>
                        <option value="closed">বন্ধ</option>
                        </select>

                        <div className="flex gap-3">
                        <button
                            onClick={handleStatusUpdate}
                            disabled={updateLoading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                        >
                            {updateLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                            <>
                                <i className="fa-solid fa-check text-xs"></i>
                                আপডেট করুন
                            </>
                            )}
                        </button>
                        <button
                            onClick={closeDetail}
                            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <i className="fa-solid fa-xmark text-xs"></i>
                            বন্ধ করুন
                        </button>
                        </div>
                    </div>

                    <div className="pb-6"></div>
                    </div>
                </>
                );
            })()}
        </div>
        </Portal>

        {/* ===== DELETE MODAL ===== */}
        <Portal>
        {deleteModalOpen && (
            <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) closeDeleteModal();
            }}
            >
            <div
                className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl"
                style={{
                animation: "modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
            >
                <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-trash-can text-red-500 text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                রিপোর্ট মুছে ফেলুন?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                এই রিপোর্ট স্থায়ীভাবে মুছে যাবে এবং আর ফিরিয়ে আনা যাবে না।
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
                        <i className="fa-solid fa-trash text-xs"></i> মুছে ফেলুন
                    </>
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
            @keyframes emptyFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        `}</style>
        </div>
    );
}