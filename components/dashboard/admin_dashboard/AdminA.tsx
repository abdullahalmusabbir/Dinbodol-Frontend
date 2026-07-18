"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { profileApi, authApi } from "@/lib/api";
import { AdminProfile } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ===== HELPERS =====
const toBangla = (num: number): string => {
    const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => digits[parseInt(d)]);
};

const PAGE_SIZE = 10;

const formatDate = (dateStr: string | null | undefined, long = false) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: long ? "long" : "short",
        day: "numeric",
    });
};

// ===== TYPES =====
interface SignUpForm {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password2: string;
    date_of_birth: string;
    avatar: File | null;
}

// ===== SKELETON =====
const SkeletonRows = () => (
    <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-row h-14 rounded-lg" />
        ))}
    </div>
);

// ===== ADMIN ROW =====
interface AdminRowProps {
    admin: AdminProfile;
    onView: (id: number) => void;
    onDelete: (id: number) => void;
}

const AdminRow = ({ admin, onView, onDelete }: AdminRowProps) => {
    const fullName =
        [admin.user?.first_name, admin.user?.last_name]
        .filter(Boolean)
        .join(" ") ||
        admin.user?.username ||
        "—";
    const initial = fullName.charAt(0).toUpperCase();
    const dob = formatDate(admin.date_of_birth);
    const joined = formatDate(admin.joined_at);

    return (
        <tr className="volunteer-row" id={`adminRow${admin.id}`}>
        <td className="px-5 py-3.5">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-lg text-xs font-bold text-indigo-600">
            A{admin.id}
            </span>
        </td>
        <td className="px-5 py-3.5">
            <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {admin.avatar ? (
                <img
                    src={admin.avatar}
                    alt={fullName}
                    className="w-full h-full rounded-full object-cover"
                />
                ) : (
                initial
                )}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                {fullName}
                </p>
                <p className="text-[11px] text-gray-400">
                {admin.user?.email || ""}
                </p>
            </div>
            </div>
        </td>
        <td className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <i className="fa-solid fa-phone text-gray-300 text-[10px]"></i>
            {admin.user?.username || "—"}
            </div>
        </td>
        <td className="px-5 py-3.5">
            <span className="text-sm text-gray-600">{dob}</span>
        </td>
        <td className="px-5 py-3.5">
            <span className="text-sm text-gray-600">{joined}</span>
        </td>
        <td className="px-5 py-3.5 text-center">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
            <i className="fa-solid fa-shield-halved text-[9px]"></i> অ্যাডমিন
            </span>
        </td>
        <td className="px-5 py-3.5">
            <div className="flex items-center justify-center gap-1.5">
            <button
                onClick={() => onView(admin.id)}
                className="action-icon w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 cursor-pointer"
                title="দেখুন"
            >
                <i className="fa-solid fa-eye text-xs"></i>
            </button>
            <button
                onClick={() => onDelete(admin.id)}
                className="action-icon w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer"
                title="মুছুন"
            >
                <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
            </div>
        </td>
        </tr>
    );
};

