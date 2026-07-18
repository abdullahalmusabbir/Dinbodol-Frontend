"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Data ──────────────────────────────────────────────
const TOC_ITEMS = [
    { id: "term-1", num: "১", label: "সম্মতি" },
    { id: "term-2", num: "২", label: "মেধাস্বত্ব" },
    { id: "term-3", num: "৩", label: "ব্যবহারের লাইসেন্স" },
    { id: "term-4", num: "৪", label: "অ্যাকাউন্ট নিরাপত্তা" },
    { id: "term-5", num: "৫", label: "অধিকার সংরক্ষণ" },
    { id: "term-6", num: "৬", label: "নিষিদ্ধ ব্যবহার" },
    { id: "term-7", num: "৭", label: "তৃতীয় পক্ষ" },
    { id: "term-8", num: "৮", label: "প্রযোজ্য আইন" },
    { id: "term-9", num: "৯", label: "পরিবর্তনের অধিকার" },
];

interface TermItem {
    id: string;
    num: string;
    numColor: string;
    bgColor: string;
    title: string;
    content: React.ReactNode;
}

const TERMS: TermItem[] = [
    {
        id: "term-1",
        num: "০১",
        numColor: "text-emerald-600",
        bgColor: "bg-emerald-50",
        title: "সম্মতি ও স্বীকৃতি",
        content: (
        <p className="text-sm text-gray-600 leading-relaxed">
            আপনি যদি এই শর্তাবলীর কোনোটির সাথে একমত না হন, তবে এই সাইট ব্যবহার বা
            অ্যাক্সেস করা আপনার জন্য নিষিদ্ধ। সাইটে প্রবেশ করার সাথে সাথে আপনি
            সকল শর্ত মেনে নিচ্ছেন বলে ধরা হবে।
        </p>
        ),
    },
    {
        id: "term-2",
        num: "০২",
        numColor: "text-blue-600",
        bgColor: "bg-blue-50",
        title: "মেধাস্বত্ব ও কপিরাইট",
        content: (
        <>
            <p className="text-sm text-gray-600 leading-relaxed">
            টেক্সট, গ্রাফিক্স, লোগো এবং সফটওয়্যারসহ এই সাইটের সমস্ত বিষয়বস্তু{" "}
            <span className="font-semibold text-gray-800">দিনবদলের এখনই সময়</span>
            -এর সম্পত্তি এবং এটি আন্তর্জাতিক কপিরাইট ও ট্রেডমার্ক আইন দ্বারা
            সুরক্ষিত।
            </p>
            <div className="mt-3 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
            <i className="fa-solid fa-copyright text-blue-500 text-xs" />
            <span className="text-xs text-blue-700 font-medium">
                সর্বস্বত্ব সংরক্ষিত © দিনবদল ২০২৫
            </span>
            </div>
        </>
        ),
    },
    {
        id: "term-3",
        num: "০৩",
        numColor: "text-purple-600",
        bgColor: "bg-purple-50",
        title: "ব্যবহারের লাইসেন্স",
        content: (
        <p className="text-sm text-gray-600 leading-relaxed">
            ব্যবহারকারীদের শুধুমাত্র ব্যক্তিগত এবং অ-ব্যবসায়িক উদ্দেশ্যে বিষয়বস্তু
            দেখার জন্য সীমিত এবং অ-একচেটিয়া লাইসেন্স প্রদান করা হলো। ব্যবসায়িক
            ব্যবহারের জন্য পূর্বানুমতি প্রয়োজন।
        </p>
        ),
    },
    {
        id: "term-4",
        num: "০৪",
        numColor: "text-amber-600",
        bgColor: "bg-amber-50",
        title: "অ্যাকাউন্ট নিরাপত্তা",
        content: (
        <>
            <p className="text-sm text-gray-600 leading-relaxed">
            ব্যবহারকারীরা তাদের অ্যাকাউন্টের তথ্যাদি (Credentials) এবং পাসওয়ার্ডের
            গোপনীয়তা বজায় রাখার জন্য সম্পূর্ণ দায়ী থাকবেন।
            </p>
            <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
            <i className="fa-solid fa-shield-halved text-amber-500 text-xs" />
            <span className="text-xs text-amber-700 font-medium">
                আপনার পাসওয়ার্ড কখনো কাউকে শেয়ার করবেন না
            </span>
            </div>
        </>
        ),
    },
    {
        id: "term-5",
        num: "০৫",
        numColor: "text-rose-600",
        bgColor: "bg-rose-50",
        title: "অধিকার সংরক্ষণ",
        content: (
        <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-800">দিনবদলের এখনই সময়</span>{" "}
            যেকোনো অ্যাকাউন্ট বন্ধ করা, কোনো বিষয়বস্তু অপসারণ বা সম্পাদনা করা,
            অথবা অর্ডার বাতিল করার অধিকার সংরক্ষণ করে। এই সিদ্ধান্ত চূড়ান্ত বলে
            গণ্য হবে।
        </p>
        ),
    },
    {
        id: "term-6",
        num: "০৬",
        numColor: "text-red-600",
        bgColor: "bg-red-50",
        title: "নিষিদ্ধ ব্যবহার",
        content: (
        <>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
            কোনো বেআইনি উদ্দেশ্যে বা অন্য কাউকে কোনো বেআইনি কাজ করতে প্ররোচিত
            করার জন্য এই ওয়েবসাইট ব্যবহার করা যাবে না।
            </p>
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-ban text-red-500 text-xs" />
                <span className="text-xs font-bold text-red-700">নিষিদ্ধ কার্যক্রম:</span>
            </div>
            <ul className="text-xs text-red-600 space-y-1 ml-5">
                {[
                "স্প্যাম বা অবাঞ্ছিত বার্তা পাঠানো",
                "মিথ্যা তথ্য প্রদান করা",
                "সিস্টেমে অননুমোদিত প্রবেশ",
                ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                    <i className="fa-solid fa-xmark text-[9px]" />
                    {item}
                </li>
                ))}
            </ul>
            </div>
        </>
        ),
    },
    {
        id: "term-7",
        num: "০৭",
        numColor: "text-cyan-600",
        bgColor: "bg-cyan-50",
        title: "তৃতীয় পক্ষের দায়মুক্তি",
        content: (
        <p className="text-sm text-gray-600 leading-relaxed">
            আমরা কোনো তৃতীয় পক্ষের ওয়েবসাইটের বিষয়বস্তু, গোপনীয়তা নীতি বা
            কার্যক্রমের জন্য কোনো দায়ভার গ্রহণ করি না। তৃতীয় পক্ষের লিংকে ক্লিক
            করা সম্পূর্ণ আপনার নিজ দায়িত্বে।
        </p>
        ),
    },
    {
        id: "term-8",
        num: "০৮",
        numColor: "text-indigo-600",
        bgColor: "bg-indigo-50",
        title: "প্রযোজ্য আইন",
        content: (
        <>
            <p className="text-sm text-gray-600 leading-relaxed">
            এই শর্তাবলী{" "}
            <span className="font-semibold text-gray-800">বাংলাদেশ</span>-এর আইন
            অনুযায়ী পরিচালিত এবং ব্যাখ্যা করা হবে। যেকোনো বিরোধ বাংলাদেশের
            আদালতের এখতিয়ারে নিষ্পত্তি হবে।
            </p>
            <div className="mt-3 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
            <i className="fa-solid fa-gavel text-indigo-500 text-xs" />
            <span className="text-xs text-indigo-700 font-medium">
                বাংলাদেশের আইন অনুসারে পরিচালিত
            </span>
            </div>
        </>
        ),
    },
    {
        id: "term-9",
        num: "০৯",
        numColor: "text-teal-600",
        bgColor: "bg-teal-50",
        title: "পরিবর্তনের অধিকার",
        content: (
        <p className="text-sm text-gray-600 leading-relaxed">
            আমরা যেকোনো সময় নোটিশ ছাড়াই এই ওয়েবসাইট (বা এর যেকোনো অংশ) পরিবর্তন
            বা বন্ধ করার অধিকার সংরক্ষণ করি। পরিবর্তনের পর ব্যবহার অব্যাহত রাখলে
            আপনি নতুন শর্তাবলী মেনে নিচ্ছেন বলে ধরা হবে।
        </p>
        ),
    },
];

