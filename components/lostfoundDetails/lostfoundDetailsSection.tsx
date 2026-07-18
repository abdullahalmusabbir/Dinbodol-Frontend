"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { lostReportApi, reportApi  } from "@/lib/api";
import { LostReport } from "@/types";


interface Props {
    id: number;
}

export default function LostFoundDetailsSection({ id }: Props) {
    const [report, setReport] = useState<LostReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [copyMsg, setCopyMsg] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const revealRefs = useRef<HTMLDivElement[]>([]);
    const getMediaUrl = (path: string | null) => {
        if (!path) return "/images/icon.png";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
    };
    // ---- API Call ----
    useEffect(() => {
        const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await lostReportApi.getById(id);
            setReport(res.data);
        } catch {
            setError("রিপোর্ট লোড করতে সমস্যা হয়েছে।");
        } finally {
            setLoading(false);
        }
        };
        fetchReport();
    }, [id]);

    // ---- Reveal Animation ----
    useEffect(() => {
        const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("lfd-active");
            }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
        );
        revealRefs.current.forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [report]);

    // ---- Keyboard Escape for Lightbox ----
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setLightboxOpen(false);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // ---- Toast ----
    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // ---- PDF Download ----
    const downloadPDF = async () => {
        if (!report) return;
        try {
            const res = await reportApi.downloadPDF(report.id);
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `report_${report.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            showToast("PDF ডাউনলোড করতে সমস্যা হয়েছে।");
        }
    };

    // ---- Share Functions ----
    const shareToFacebook = () => {
        window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
        "_blank"
        );
    };

    const shareToTwitter = () => {
        window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            window.location.href
        )}&text=${encodeURIComponent(`${report?.item_name} — হারানো-পাওয়া`)}`,
        "_blank"
        );
    };

    const shareToWhatsApp = () => {
        window.open(
        `https://wa.me/?text=${encodeURIComponent(
            `${report?.item_name} — ${window.location.href}`
        )}`,
        "_blank"
        );
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
        setCopyMsg(true);
        setTimeout(() => setCopyMsg(false), 2500);
        });
    };

    // ---- Date Format ----
    const formatDate = (dateStr: string, style: "short" | "long" = "short") => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (style === "long") {
        return date.toLocaleDateString("bn-BD", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        }
        return date.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        });
    };

    // ---- Hero BG Class ----
    const heroBg =
        report?.typePost === "হারানো"
        ? "lfd-hero-lost"
        : report?.status === "ফেরত পাওয়া"
        ? "lfd-hero-returned"
        : "lfd-hero-found";

    // ---- Add to ref ----
    const addRef = (el: HTMLDivElement | null) => {
        if (el && !revealRefs.current.includes(el)) {
        revealRefs.current.push(el);
        }
    };

    // ---- Loading ----
    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
            <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm">লোড হচ্ছে...</p>
            </div>
        </div>
        );
    }

    // ---- Error ----
    if (error || !report) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
            <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl" />
            </div>
            <p className="text-gray-700 font-semibold">{error || "রিপোর্ট পাওয়া যায়নি।"}</p>
            <Link
                href="/lost-found"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium"
            >
                <i className="fa-solid fa-arrow-left text-xs" />
                ফিরে যান
            </Link>
            </div>
        </div>
        );
    }

    return (
        <>
        <style>{`
            .lfd-page { font-family: 'Noto Sans Bengali', 'Inter', sans-serif; background: #f8faf9; min-height: 100vh; }
            .lfd-hero { position: relative; overflow: hidden; }
            .lfd-hero::before { content: ''; position: absolute; top: -40%; right: -20%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); pointer-events: none; }
            .lfd-hero::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%); pointer-events: none; }
            .lfd-hero-lost { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); }
            .lfd-hero-found { background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); }
            .lfd-hero-returned { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%); }
            .lfd-reveal { opacity: 0; transform: translateY(25px); transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            .lfd-active { opacity: 1; transform: translateY(0); }
            .lfd-d1 { transition-delay: 0.1s; }
            .lfd-d2 { transition-delay: 0.2s; }
            .lfd-d3 { transition-delay: 0.3s; }
            .lfd-d4 { transition-delay: 0.4s; }
            .lfd-img-wrap { overflow: hidden; position: relative; }
            .lfd-img-wrap img { transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            .lfd-img-wrap:hover img { transform: scale(1.04); }
            .lfd-img-overlay { opacity: 0; transition: opacity 0.3s ease; }
            .lfd-img-wrap:hover .lfd-img-overlay { opacity: 1; }
            .lfd-info-row { transition: all 0.2s ease; }
            .lfd-info-row:hover { background: #f9fafb; }
            .lfd-card-hover { transition: all 0.3s ease; }
            .lfd-card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
            .lfd-contact-glow { animation: lfdGlow 3s ease-in-out infinite; }
            @keyframes lfdGlow { 0%, 100% { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.06); } 50% { box-shadow: 0 4px 25px rgba(16, 185, 129, 0.12); } }
            .lfd-share-btn { transition: all 0.3s ease; }
            .lfd-share-btn:hover { transform: scale(1.1) translateY(-2px); }
            .lfd-dl-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); transition: all 0.3s ease; position: relative; overflow: hidden; }
            .lfd-dl-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transition: left 0.5s ease; }
            .lfd-dl-btn:hover::before { left: 100%; }
            .lfd-dl-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3); }
            .lfd-lightbox-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
            .lfd-lightbox-img { animation: lfdLbZoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            @keyframes lfdLbZoom { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            .lfd-sticky { position: sticky; top: 96px; }
            .lfd-stat-float { animation: lfdStatFloat 3s ease-in-out infinite; }
            @keyframes lfdStatFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            .lfd-toast { animation: lfdToastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            @keyframes lfdToastIn { from { opacity: 0; transform: translateY(-15px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @media print { .no-print { display: none !important; } }
        `}</style>

        <div className="lfd-page">

            {/* ---- Toast ---- */}
            {toast && (
            <div className="fixed top-24 right-6 z-50">
                <div className="lfd-toast bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                <i className="fa-solid fa-check-circle text-emerald-500 text-xs" />
                {toast}
                </div>
            </div>
            )}

            {/* ===== HERO BANNER ===== */}
            <div className={`lfd-hero pt-24 pb-14 md:pt-28 md:pb-20 ${heroBg}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-white/60 text-xs mb-8 no-print">
                <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
                    <i className="fa-solid fa-house text-[10px]" />
                    <span>হোম</span>
                </Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-white/30" />
                <Link href="/lost-found" className="hover:text-white transition-colors">
                    হারানো-পাওয়া
                </Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-white/30" />
                <span className="text-white/80 truncate max-w-[200px]">{report.item_name}</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                {/* Left: Title */}
                <div className="flex-1 min-w-0">
                    {/* Status + Type Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                    {report.status === "হারানো" && (
                        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
                        হারানো
                        </span>
                    )}
                    {report.status === "পাওয়া" && (
                        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                        পাওয়া
                        </span>
                    )}
                    {report.status === "ফেরত পাওয়া" && (
                        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold">
                        <i className="fa-solid fa-check text-[10px]" />
                        ফেরত পাওয়া
                        </span>
                    )}
                    {report.category && (
                        <span className="inline-flex items-center gap-1 bg-white/10 text-white/80 px-3 py-1.5 rounded-full text-xs font-medium">
                        <i className="fa-solid fa-tag text-[9px]" />
                        {report.category}
                        </span>
                    )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
                    {report.item_name}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
                    <span className="flex items-center gap-1.5">
                        <i className="fa-solid fa-location-dot text-xs" />
                        {report.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <i className="fa-solid fa-calendar-days text-xs" />
                        {formatDate(report.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <i className="fa-solid fa-clock text-xs" />
                        {formatTime(report.reported_at)}
                    </span>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-3 no-print flex-shrink-0">
                    <Link
                    href="/lost-found"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors no-underline"
                    >
                    <i className="fa-solid fa-arrow-left text-xs" />
                    ফিরে যান
                    </Link>
                    <button
                    onClick={downloadPDF}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 rounded-xl text-sm font-bold hover:shadow-lg transition-all cursor-pointer"
                    >
                    <i className="fa-solid fa-file-pdf text-red-500 text-xs" />
                    PDF
                    </button>
                </div>
                </div>
            </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 pb-12">

            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {/* Item */}
                <div ref={addRef} className="lfd-reveal lfd-card-hover bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center lfd-stat-float">
                    <i className="fa-solid fa-cube text-purple-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">আইটেম</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{report.item_name}</p>
                </div>
                </div>

                {/* Location */}
                <div ref={addRef} className="lfd-reveal lfd-d1 lfd-card-hover bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center lfd-stat-float" style={{ animationDelay: "0.5s" }}>
                    <i className="fa-solid fa-location-dot text-blue-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">অবস্থান</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{report.location}</p>
                </div>
                </div>

                {/* Date */}
                <div ref={addRef} className="lfd-reveal lfd-d2 lfd-card-hover bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center lfd-stat-float" style={{ animationDelay: "1s" }}>
                    <i className="fa-solid fa-calendar-day text-amber-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">তারিখ</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(report.date)}</p>
                </div>
                </div>

                {/* Type */}
                <div ref={addRef} className="lfd-reveal lfd-d3 lfd-card-hover bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center lfd-stat-float ${
                    report.typePost === "হারানো" ? "bg-red-50" : "bg-emerald-50"
                    }`}
                    style={{ animationDelay: "1.5s" }}
                >
                    <i className={`fa-solid ${report.typePost === "হারানো" ? "fa-magnifying-glass text-red-500" : "fa-hand-holding text-emerald-500"}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">ধরন</p>
                    <p className="text-sm font-bold text-gray-900">{report.typePost}</p>
                </div>
                </div>
            </div>

            {/* 3-col Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ===== LEFT (2 cols) ===== */}
                <div className="lg:col-span-2 space-y-6">

                {/* Image Card */}
                {report.image && (
                    <div ref={addRef} className="lfd-reveal bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 md:px-8 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-image text-purple-600 text-sm" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">সংযুক্ত ছবি</h3>
                        </div>
                        <button
                        onClick={() => setLightboxOpen(true)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                        <i className="fa-solid fa-expand text-[10px]" />
                        বড় করুন
                        </button>
                    </div>
                    <div className="p-3">
                        <div
                        className="lfd-img-wrap rounded-xl cursor-pointer"
                        onClick={() => setLightboxOpen(true)}
                        >
                        <img
                            src={getMediaUrl(report.image)}
                            alt={report.item_name}
                            className="w-full h-72 md:h-96 object-cover rounded-xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/icon.png";
                            }}
                        />
                        <div className="lfd-img-overlay absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl flex items-end justify-center pb-6">
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-semibold text-gray-800 shadow-lg">
                            <i className="fa-solid fa-expand" />
                            বড় করে দেখুন
                            </span>
                        </div>
                        </div>
                    </div>
                    </div>
                )}

                {/* Description Card */}
                <div ref={addRef} className="lfd-reveal lfd-d1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 md:px-8 py-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-align-left text-emerald-600 text-sm" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">বিস্তারিত বিবরণ</h3>
                    </div>
                    <div className="px-6 md:px-8 py-6">
                    <p className="text-gray-600 text-[15px] leading-[1.85] whitespace-pre-line">
                        {report.description}
                    </p>
                    </div>
                </div>

                {/* Details Card */}
                <div ref={addRef} className="lfd-reveal lfd-d2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 md:px-8 py-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-list-check text-blue-600 text-sm" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">আইটেম তথ্য</h3>
                    </div>
                    <div className="divide-y divide-gray-50">

                    {/* Item Name */}
                    <div className="lfd-info-row flex items-center gap-4 px-6 md:px-8 py-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-cube text-purple-500 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">আইটেমের নাম</p>
                        <p className="text-sm font-semibold text-gray-800">{report.item_name}</p>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="lfd-info-row flex items-center gap-4 px-6 md:px-8 py-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-tag text-indigo-500 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">ক্যাটাগরি</p>
                        <p className="text-sm font-semibold text-gray-800">{report.category || "নির্দিষ্ট নয়"}</p>
                        </div>
                    </div>

                    {/* Type */}
                    <div className="lfd-info-row flex items-center gap-4 px-6 md:px-8 py-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${report.typePost === "হারানো" ? "bg-red-50" : "bg-emerald-50"}`}>
                        <i className={`fa-solid ${report.typePost === "হারানো" ? "fa-magnifying-glass text-red-500" : "fa-hand-holding text-emerald-500"} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">পোস্টের ধরন</p>
                        <p className="text-sm font-semibold text-gray-800">{report.typePost}</p>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="lfd-info-row flex items-center gap-4 px-6 md:px-8 py-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-calendar-days text-amber-500 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">তারিখ</p>
                        <p className="text-sm font-semibold text-gray-800">{formatDate(report.date, "long")}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="lfd-info-row flex items-center gap-4 px-6 md:px-8 py-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-location-dot text-blue-500 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">অবস্থান</p>
                        <p className="text-sm font-semibold text-gray-800">{report.location}</p>
                        </div>
                    </div>

                    {/* Reported At */}
                    <div className="lfd-info-row flex items-center gap-4 px-6 md:px-8 py-4">
                        <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-clock text-cyan-500 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">রিপোর্ট সময়</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {formatDate(report.reported_at)} — {formatTime(report.reported_at)}
                        </p>
                        </div>
                    </div>

                    </div>
                </div>
                </div>

                {/* ===== RIGHT Sidebar ===== */}
                <div className="lg:col-span-1">
                <div className="lfd-sticky space-y-5">

                    {/* Reporter Card */}
                    <div ref={addRef} className="lfd-reveal lfd-d1 lfd-contact-glow bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-user text-emerald-600 text-sm" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800">রিপোর্টকারী</h4>
                    </div>
                    <div className="p-6">
                        {/* User Info */}
                        <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
                            {(report.user?.first_name || report.user?.username || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-base">
                            {report.user?.first_name && report.user?.last_name
                                ? `${report.user.first_name} ${report.user.last_name}`
                                : report.user?.username}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <i className="fa-solid fa-circle-check text-emerald-500 text-[10px]" />
                            যাচাইকৃত ব্যবহারকারী
                            </p>
                        </div>
                        </div>

                        {/* Username/Phone */}
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 mb-4">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-phone text-emerald-600 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-400 font-medium">ফোন নম্বর</p>
                            <p className="text-sm font-semibold text-gray-800">{report.user?.username}</p>
                        </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2.5">
                        <a
                            href={`tel:${report.user?.username}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all no-underline"
                        >
                            <i className="fa-solid fa-phone text-xs" />
                            কল করুন
                        </a>
                        <a
                            href={`https://wa.me/${report.user?.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-sm hover:bg-green-100 transition-all no-underline"
                        >
                            <i className="fa-brands fa-whatsapp text-base" />
                            WhatsApp
                        </a>
                        </div>
                    </div>
                    </div>

                    {/* Share Card */}
                    <div ref={addRef} className="lfd-reveal lfd-d2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-share-nodes text-gray-500 text-sm" />
                        </div>
                        <div>
                        <h4 className="text-sm font-bold text-gray-800">শেয়ার করুন</h4>
                        <p className="text-[11px] text-gray-400">অন্যদের জানাতে শেয়ার করুন</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={shareToFacebook} className="lfd-share-btn w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100 cursor-pointer" title="Facebook">
                        <i className="fa-brands fa-facebook-f text-sm" />
                        </button>
                        <button onClick={shareToWhatsApp} className="lfd-share-btn w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600 hover:bg-green-100 cursor-pointer" title="WhatsApp">
                        <i className="fa-brands fa-whatsapp text-base" />
                        </button>
                        <button onClick={shareToTwitter} className="lfd-share-btn w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 hover:bg-sky-100 cursor-pointer" title="Twitter">
                        <i className="fa-brands fa-x-twitter text-sm" />
                        </button>
                        <button onClick={copyLink} className="lfd-share-btn w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer" title="Copy Link">
                        <i className={`fa-solid ${copyMsg ? "fa-check text-emerald-600" : "fa-link"} text-sm`} />
                        </button>
                    </div>
                    {copyMsg && (
                        <p className="text-xs text-emerald-600 font-medium mt-2.5">
                        <i className="fa-solid fa-check-circle text-[10px] mr-0.5" /> লিংক কপি হয়েছে!
                        </p>
                    )}
                    </div>

                    {/* Quick Summary Card */}
                    <div ref={addRef} className="lfd-reveal lfd-d3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-5">
                        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-circle-info text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-sm">সংক্ষিপ্ত তথ্য</h4>
                        </div>
                        <div className="space-y-3.5">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-cube text-emerald-400 text-xs" />
                            </div>
                            <span className="text-white/80 text-sm truncate">{report.item_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-location-dot text-blue-400 text-xs" />
                            </div>
                            <span className="text-white/80 text-sm truncate">{report.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-calendar-day text-amber-400 text-xs" />
                            </div>
                            <span className="text-white/80 text-sm">{formatDate(report.date)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className={`fa-solid ${report.typePost === "হারানো" ? "fa-magnifying-glass text-red-400" : "fa-hand-holding text-emerald-400"} text-xs`} />
                            </div>
                            <span className={`text-sm ${report.typePost === "হারানো" ? "text-red-300" : "text-emerald-300"}`}>
                            {report.typePost} আইটেম
                            </span>
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* Download Card */}
                    <div ref={addRef} className="lfd-reveal lfd-d4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 no-print">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-download text-blue-500 text-sm" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800">ডাউনলোড</h4>
                    </div>
                    <button
                        onClick={downloadPDF}
                        className="lfd-dl-btn w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm cursor-pointer"
                    >
                        <i className="fa-solid fa-file-pdf" />
                        PDF ডাউনলোড করুন
                    </button>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        রিপোর্টের সম্পূর্ণ তথ্য PDF আকারে সংরক্ষণ করুন
                    </p>
                    </div>

                </div>
                </div>

            </div>
            </div>

            {/* ===== LIGHTBOX ===== */}
            {report.image && lightboxOpen && (
                <div
                    className="fixed inset-0 bg-black/80 lfd-lightbox-bg flex items-center justify-center z-[9999] p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl transition-colors z-10 cursor-pointer"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                    <img
                        src={getMediaUrl(report.image)}  
                        alt={report.item_name}
                        className="lfd-lightbox-img max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </div>
        </>
    );
}