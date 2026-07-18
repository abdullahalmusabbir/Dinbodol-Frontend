"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { lostReportApi } from "@/lib/api";
import { LostReport, LostReportStatus } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ============================================
// TYPES
// ============================================
type StatusFilter = "all" | "পেন্ডিং" | "অনুমোদিত";

// ============================================
// HELPERS
// ============================================
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

// Type Badge (status = হারানো / পাওয়া / ফেরত পাওয়া)
const TypeBadge = ({ status }: { status: LostReportStatus | null }) => {
    if (status === "হারানো")
        return (
        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            <i className="fa-solid fa-magnifying-glass text-[8px]"></i>হারানো
        </span>
        );
    if (status === "পাওয়া")
        return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            <i className="fa-solid fa-hand-holding text-[8px]"></i>পাওয়া
        </span>
        );
    if (status === "ফেরত পাওয়া")
        return (
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            <i className="fa-solid fa-check text-[8px]"></i>ফেরত পাওয়া
        </span>
        );
    return (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-[11px] font-semibold">
        {status || "—"}
        </span>
    );
};

// Status Badge (typePost = পেন্ডিং / অনুমোদিত)
const StatusBadge = ({ typePost }: { typePost: string | null }) => {
    if (typePost === "পেন্ডিং")
        return (
        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
            পেন্ডিং
        </span>
        );
    if (typePost === "অনুমোদিত")
        return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            অনুমোদিত
        </span>
        );
    return (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-[11px] font-semibold">
        {typePost || "—"}
        </span>
    );
};

// Category Badge
const CatBadge = ({ cat }: { cat: string | null }) => (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
        <i className="fa-solid fa-tag text-[8px] opacity-50"></i>
        {cat || "—"}
    </span>
);

const PAGE_SIZE = 10;

