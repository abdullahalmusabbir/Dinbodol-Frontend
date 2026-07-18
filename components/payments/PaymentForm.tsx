"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { paymentApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PaymentMethod } from "@/types";

// ── Helpers ──
const BANGLA_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
function toBangla(num: number | string) {
  return String(num).replace(/[0-9]/g, (d) => BANGLA_DIGITS[parseInt(d)]);
}
function formatBangla(num: number | string) {
  return "৳ " + toBangla(Number(num).toLocaleString("en-IN"));
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 5000];
const PRESET_LABELS  = ["১০০","২৫০","৫০০","১,০০০","৫,০০০"];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; disabled?: boolean }[] = [
    { key: "bkash",  label: "বিকাশ" },
    { key: "nogod",  label: "নগদ",   disabled: true },
    { key: "rocket", label: "রকেট",  disabled: true },
];

const METHOD_LABELS: Record<string, string> = {
    bkash: "বিকাশ", nogod: "নগদ", rocket: "রকেট",
};

const IMPACTS = [
    { bg:"bg-emerald-50/50", ibg:"bg-emerald-100", ic:"text-emerald-600", icon:"fa-utensils",
        title:"১০০ টাকায়", desc:"একজন শিশুকে একদিনের খাবার দেওয়া যায়" },
    { bg:"bg-blue-50/50",    ibg:"bg-blue-100",    ic:"text-blue-600",    icon:"fa-book-open",
        title:"৫০০ টাকায়", desc:"একজন শিক্ষার্থীর এক মাসের শিক্ষা উপকরণ" },
    { bg:"bg-purple-50/50",  ibg:"bg-purple-100",  ic:"text-purple-600",  icon:"fa-house-medical",
        title:"১,০০০ টাকায়", desc:"একটি পরিবারের জরুরি চিকিৎসা সহায়তা" },
    { bg:"bg-amber-50/50",   ibg:"bg-amber-100",   ic:"text-amber-600",   icon:"fa-hand-holding-heart",
        title:"৫,০০০ টাকায়", desc:"একটি কমিউনিটি প্রকল্পে সরাসরি সহায়তা" },
];

const FAQS = [
    { q:"ডোনেশন কোথায় ব্যবহৃত হয়?",
        a:"আপনার ডোনেশন সরাসরি কমিউনিটি উন্নয়ন, শিক্ষা সহায়তা এবং জরুরি ত্রাণ কার্যক্রমে ব্যবহৃত হয়।" },
    { q:"রিফান্ড পলিসি কী?",
        a:"পেমেন্ট সংক্রান্ত যেকোনো সমস্যায় ৭ দিনের মধ্যে পূর্ণ রিফান্ড পাবেন।" },
    { q:"রসিদ পাওয়া যাবে?",
        a:"হ্যাঁ, প্রতিটি ডোনেশনের জন্য স্বয়ংক্রিয়ভাবে রসিদ প্রদান করা হয়।" },
];