// ── Component ─────────────────────────────────────────
export default function TermsSection() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Scroll progress
    useEffect(() => {
        const onScroll = () => {
        const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        const docHeight =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
        setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Intersection Observer – reveal
    useEffect(() => {
        const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
            if (entry.isIntersecting) {
                (entry.target as HTMLElement).style.opacity = "1";
                (entry.target as HTMLElement).style.transform = "translateY(0)";
            }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
        );
        revealRefs.current.forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Smooth scroll for TOC
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Reveal style helper
    const revealStyle: React.CSSProperties = {
        opacity: 0,
        transform: "translateY(20px)",
        transition: "all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
    };

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800;900&display=swap');
            .terms-page * { font-family:'Noto Sans Bengali',sans-serif; }

            .term-item {
            transition: all 0.3s ease;
            position: relative;
            }
            .term-item:hover {
            background: #f0fdf4 !important;
            border-color: #a7f3d0 !important;
            transform: translateX(4px);
            }
            .term-item::before {
            content:''; position:absolute;
            left:0; top:0; bottom:0; width:3px;
            background: linear-gradient(180deg,#059669,#10b981);
            border-radius:0 4px 4px 0;
            opacity:0; transition:opacity 0.3s ease;
            }
            .term-item:hover::before { opacity:1; }

            .term-num { transition:all 0.3s ease; }
            .term-item:hover .term-num {
            background:linear-gradient(135deg,#059669,#10b981) !important;
            color:white !important;
            transform:scale(1.1);
            }

            .toc-link { transition:all 0.2s ease; }
            .toc-link:hover {
            background:#ecfdf5;
            color:#065f46;
            padding-left:1rem;
            }

            .terms-sticky { position:sticky; top:96px; }

            .terms-card-hover { transition:all 0.3s ease; }
            .terms-card-hover:hover {
            transform:translateY(-2px);
            box-shadow:0 12px 30px rgba(0,0,0,0.06);
            }

            .scroll-progress {
            position:fixed; top:72px; left:0; height:3px; z-index:40;
            background:linear-gradient(90deg,#059669,#10b981,#34d399);
            transition:width 0.1s ease-out;
            border-radius:0 2px 2px 0;
            }

            @media print {
            .no-print { display:none !important; }
            }
        `}</style>

        <div className="terms-page bg-[#f8faf9] min-h-screen">
            {/* Scroll Progress */}
            <div
            className="scroll-progress"
            style={{ width: `${scrollProgress}%` }}
            />

            {/* ── HERO ── */}
            <div
            className="pt-24 pb-14 md:pt-28 md:pb-20 relative overflow-hidden"
            style={{
                background:
                "linear-gradient(135deg,#059669 0%,#047857 50%,#065f46 100%)",
            }}
            >
            {/* decorative blobs */}
            <div
                className="pointer-events-none absolute"
                style={{
                top: "-40%", right: "-20%",
                width: 500, height: 500,
                background:
                    "radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)",
                }}
            />
            <div
                className="pointer-events-none absolute"
                style={{
                bottom: "-30%", left: "-10%",
                width: 400, height: 400,
                background:
                    "radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)",
                }}
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-white/60 text-xs mb-8">
                <Link
                    href="/"
                    className="flex items-center gap-1 transition-colors hover:text-white"
                >
                    <i className="fa-solid fa-house text-[10px]" />
                    <span>হোম</span>
                </Link>
                <i className="fa-solid fa-chevron-right text-[8px] text-white/30" />
                <span className="text-white/80">শর্তাবলী</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                        <i className="fa-solid fa-scale-balanced text-white text-xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                        শর্তাবলী
                        </h1>
                        <p className="text-emerald-200 text-sm mt-0.5">
                        Terms & Conditions
                        </p>
                    </div>
                    </div>
                    <p className="text-emerald-100/80 text-sm max-w-lg leading-relaxed">
                    দিনবদল প্ল্যাটফর্ম ব্যবহার করার আগে অনুগ্রহ করে নিম্নলিখিত
                    শর্তাবলী মনোযোগ সহকারে পড়ুন।
                    </p>
                </div>

                {/* Meta badges */}
                <div className="flex items-center gap-3 flex-shrink-0 no-print">
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs">
                    <i className="fa-solid fa-calendar-day text-[10px] text-emerald-300" />
                    <span>আপডেট: জানুয়ারি ২০২৫</span>
                    </div>
                    <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 text-white text-xs hover:bg-white/20 transition-colors cursor-pointer"
                    >
                    <i className="fa-solid fa-print text-[10px]" />
                    <span>প্রিন্ট</span>
                    </button>
                </div>
                </div>
            </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 pb-16">

            {/* Intro Card */}
            <div
                ref={(el) => { revealRefs.current[0] = el; }}
                style={revealStyle}
                className="terms-card-hover bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6"
            >
                <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-circle-info text-emerald-600 text-lg" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                    গুরুত্বপূর্ণ তথ্য
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                    এই ওয়েবসাইটটি ব্যবহার করার মাধ্যমে, আপনি নিম্নলিখিত শর্তাবলী
                    এবং সমস্ত প্রযোজ্য আইন ও বিধিবিধান মেনে চলতে সম্মত হচ্ছেন।
                    আমরা সুপারিশ করি যে আপনি সময়ে সময়ে এই শর্তাবলী পর্যালোচনা
                    করুন।
                    </p>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* ── SIDEBAR ── */}
                <div className="lg:col-span-1 no-print">
                <div className="terms-sticky">
                    {/* TOC */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-list text-gray-500 text-xs" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-700">সূচিপত্র</h4>
                    </div>
                    <div className="p-3 space-y-0.5">
                        {TOC_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollTo(item.id)}
                            className="toc-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 w-full text-left"
                        >
                            <span className="w-5 h-5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 flex items-center justify-center flex-shrink-0">
                            {item.num}
                            </span>
                            <span className="truncate">{item.label}</span>
                        </button>
                        ))}
                    </div>
                    </div>

                    {/* Quick Contact */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 mt-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-question text-emerald-400 text-sm" />
                        </div>
                        <h4 className="font-bold text-sm mb-1">প্রশ্ন আছে?</h4>
                        <p className="text-gray-400 text-xs leading-relaxed mb-3">
                        শর্তাবলী নিয়ে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ
                        করুন।
                        </p>
                        <a
                        href="mailto:info@dinbodol.com"
                        className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors"
                        >
                        <i className="fa-solid fa-envelope text-[10px]" />
                        info@dinbodol.com
                        </a>
                    </div>
                    </div>
                </div>
                </div>

                {/* ── TERMS LIST ── */}
                <div className="lg:col-span-3 space-y-4">
                {TERMS.map((term, idx) => (
                    <div
                    key={term.id}
                    id={term.id}
                    ref={(el) => { revealRefs.current[idx + 1] = el; }}
                    style={revealStyle}
                    className="term-item bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 scroll-mt-24"
                    >
                    <div className="flex items-start gap-4">
                        <div
                        className={`term-num w-10 h-10 ${term.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ${term.numColor} font-bold text-sm`}
                        >
                        {term.num}
                        </div>
                        <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 mb-2">
                            {term.title}
                        </h3>
                        {term.content}
                        </div>
                    </div>
                    </div>
                ))}

                {/* ── ACCEPTANCE CARD ── */}
                <div
                    ref={(el) => { revealRefs.current[TERMS.length + 1] = el; }}
                    style={revealStyle}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 md:p-8 mt-6"
                >
                    <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-handshake text-emerald-600 text-lg" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">
                        আপনার সম্মতি
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        এই ওয়েবসাইট ব্যবহার করার মাধ্যমে আপনি উপরোক্ত সকল শর্তাবলী
                        পড়েছেন, বুঝেছেন এবং সম্মত হয়েছেন বলে গণ্য হবে।
                        </p>
                        <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                        style={{
                            background:
                            "linear-gradient(to right,#059669,#047857)",
                        }}
                        >
                        <i className="fa-solid fa-check text-xs" />
                        সম্মত আছি — হোম পেইজে যান
                        </Link>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        </>
    );
}