// ============================================
// MAIN COMPONENT
// ============================================
export default function LostA() {
    const [reports, setReports] = useState<LostReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

    // Delete confirm modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Approve confirm modal
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveId, setApproveId] = useState<number | null>(null);
    const [approveLoading, setApproveLoading] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ============================================
    // LOAD
    // ============================================
    const loadReports = useCallback(async () => {
        try {
        setLoading(true);
        const res = await lostReportApi.getAll();
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

    // ============================================
    // FILTER
    // ============================================
    const getFiltered = () => {
        let filtered =
        activeStatus === "all"
            ? reports
            : reports.filter((r) => (r as any).typePost === activeStatus);

        const term = search.trim().toLowerCase();
        if (term) {
        filtered = filtered.filter((p) => {
            const name = `${p.user?.first_name || ""} ${p.user?.last_name || ""}`.trim();
            return (
            `l${p.id}`.toLowerCase().includes(term) ||
            (p.status || "").toLowerCase().includes(term) ||
            (p.item_name || "").toLowerCase().includes(term) ||
            (p.category || "").toLowerCase().includes(term) ||
            name.toLowerCase().includes(term) ||
            (p.location || "").toLowerCase().includes(term)
            );
        });
        }

        if (dateFilter) {
        filtered = filtered.filter((p) => {
            if (!p.reported_at) return false;
            return (
            new Date(p.reported_at).toISOString().split("T")[0] === dateFilter
            );
        });
        }

        return filtered.sort((a, b) => b.id - a.id);
    };

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(1, totalPages || 1));
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

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
        await lostReportApi.delete(deleteId);
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
    // APPROVE
    // ============================================
    const openApproveModal = (id: number) => {
        setApproveId(id);
        setApproveModalOpen(true);
    };

    const closeApproveModal = () => {
        setApproveId(null);
        setApproveModalOpen(false);
    };

    const confirmApprove = async () => {
        if (!approveId) return;
        setApproveLoading(true);
        try {
        await lostReportApi.update(approveId, { typePost: "অনুমোদিত" });
        setReports((prev) =>
            prev.map((r) =>
            r.id === approveId ? { ...r, typePost: "অনুমোদিত" } as any : r
            )
        );
        closeApproveModal();
        } catch (err) {
        console.error(err);
        alert("অনুমোদন করতে সমস্যা হয়েছে");
        } finally {
        setApproveLoading(false);
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
    // STATUS FILTER BUTTONS
    // ============================================
    const filterButtons: { key: StatusFilter; label: string }[] = [
        { key: "all", label: "সব" },
        { key: "পেন্ডিং", label: "পেন্ডিং" },
        { key: "অনুমোদিত", label: "অনুমোদিত" },
    ];

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="mt-2">
        {/* ===== SECTION HEADER ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-magnifying-glass-location text-purple-600"></i>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                হারানো–পাওয়া পরিচালনা
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                সকল হারানো ও পাওয়া জিনিসের রিপোর্ট পরিচালনা করুন
                </p>
            </div>
            </div>
            <span className="text-xs text-gray-400">
            {toBangla(filtered.length)} টি পোস্ট
            </span>
        </div>

        {/* ===== FILTER BAR ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Status Filters */}
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
                        ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white border-transparent shadow-md shadow-emerald-500/25"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                >
                    {btn.key === "all" && (
                    <i className="fa-solid fa-layer-group text-xs"></i>
                    )}
                    {btn.key === "পেন্ডিং" && (
                    <span
                        className={`w-2 h-2 rounded-full ${
                        activeStatus === "পেন্ডিং"
                            ? "bg-white"
                            : "bg-amber-400 animate-pulse"
                        }`}
                    ></span>
                    )}
                    {btn.key === "অনুমোদিত" && (
                    <span
                        className={`w-2 h-2 rounded-full ${
                        activeStatus === "অনুমোদিত"
                            ? "bg-white"
                            : "bg-emerald-400"
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
                    placeholder="ID, ধরন, জিনিস, পোস্টকারী, এলাকা..."
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
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                    {[
                        { icon: "fa-hashtag", label: "আইডি", center: false },
                        {
                        icon: "fa-arrow-right-arrow-left",
                        label: "ধরন",
                        center: true,
                        },
                        { icon: "fa-cube", label: "জিনিস", center: false },
                        { icon: "fa-tag", label: "ক্যাটাগরি", center: true },
                        { icon: "fa-user", label: "পোস্টকারী", center: false },
                        {
                        icon: "fa-location-dot",
                        label: "এলাকা",
                        center: false,
                        },
                        { icon: "fa-signal", label: "স্ট্যাটাস", center: true },
                        { icon: "fa-calendar", label: "তারিখ", center: false },
                    ].map((col) => (
                        <th
                        key={col.label}
                        className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${
                            col.center ? "text-center" : "text-left"
                        }`}
                        >
                        <div
                            className={`flex items-center gap-1.5 ${col.center ? "justify-center" : ""}`}
                        >
                            <i
                            className={`fa-solid ${col.icon} text-[10px] text-gray-400`}
                            ></i>
                            {col.label}
                        </div>
                        </th>
                    ))}
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        অ্যাকশন
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginated.map((post) => {
                    const name =
                        `${post.user?.first_name || ""} ${post.user?.last_name || ""}`.trim() ||
                        "—";
                    const date = post.reported_at
                        ? new Date(post.reported_at).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })
                        : "—";
                    const typePost = (post as any).typePost as string | null;
                    const isPending = typePost === "পেন্ডিং";

                    return (
                        <tr
                        key={post.id}
                        className="transition-all duration-200 hover:bg-purple-50/30"
                        >
                        {/* ID */}
                        <td className="px-5 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg text-xs font-bold text-purple-600">
                            L{post.id}
                            </span>
                        </td>

                        {/* Type (status) */}
                        <td className="px-5 py-3.5 text-center">
                            <TypeBadge status={post.status} />
                        </td>

                        {/* Item Name */}
                        <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-gray-800 truncate block max-w-[120px]">
                            {post.item_name || "—"}
                            </span>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5 text-center">
                            <CatBadge cat={post.category} />
                        </td>

                        {/* User */}
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-user text-gray-400 text-[10px]"></i>
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[90px]">
                                {name}
                            </span>
                            </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <i className="fa-solid fa-location-dot text-gray-300 text-[10px]"></i>
                            <span className="truncate max-w-[90px]">
                                {post.location || "—"}
                            </span>
                            </div>
                        </td>

                        {/* typePost Status */}
                        <td className="px-5 py-3.5 text-center">
                            <StatusBadge typePost={typePost} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-500">{date}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                            {/* View */}
                            <button
                                onClick={() =>
                                window.open(
                                    `/lostfoundDetails/${post.id}/`,
                                    "_blank"
                                )
                                }
                                className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 cursor-pointer transition-colors"
                                title="দেখুন"
                            >
                                <i className="fa-solid fa-eye text-xs"></i>
                            </button>

                            {/* Approve (only if pending) */}
                            {isPending && (
                                <button
                                onClick={() => openApproveModal(post.id)}
                                className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 cursor-pointer transition-colors"
                                title="অনুমোদন"
                                >
                                <i className="fa-solid fa-check text-xs"></i>
                                </button>
                            )}

                            {/* Delete */}
                            <button
                                onClick={() => openDeleteModal(post.id)}
                                className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer transition-colors"
                                title={isPending ? "বাতিল" : "মুছুন"}
                            >
                                <i
                                className={`fa-solid ${isPending ? "fa-xmark" : "fa-trash-can"} text-xs`}
                                ></i>
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
                <div className="w-16 h-16 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-magnifying-glass text-purple-300 text-3xl"></i>
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
                ? `${toBangla((currentPage - 1) * PAGE_SIZE + 1)}–${toBangla(
                    Math.min(currentPage * PAGE_SIZE, filtered.length)
                )} / ${toBangla(filtered.length)} টি`
                : "—"}
            </p>
            {renderPagination()}
        </div>
        <Portal>
        {/* ===== DELETE CONFIRM MODAL ===== */}
        {deleteModalOpen && (
            <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) closeDeleteModal();
            }}
            >
            <div
                className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl"
                style={{ animation: "modalPop 0.26s cubic-bezier(.34,1.56,.64,1)" }}
            >
                <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-trash-can text-red-500 text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                রিপোর্ট মুছে ফেলুন?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                এই রিপোর্ট স্থায়ীভাবে মুছে যাবে এবং ফিরিয়ে আনা যাবে না।
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
        )}
        </Portal>
        <Portal>
        {/* ===== APPROVE CONFIRM MODAL ===== */}
        {approveModalOpen && (
            <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) closeApproveModal();
            }}
            >
            <div
                className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl"
                style={{ animation: "modalPop 0.26s cubic-bezier(.34,1.56,.64,1)" }}
            >
                <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-check text-emerald-500 text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                রিপোর্ট অনুমোদন করুন?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                এই রিপোর্টটি অনুমোদিত হিসেবে চিহ্নিত করা হবে।
                </p>
                <div className="flex gap-3">
                <button
                    onClick={closeApproveModal}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                >
                    বাতিল
                </button>
                <button
                    onClick={confirmApprove}
                    disabled={approveLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                    {approveLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                    <>
                        <i className="fa-solid fa-check text-xs"></i>
                        অনুমোদন করুন
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
            @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
            }
            @keyframes modalPop {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
            }
        `}</style>
        </div>
    );
}