"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { paymentApi } from "@/lib/api";
import { Payment, PaymentStatus, PaymentMethod } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ===== HELPERS =====
const toBangla = (num: number): string => {
  const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const PAGE_SIZE = 10;

type FilterStatus = "all" | "pending" | "success" | "failed";

// ===== STATUS BADGE =====
const StatusBadge = ({ status }: { status: PaymentStatus }) => {
    const map: Record<
        string,
        { label: string; cls: string; dot: string }
    > = {
        success: {
        label: "সফল",
        cls: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-400",
        },
        pending: {
        label: "অনিষ্পন্ন",
        cls: "bg-yellow-50 text-yellow-700",
        dot: "bg-yellow-400",
        },
        failed: {
        label: "ব্যর্থ",
        cls: "bg-red-50 text-red-600",
        dot: "bg-red-400",
        },
    };

    const v = map[status] ?? {
        label: status || "-",
        cls: "bg-gray-100 text-gray-600",
        dot: "bg-gray-400",
    };

    return (
        <span
        className={`inline-flex items-center gap-1.5 ${v.cls} px-2.5 py-1 rounded-full text-[11px] font-semibold`}
        >
        <span className={`w-1.5 h-1.5 ${v.dot} rounded-full`}></span>
        {v.label}
        </span>
    );
};

// ===== SKELETON =====
const SkeletonRows = () => (
    <div className="p-4">
        {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-row h-12 rounded-lg mb-3" />
        ))}
    </div>
);

