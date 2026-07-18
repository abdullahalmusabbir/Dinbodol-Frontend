"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { volunteerApi, profileApi, adminVolunteerApi } from "@/lib/api";
import { VolunteerProfile } from "@/types";
import api from "@/lib/api";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ===== HELPER =====
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const PAGE_SIZE = 10;

// ===== SKELETON =====
const SkeletonRow = () => (
    <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 rounded-lg skeleton-row" />
        ))}
    </div>
);

// ===== VOLUNTEER ROW =====
interface VolunteerRowProps {
    v: VolunteerProfile;
    onView: (id: number) => void;
    onDelete: (id: number) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

const VolunteerRow = ({ v, onView, onDelete, onApprove, onReject }: VolunteerRowProps) => {
    const fullName =
        `${v.user.first_name || ""} ${v.user.last_name || ""}`.trim() ||
        v.user.username;
    const initial = fullName.charAt(0).toUpperCase();
    const points = v.point || 0;
    const attendance = v.event_attendance || 0;
    const avatarClass = v.active
        ? "volunteer-avatar"
        : "volunteer-avatar-pending";

    return (
        <tr className="volunteer-row" id={`volunteerRow${v.id}`}>
        <td className="px-5 py-3.5">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg text-xs font-bold text-gray-500">
            V{v.id}
            </span>
        </td>
        <td className="px-5 py-3.5">
            <div className="flex items-center gap-3">
            <div
                className={`${avatarClass} w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
            >
                {v.avatar ? (
                <img
                    src={v.avatar}
                    alt={fullName}
                    className="w-full h-full object-cover rounded-full"
                />
                ) : (
                initial
                )}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                {fullName}
                </p>
            </div>
            </div>
        </td>
        <td className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <i className="fa-solid fa-location-dot text-gray-300 text-[10px]"></i>
            <span className="truncate max-w-[120px]">{v.address || "—"}</span>
            </div>
        </td>
        <td className="px-5 py-3.5">
            <span className="text-sm text-gray-600">{v.user.username}</span>
        </td>
        <td className="px-5 py-3.5 text-center">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg text-xs font-bold text-blue-700">
            {toBangla(attendance)}
            </span>
        </td>
        <td className="px-5 py-3.5 text-center">
            <div className="inline-flex items-center gap-1.5 star-badge px-2.5 py-1 rounded-full">
            <i className="fa-solid fa-star text-amber-500 text-[10px]"></i>
            <span className="text-xs font-bold text-amber-800">
                {toBangla(points)}
            </span>
            </div>
        </td>
        <td className="px-5 py-3.5 text-center">
            {v.active ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                সক্রিয়
            </span>
            ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                পেন্ডিং
            </span>
            )}
        </td>
        <td className="px-5 py-3.5">
            <div className="flex items-center justify-center gap-1.5">
            <button
                onClick={() => onView(v.id)}
                className="action-icon w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 cursor-pointer"
                title="বিবরণ"
            >
                <i className="fa-solid fa-eye text-xs"></i>
            </button>
            {!v.active ? (
                <>
                <button
                    onClick={() => onApprove(v.id)}
                    className="approve-btn w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 cursor-pointer"
                    title="অনুমোদন"
                >
                    <i className="fa-solid fa-check text-xs"></i>
                </button>
                <button
                    onClick={() => onReject(v.id)}
                    className="reject-btn w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer"
                    title="বাতিল"
                >
                    <i className="fa-solid fa-xmark text-xs"></i>
                </button>
                </>
            ) : (
                <button
                onClick={() => onDelete(v.id)}
                className="action-icon w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer"
                title="মুছুন"
                >
                <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
            )}
            </div>
        </td>
        </tr>
    );
};

// ===== DETAIL PANEL =====
interface DetailPanelProps {
    volunteer: VolunteerProfile | null;
    isOpen: boolean;
    onClose: () => void;
    onDeleteRequest: (id: number) => void;
    onApprove: (id: number) => void;  
    onReject: (id: number) => void; 
}

const DetailPanel = ({
    volunteer: v,
    isOpen,
    onClose,
    onDeleteRequest,
    onApprove,
    onReject,
}: DetailPanelProps) => {
    const pointBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && v && pointBarRef.current) {
        const pointPercent = Math.min(v.point || 0, 100);
        setTimeout(() => {
            if (pointBarRef.current)
            pointBarRef.current.style.width = pointPercent + "%";
        }, 100);
        } else if (!isOpen && pointBarRef.current) {
        pointBarRef.current.style.width = "0%";
        }
    }, [isOpen, v]);

    if (!v) return null;

    const fullName =
        `${v.user.first_name || ""} ${v.user.last_name || ""}`.trim() ||
        v.user.username;
    const initial = fullName.charAt(0).toUpperCase();
    const points = v.point || 0;
    const attendance = v.event_attendance || 0;
    const pointPercent = Math.min(points, 100);

    return (
        <Portal>
        {/* Overlay */}
        <div
            className={`fixed inset-0 bg-black/30 vol-detail-overlay z-[9998] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
        />

        {/* Panel */}
        <div
            className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl vol-detail-panel z-[9999] overflow-y-auto ${
            isOpen ? "open" : "closed"
            }`}
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-user-check text-emerald-600 text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                    স্বেচ্ছাসেবক বিবরণ
                </h3>
                </div>
                <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
            {/* Profile */}
            <div className="text-center py-6">
                {v.avatar ? (
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden shadow-lg mb-4">
                    <img
                    src={v.avatar}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    />
                </div>
                ) : (
                <div
                    className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 ${
                    v.active ? "volunteer-avatar" : "volunteer-avatar-pending"
                    }`}
                >
                    {initial}
                </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                {v.user.email || "ইমেইল প্রদান করা হয়নি"}
                </p>
                <div className="mt-3">
                {v.active ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-200">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    সক্রিয় স্বেচ্ছাসেবক
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-amber-200">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                    অনুমোদন অপেক্ষমান
                    </span>
                )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="vol-stat-card bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100/50 text-center">
                <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <i className="fa-solid fa-star text-amber-500"></i>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                    {toBangla(points)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">পয়েন্ট</p>
                </div>
                <div className="vol-stat-card bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 text-center">
                <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <i className="fa-solid fa-calendar-check text-blue-500"></i>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                    {toBangla(attendance)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">ইভেন্ট অংশগ্রহণ</p>
                </div>
            </div>

            {/* Point Progress */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">
                    পয়েন্ট অগ্রগতি
                </span>
                <span className="text-xs font-bold text-emerald-600">
                    {toBangla(pointPercent)}%
                </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    ref={pointBarRef}
                    className="point-progress-bar h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                    style={{ width: "0%" }}
                />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                সর্বোচ্চ ১০০ পয়েন্ট লক্ষ্য
                </p>
            </div>

            {/* Info List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {[
                {
                    icon: "fa-phone",
                    bg: "bg-blue-50",
                    color: "text-blue-500",
                    label: "ফোন নম্বর",
                    value: v.user.username || "—",
                },
                {
                    icon: "fa-location-dot",
                    bg: "bg-red-50",
                    color: "text-red-500",
                    label: "ঠিকানা",
                    value: v.address || "ঠিকানা প্রদান করা হয়নি",
                },
                {
                    icon: "fa-wrench",
                    bg: "bg-purple-50",
                    color: "text-purple-500",
                    label: "দক্ষতা",
                    value: v.skills || "কোনো দক্ষতা উল্লেখ করা হয়নি",
                },
                {
                    icon: "fa-clock",
                    bg: "bg-green-50",
                    color: "text-green-500",
                    label: "সময়সূচী",
                    value: v.availability || "উল্লেখ করা হয়নি",
                },
                {
                    icon: "fa-calendar-plus",
                    bg: "bg-indigo-50",
                    color: "text-indigo-500",
                    label: "যোগদানের তারিখ",
                    value: v.joined_at || "—",
                },
                ].map((item) => (
                <div
                    key={item.label}
                    className="vol-info-row flex items-center gap-4 px-5 py-4"
                >
                    <div
                    className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                    <i className={`fa-solid ${item.icon} ${item.color} text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                        {item.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                        {item.value}
                    </p>
                    </div>
                </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
                {!v.active ? (
                <>
                    <button
                        onClick={() => { onApprove(v.id); onClose(); }}
                        className="approve-btn w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                        <i className="fa-solid fa-check"></i> অনুমোদন করুন
                    </button>
                    <button
                        onClick={() => { onReject(v.id); onClose(); }}
                        className="reject-btn w-full py-3 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 cursor-pointer"
                        >
                        <i className="fa-solid fa-xmark"></i> বাতিল করুন
                    </button>
                </>
                ) : (
                <button
                    onClick={() => { onClose(); onDeleteRequest(v.id); }}
                    className="w-full py-3 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 cursor-pointer"
                >
                    <i className="fa-solid fa-trash-can"></i> স্বেচ্ছাসেবক সরান
                </button>
                )}
            </div>
            </div>
        </div>
        </Portal>
    );
};

// ===== DELETE MODAL =====
interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
    if (!isOpen) return null;
    return (
        <Portal>
        <div
        className="fixed inset-0 bg-black/40 vol-delete-modal flex items-center justify-center z-[10000] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        >
        <div className="vol-delete-card bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-user-xmark text-red-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
            স্বেচ্ছাসেবক সরান?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
            এই স্বেচ্ছাসেবক স্থায়ীভাবে মুছে যাবে এবং আর ফিরিয়ে আনা যাবে না।
            </p>
            <div className="flex gap-3">
            <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
            >
                বাতিল
            </button>
            <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
                <i className="fa-solid fa-trash text-xs"></i> মুছে ফেলুন
            </button>
            </div>
        </div>
        </div>
        </Portal>
    );
};

// ===== PAGINATION =====
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) => {
    if (totalPages <= 1) return null;

    let startPage = Math.max(currentPage - 1, 1);
    let endPage = Math.min(currentPage + 1, totalPages);
    if (currentPage === 1) endPage = Math.min(3, totalPages);
    if (currentPage === totalPages) startPage = Math.max(totalPages - 2, 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
        <div className="flex items-center gap-1.5">
        {currentPage > 1 && (
            <button
            onClick={() => onPageChange(currentPage - 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer"
            >
            <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
        )}
        {pages.map((p) => (
            <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
                p === currentPage
                ? "active-page"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            >
            {toBangla(p)}
            </button>
        ))}
        {currentPage < totalPages && (
            <button
            onClick={() => onPageChange(currentPage + 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer"
            >
            <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
        )}
        </div>
    );
};

// ===== MAIN COMPONENT =====
export default function VolunteerA() {
    const [allVolunteers, setAllVolunteers] = useState<VolunteerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedVolunteer, setSelectedVolunteer] =
        useState<VolunteerProfile | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ===== LOAD =====
    useEffect(() => {
        loadVolunteers();
    }, []);

    const loadVolunteers = async () => {
        setIsLoading(true);
        try {
        const res = await volunteerApi.getAll();
        setAllVolunteers(res.data);
        } catch (err) {
        console.error(err);
        } finally {
        setIsLoading(false);
        }
    };

    // ===== KEYBOARD =====
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsDeleteModalOpen(false);
            setIsDetailOpen(false);
        }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ===== BODY OVERFLOW =====
    useEffect(() => {
        document.body.style.overflow =
        isDetailOpen || isDeleteModalOpen ? "hidden" : "";
        return () => {
        document.body.style.overflow = "";
        };
    }, [isDetailOpen, isDeleteModalOpen]);

    // ===== FILTER =====
    const filteredVolunteers = useCallback(() => {
        let result = [...allVolunteers];
        if (filterStatus !== "all") {
        result = result.filter((v) =>
            filterStatus === "active" ? v.active : !v.active
        );
        }
        if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
            (v) =>
            v.id.toString().includes(q) ||
            `${v.user.first_name} ${v.user.last_name}`.toLowerCase().includes(q) ||
            (v.address ?? "").toLowerCase().includes(q) ||
            (v.user.username ?? "").toLowerCase().includes(q)
        );
        }
        return result.sort((a, b) => b.id - a.id);
    }, [allVolunteers, filterStatus, searchQuery]);

    const volunteers = filteredVolunteers();
    const totalPages = Math.ceil(volunteers.length / PAGE_SIZE);
    const safePage = Math.min(currentPage, totalPages || 1);
    const start = (safePage - 1) * PAGE_SIZE;
    const paginated = volunteers.slice(start, start + PAGE_SIZE);

    // ===== HANDLERS =====
    const handleFilterChange = (status: "all" | "active" | "inactive") => {
        setFilterStatus(status);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
        }, 250);
    };

    const handleViewDetail = (id: number) => {
        const v = allVolunteers.find((vol) => vol.id === id);
        if (!v) return;
        setSelectedVolunteer(v);
        setIsDetailOpen(true);
    };

    const handleOpenDeleteModal = (id: number) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
        // volunteerApi তে delete নেই, তাই custom call করা যাবে
        // আপাতত local state থেকে সরিয়ে দিচ্ছি
        setAllVolunteers((prev) => prev.filter((v) => v.id !== deleteTargetId));
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
        } catch (err) {
        console.error(err);
        alert("স্বেচ্ছাসেবক মুছতে সমস্যা হয়েছে");
        }
    };

    const handleApprove = async (id: number) => {
        try {
        await adminVolunteerApi.approve(id);
        setAllVolunteers((prev) =>
            prev.map((v) => (v.id === id ? { ...v, active: true } : v))
        );
        } catch (err) {
        console.error(err);
        alert("অনুমোদনে সমস্যা হয়েছে");
        }
    };

    const handleReject = async (id: number) => {
        try {
        await adminVolunteerApi.reject(id);
        setAllVolunteers((prev) =>
            prev.map((v) => (v.id === id ? { ...v, active: false } : v))
        );
        } catch (err) {
        console.error(err);
        alert("বাতিলে সমস্যা হয়েছে");
        }
    };

    // ===== RENDER =====
    return (
        <>
        {/* Styles */}
        <style>{`
            .volunteer-row { transition: all 0.2s ease; }
            .volunteer-row:hover { background: #f0fdf4; }
            .star-badge { background: linear-gradient(135deg, #fef3c7, #fde68a); }
            .approve-btn { transition: all 0.3s ease; }
            .approve-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
            .reject-btn { transition: all 0.3s ease; }
            .reject-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(239,68,68,0.2); }
            .volunteer-avatar { background: linear-gradient(135deg, #34d399, #059669); }
            .volunteer-avatar-pending { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
            .vol-delete-modal { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
            .vol-delete-card { animation: volDeletePop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes volDeletePop { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
            .vol-detail-overlay { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
            .vol-detail-panel { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
            .vol-detail-panel.closed { transform: translateX(100%); }
            .vol-detail-panel.open { transform: translateX(0); }
            .vol-stat-card { transition: all 0.3s ease; }
            .vol-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
            .vol-info-row { transition: background 0.2s ease; }
            .vol-info-row:hover { background: #f9fafb; }
            .point-progress-bar { transition: width 1.2s cubic-bezier(0.25,0.46,0.45,0.94); }
            .skeleton-row { background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
            @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            .active-page { background: #059669; color: white; }
            .active-filter { background: #ecfdf5; color: #065f46; border-color: #6ee7b7 !important; }
            .admin-search { border: 1.5px solid #e5e7eb; outline: none; transition: border-color 0.2s; }
            .admin-search:focus { border-color: #6ee7b7; }
        `}</style>

        <div className="mt-2">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-people-group text-emerald-600"></i>
                </div>
                <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    স্বেচ্ছাসেবক পরিচালনা
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    সকল স্বেচ্ছাসেবকদের তালিকা এবং পরিচালনা
                </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                {isLoading
                    ? "লোড হচ্ছে..."
                    : `${toBangla(volunteers.length)} জন স্বেচ্ছাসেবক`}
                </span>
            </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Status Filters */}
                <div className="flex gap-2">
                {(
                    [
                        { status: "all", icon: "fa-layer-group", label: "সব", dot: undefined, pulse: false },
                        { status: "active", icon: undefined, label: "সক্রিয়", dot: "bg-emerald-400", pulse: false },
                        {
                            status: "inactive",
                            icon: undefined,
                            label: "পেন্ডিং",
                            dot: "bg-amber-400",
                            pulse: true,
                        },
                    ] as const
                ).map(({ status, icon, label, dot, pulse }) => (
                    <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`filter-pill flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 border-gray-200 transition-all ${
                        filterStatus === status
                        ? "active-filter font-semibold"
                        : "text-gray-600 bg-white"
                    }`}
                    >
                    {icon ? (
                        <i className={`fa-solid ${icon} text-xs`}></i>
                    ) : (
                        <span
                        className={`w-2 h-2 ${dot} rounded-full ${
                            pulse ? "animate-pulse" : ""
                        }`}
                        ></span>
                    )}
                    {label}
                    </button>
                ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                <input
                    type="text"
                    placeholder="নাম, এলাকা, ফোন দিয়ে খুঁজুন..."
                    onChange={handleSearchChange}
                    className="admin-search w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm"
                />
                </div>
            </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
                <SkeletonRow />
            ) : volunteers.length === 0 ? (
                <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <i className="fa-solid fa-users-slash text-gray-300 text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                    কোনো স্বেচ্ছাসেবক পাওয়া যায়নি
                </h3>
                <p className="text-gray-400 text-sm">
                    ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                        {[
                        { icon: "fa-hashtag", label: "আইডি" },
                        { icon: "fa-user", label: "নাম" },
                        { icon: "fa-location-dot", label: "এলাকা" },
                        { icon: "fa-phone", label: "ফোন" },
                        { icon: "fa-calendar-check", label: "সম্পন্ন", center: true },
                        { icon: "fa-star", label: "পয়েন্ট", center: true },
                        { icon: "fa-signal", label: "স্ট্যাটাস", center: true },
                        { label: "অ্যাকশন", center: true },
                        ].map(({ icon, label, center }) => (
                        <th
                            key={label}
                            className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${
                            center ? "text-center" : "text-left"
                            }`}
                        >
                            <div
                            className={`flex items-center gap-1.5 ${
                                center ? "justify-center" : ""
                            }`}
                            >
                            {icon && (
                                <i
                                className={`fa-solid ${icon} text-[10px] text-gray-400`}
                                ></i>
                            )}
                            {label}
                            </div>
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {paginated.map((v) => (
                        <VolunteerRow
                        key={v.id}
                        v={v}
                        onView={handleViewDetail}
                        onDelete={handleOpenDeleteModal}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        />
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>

            {/* Pagination */}
            {!isLoading && volunteers.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                {toBangla(start + 1)}–
                {toBangla(Math.min(start + PAGE_SIZE, volunteers.length))} /{" "}
                {toBangla(volunteers.length)} জন
                </p>
                <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                />
            </div>
            )}
        </div>

        {/* Detail Panel */}
        <DetailPanel
            volunteer={selectedVolunteer}
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            onDeleteRequest={handleOpenDeleteModal}
            onApprove={handleApprove}
            onReject={handleReject}
        />

        {/* Delete Modal */}
        <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
            }}
            onConfirm={handleConfirmDelete}
        />
        </>
    );
}