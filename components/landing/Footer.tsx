"use client";

import { useState } from "react";
import Link from "next/link";
import { subscribeApi } from "@/lib/api";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" | "" }>({
        text: "",
        type: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!email.trim()) {
        setMessage({ text: "ইমেইল দিন", type: "error" });
        return;
        }
        setLoading(true);
        try {
        await subscribeApi.subscribe(email);
        setMessage({ text: "✓ সফলভাবে সাবস্ক্রাইব করা হয়েছে!", type: "success" });
        setEmail("");
        } catch (err: unknown) {
        const anyErr = err as { response?: { data?: { message?: string } } };
        if (anyErr?.response?.data?.message?.includes("ইতিমধ্যে")) {
            setMessage({ text: "এই ইমেইল আগে থেকেই আছে", type: "warning" });
        } else {
            setMessage({ text: "কিছু সমস্যা হয়েছে, পরে চেষ্টা করুন", type: "error" });
        }
        } finally {
        setLoading(false);
        }
    };

    const msgColor =
        message.type === "success"
        ? "text-emerald-300"
        : message.type === "warning"
        ? "text-yellow-300"
        : "text-red-300";

    return (
        <>
        <style>{`
            .footer-gradient {
            background: linear-gradient(160deg, #064e3b 0%, #065f46 40%, #047857 100%);
            }
            .subscribe-btn {
            transition: all 0.3s ease; background: white;
            position: relative; overflow: hidden;
            }
            .subscribe-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
            .footer-link {
            transition: all 0.2s ease; position: relative; display: inline-block;
            }
            .footer-link::after {
            content: ''; position: absolute; bottom: -2px; left: 0;
            width: 0; height: 1.5px; background: #34d399; transition: width 0.3s ease;
            }
            .footer-link:hover::after { width: 100%; }
            .footer-link:hover { color: #34d399; }
            .social-icon {
            width: 42px; height: 42px;
            border: 1.5px solid rgba(255,255,255,0.25);
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; transition: all 0.3s ease;
            }
            .social-icon:hover {
            background: rgba(255,255,255,0.15);
            border-color: #34d399;
            transform: translateY(-3px); color: #34d399;
            }
        `}</style>

        <footer className="footer-gradient text-white pt-20 pb-8 px-6 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">

                {/* ── Newsletter ── */}
                <div className="md:col-span-5">
                <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-1.5 text-[13px] mb-5">
                    <i className="fa-solid fa-bell text-yellow-300" />
                    <span className="text-emerald-100">সর্বশেষ আপডেট পান</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                    আমাদের সাথে <br />
                    <span className="text-emerald-300">সংযুক্ত থাকুন</span>
                </h2>
                <p className="text-emerald-100/80 text-[15px] mb-8 leading-relaxed">
                    নতুন ফিচার, কমিউনিটি আপডেট এবং গুরুত্বপূর্ণ তথ্য সরাসরি আপনার ইনবক্সে পান
                </p>

                <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                    <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                        placeholder="আপনার ইমেইল লিখুন"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-800 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    </div>
                    <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="subscribe-btn text-emerald-800 px-6 py-3.5 rounded-xl font-bold text-[14px] whitespace-nowrap disabled:opacity-70"
                    >
                    {loading ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                        <>সাবস্ক্রাইব <i className="fa-solid fa-arrow-right ml-1.5" /></>
                    )}
                    </button>
                </div>

                {message.text && (
                    <p className={`mt-3 text-sm font-medium ${msgColor}`}>{message.text}</p>
                )}

                {/* Social Icons */}
                <div className="mt-10 flex space-x-3">
                    {[
                    { icon: "fa-facebook-f", label: "Facebook" },
                    { icon: "fa-x-twitter", label: "Twitter" },
                    { icon: "fa-instagram", label: "Instagram" },
                    { icon: "fa-youtube", label: "YouTube" },
                    ].map((s) => (
                    <a
                        key={s.label}
                        href="#"
                        className="social-icon text-white"
                        aria-label={s.label}
                    >
                        <i className={`fa-brands ${s.icon} text-sm`} />
                    </a>
                    ))}
                </div>
                </div>

                {/* ── Quick Links ── */}
                <div className="md:col-span-3 md:pl-8">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-emerald-300 mb-6">
                    দ্রুত লিঙ্ক
                </h3>
                <ul className="space-y-4">
                    {[
                    { href: "/reports", label: "সমস্যা রিপোর্ট" },
                    { href: "/safety", label: "নিরাপত্তা সহায়তা" },
                    { href: "/lost-found", label: "হারানো-পাওয়া" },
                    { href: "/volunteer", label: "স্বেচ্ছাসেবক দল" },
                    { href: "/events", label: "ইভেন্টস" },
                    ].map((link) => (
                    <li key={link.href}>
                        <Link
                        href={link.href}
                        className="footer-link text-emerald-100/80 text-[15px] flex items-center space-x-2"
                        >
                        <i className="fa-solid fa-chevron-right text-[9px] text-emerald-400" />
                        <span>{link.label}</span>
                        </Link>
                    </li>
                    ))}
                </ul>
                </div>

                {/* ── Contact ── */}
                <div className="md:col-span-4">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-emerald-300 mb-6">
                    যোগাযোগ
                </h3>
                <div className="space-y-5">
                    {[
                    { icon: "fa-phone", label: "ফোন", value: "+৮৮০ ১১০০-০০০০০" },
                    { icon: "fa-envelope", label: "ইমেইল", value: "info@dinbodol.com" },
                    { icon: "fa-location-dot", label: "ঠিকানা", value: "ধানমন্ডি, ঢাকা-১২০৫\nবাংলাদেশ" },
                    ].map((c) => (
                    <div key={c.label} className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`fa-solid ${c.icon} text-emerald-300 text-sm`} />
                        </div>
                        <div>
                        <p className="text-[13px] text-emerald-300 font-medium">{c.label}</p>
                        <p className="text-white text-[15px] whitespace-pre-line">{c.value}</p>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-emerald-100/60 text-[13px] space-y-4 md:space-y-0">
                <p>© ২০২৫ দিনবদল — সকল অধিকার সংরক্ষিত</p>
                <div className="flex items-center space-x-6">
                <Link href="/terms" className="footer-link text-emerald-100/60 hover:text-emerald-300">
                    শর্তাবলী
                </Link>
                <span className="text-white/20">|</span>
                <a
                    href="http://www.tazhubllc.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link text-emerald-100/60 hover:text-emerald-300 flex items-center space-x-1.5"
                >
                    <i className="fa-solid fa-code text-[10px]" />
                    <span>Built by TazHub LLC</span>
                </a>
                </div>
            </div>
            </div>
        </footer>
        </>
    );
}