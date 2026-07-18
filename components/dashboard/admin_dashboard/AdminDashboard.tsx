"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { profileApi, adminApi, reportApi, securityReportApi, lostReportApi } from "@/lib/api";
import { AdminProfile } from "@/types";

// Admin specific components (create these separately)
import ReportA from "@/components/dashboard/admin_dashboard/ReportA";
import SecurityA from "@/components/dashboard/admin_dashboard/SecurityA";
import LostA from "@/components/dashboard/admin_dashboard/LostA";
import ProfileC from "@/components/dashboard/customer_dashboard/ProfileC";
import ForumA from "@/components/dashboard/admin_dashboard/ForumA";
import EventA from "@/components/dashboard/admin_dashboard/EventA";
import AdminA from "@/components/dashboard/admin_dashboard/AdminA";
import VolunteerA from "@/components/dashboard/admin_dashboard/VolunteerA";
import DonationA from "@/components/dashboard/admin_dashboard/DonationA";

// ============================================
// TYPES
// ============================================
type TabId =
    | "overview"
    | "report"
    | "volunteer"
    | "security"
    | "lost"
    | "event"
    | "forum"
    | "donation"
    | "addadmin"
    | "profile";

interface AdminStats {
    totalReports: number;
    activeVolunteers: number;
    totalSecurity: number;
    totalLost: number;
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
        className={`group relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:shadow-xl ${delay}`}
        >
        {/* BG circle decoration */}
        <div
            className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.08] transition-all duration-400 group-hover:w-28 group-hover:h-28 group-hover:opacity-[0.12]"
            style={{
            background: iconBg.includes("blue")
                ? "#3b82f6"
                : iconBg.includes("emerald")
                ? "#10b981"
                : iconBg.includes("amber")
                ? "#f59e0b"
                : "#f43f5e",
            }}
        />
        <div className="flex items-center justify-between mb-4">
            <div
            className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
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
        <p className="text-3xl font-extrabold text-gray-900 mb-1 font-mono">
            {count}
        </p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        </div>
    );
};

// ============================================
// PLACEHOLDER COMPONENT
// (যেসব admin-specific component এখনো নেই)
// ============================================
const PlaceholderTab = ({ title }: { title: string }) => (
    <div className="py-20 text-center">
        <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <svg
            className="w-8 h-8 text-emerald-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
        </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-1">{title}</h3>
        <p className="text-gray-400 text-sm">এই সেকশনটি近শীঘ্রই আসছে</p>
    </div>
);