// ===== PAGINATION =====
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
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
            className="page-btn w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
            >
            <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
        )}
        {pages.map((p) => (
            <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`page-btn w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
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
            className="page-btn w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
            >
            <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
        )}
        </div>
    );
};

// ===== DETAIL PANEL =====
interface DetailPanelProps {
    admin: AdminProfile | null;
    isOpen: boolean;
    onClose: () => void;
    onDeleteRequest: (id: number) => void;
}

const DetailPanel = ({
    admin,
    isOpen,
    onClose,
    onDeleteRequest,
}: DetailPanelProps) => {
    if (!admin) return null;

    const fullName =
        [admin.user?.first_name, admin.user?.last_name]
        .filter(Boolean)
        .join(" ") ||
        admin.user?.username ||
        "—";
    const initial = fullName.charAt(0).toUpperCase();
    const email = admin.user?.email || "—";
    const phone = admin.user?.username || "—";
    const dob = formatDate(admin.date_of_birth, true);
    const joined = formatDate(admin.joined_at, true);

    const infoRows = [
        {
        icon: "fa-user",
        bg: "bg-blue-50",
        color: "text-blue-500",
        label: "পুরো নাম",
        value: fullName,
        },
        {
        icon: "fa-phone",
        bg: "bg-emerald-50",
        color: "text-emerald-500",
        label: "ফোন/ইউজারনেম",
        value: phone,
        },
        {
        icon: "fa-envelope",
        bg: "bg-purple-50",
        color: "text-purple-500",
        label: "ইমেইল",
        value: email,
        },
        {
        icon: "fa-cake-candles",
        bg: "bg-pink-50",
        color: "text-pink-500",
        label: "জন্ম তারিখ",
        value: dob,
        },
        {
        icon: "fa-calendar-plus",
        bg: "bg-amber-50",
        color: "text-amber-500",
        label: "যোগদানের তারিখ",
        value: joined,
        },
    ];

    return (
        <Portal>
        {/* Overlay */}
        <div
            className={`fixed inset-0 bg-black/30 adm-detail-overlay z-[9998] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
        />
        {/* Panel */}
        <div
            className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl adm-detail-panel z-[9999] overflow-y-auto ${
            isOpen ? "open" : "closed"
            }`}
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-user-shield text-indigo-600 text-sm"></i>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                    অ্যাডমিন প্রোফাইল
                    </h3>
                    <p className="text-xs text-gray-400">আইডি: A{admin.id}</p>
                </div>
                </div>
                <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
                >
                <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
            {/* Profile Header */}
            <div className="text-center py-4">
                <div className="mb-4">
                {admin.avatar ? (
                    <img
                    src={admin.avatar}
                    alt={fullName}
                    className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-emerald-100 shadow-lg"
                    />
                ) : (
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-500/25">
                    {initial}
                    </div>
                )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">
                {fullName}
                </h4>
                <p className="text-sm text-gray-400 mb-2">{email}</p>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-sm font-semibold">
                <i className="fa-solid fa-shield-halved text-[10px]"></i>{" "}
                অ্যাডমিন
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="adm-stat-card bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100/50 text-center">
                <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <i className="fa-solid fa-shield-halved text-indigo-500"></i>
                </div>
                <p className="text-lg font-bold text-gray-900">অ্যাডমিন</p>
                <p className="text-xs text-gray-500 mt-0.5">রোল</p>
                </div>
                <div className="adm-stat-card bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100/50 text-center">
                <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <i className="fa-solid fa-circle-check text-emerald-500"></i>
                </div>
                <p className="text-lg font-bold text-emerald-600">Active</p>
                <p className="text-xs text-gray-500 mt-0.5">স্ট্যাটাস</p>
                </div>
            </div>

            {/* Info List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {infoRows.map((row) => (
                <div
                    key={row.label}
                    className="adm-info-row flex items-center gap-4 px-5 py-4"
                >
                    <div
                    className={`w-9 h-9 ${row.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                    <i
                        className={`fa-solid ${row.icon} ${row.color} text-sm`}
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

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
                <button
                onClick={() => {
                    onClose();
                    setTimeout(() => onDeleteRequest(admin.id), 350);
                }}
                className="w-full py-3 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
                >
                <i className="fa-solid fa-trash-can"></i> অ্যাডমিন সরিয়ে দিন
                </button>
            </div>
            </div>
        </div>
        </Portal>
    );
};

// ===== SIGN-UP PANEL =====
interface SignUpPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (admin: AdminProfile) => void;
}

const SignUpPanel = ({ isOpen, onClose, onSuccess }: SignUpPanelProps) => {
    const [form, setForm] = useState<SignUpForm>({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        password2: "",
        date_of_birth: "",
        avatar: null,
    });
    const [msg, setMsg] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset when panel opens
    useEffect(() => {
        if (isOpen) {
        setForm({
            username: "",
            email: "",
            first_name: "",
            last_name: "",
            password: "",
            password2: "",
            date_of_birth: "",
            avatar: null,
        });
        setMsg(null);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        if (name === "avatar" && files) {
        setForm((prev) => ({ ...prev, avatar: files[0] }));
        } else {
        setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        if (form.password !== form.password2) {
        setMsg({
            text: "Password এবং Confirm Password মিলছে না।",
            type: "error",
        });
        return;
        }

        setIsSubmitting(true);
        try {
        // Register as admin using authApi
        const formData = new FormData();
        formData.append("username", form.username);
        formData.append("email", form.email);
        formData.append("first_name", form.first_name);
        formData.append("last_name", form.last_name);
        formData.append("password", form.password);
        formData.append("role", "admin");
        if (form.date_of_birth) formData.append("date_of_birth", form.date_of_birth);
        if (form.avatar) formData.append("avatar", form.avatar);

        const res = await profileApi.updateAdminProfile(formData);
        setMsg({ text: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", type: "success" });
        if (res.data) onSuccess(res.data);
        setTimeout(() => onClose(), 1200);
        } catch (err: any) {
        const errData = err?.response?.data;
        const errMsg = errData?.detail || JSON.stringify(errData) || "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।";
        setMsg({ text: errMsg, type: "error" });
        } finally {
        setIsSubmitting(false);
        }
    };

    const inputCls =
        "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 transition-colors";

    const fields = [
        {
        name: "username",
        type: "text",
        label: "ফোন নম্বর",
        icon: "fa-phone",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        placeholder: "ফোন নম্বর লিখুন",
        required: true,
        },
        {
        name: "email",
        type: "email",
        label: "ইমেইল",
        icon: "fa-envelope",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        placeholder: "ইমেইল লিখুন",
        required: true,
        },
        {
        name: "password",
        type: "password",
        label: "পাসওয়ার্ড",
        icon: "fa-lock",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        placeholder: "পাসওয়ার্ড দিন",
        required: true,
        },
        {
        name: "password2",
        type: "password",
        label: "কনফার্ম পাসওয়ার্ড",
        icon: "fa-lock",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        placeholder: "পাসওয়ার্ড আবার দিন",
        required: true,
        },
        {
        name: "date_of_birth",
        type: "date",
        label: "জন্ম তারিখ",
        icon: "fa-cake-candles",
        iconBg: "bg-pink-50",
        iconColor: "text-pink-500",
        placeholder: "",
        required: false,
        },
    ];

    return (
        <Portal>
        {/* Overlay */}
        <div
            className={`fixed inset-0 bg-black/30 adm-detail-overlay z-[9998] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
        />
        {/* Panel */}
        <div
            className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl adm-detail-panel z-[9999] overflow-y-auto ${
            isOpen ? "open" : "closed"
            }`}
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <i className="fa-solid fa-user-plus text-white text-sm"></i>
                </div>
                <div>
                <h3 className="text-lg font-bold text-gray-900">
                    নতুন অ্যাডমিন যোগ করুন
                </h3>
                <p className="text-xs text-gray-400">
                    নতুন অ্যাকাউন্ট তৈরি করুন
                </p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
            >
                <i className="fa-solid fa-xmark"></i>
            </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
            {/* Message */}
            {msg && (
                <div
                className={`adm-toast text-sm rounded-xl px-4 py-3 border ${
                    msg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
                >
                {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* First + Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["first_name", "last_name"].map((fname) => (
                    <div key={fname}>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-user text-blue-500 text-xs"></i>
                        </div>
                        {fname === "first_name" ? "প্রথম নাম" : "শেষ নাম"} *
                    </label>
                    <input
                        type="text"
                        name={fname}
                        required
                        placeholder={
                        fname === "first_name" ? "আপনার প্রথম নাম" : "আপনার শেষ নাম"
                        }
                        value={form[fname as keyof SignUpForm] as string}
                        onChange={handleChange}
                        className={inputCls}
                    />
                    </div>
                ))}
                </div>

                {/* Other fields */}
                {fields.map((f) => (
                <div key={f.name}>
                    <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <div
                        className={`w-7 h-7 ${f.iconBg} rounded-lg flex items-center justify-center`}
                    >
                        <i
                        className={`fa-solid ${f.icon} ${f.iconColor} text-xs`}
                        ></i>
                    </div>
                    {f.label}
                    </label>
                    <input
                    type={f.type}
                    name={f.name}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.name as keyof SignUpForm] as string}
                    onChange={handleChange}
                    className={inputCls}
                    />
                </div>
                ))}

                {/* Avatar */}
                <div>
                <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-image text-amber-500 text-xs"></i>
                    </div>
                    অবতার
                </label>
                <input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2 pb-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {isSubmitting ? (
                    <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                    ) : (
                    <i className="fa-solid fa-user-plus text-xs"></i>
                    )}
                    সাইন আপ
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                >
                    বাতিল
                </button>
                </div>
            </form>
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
        className="fixed inset-0 bg-black/40 delete-modal flex items-center justify-center z-[10000] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        >
        <div className="delete-modal-card bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-user-slash text-red-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
            অ্যাডমিন সরান?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
            এই অ্যাডমিন অ্যাকাউন্ট স্থায়ীভাবে মুছে যাবে।
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

// ===== MAIN COMPONENT =====
export default function AdminA() {
    const [allAdmins, setAllAdmins] = useState<AdminProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [isSignUpOpen, setIsSignUpOpen] = useState(false);

    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // ===== LOAD =====
    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setIsLoading(true);
        try {
        const res = await profileApi.getAdminProfile();
        const data = res.data;
        setAllAdmins(Array.isArray(data) ? data : [data]);
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
            setIsSignUpOpen(false);
        }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ===== BODY OVERFLOW =====
    useEffect(() => {
        const anyOpen = isDetailOpen || isDeleteModalOpen || isSignUpOpen;
        document.body.style.overflow = anyOpen ? "hidden" : "";
        return () => {
        document.body.style.overflow = "";
        };
    }, [isDetailOpen, isDeleteModalOpen, isSignUpOpen]);

    // ===== PAGINATION =====
    const sorted = [...allAdmins].sort((a, b) => b.id - a.id);
    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const safePage = Math.min(currentPage, totalPages || 1);
    const start = (safePage - 1) * PAGE_SIZE;
    const paginated = sorted.slice(start, start + PAGE_SIZE);

    // ===== HANDLERS =====
    const handleView = (id: number) => {
        const admin = allAdmins.find((a) => a.id === id);
        if (!admin) return;
        setSelectedAdmin(admin);
        setIsDetailOpen(true);
    };

    const handleOpenDelete = (id: number) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
        // profileApi তে delete নেই, local state থেকে সরিয়ে দিচ্ছি
        setAllAdmins((prev) => prev.filter((a) => a.id !== deleteTargetId));
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
        } catch (err) {
        console.error(err);
        alert("অ্যাডমিন মুছতে সমস্যা হয়েছে");
        }
    };

    const handleSignUpSuccess = (newAdmin: AdminProfile) => {
        setAllAdmins((prev) => [newAdmin, ...prev]);
    };

    // ===== RENDER =====
    const tableHeaders = [
        { icon: "fa-hashtag", label: "আইডি" },
        { icon: "fa-user-tie", label: "নাম" },
        { icon: "fa-phone", label: "ফোন" },
        { icon: "fa-cake-candles", label: "জন্মদিন" },
        { icon: "fa-calendar-plus", label: "যোগদান" },
        { icon: "fa-shield-halved", label: "রোল", center: true },
        { label: "অ্যাকশন", center: true },
    ];

    return (
        <>
        {/* Styles */}
        <style>{`
            .filter-pill { transition: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94); }
            .filter-pill:hover { transform: translateY(-1px); }
            .filter-pill.active-filter { background: linear-gradient(135deg,#059669,#047857) !important; color:white !important; border-color:transparent !important; box-shadow:0 4px 12px rgba(5,150,105,0.25); }
            .report-row { transition: all 0.2s ease; }
            .report-row:hover { background: #f8faf8; }
            .action-icon { transition: all 0.2s ease; }
            .action-icon:hover { transform: scale(1.15); }
            .delete-modal { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
            .delete-modal-card { animation: deleteModalPop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes deleteModalPop { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
            .skeleton-row { background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:skeletonShimmer 1.5s infinite; }
            @keyframes skeletonShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            .page-btn { transition: all 0.3s ease; }
            .page-btn:hover { transform: translateY(-1px); }
            .page-btn.active-page { background: linear-gradient(135deg,#059669,#047857); color:white; box-shadow:0 4px 12px rgba(5,150,105,0.2); }
            .volunteer-row { transition: all 0.2s ease; }
            .volunteer-row:hover { background: #f0fdf4; }
            .adm-detail-overlay { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: opacity 0.3s ease; }
            .adm-detail-panel { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
            .adm-detail-panel.closed { transform: translateX(100%); }
            .adm-detail-panel.open { transform: translateX(0); }
            .adm-info-row { transition: background 0.2s ease; }
            .adm-info-row:hover { background: #f9fafb; }
            .adm-stat-card { transition: all 0.3s ease; }
            .adm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
            .adm-toast { animation: admToastIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
            @keyframes admToastIn { from{opacity:0;transform:translateY(-10px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
            .empty-float { animation: emptyFloat 3s ease-in-out infinite; }
            @keyframes emptyFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        `}</style>

        <div className="mt-2">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-user-shield text-emerald-600"></i>
                </div>
                <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    অ্যাডমিন পরিচালনা
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    সিস্টেম অ্যাডমিনিস্ট্রেটরদের তালিকা
                </p>
                </div>
            </div>
            <button
                onClick={() => setIsSignUpOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
            >
                <i className="fa-solid fa-user-plus text-xs"></i>
                নতুন অ্যাডমিন যোগ করুন
            </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
                <SkeletonRows />
            ) : sorted.length === 0 ? (
                <div className="py-16 text-center">
                <div className="empty-float inline-block mb-4">
                    <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-user-shield text-emerald-300 text-3xl"></i>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                    কোনো অ্যাডমিন নেই
                </h3>
                <p className="text-gray-400 text-sm">
                    নতুন অ্যাডমিন যোগ করুন
                </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                        {tableHeaders.map(({ icon, label, center }) => (
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
                    {paginated.map((admin) => (
                        <AdminRow
                        key={admin.id}
                        admin={admin}
                        onView={handleView}
                        onDelete={handleOpenDelete}
                        />
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>

            {/* Pagination */}
            {!isLoading && sorted.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                {toBangla(start + 1)}–
                {toBangla(Math.min(start + PAGE_SIZE, sorted.length))} /{" "}
                {toBangla(sorted.length)} জন
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
            admin={selectedAdmin}
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            onDeleteRequest={handleOpenDelete}
        />

        {/* Sign-Up Panel */}
        <SignUpPanel
            isOpen={isSignUpOpen}
            onClose={() => setIsSignUpOpen(false)}
            onSuccess={handleSignUpSuccess}
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