// ===== DONATION ROW =====
const DonationRow = ({ d }: { d: Payment }) => {
    const date = d.created_at
        ? new Date(d.created_at).toLocaleDateString("bn-BD", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "—";

    return (
        <tr className="border-b hover:bg-gray-50/50 transition-colors">
        <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
            D{d.id}
        </td>
        <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">
            {d.name || "—"}
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{d.phone || "—"}</td>
        <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
            ৳{d.amount || "—"}
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-medium">
            {d.payment_method || "—"}
            </span>
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">
            {d.transaction_id || "—"}
        </td>
        <td className="px-5 py-3.5">
            <StatusBadge status={d.status} />
        </td>
        <td className="px-5 py-3.5 text-xs text-gray-400">{date}</td>
        </tr>
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

    let startP = Math.max(currentPage - 1, 1);
    let endP = Math.min(currentPage + 1, totalPages);
    if (currentPage === 1) endP = Math.min(3, totalPages);
    if (currentPage === totalPages) startP = Math.max(totalPages - 2, 1);

    const pages: number[] = [];
    for (let i = startP; i <= endP; i++) pages.push(i);

    return (
        <div className="flex items-center gap-1.5">
        {currentPage > 1 && (
            <button
            onClick={() => onPageChange(currentPage - 1)}
            className="page-btn w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
            <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
        )}
        {pages.map((p) => (
            <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`page-btn w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
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
            className="page-btn w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
            <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
        )}
        </div>
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
      className="fixed inset-0 bg-black/40 delete-modal flex items-center justify-center z-[9999] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="delete-modal-card bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <i className="fa-solid fa-trash-can text-red-500 text-xl"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          ডোনেশন মুছুন?
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          এই ডোনেশনটি স্থায়ীভাবে মুছে যাবে।
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm"
          >
            মুছুন
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

// ===== MAIN COMPONENT =====
export default function DonationA() {
    const [allDonations, setAllDonations] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "">("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Delete modal
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ===== LOAD =====
    useEffect(() => {
        loadDonations();
    }, []);

    const loadDonations = async () => {
        setIsLoading(true);
        try {
        const res = await paymentApi.getAll();
        setAllDonations(res.data);
        } catch (err) {
        console.error(err);
        } finally {
        setIsLoading(false);
        }
    };

    // ===== KEYBOARD =====
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsDeleteModalOpen(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ===== BODY OVERFLOW =====
    useEffect(() => {
        document.body.style.overflow = isDeleteModalOpen ? "hidden" : "";
        return () => {
        document.body.style.overflow = "";
        };
    }, [isDeleteModalOpen]);

    // ===== FILTER =====
    const filteredDonations = useCallback(() => {
        let result = [...allDonations];

        // Status filter - map "completed" → "success" for compatibility
        if (filterStatus !== "all") {
        result = result.filter((d) => d.status === filterStatus);
        }

        // Method filter
        if (selectedMethod) {
        result = result.filter(
            (d) =>
            d.payment_method?.toLowerCase() === selectedMethod.toLowerCase()
        );
        }

        // Search filter
        if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
            (d) =>
            `D${d.id}`.toLowerCase().includes(q) ||
            (d.name || "").toLowerCase().includes(q) ||
            (d.phone || "").toLowerCase().includes(q)
        );
        }

        // Date filter
        if (selectedDate) {
        result = result.filter((d) =>
            d.created_at
            ? new Date(d.created_at).toISOString().split("T")[0] === selectedDate
            : false
        );
        }

        return result.sort((a, b) => b.id - a.id);
    }, [allDonations, filterStatus, selectedMethod, searchQuery, selectedDate]);

    const donations = filteredDonations();
    const totalPages = Math.ceil(donations.length / PAGE_SIZE);
    const safePage = Math.min(currentPage, totalPages || 1);
    const start = (safePage - 1) * PAGE_SIZE;
    const paginated = donations.slice(start, start + PAGE_SIZE);

    // ===== HANDLERS =====
    const handleFilterChange = (status: FilterStatus) => {
        setFilterStatus(status);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        const val = e.target.value;
        searchTimerRef.current = setTimeout(() => {
        setSearchQuery(val);
        setCurrentPage(1);
        }, 250);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
        setCurrentPage(1);
    };

    const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMethod(e.target.value as PaymentMethod | "");
        setCurrentPage(1);
    };

    const handleOpenDeleteModal = (id: number) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
        // API call - local state থেকে সরিয়ে দেওয়া হচ্ছে
        setAllDonations((prev) => prev.filter((d) => d.id !== deleteTargetId));
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
        } catch (err) {
        console.error(err);
        alert("ডোনেশন মুছতে সমস্যা হয়েছে");
        }
    };

    // ===== RENDER =====
    return (
        <>
        {/* Styles */}
        <style>{`
            .filter-pill { transition: all .3s cubic-bezier(.25,.46,.45,.94); position: relative; overflow: hidden; }
            .filter-pill:hover { transform: translateY(-1px); }
            .filter-pill.active-filter { background: linear-gradient(135deg,#059669,#047857) !important; color:#fff !important; border-color:transparent !important; box-shadow:0 4px 12px rgba(5,150,105,.25); }
            .admin-search { transition: all .3s ease; border:2px solid #e5e7eb; outline: none; }
            .admin-search:focus { border-color:#10b981; box-shadow:0 0 0 4px rgba(16,185,129,0.08); outline:none; }
            .skeleton-row { background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:skeletonShimmer 1.5s infinite; }
            @keyframes skeletonShimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
            .page-btn { transition: all .3s ease; }
            .page-btn:hover { transform: translateY(-1px); }
            .page-btn.active-page { background: linear-gradient(135deg,#059669,#047857); color:#fff; box-shadow:0 4px 12px rgba(5,150,105,.2); }
            .delete-modal { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
            .delete-modal-card { animation: deleteModalPop .26s cubic-bezier(.34,1.56,.64,1); }
            @keyframes deleteModalPop { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
            .table-head-icon { font-size:10px; margin-right:.5rem; color:#9ca3af; }
        `}</style>

        <div className="mt-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-hand-holding-dollar text-emerald-600"></i>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                ডোনেশন ব্যবস্থাপনা
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                ডোনেশন দেখুন, ফিল্টার করুন এবং পরিচালনা করুন
                </p>
            </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                {(
                    [
                    { status: "all", label: "সব" },
                    { status: "success", label: "সফল" },
                    { status: "pending", label: "অনিষ্পন্ন" },
                    { status: "failed", label: "ব্যর্থ" },
                    ] as { status: FilterStatus; label: string }[]
                ).map(({ status, label }) => (
                    <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`filter-pill px-4 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 ${
                        filterStatus === status
                        ? "active-filter"
                        : "bg-white text-gray-600"
                    }`}
                    >
                    {label}
                    </button>
                ))}
                </div>

                {/* Search + Date + Method */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                    <input
                    type="text"
                    placeholder="ID, নাম বা ফোন দিয়ে খুঁজুন"
                    onChange={handleSearchChange}
                    className="admin-search w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm"
                    />
                </div>

                {/* Date */}
                <div className="relative">
                    <i className="fa-solid fa-calendar-day absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                    <input
                    type="date"
                    onChange={handleDateChange}
                    className="admin-search w-full sm:w-auto pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm"
                    />
                </div>

                {/* Method */}
                <div>
                    <select
                    onChange={handleMethodChange}
                    className="admin-search pl-3 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm"
                    >
                    <option value="">সব পেমেন্ট</option>
                    <option value="bkash">Bkash</option>
                    <option value="nogod">Nogod</option>
                    <option value="rocket">Rocket</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="visa_card">Visa Card</option>
                    <option value="master_card">Master Card</option>
                    </select>
                </div>
                </div>
            </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
                <SkeletonRows />
            ) : donations.length === 0 ? (
                <div className="py-16 text-center">
                <div className="inline-block mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-hand-holding-heart text-gray-300 text-3xl"></i>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                    কোনো ডোনেশন পাওয়া যায়নি
                </h3>
                <p className="text-gray-400 text-sm">
                    ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
                </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-50/80 border-b">
                        {[
                        { icon: "fa-hashtag", label: "ID" },
                        { icon: "fa-user", label: "নাম" },
                        { icon: "fa-phone", label: "মোবাইল" },
                        { icon: "fa-coins", label: "পরিমাণ" },
                        { icon: "fa-credit-card", label: "পেমেন্ট" },
                        { icon: "fa-receipt", label: "Transaction ID" },
                        { icon: "fa-circle-notch", label: "স্ট্যাটাস" },
                        { icon: "fa-calendar-day", label: "তারিখ" },
                        ].map(({ icon, label }) => (
                        <th
                            key={label}
                            className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                        >
                            <i
                            className={`fa-solid ${icon} table-head-icon`}
                            ></i>
                            {label}
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {paginated.map((d) => (
                        <DonationRow key={d.id} d={d} />
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>

            {/* Pagination + Info */}
            {!isLoading && donations.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                {toBangla(start + 1)}–
                {toBangla(Math.min(start + PAGE_SIZE, donations.length))} /{" "}
                {toBangla(donations.length)} টি
                </p>
                <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                />
            </div>
            )}
        </div>

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