// ============================================
// OVERVIEW TAB
// ============================================
const OverviewTab = ({ stats }: { stats: AdminStats }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
            📊 সিস্টেম সংক্ষিপ্ত বিবরণ
        </h3>
        <p className="text-sm text-gray-500">
            সমস্ত কার্যক্রমের সামগ্রিক চিত্র এখানে দেখা যাচ্ছে।
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
            {
                label: "মোট রিপোর্ট",
                value: stats.totalReports,
                color: "text-blue-600",
                bg: "bg-blue-50",
            },
            {
                label: "স্বেচ্ছাসেবক",
                value: stats.activeVolunteers,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
            },
            {
                label: "নিরাপত্তা",
                value: stats.totalSecurity,
                color: "text-amber-600",
                bg: "bg-amber-50",
            },
            {
                label: "হারানো-পাওয়া",
                value: stats.totalLost,
                color: "text-rose-600",
                bg: "bg-rose-50",
            },
            ].map((item) => (
            <div
                key={item.label}
                className={`${item.bg} rounded-xl p-4 text-center`}
            >
                <p className={`text-2xl font-extrabold ${item.color}`}>
                {item.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
            ))}
        </div>
        </div>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminDashboard() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [stats, setStats] = useState<AdminStats>({
        totalReports: 0,
        activeVolunteers: 0,
        totalSecurity: 0,
        totalLost: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // ============================================
    // AUTH CHECK
    // ============================================
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
        router.replace("/");
        }
    }, [isLoading, isAuthenticated, user, router]);

    // ============================================
    // FETCH DATA
    // ============================================
    useEffect(() => {
        const fetchData = async () => {
        if (!isAuthenticated) return;
        try {
            // Admin profile
            const profileRes = await profileApi.getAdminProfile();
            setProfile(profileRes.data as AdminProfile);

            // Dashboard stats
            const dashRes = await adminApi.getDashboard();
            const dash = dashRes.data;

            setStats({
            totalReports: dash.total_reports ?? 0,
            activeVolunteers: dash.total_volunteers ?? 0,
            totalSecurity: dash.total_security_reports ?? 0,
            totalLost: dash.total_lost_reports ?? 0,
            });
        } catch {
            // keep zeros
        } finally {
            setStatsLoading(false);
        }
        };
        fetchData();
    }, [isAuthenticated]);

    // ============================================
    // TABS CONFIG
    // ============================================
    const tabs: {
        id: TabId;
        icon: string;
        label: string;
        shortLabel: string;
    }[] = [
        {
        id: "overview",
        icon: "📊",
        label: "সংক্ষিপ্ত বিবরণ",
        shortLabel: "বিবরণ",
        },
        {
        id: "report",
        icon: "📄",
        label: "সমস্যা রিপোর্ট",
        shortLabel: "রিপোর্ট",
        },
        {
        id: "volunteer",
        icon: "👥",
        label: "স্বেচ্ছাসেবক",
        shortLabel: "স্বেচ্ছাসেবক",
        },
        {
        id: "security",
        icon: "🛡",
        label: "নিরাপত্তা",
        shortLabel: "নিরাপত্তা",
        },
        {
        id: "lost",
        icon: "🔍",
        label: "হারানো-পাওয়া",
        shortLabel: "হারানো",
        },
        {
        id: "event",
        icon: "📅",
        label: "ইভেন্ট",
        shortLabel: "ইভেন্ট",
        },
        {
        id: "forum",
        icon: "💬",
        label: "ফোরাম-পোস্ট",
        shortLabel: "ফোরাম",
        },
        {
        id: "donation",
        icon: "💰",
        label: "ডোনেশন",
        shortLabel: "ডোনেশন",
        },
        {
        id: "addadmin",
        icon: "🛡️",
        label: "অ্যাড অ্যাডমিন",
        shortLabel: "অ্যাডমিন",
        },
        {
        id: "profile",
        icon: "⚙️",
        label: "প্রোফাইল",
        shortLabel: "প্রোফাইল",
        },
    ];

    // ============================================
    // LOADING STATE
    // ============================================
    if (isLoading) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full" />
        </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================
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
            @keyframes notifPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            }
            .notif-dot {
            animation: notifPulse 2s ease-in-out infinite;
            }
            .logout-btn { transition: all 0.3s ease; }
            .logout-btn:hover {
            background: #fef2f2;
            color: #dc2626;
            transform: translateY(-1px);
            }
        `}</style>

        {/* ==================== HEADER ==================== */}
        <section className="mt-16 bg-gradient-to-br from-gray-50 to-white">
            <div
            className="mx-auto px-4 md:px-6 py-8"
            style={{ maxWidth: "85rem" }}
            >
            {/* Top: Greeting + Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="greeting-wave text-2xl">👋</span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    স্বাগতম,{" "}
                    <span className="gradient-text">
                        {profile
                        ? profile.user.first_name && profile.user.last_name
                            ? `${profile.user.first_name} ${profile.user.last_name}`
                            : profile.user.username
                        : user?.username || "অ্যাডমিন"}
                    </span>
                    </h1>
                </div>
                <p className="text-gray-500 text-sm flex items-center gap-2">
                    <span className="text-emerald-500 text-xs">🛡</span>
                    অ্যাডমিন ড্যাশবোর্ড — সম্পূর্ণ সিস্টেম পরিচালনা ও পর্যবেক্ষণ
                </p>
                </div>

                <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button className="relative w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="notif-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                </button>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="logout-btn flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium bg-white"
                >
                    <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    >
                    <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                        clipRule="evenodd"
                    />
                    </svg>
                    লগআউট
                </button>
                </div>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* মোট রিপোর্ট */}
                <StatCard
                icon="📄"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                badgeBg="bg-emerald-50"
                badgeText="text-emerald-600"
                badgeIcon="📈"
                badgeLabel="সক্রিয়"
                value={statsLoading ? 0 : stats.totalReports}
                label="মোট রিপোর্ট"
                delay=""
                />

                {/* সক্রিয় স্বেচ্ছাসেবক */}
                <StatCard
                icon="👥"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                badgeBg="bg-emerald-50"
                badgeText="text-emerald-600"
                badgeIcon="✓"
                badgeLabel="সক্রিয়"
                value={statsLoading ? 0 : stats.activeVolunteers}
                label="সক্রিয় স্বেচ্ছাসেবক"
                delay="delay-100"
                />

                {/* নিরাপত্তা অভিযোগ */}
                <StatCard
                icon="🛡"
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                badgeBg="bg-amber-50"
                badgeText="text-amber-600"
                badgeIcon="⚠"
                badgeLabel="পর্যালোচনা"
                value={statsLoading ? 0 : stats.totalSecurity}
                label="নিরাপত্তা অভিযোগ"
                delay="delay-200"
                />

                {/* হারানো-পাওয়া */}
                <StatCard
                icon="🔍"
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                badgeBg="bg-rose-50"
                badgeText="text-rose-600"
                badgeIcon="⏰"
                badgeLabel="অপেক্ষমান"
                value={statsLoading ? 0 : stats.totalLost}
                label="হারানো-পাওয়া"
                delay="delay-300"
                />
            </div>
            </div>
        </section>

        {/* ==================== TABS + CONTENT ==================== */}
        <section
            className="bg-white mx-auto rounded-2xl shadow-sm border border-gray-100 mb-10  px-4 md:px-6"
            style={{ maxWidth: "85rem" }}
        >
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 pt-4">
            <div className="tabs-scroll flex gap-2 overflow-x-auto pb-3">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25"
                        : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                    <span
                    className={`text-xs transition-colors ${
                        activeTab === tab.id ? "text-white" : "text-gray-400"
                    }`}
                    >
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
    {activeTab === "overview" && <OverviewTab stats={stats} />}

    {activeTab === "report" && <ReportA />}

    {activeTab === "volunteer" && <VolunteerA />}

    {activeTab === "security" && <SecurityA />}

    {activeTab === "lost" && <LostA />}

    {activeTab === "event" && <EventA />}

    {activeTab === "forum" && <ForumA />}

    {activeTab === "donation" && <DonationA />}

    {activeTab === "addadmin" && <AdminA />}

    {activeTab === "profile" && <ProfileC />}
  </div>
</div>
        </section>
        </>
    );
}