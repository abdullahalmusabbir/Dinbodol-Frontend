"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin?: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: Props) {
    const { register } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"customer" | "volunteer">("customer");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("customer");
        setError("");
        setSuccess("");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
        setError("পাসওয়ার্ড দুটো মিলছে না।");
        return;
        }
        if (password.length < 6) {
        setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
        return;
        }

        setLoading(true);
        try {
        await register({ username, email, password, role });
        setSuccess("রেজিস্ট্রেশন সফল হয়েছে! ড্যাশবোর্ডে যাচ্ছেন...");
        setTimeout(() => onClose(), 1500);
        } catch (err: any) {
        const data = err?.response?.data;
        setError(
            data?.error ||
            data?.username?.[0] ||
            data?.email?.[0] ||
            data?.password?.[0] ||
            "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
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
            .reg-btn {
            background:linear-gradient(135deg,#059669,#047857);
            transition:all 0.3s ease; position:relative; overflow:hidden;
            }
            .reg-btn::before {
            content:''; position:absolute; top:0; left:-100%;
            width:100%; height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
            transition:left 0.5s ease;
            }
            .reg-btn:hover::before { left:100%; }
            .reg-btn:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(5,150,105,0.35); }
            .role-card {
            border:2px solid #e5e7eb; border-radius:12px; padding:0.75rem 1rem;
            cursor:pointer; transition:all 0.25s ease; display:flex; align-items:center; gap:0.75rem;
            }
            .role-card.active {
            border-color:#10b981; background:#ecfdf5;
            }
            .role-card:hover { border-color:#6ee7b7; }
        `}</style>

        <div
            className="modal-overlay fixed inset-0 bg-black/50 flex justify-center items-center z-[9999] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="modal-card w-full max-w-[440px] bg-white rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="p-8">
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
                    <i className="fa-solid fa-user-plus text-emerald-600 text-2xl" />
                </div>
                </div>

                <h2 className="text-center text-[24px] font-bold text-gray-900">নতুন অ্যাকাউন্ট</h2>
                <p className="text-center text-gray-500 text-[14px] mt-1 mb-6">
                DinBodol-এ যোগ দিন
                </p>

                {/* Error */}
                {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] text-center">
                    <i className="fa-solid fa-circle-exclamation mr-2" />
                    {error}
                </div>
                )}

                {/* Success */}
                {success && (
                <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[13px] text-center">
                    <i className="fa-solid fa-circle-check mr-2" />
                    {success}
                </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Username */}
                <div>
                    <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                    ইউজারনেম <span className="text-red-500">*</span>
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

                {/* Email */}
                <div>
                    <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                    ইমেইল <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ইমেইল লিখুন"
                        required
                        className="input-field w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 text-[15px]"
                    />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                    পাসওয়ার্ড <span className="text-red-500">*</span>
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

                {/* Confirm Password */}
                <div>
                    <label className="text-[13px] font-semibold text-gray-600 mb-1.5 block">
                    পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                    <i className="fa-solid fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="input-field w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 text-[15px]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                    </button>
                    </div>
                    {/* Password match indicator */}
                    {confirmPassword && (
                    <p className={`text-[12px] mt-1 ${password === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                        <i className={`fa-solid ${password === confirmPassword ? "fa-check" : "fa-xmark"} mr-1`} />
                        {password === confirmPassword ? "পাসওয়ার্ড মিলেছে" : "পাসওয়ার্ড মিলছে না"}
                    </p>
                    )}
                </div>

                {/* Role Selection */}
                <div>
                    <label className="text-[13px] font-semibold text-gray-600 mb-2 block">
                    আপনি কে? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                    <div
                        className={`role-card ${role === "customer" ? "active" : ""}`}
                        onClick={() => setRole("customer")}
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${role === "customer" ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <i className={`fa-solid fa-person text-sm ${role === "customer" ? "text-emerald-600" : "text-gray-500"}`} />
                        </div>
                        <div>
                        <p className="text-[13px] font-semibold text-gray-800">সাধারণ</p>
                        <p className="text-[11px] text-gray-400">Customer</p>
                        </div>
                    </div>
                    <div
                        className={`role-card ${role === "volunteer" ? "active" : ""}`}
                        onClick={() => setRole("volunteer")}
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${role === "volunteer" ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <i className={`fa-solid fa-hand-holding-heart text-sm ${role === "volunteer" ? "text-emerald-600" : "text-gray-500"}`} />
                        </div>
                        <div>
                        <p className="text-[13px] font-semibold text-gray-800">স্বেচ্ছাসেবক</p>
                        <p className="text-[11px] text-gray-400">Volunteer</p>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="reg-btn w-full py-3.5 text-white rounded-xl font-bold text-[15px] mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin" />
                        রেজিস্ট্রেশন হচ্ছে...
                    </span>
                    ) : (
                    <>
                        <i className="fa-solid fa-user-plus mr-2" />
                        অ্যাকাউন্ট তৈরি করুন
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

                {/* Switch to Login */}
                <button
                onClick={() => {
                    onClose();
                    onSwitchToLogin?.();
                }}
                className="block text-center w-full py-3 border-2 border-gray-200 rounded-xl text-[14px] font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                <i className="fa-solid fa-arrow-right-to-bracket mr-2 text-emerald-600" />
                ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
                </button>
            </div>
            </div>
        </div>
        </>
    );
}