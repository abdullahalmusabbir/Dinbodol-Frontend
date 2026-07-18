"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import RegisterModal from "./RegisterModal";
import ForgetPasswordModal from "./ForgetPasswordModal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialView?: "login" | "register" | "forgot";
    onViewChange?: (view: "login" | "register" | "forgot") => void;
}

export default function LoginModal({
    isOpen,
    onClose,
    initialView = "login",
    onViewChange,
}: Props) {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRegister, setShowRegister] = useState(initialView === "register");
    const [showForget, setShowForget] = useState(initialView === "forgot");

    // Sync view state whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setShowRegister(initialView === "register");
            setShowForget(initialView === "forgot");
        }
    }, [isOpen, initialView]);

    // ESC close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    // body scroll lock
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login({ username, password });
            onClose();
        } catch {
            setError("ইউজারনেম বা পাসওয়ার্ড ভুল।");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <style>{`
            .modal-overlay { backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
            .modal-card { animation:modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
            @keyframes modalPop {
            from { opacity:0; transform:scale(0.9) translateY(20px); }
            to   { opacity:1; transform:scale(1) translateY(0); }
            }
            .input-field { transition:all 0.3s ease; border:2px solid #e5e7eb; }
            .input-field:focus {
            border-color:#10b981;
            box-shadow:0 0 0 4px rgba(16,185,129,0.1);
            outline:none;
            }
            .login-btn {
            background:linear-gradient(135deg,#059669,#047857);
            transition:all 0.3s ease; position:relative; overflow:hidden;
            }
            .login-btn::before {
            content:''; position:absolute; top:0; left:-100%;
            width:100%; height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
            transition:left 0.5s ease;
            }
            .login-btn:hover::before { left:100%; }
            .login-btn:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(5,150,105,0.35); }
        `}</style>

        {/* Overlay */}
        <div
            className="modal-overlay fixed inset-0 bg-black/50 flex justify-center items-center z-[9999] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="modal-card w-full max-w-[400px] bg-white p-8 rounded-2xl shadow-2xl relative">

            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <i className="fa-solid fa-xmark text-lg" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-lock text-emerald-600 text-2xl" />
                </div>
            </div>

            <h2 className="text-center text-[24px] font-bold text-gray-900">আবার স্বাগতম</h2>
            <p className="text-center text-gray-500 text-[14px] mt-1 mb-6">
                আপনার অ্যাকাউন্টে লগইন করুন
            </p>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] text-center">
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Username */}
                <div>
                <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                    ইউজারনেম / ফোন নম্বর
                </label>
                <div className="relative">
                    <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ইউজারনেম লিখুন"
                    required
                    className="input-field w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 text-[15px]"
                    />
                </div>
                </div>

                {/* Password */}
                <div>
                <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                    পাসওয়ার্ড
                </label>
                <div className="relative">
                    <i className="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 text-[15px]"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                    </button>
                </div>
                </div>

                {/* Remember + Forget */}
                <div className="flex justify-between items-center text-[13px]">
                <label className="flex items-center text-gray-600 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    মনে রাখুন
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setShowForget(true);
                        setShowRegister(false);
                        onViewChange?.("forgot");
                    }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                    পাসওয়ার্ড ভুলে গেছেন?
                </button>
                </div>

                {/* Submit */}
                <button
                type="submit"
                disabled={loading}
                className="login-btn w-full py-3.5 text-white rounded-xl font-bold text-[15px] mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin" />
                    লগইন হচ্ছে...
                    </span>
                ) : (
                    "লগইন করুন"
                )}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-4 text-[13px] text-gray-400">অথবা</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Register */}
            <button
                onClick={() => {
                    setShowRegister(true);
                    setShowForget(false);
                    onViewChange?.("register");
                }}
                className="block text-center w-full py-3 border-2 border-gray-200 rounded-xl text-[14px] font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                <i className="fa-solid fa-user-plus mr-2 text-emerald-600" />
                নতুন অ্যাকাউন্ট তৈরি করুন
            </button>
            </div>
        </div>
        <RegisterModal
            isOpen={showRegister}
            onClose={() => {
                setShowRegister(false);
                onViewChange?.("login");
            }}
            onSwitchToLogin={() => {
                setShowRegister(false);
                onViewChange?.("login");
            }}
        />
        <ForgetPasswordModal
            isOpen={showForget}
            onClose={() => {
                setShowForget(false);
                onViewChange?.("login");
            }}
            onSwitchToLogin={() => {
                setShowForget(false);
                onViewChange?.("login");
            }}
        />
        </>
    );
}