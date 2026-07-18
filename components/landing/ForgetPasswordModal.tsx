"use client";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin?: () => void;
}

export default function ForgetPasswordModal({ isOpen, onClose, onSwitchToLogin }: Props) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

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

    // reset on open
    useEffect(() => {
        if (isOpen) {
        setEmail("");
        setError("");
        setSuccess(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
        await authApi.forgetPassword(email);
        setSuccess(true);
        } catch (err: any) {
        const data = err?.response?.data;
        setError(
            data?.error ||
            data?.message ||
            "কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।"
        );
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
            .forget-btn {
            background:linear-gradient(135deg,#059669,#047857);
            transition:all 0.3s ease; position:relative; overflow:hidden;
            }
            .forget-btn::before {
            content:''; position:absolute; top:0; left:-100%;
            width:100%; height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
            transition:left 0.5s ease;
            }
            .forget-btn:hover::before { left:100%; }
            .forget-btn:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(5,150,105,0.35); }
            .success-anim { animation:successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
            @keyframes successPop {
            from { opacity:0; transform:scale(0.8); }
            to   { opacity:1; transform:scale(1); }
            }
        `}</style>

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

            {/* Success State */}
            {success ? (
                <div className="text-center py-4 success-anim">
                <div className="flex justify-center mb-5">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-paper-plane text-emerald-600 text-3xl" />
                    </div>
                </div>
                <h2 className="text-[22px] font-bold text-gray-900 mb-2">ইমেইল পাঠানো হয়েছে!</h2>
                <p className="text-gray-500 text-[14px] mb-2">
                    <span className="font-semibold text-emerald-700">{email}</span> এ নতুন পাসওয়ার্ড পাঠানো হয়েছে।
                </p>
                <p className="text-gray-400 text-[13px] mb-6">
                    ইমেইল না পেলে Spam/Junk ফোল্ডার চেক করুন।
                </p>

                <div className="flex flex-col gap-3">
                    <button
                    onClick={() => {
                        onClose();
                        onSwitchToLogin?.();
                    }}
                    className="forget-btn w-full py-3 text-white rounded-xl font-bold text-[15px]"
                    >
                    <i className="fa-solid fa-arrow-right-to-bracket mr-2" />
                    লগইন করুন
                    </button>
                    <button
                    onClick={() => setSuccess(false)}
                    className="w-full py-3 border-2 border-gray-200 rounded-xl text-[14px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                    আবার চেষ্টা করুন
                    </button>
                </div>
                </div>
            ) : (
                <>
                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-unlock-keyhole text-amber-500 text-2xl" />
                    </div>
                </div>

                <h2 className="text-center text-[24px] font-bold text-gray-900">পাসওয়ার্ড ভুলেছেন?</h2>
                <p className="text-center text-gray-500 text-[14px] mt-1 mb-6">
                    ইমেইল দিন, নতুন পাসওয়ার্ড পাঠানো হবে
                </p>

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] text-center">
                    <i className="fa-solid fa-circle-exclamation mr-2" />
                    {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Email */}
                    <div>
                    <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                        ইমেইল ঠিকানা
                    </label>
                    <div className="relative">
                        <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="আপনার ইমেইল লিখুন"
                        required
                        className="input-field w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 text-[15px]"
                        />
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1.5">
                        <i className="fa-solid fa-circle-info mr-1" />
                        রেজিস্ট্রেশনে ব্যবহৃত ইমেইল দিন
                    </p>
                    </div>

                    {/* Submit */}
                    <button
                    type="submit"
                    disabled={loading}
                    className="forget-btn w-full py-3.5 text-white rounded-xl font-bold text-[15px] mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin" />
                        পাঠানো হচ্ছে...
                        </span>
                    ) : (
                        <>
                        <i className="fa-solid fa-paper-plane mr-2" />
                        পাসওয়ার্ড রিসেট করুন
                        </>
                    )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="px-4 text-[13px] text-gray-400">অথবা</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Back to Login */}
                <button
                    onClick={() => {
                    onClose();
                    onSwitchToLogin?.();
                    }}
                    className="block text-center w-full py-3 border-2 border-gray-200 rounded-xl text-[14px] font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                    <i className="fa-solid fa-arrow-left mr-2 text-emerald-600" />
                    লগইনে ফিরে যান
                </button>
                </>
            )}
            </div>
        </div>
        </>
    );
}