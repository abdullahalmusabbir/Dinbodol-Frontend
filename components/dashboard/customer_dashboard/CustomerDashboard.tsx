"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { reportApi, securityReportApi, lostReportApi } from "@/lib/api";
import { Report, ReportStatus } from "@/types";
import ReportC from "./ReportC";
import SecurityC from "./SecurityC";
import LostC from "./LostC";
import ProfileC from "./ProfileC";

// ============================================
// TYPES
// ============================================
type TabId = "report" | "security" | "lost" | "profile";

interface Stats {
    total: number;
    resolved: number;
    inProgress: number;
    pending: number;
}

// ============================================
// STAT CARD
// ============================================
const StatCard = ({
    icon,
    iconBg,
    iconColor,
    badgeBg,
    badgeText,
    badgeIcon,
    badgeLabel,
    value,
    label,
    delay,
}: {
    icon: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    badgeIcon: string;
    badgeLabel: string;
    value: number;
    label: string;
    delay: string;
}) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (value === 0) return;
        let current = 0;
        const increment = Math.ceil(value / 40);
        const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            current = value;
            clearInterval(timer);
        }
        setCount(current);
        }, 30);
        return () => clearInterval(timer);
    }, [value]);

    return (
        <div
        className={`group relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 
            shadow-sm transition-all duration-350 hover:-translate-y-1 hover:shadow-xl ${delay}`}
        >
        <div
            className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.08] 
            transition-all duration-400 group-hover:w-28 group-hover:h-28 group-hover:opacity-[0.12]"
            style={{ background: iconColor.includes("blue") ? "#3b82f6" :
            iconColor.includes("emerald") ? "#10b981" :
            iconColor.includes("amber") ? "#f59e0b" : "#f43f5e" }}
        />
        <div className="flex items-center justify-between mb-4">
            <div
            className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center 
                transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
            >
            <span className={`text-lg ${iconColor}`}>{icon}</span>
            </div>
            <div
            className={`flex items-center gap-1 text-xs font-medium ${badgeText} ${badgeBg} px-2 py-1 rounded-full`}
            >
            <span className="text-[10px]">{badgeIcon}</span>
            {badgeLabel}
            </div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mb-1 font-mono">{count}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        </div>
    );
};