export default function PaymentForm() {
    const { user } = useAuth();
    const router = useRouter();
    const sectionRef = useRef<HTMLDivElement>(null);

    const [amount, setAmount]               = useState<string>("");
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [method, setMethod]               = useState<PaymentMethod>("bkash");
    const [name, setName]                   = useState("");
    const [phone, setPhone]                 = useState("");
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState("");
    const [success, setSuccess]             = useState("");
    const [amountError, setAmountError]     = useState(false);

    // Pre-fill from user
    useEffect(() => {
        if (user) {
        setName(user.username);
        setPhone(user.username);
        }
    }, [user]);

    // Reveal on scroll
    useEffect(() => {
        const els = sectionRef.current?.querySelectorAll(".reveal");
        if (!els?.length) return;
        const obs = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add("active"); obs.unobserve(e.target); }
        }),
        { threshold: 0.1 }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    // Preset click
    const handlePreset = (val: number, idx: number) => {
        setSelectedPreset(idx);
        setAmount(String(val));
        setAmountError(false);
    };

    // Custom amount
    const handleCustom = (v: string) => {
        setAmount(v);
        setAmountError(false);
        const matched = PRESET_AMOUNTS.findIndex((p) => String(p) === v);
        setSelectedPreset(matched >= 0 ? matched : null);
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!amount || Number(amount) <= 0) {
        setAmountError(true);
        return;
        }
        if (!name.trim() || !phone.trim()) {
        setError("নাম এবং মোবাইল নম্বর দিন।");
        return;
        }

        setLoading(true);
        try {
        await paymentApi.create({
            name,
            phone,
            amount: Number(amount),
            payment_method: method,
        });
        setSuccess("ডোনেশন সফলভাবে সম্পন্ন হয়েছে! ধন্যবাদ 🎉");
        setAmount("");
        setSelectedPreset(null);
        setTimeout(() => router.push("/dashboard"), 2000);
        } catch {
        setError("পেমেন্ট ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
        } finally {
        setLoading(false);
        }
    };

    const summaryAmount = amount ? formatBangla(amount) : "৳ ০";

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800;900&display=swap');
            * { font-family: 'Noto Sans Bengali', sans-serif; }

            .reveal { opacity:0; transform:translateY(30px); transition:all 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
            .reveal.active { opacity:1; transform:translateY(0); }
            .reveal-delay-1 { transition-delay:0.15s; }
            .reveal-delay-2 { transition-delay:0.3s; }

            .gradient-text {
            background:linear-gradient(135deg,#065f46,#10b981);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
            }

            .amount-card {
            transition:all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);
            cursor:pointer; position:relative; overflow:hidden;
            }
            .amount-card:hover { transform:translateY(-3px); }
            .amount-card.selected {
            border-color:#059669 !important;
            box-shadow:0 0 0 3px rgba(16,185,129,0.15);
            }
            .amount-card::after {
            content:''; position:absolute; inset:0; border-radius:inherit;
            opacity:0; background:linear-gradient(135deg,rgba(16,185,129,0.05),rgba(5,150,105,0.1));
            transition:opacity 0.3s ease;
            }
            .amount-card:hover::after, .amount-card.selected::after { opacity:1; }

            .check-dot {
            opacity:0; transform:scale(0);
            transition:all 0.3s ease;
            position:absolute; top:8px; right:8px;
            }
            .amount-card.selected .check-dot { opacity:1; transform:scale(1); }

            .payment-option {
            transition:all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);
            position:relative; cursor:pointer;
            }
            .payment-option:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.06); }
            .payment-option.selected-method {
            border-color:#059669 !important;
            box-shadow:0 0 0 3px rgba(16,185,129,0.12);
            background:#ecfdf5;
            }
            .method-check {
            opacity:0; transform:scale(0);
            transition:all 0.3s ease;
            position:absolute; top:10px; right:10px;
            }
            .payment-option.selected-method .method-check { opacity:1; transform:scale(1); }

            .form-input {
            transition:all 0.3s ease;
            border:2px solid #e5e7eb;
            }
            .form-input:focus {
            border-color:#10b981;
            box-shadow:0 0 0 4px rgba(16,185,129,0.1);
            outline:none;
            }

            .submit-btn {
            background:linear-gradient(135deg,#059669,#047857);
            transition:all 0.3s ease; position:relative; overflow:hidden;
            }
            .submit-btn::before {
            content:''; position:absolute; top:0; left:-100%;
            width:100%; height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
            transition:left 0.6s ease;
            }
            .submit-btn:hover::before { left:100%; }
            .submit-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(5,150,105,0.35); }

            .impact-card { transition:all 0.3s ease; }
            .impact-card:hover { transform:translateY(-4px); box-shadow:0 12px 30px rgba(0,0,0,0.06); }

            .sticky-sidebar { position:sticky; top:100px; }

            .secure-pulse { animation:securePulse 2s ease-in-out infinite; }
            @keyframes securePulse {
            0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,0.3); }
            50%      { box-shadow:0 0 0 8px rgba(16,185,129,0); }
            }

            .heart-beat { animation:heartBeat 1.5s ease-in-out infinite; }
            @keyframes heartBeat {
            0%,100% { transform:scale(1); }
            15%     { transform:scale(1.15); }
            30%     { transform:scale(1); }
            45%     { transform:scale(1.1); }
            }
        `}</style>

        <div ref={sectionRef} className="bg-gray-50 min-h-screen">

            {/* ── HERO ── */}
            <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 text-center">
                <div className="heart-beat inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/10">
                <i className="fa-solid fa-hand-holding-heart text-emerald-300 text-2xl" />
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                আপনার <span className="text-emerald-300">ডোনেশন</span> পরিবর্তন আনে
                </h1>
                <p className="text-emerald-100/70 text-lg max-w-2xl mx-auto leading-relaxed">
                আপনার অবদান দিয়ে আমরা সমস্যায় থাকা মানুষের পাশে দাঁড়াতে পারি
                </p>
            </div>

            {/* Wave */}
            <div className="absolute bottom-0 left-0 w-full">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M0 30L60 27C120 24 240 18 360 21C480 24 600 36 720 39C840 42 960 36 1080 30C1200 24 1320 18 1380 15L1440 12V60H0V30Z" fill="#f9fafb" />
                </svg>
            </div>
            </section>

            {/* ── MAIN ── */}
            <section className="max-w-6xl mx-auto px-4 md:px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── LEFT: FORM ── */}
                <div className="lg:col-span-2 space-y-6">

                {/* Amount Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden reveal">
                    <div className="px-6 md:px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-coins text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">পরিমাণ নির্বাচন করুন</h3>
                        <p className="text-xs text-gray-400">একটি পরিমাণ বেছে নিন অথবা নিজে লিখুন</p>
                    </div>
                    </div>

                    <div className="p-6 md:p-8">
                    {/* Preset amounts */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
                        {PRESET_AMOUNTS.map((val, idx) => (
                        <div
                            key={val}
                            onClick={() => handlePreset(val, idx)}
                            className={`amount-card border-2 rounded-xl p-3 text-center ${
                            selectedPreset === idx ? "selected border-gray-100" : "border-gray-100"
                            }`}
                        >
                            <p className="text-lg font-bold text-gray-800">{PRESET_LABELS[idx]}</p>
                            <p className="text-[10px] text-gray-400 font-medium">টাকা</p>
                            <div className="check-dot w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-white text-[8px]" />
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Custom amount */}
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400">
                        <i className="fa-solid fa-bangladeshi-taka-sign text-sm" />
                        </div>
                        <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleCustom(e.target.value)}
                        placeholder="অন্য পরিমাণ লিখুন"
                        min="1"
                        className={`form-input w-full pl-10 pr-20 py-4 rounded-xl bg-gray-50 text-lg font-bold ${
                            amountError ? "!border-red-400" : ""
                        }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        টাকা
                        </div>
                    </div>
                    {amountError && (
                        <p className="text-red-500 text-xs mt-2">পরিমাণ দিন</p>
                    )}
                    </div>
                </div>

                {/* Personal Info + Payment */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden reveal reveal-delay-1">
                    <form onSubmit={handleSubmit}>

                    {/* Personal Info Header */}
                    <div className="px-6 md:px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-user-pen text-blue-600" />
                        </div>
                        <div>
                        <h3 className="text-lg font-bold text-gray-900">ব্যক্তিগত তথ্য</h3>
                        <p className="text-xs text-gray-400">আপনার তথ্য সম্পূর্ণ নিরাপদ থাকবে</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                            <i className="fa-solid fa-user text-gray-400 text-xs" />
                            পূর্ণ নাম
                            {!user && <span className="text-red-400">*</span>}
                            </label>
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            readOnly={!!user}
                            required
                            placeholder="আপনার পূর্ণ নাম লিখুন"
                            className="form-input w-full px-4 py-3.5 rounded-xl bg-gray-50 text-[15px]"
                            />
                        </div>
                        {/* Phone */}
                        <div>
                            <label className="flex items-center gap-2 text-gray-700 mb-2 text-sm font-semibold">
                            <i className="fa-solid fa-phone text-gray-400 text-xs" />
                            মোবাইল নম্বর
                            {!user && <span className="text-red-400">*</span>}
                            </label>
                            <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            placeholder="০১XXXXXXXXX"
                            className="form-input w-full px-4 py-3.5 rounded-xl bg-gray-50 text-[15px]"
                            />
                        </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100" />

                    {/* Payment Method Header */}
                    <div className="px-6 md:px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-wallet text-purple-600" />
                        </div>
                        <div>
                        <h3 className="text-lg font-bold text-gray-900">পেমেন্ট মেথড</h3>
                        <p className="text-xs text-gray-400">আপনার পছন্দের মাধ্যম বেছে নিন</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* Mobile Banking */}
                        <div className="mb-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            মোবাইল ব্যাংকিং
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {PAYMENT_METHODS.map((pm) => (
                            <div
                                key={pm.key}
                                onClick={() => !pm.disabled && setMethod(pm.key)}
                                className={`payment-option border-2 border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col items-center gap-2 ${
                                method === pm.key ? "selected-method" : ""
                                } ${pm.disabled ? "opacity-40 pointer-events-none" : ""}`}
                            >
                                <div className="method-check w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-check text-white text-[8px]" />
                                </div>

                                {/* Icons */}
                                {pm.key === "bkash" && (
                                <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center">
                                    <img
                                    src="https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg"
                                    alt="bKash"
                                    className="h-10"
                                    />
                                </div>
                                )}
                                {pm.key === "nogod" && (
                                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <i className="fa-solid fa-mobile-screen text-orange-500 text-2xl" />
                                </div>
                                )}
                                {pm.key === "rocket" && (
                                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
                                    <i className="fa-solid fa-rocket text-purple-500 text-2xl" />
                                </div>
                                )}

                                <span className="font-semibold text-gray-800 text-sm">{pm.label}</span>
                                {pm.disabled && (
                                <span className="text-[10px] text-gray-400">শীঘ্রই আসছে</span>
                                )}
                            </div>
                            ))}
                        </div>
                        </div>

                        {/* Security info */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 mb-6">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fa-solid fa-lock text-emerald-600 text-sm" />
                        </div>
                        <div>
                            <p className="text-emerald-800 text-sm font-semibold">নিরাপদ পেমেন্ট</p>
                            <p className="text-emerald-600 text-xs mt-0.5">
                            আপনার সমস্ত তথ্য SSL এনক্রিপশন দ্বারা সুরক্ষিত
                            </p>
                        </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500">ডোনেশন পরিমাণ</span>
                            <span className="text-lg font-bold text-gray-900">{summaryAmount}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500">পেমেন্ট মাধ্যম</span>
                            <span className="text-sm font-semibold text-gray-700">
                            {METHOD_LABELS[method]}
                            </span>
                        </div>
                        <div className="h-px bg-gray-200 my-3" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-800">মোট</span>
                            <span className="text-xl font-extrabold text-emerald-700">{summaryAmount}</span>
                        </div>
                        </div>

                        {/* Error / Success */}
                        {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                            {error}
                        </div>
                        )}
                        {success && (
                        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm text-center font-semibold">
                            {success}
                        </div>
                        )}

                        {/* Submit */}
                        <button
                        type="submit"
                        disabled={loading}
                        className="submit-btn w-full py-4 rounded-xl font-bold text-white text-[16px] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                        {loading ? (
                            <>
                            <i className="fa-solid fa-spinner fa-spin" />
                            প্রক্রিয়া চলছে...
                            </>
                        ) : (
                            <>
                            <i className="fa-solid fa-lock text-sm" />
                            নিরাপদভাবে ডোনেশন করুন
                            <i className="fa-solid fa-arrow-right text-sm" />
                            </>
                        )}
                        </button>
                    </div>
                    </form>
                </div>
                </div>

                {/* ── RIGHT: SIDEBAR ── */}
                <div className="lg:col-span-1">
                <div className="sticky-sidebar space-y-6">

                    {/* Impact Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden reveal reveal-delay-1">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-heart-pulse text-amber-600 text-sm" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-[15px]">আপনার প্রভাব</h4>
                    </div>
                    <div className="p-6 space-y-4">
                        {IMPACTS.map((imp, i) => (
                        <div key={i} className={`impact-card flex items-start gap-3.5 p-3.5 ${imp.bg} rounded-xl`}>
                            <div className={`w-10 h-10 ${imp.ibg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <i className={`fa-solid ${imp.icon} ${imp.ic} text-sm`} />
                            </div>
                            <div>
                            <p className="text-sm font-bold text-gray-800">{imp.title}</p>
                            <p className="text-xs text-gray-500">{imp.desc}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* Trust & Security */}
                    <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white relative overflow-hidden reveal reveal-delay-2">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-700/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 secure-pulse">
                        <i className="fa-solid fa-shield-halved text-emerald-300" />
                        </div>
                        <h4 className="font-bold text-sm mb-4">নিরাপত্তা নিশ্চিত</h4>
                        <div className="space-y-3">
                        {[
                            "SSL সুরক্ষিত পেমেন্ট",
                            "তথ্য গোপনীয়তা নিশ্চিত",
                            "রিফান্ড গ্যারান্টি",
                            "ট্রানজেকশন রসিদ প্রদান",
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-emerald-100/80 text-sm">
                            <i className="fa-solid fa-check-circle text-emerald-400 text-xs" />
                            <span>{item}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>

                    {/* FAQ */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 reveal reveal-delay-2">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-circle-question text-indigo-600 text-sm" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-[15px]">সাধারণ জিজ্ঞাসা</h4>
                    </div>
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                        <div key={i}>
                            {i > 0 && <div className="h-px bg-gray-100 mb-4" />}
                            <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-emerald-700 transition-colors">
                                {faq.q}
                                <i className="fa-solid fa-chevron-down text-xs text-gray-400 transition-transform group-open:rotate-180" />
                            </summary>
                            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                            </details>
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 reveal reveal-delay-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-headset text-emerald-600 text-sm" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-[15px]">সাহায্য দরকার?</h4>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">
                        পেমেন্ট সংক্রান্ত যেকোনো সমস্যায় যোগাযোগ করুন
                    </p>
                    <a
                        href="tel:+8801100000000"
                        className="flex items-center gap-2 text-emerald-700 font-semibold text-sm hover:text-emerald-800 transition-colors"
                    >
                        <i className="fa-solid fa-phone text-xs" />
                        +৮৮০ ১১০০-০০০০০
                    </a>
                    </div>

                </div>
                </div>
            </div>
            </section>
        </div>
        </>
    );
}