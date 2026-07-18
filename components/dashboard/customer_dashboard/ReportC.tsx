"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { reportApi } from "@/lib/api";
import { Report, ReportStatus } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
import { useAuth } from "@/context/AuthContext";
// ============================================
// TYPES
// ============================================
type FilterStatus = ReportStatus | "all";

// ============================================
// CONFIGS
// ============================================
const statusConfig: Record<
    ReportStatus,
    { label: string; bg: string; text: string; dot: string; border: string; dotAnim?: string }
> = {
    pending: {
        label: "মূল্যায়ন",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-400",
        border: "border-amber-200",
    },
    under_analysis: {
        label: "পর্যালোচনা",
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-400",
        border: "border-purple-200",
    },
    in_progress: {
        label: "চলমান",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-400",
        border: "border-blue-200",
        dotAnim: "animate-pulse",
    },
    solved: {
        label: "সমাধান",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
        border: "border-emerald-200",
    },
    closed: {
        label: "বন্ধ",
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-400",
        border: "border-red-200",
    },
};

const progressMap: Record<ReportStatus, { percent: number; label: string }> = {
    pending: { percent: 25, label: "২৫%" },
    under_analysis: { percent: 50, label: "৫০%" },
    in_progress: { percent: 75, label: "৭৫%" },
    solved: { percent: 100, label: "১০০%" },
    closed: { percent: 100, label: "১০০%" },
};

const colorBarMap: Record<ReportStatus, string> = {
    pending: "from-gray-300 to-gray-400",
    under_analysis: "from-amber-400 to-orange-500",
    in_progress: "from-blue-400 to-indigo-500",
    solved: "from-emerald-400 to-green-500",
    closed: "from-emerald-400 to-green-500",
};

const timelineSteps = [
    {
        key: "pending",
        label: "রিপোর্ট গৃহীত",
        sub: "সফলভাবে গৃহীত হয়েছে",
        statuses: ["pending", "under_analysis", "in_progress", "solved", "closed"],
    },
    {
        key: "under_analysis",
        label: "পর্যালোচনা সম্পন্ন",
        sub: "বিস্তারিত পর্যালোচনা",
        statuses: ["under_analysis", "in_progress", "solved", "closed"],
    },
    {
        key: "in_progress",
        label: "সমাধান প্রক্রিয়া",
        sub: "সমস্যা সমাধান চলমান",
        statuses: ["in_progress", "solved", "closed"],
    },
    {
        key: "solved",
        label: "সম্পন্ন",
        sub: "সমস্যা সমাধান সম্পূর্ণ",
        statuses: ["solved", "closed"],
    },
];

const PAGE_SIZE = 8;

// ============================================
// HELPERS
// ============================================
function toBangla(num: number): string {
    const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (x) => d[parseInt(x)]);
}

function formatDateBn(dateStr: string, short = false): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: short ? "short" : "long",
        day: "numeric",
        });
    } catch {
        return "—";
    }
}

// ============================================
// SUB COMPONENTS
// ============================================

// Skeleton Row
const SkeletonRow = () => (
    <tr>
        <td colSpan={8} className="px-4 py-2">
        <div
            className="h-12 rounded-lg"
            style={{
            background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            }}
        />
        </td>
    </tr>
);