// ============================================
// QUICK ACTION
// ============================================
const QuickAction = ({
    href,
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    delay,
}: {
    href: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
    delay: string;
}) => (
    <Link href={href}>
        <div
        className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm 
            flex items-center gap-4 cursor-pointer transition-all duration-300 
            hover:-translate-y-1 hover:shadow-xl ${delay}`}
        >
        <div
            className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center 
            flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
        >
            <span className={`text-lg ${iconColor}`}>{icon}</span>
        </div>
        <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="text-gray-300 ml-auto text-sm">›</span>
        </div>
    </Link>
);

// ============================================
// BECOME VOLUNTEER MODAL
// ============================================
const BecomeVolunteerModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const router = useRouter();
    if (!open) return null;

    return (
        <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        >
        <div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤲</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">স্বেচ্ছাসেবক হতে চান?</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
                আমাদের স্বেচ্ছাসেবক দলে যোগ দিন এবং সমাজের উন্নয়নে অবদান রাখুন
            </p>
            </div>
            <div className="flex gap-3">
            <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold
                hover:bg-gray-50 transition-colors"
            >
                বাতিল
            </button>
            <button
                onClick={() => { onClose(); router.push("/volunteer"); }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 
                text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg 
                hover:shadow-emerald-500/30 transition-all"
            >
                রেজিস্ট্রেশন করুন
            </button>
            </div>
        </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function CustomerDashboard() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabId>("report");
    const [stats, setStats] = useState<Stats>({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [showVolModal, setShowVolModal] = useState(false);

    // Auth check
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "customer")) {
        router.replace("/");
        }
    }, [isLoading, isAuthenticated, user, router]);

    // Fetch stats
    useEffect(() => {
        const fetchStats = async () => {
        try {
            const res = await reportApi.getAll();
            const reports: Report[] = res.data;
            setStats({
            total: reports.length,
            resolved: reports.filter((r) => r.status === "solved").length,
            inProgress: reports.filter((r) => r.status === "in_progress" || r.status === "under_analysis").length,
            pending: reports.filter((r) => r.status === "pending").length,
            });
        } catch {
            // keep zeros
        } finally {
            setStatsLoading(false);
        }
        };
        if (isAuthenticated) fetchStats();
    }, [isAuthenticated]);

    const tabs: { id: TabId; icon: string; label: string; shortLabel: string }[] = [
        { id: "report", icon: "📄", label: "আমার রিপোর্ট", shortLabel: "রিপোর্ট" },
        { id: "security", icon: "🛡️", label: "নিরাপত্তা রিপোর্ট", shortLabel: "নিরাপত্তা" },
        { id: "lost", icon: "🔍", label: "হারানো-পাওয়া", shortLabel: "হারানো" },
        { id: "profile", icon: "⚙️", label: "প্রোফাইল", shortLabel: "প্রোফাইল" },
    ];

    if (isLoading) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full" />
        </div>
        );
    }

    return (
        <>
        <style>{`
            @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            10% { transform: rotate(14deg); }
            20% { transform: rotate(-8deg); }
            30% { transform: rotate(14deg); }
            40% { transform: rotate(-4deg); }
            50% { transform: rotate(10deg); }
            60%, 100% { transform: rotate(0deg); }
            }
            .greeting-wave {
            display: inline-block;
            animation: wave 2.5s ease-in-out infinite;
            transform-origin: 70% 70%;
            }
            .gradient-text {
            background: linear-gradient(135deg, #065f46, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            }
            @keyframes tabFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
            }
            .tab-content-anim {
            animation: tabFadeIn 0.4s ease forwards;
            }
            .tabs-scroll::-webkit-scrollbar { height: 0; }
            .tabs-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>

        {/* ==================== HEADER ==================== */}
        <section className="mt-16 bg-gradient-to-br from-gray-50 to-white">
            <div className="mx-auto px-4 md:px-6 py-8" style={{ maxWidth: "85rem" }}>

            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="greeting-wave text-2xl">👋</span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    স্বাগতম,{" "}
                    <span className="gradient-text">
                        {user?.username || "ব্যবহারকারী"}
                    </span>
                    </h1>
                </div>
                <p className="text-gray-500 text-sm flex items-center gap-2">
                    <span className="text-emerald-500 text-xs">👤</span>
                    আমার ড্যাশবোর্ড — আপনার রিপোর্ট এবং কার্যক্রম দেখুন
                </p>
                </div>
                <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowVolModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl 
                    bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold 
                    shadow-md transition-all duration-300 hover:-translate-y-0.5 
                    hover:shadow-lg hover:shadow-emerald-500/30"
                >
                    <span className="text-xs">🤲</span>
                    Become a Volunteer
                </button>
                </div>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <StatCard
                icon="📄"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                badgeBg="bg-blue-50"
                badgeText="text-blue-600"
                badgeIcon="📈"
                badgeLabel="সক্রিয়"
                value={stats.total}
                label="মোট রিপোর্ট"
                delay=""
                />
                <StatCard
                icon="✅"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                badgeBg="bg-emerald-50"
                badgeText="text-emerald-600"
                badgeIcon="✓"
                badgeLabel="সম্পন্ন"
                value={stats.resolved}
                label="সমাধান হয়েছে"
                delay="delay-100"
                />
                <StatCard
                icon="⚙️"
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                badgeBg="bg-amber-50"
                badgeText="text-amber-600"
                badgeIcon="⏳"
                badgeLabel="চলমান"
                value={stats.inProgress}
                label="প্রক্রিয়াধীন"
                delay="delay-200"
                />
                <StatCard
                icon="🕐"
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                badgeBg="bg-rose-50"
                badgeText="text-rose-600"
                badgeIcon="⌛"
                badgeLabel="অপেক্ষমান"
                value={stats.pending}
                label="পেন্ডিং"
                delay="delay-300"
                />
            </div>
            </div>
        </section>

        {/* ==================== QUICK ACTIONS ==================== */}
        <section className="bg-white pb-2">
            <div className="mx-auto px-4 md:px-6" style={{ maxWidth: "85rem" }}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-amber-500">⚡</span>
                দ্রুত অ্যাকশন
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <QuickAction
                href="/reports"
                icon="➕"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="নতুন রিপোর্ট"
                subtitle="সমস্যা জানান"
                delay=""
                />
                <QuickAction
                href="/lost-found"
                icon="🔍"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                title="হারানো-পাওয়া"
                subtitle="পোস্ট করুন"
                delay="delay-100"
                />
                <QuickAction
                href="/security"
                icon="🛡️"
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                title="নিরাপত্তা সহায়তা"
                subtitle="অভিযোগ করুন"
                delay="delay-200"
                />
            </div>
            </div>
        </section>

        {/* ==================== TABS ==================== */}
        <section
            className="bg-white mx-auto rounded-2xl shadow-sm border border-gray-100 mb-10 overflow-hidden"
            style={{ maxWidth: "85rem" }}
        >
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 px-4 md:px-6 pt-4">
            <div className="tabs-scroll flex gap-2 overflow-x-auto pb-3">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm 
                    whitespace-nowrap transition-all duration-300
                    ${activeTab === tab.id
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25"
                        : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                    <span className={`text-xs transition-colors ${activeTab === tab.id ? "text-white" : "text-gray-400"}`}>
                    {tab.icon}
                    </span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
                ))}
            </div>
            </div>

            {/* Tab Content */}
            <div className="p-5 md:p-8">
            <div key={activeTab} className="tab-content-anim">
                {activeTab === "report" && <ReportC />}
                {activeTab === "security" && <SecurityC />}
                {activeTab === "lost" && <LostC />}
                {activeTab === "profile" && <ProfileC />}
            </div>
            </div>
        </section>

        {/* Volunteer Modal */}
        <BecomeVolunteerModal
            open={showVolModal}
            onClose={() => setShowVolModal(false)}
        />
        </>
    );
}