// Status Badge Small
function StatusBadge({ status }: { status: ReportStatus }) {
    const cfg = statusConfig[status];
    return (
        <span
        className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text} px-2.5 py-1 rounded-full text-[11px] font-semibold`}
        >
        <span className={`w-1.5 h-1.5 ${cfg.dot} ${cfg.dotAnim ?? ""} rounded-full`} />
        {cfg.label}
        </span>
    );
}

// Status Badge Large
function StatusBadgeLarge({ status }: { status: ReportStatus }) {
    const cfg = statusConfig[status];
    return (
        <span
        className={`inline-flex items-center gap-2 ${cfg.bg} ${cfg.text} ${cfg.border} px-4 py-1.5 rounded-full text-sm font-semibold border`}
        >
        <span className={`w-2 h-2 ${cfg.dot} ${cfg.dotAnim ?? ""} rounded-full`} />
        {cfg.label}
        </span>
    );
}

// Category Badge Small
function CategoryBadge({ category }: { category: string }) {
    return (
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
        <span className="text-[8px] opacity-50">🏷</span>
        {category || "—"}
        </span>
    );
}

// Category Badge Large
function CategoryBadgeLarge({ category }: { category: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 px-4 py-1.5 rounded-full text-sm font-semibold border">
        <span className="text-[10px] opacity-50">🏷</span>
        {category || "—"}
        </span>
    );
}

// Pagination
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

    const pages = [];
    for (let i = s; i <= e; i++) pages.push(i);

    return (
        <div className="flex items-center gap-1.5">
        {page > 1 && (
            <button
            onClick={() => onChange(page - 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer"
            >
            ‹
            </button>
        )}
        {pages.map((p) => (
            <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
                p === page
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            >
            {toBangla(p)}
            </button>
        ))}
        {page < totalPages && (
            <button
            onClick={() => onChange(page + 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer"
            >
            ›
            </button>
        )}
        </div>
    );
}

// ============================================
// IMAGE FULLSCREEN MODAL
// ============================================
interface ImageModalProps {
    src: string;
    onClose: () => void;
}

function ImageModal({ src, onClose }: ImageModalProps) {
    return (
        <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        >
        <div className="relative max-w-4xl w-full">
            <button
            onClick={onClose}
            className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl transition-colors cursor-pointer"
            >
            ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Report Image" className="w-full rounded-2xl shadow-2xl" />
        </div>
        </div>
    );
}

// ============================================
// DETAIL PANEL
// ============================================
interface DetailPanelProps {
    report: Report | null;
    onClose: () => void;
    onImageClick: (src: string) => void;
}

function DetailPanel({ report, onClose, onImageClick }: DetailPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [barWidth, setBarWidth] = useState(0);

    useEffect(() => {
        if (report) {
        setBarWidth(0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
            setIsOpen(true);
            setTimeout(() => {
                setBarWidth(progressMap[report.status]?.percent ?? 0);
            }, 100);
            });
        });
        } else {
        setIsOpen(false);
        }
    }, [report]);

    if (!report) return null;

    const prog = progressMap[report.status];
    const colorBar = colorBarMap[report.status];

    return (
        <Portal>
        {/* Overlay */}
        <div
            onClick={onClose}
            className={`fixed inset-0 bg-black/30 backdrop-blur-[6px] z-[9998] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        />

        {/* Panel */}
        <div
            className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9999] overflow-y-auto transition-transform duration-[400ms] ${
            isOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">রিপোর্ট বিবরণ</h3>
                    <p className="text-xs text-gray-400">আইডি: #{report.id}</p>
                </div>
                </div>
                <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                ✕
                </button>
            </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
            {/* Report Header */}
            <div className="text-center py-4">
                <div className={`h-1.5 rounded-full w-32 mx-auto mb-4 bg-gradient-to-r ${colorBar}`} />
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{report.title || "—"}</h2>
                <div className="mb-2">
                <CategoryBadgeLarge category={report.category} />
                </div>
                <div className="mb-2">
                <StatusBadgeLarge status={report.status} />
                </div>
                <p className="text-xs text-gray-400">{formatDateBn(report.reported_at, true)}</p>
            </div>

            {/* Stats Grid - 2 cols */}
            <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 text-center hover:-translate-y-0.5 transition-transform duration-300">
                <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <span className="text-emerald-500 text-sm">📊</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{statusConfig[report.status].label}</p>
                <p className="text-xs text-gray-500 mt-0.5">স্ট্যাটাস</p>
                </div>
                {/* Progress */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 text-center hover:-translate-y-0.5 transition-transform duration-300">
                <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <span className="text-blue-500 text-sm">📈</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{prog.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">সম্পন্নতা</p>
                </div>
            </div>

            {/* Info List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {/* Location */}
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 text-sm">📍</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">অবস্থান</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{report.location || "উল্লেখ করা হয়নি"}</p>
                </div>
                </div>
                {/* Category */}
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-500 text-sm">🏷️</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">ক্যাটাগরি</p>
                    <p className="text-sm font-semibold text-gray-800">{report.category || "—"}</p>
                </div>
                </div>
                {/* Date */}
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-500 text-sm">📅</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">রিপোর্ট তারিখ</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDateBn(report.reported_at)}</p>
                </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-gray-500 text-xs">📝</span>
                </div>
                <h4 className="text-sm font-bold text-gray-700">বিবরণ</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{report.description || "কোনো বিবরণ দেওয়া হয়নি"}</p>
            </div>

            {/* Image Card */}
            {report.image && (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-purple-500 text-xs">🖼️</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-700">সংযুক্ত ছবি</h4>
                </div>
                <div
                    className="relative group cursor-pointer rounded-2xl overflow-hidden border border-gray-100"
                    onClick={() => onImageClick(report.image!)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                    src={report.image}
                    alt="Report"
                    className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-semibold text-gray-800 shadow-lg flex items-center gap-2">
                        <span>⛶</span> বড় করে দেখুন
                    </span>
                    </div>
                </div>
                </div>
            )}

            {/* Progress Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-emerald-500 text-xs">⏱</span>
                </div>
                <h4 className="text-sm font-bold text-gray-700">অগ্রগতি</h4>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                    <span>সম্পন্নতা</span>
                    <span>{prog.label}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-[width] duration-1000 ease-out"
                    style={{ width: `${barWidth}%` }}
                    />
                </div>
                </div>

                {/* Timeline Steps */}
                <div className="space-y-0">
                {timelineSteps.map((step, idx) => {
                    const isDone = step.statuses.includes(report.status);
                    const isLast = idx === timelineSteps.length - 1;
                    const nextDone = !isLast && timelineSteps[idx + 1].statuses.includes(report.status);
                    return (
                    <div key={step.key} className="flex gap-4 transition-all duration-300">
                        <div className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                            isDone
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/25"
                                : "bg-gray-100 text-gray-400"
                            }`}
                        >
                            {isDone ? "✓" : idx + 1}
                        </div>
                        {!isLast && (
                            <div className={`w-0.5 h-14 ${nextDone ? "bg-emerald-200" : "bg-gray-200"}`} />
                        )}
                        </div>
                        <div className={`flex-1 ${!isLast ? "pb-8" : ""}`}>
                        <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.sub}</p>
                        <span
                            className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                            isDone ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                            }`}
                        >
                            {isDone ? "✓ সম্পন্ন" : "⏰ অপেক্ষমান"}
                        </span>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
                <a
                href={`/report/${report.id}/`}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors no-underline"
                >
                👁️ বিস্তারিত দেখুন
                </a>
                <button
                onClick={async () => {
                    try {
                    const res = await reportApi.downloadPDF(report.id);
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `report-${report.id}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    } catch {
                    alert("PDF ডাউনলোড ব্যর্থ হয়েছে");
                    }
                }}
                className="w-full py-3 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                📄 PDF ডাউনলোড
                </button>
            </div>
            </div>
        </div>
        </Portal>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReportC() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [filterDate, setFilterDate] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);
    const { user, isLoading: authLoading } = useAuth();

    // Fetch
    useEffect(() => {
        if (authLoading) return;

        if (!user?.id) {
            setReports([]);
            setLoading(false);
            return;
        }

        (async () => {
            try {
            const res = await reportApi.getAll();
            const mine = (res.data as Report[]).filter((r) => r.user?.id === user.id);
            setReports(mine);
            } catch {
            // handle silently
            } finally {
            setLoading(false);
            }
        })();
    }, [user?.id, authLoading]);

    // ESC key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setSelectedReport(null);
            setImageModalSrc(null);
        }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Body overflow
    useEffect(() => {
        document.body.style.overflow = selectedReport ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [selectedReport]);

    // Filter
    const filtered = reports
        .filter((r) => filterStatus === "all" || r.status === filterStatus)
        .filter((r) => {
        if (!filterDate) return true;
        return r.reported_at?.includes(filterDate);
        })
        .filter((r) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            `#${r.id}`.includes(term) ||
            (r.title ?? "").toLowerCase().includes(term) ||
            (r.location ?? "").toLowerCase().includes(term) ||
            (r.category ?? "").toLowerCase().includes(term)
        );
        })
        .sort((a, b) => b.id - a.id);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = useCallback((val: string) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
        setSearch(val);
        setPage(1);
        }, 250);
    }, []);

    const filterButtons: { status: FilterStatus; label: string; dot?: string; dotAnim?: string }[] = [
        { status: "all", label: "সব" },
        { status: "pending", label: "মূল্যায়ন", dot: "bg-amber-400" },
        { status: "in_progress", label: "চলমান", dot: "bg-blue-400", dotAnim: "animate-pulse" },
        { status: "solved", label: "সমাধান", dot: "bg-emerald-400" },
    ];

    return (
        <>
        {/* Shimmer style */}
        <style>{`
            @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
            }
        `}</style>

        <div className="mt-2">
            {/* ===== SECTION HEADER ===== */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                </div>
                <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">আমার রিপোর্টসমূহ</h2>
                <p className="text-xs text-gray-400 mt-0.5">আপনার জমা দেওয়া সকল রিপোর্ট দেখুন ও পরিচালনা করুন</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                {loading ? "—" : toBangla(filtered.length)} টি রিপোর্ট
                </span>
            </div>
            </div>

            {/* ===== FILTER BAR ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                {filterButtons.map((fb) => {
                    const isActive = filterStatus === fb.status;
                    return (
                    <button
                        key={fb.status}
                        onClick={() => { setFilterStatus(fb.status); setPage(1); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
                        isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                            : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                        }`}
                    >
                        {fb.dot ? (
                        <span className={`w-2 h-2 ${fb.dot} ${fb.dotAnim ?? ""} rounded-full`} />
                        ) : (
                        <span className="text-xs">☰</span>
                        )}
                        {fb.label}
                    </button>
                    );
                })}
                </div>

                {/* Search + Date */}
                <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
                    <input
                    type="text"
                    placeholder="শিরোনাম, এলাকা, ক্যাটাগরি দিয়ে খুঁজুন..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                </div>

                {/* Date Filter */}
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">📅</span>
                    <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                    className="w-full sm:w-auto pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                </div>
                </div>
            </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
                <div className="p-4">
                <table className="w-full">
                    <tbody>
                    {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">কোনো রিপোর্ট পাওয়া যায়নি</h3>
                <p className="text-gray-400 text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                        {[
                        { icon: "#", label: "আইডি" },
                        { icon: "T", label: "শিরোনাম" },
                        { icon: "🏷", label: "ক্যাটাগরি" },
                        { icon: "📍", label: "এলাকা" },
                        { icon: "📝", label: "বিবরণ" },
                        { icon: "📊", label: "স্ট্যাটাস", center: true },
                        { icon: "📅", label: "তারিখ" },
                        { icon: "", label: "অ্যাকশন", center: true },
                        ].map((col) => (
                        <th
                            key={col.label}
                            className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${col.center ? "text-center" : "text-left"}`}
                        >
                            <div className={`flex items-center gap-1.5 ${col.center ? "justify-center" : ""}`}>
                            <span className="text-[10px] text-gray-400">{col.icon}</span>
                            {col.label}
                            </div>
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {paginated.map((r) => {
                        const titleShort = r.title
                        ? r.title.length > 25 ? r.title.slice(0, 25) + "..." : r.title
                        : "—";
                        const desc = r.description
                        ? r.description.length > 35 ? r.description.slice(0, 35) + "..." : r.description
                        : "—";
                        return (
                        <tr
                            key={r.id}
                            className="hover:bg-emerald-50/20 transition-all duration-200"
                        >
                            <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-600">
                                #{r.id}
                            </span>
                            </td>
                            <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                </div>
                                <span
                                className="text-sm font-medium text-gray-800 truncate max-w-[150px]"
                                title={r.title ?? ""}
                                >
                                {titleShort}
                                </span>
                            </div>
                            </td>
                            <td className="px-5 py-3.5">
                            <CategoryBadge category={r.category} />
                            </td>
                            <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <span className="text-gray-300 text-[10px]">📍</span>
                                <span className="truncate max-w-[100px]">{r.location || "—"}</span>
                            </div>
                            </td>
                            <td className="px-5 py-3.5">
                            <span
                                className="text-xs text-gray-500 max-w-[140px] truncate block"
                                title={r.description ?? ""}
                            >
                                {desc}
                            </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                            <StatusBadge status={r.status} />
                            </td>
                            <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500">{formatDateBn(r.reported_at, true)}</span>
                            </td>
                            <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                                <button
                                onClick={() => setSelectedReport(r)}
                                title="বিস্তারিত"
                                className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 cursor-pointer transition-colors"
                                >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

            {/* ===== PAGINATION ===== */}
            {!loading && filtered.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                {toBangla((currentPage - 1) * PAGE_SIZE + 1)}–
                {toBangla(Math.min(currentPage * PAGE_SIZE, filtered.length))} /{" "}
                {toBangla(filtered.length)} টি
                </p>
                <Pagination page={currentPage} totalPages={totalPages} onChange={(p) => setPage(p)} />
            </div>
            )}
        </div>

        {/* ===== DETAIL SLIDE-OVER ===== */}
        <DetailPanel
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onImageClick={(src) => setImageModalSrc(src)}
        />

        {/* ===== IMAGE FULLSCREEN MODAL ===== */}
        {imageModalSrc && (
            <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />
        )}
        </>
    );
}