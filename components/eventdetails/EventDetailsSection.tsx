// app/eventdetails/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { eventApi, profileApi } from "@/lib/api";          // ← FIX 1: added profileApi
import { useAuth } from "@/context/AuthContext";
import { Event } from "@/types";

// ── Helpers ──
function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function getStatusInfo(status: string) {
    switch (status) {
        case "upcoming":
        return { label: "আসন্ন", bg: "bg-blue-500/90", pulse: true };
        case "ongoing":
        return { label: "চলমান", bg: "bg-amber-500/90", pulse: true };
        default:
        return { label: "সম্পন্ন", bg: "bg-emerald-500/90", pulse: false };
    }
}

function getProgress(count: number, needed: number) {
    if (!needed) return 0;
    return Math.min(Math.round((count / needed) * 100), 100);
}

interface Props {
  eventId: number;
}

// ── Main Component ──
export default function EventDetailsSection({ eventId }: Props) {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const id = eventId;

    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joinModal, setJoinModal] = useState(false);
    const [volunteerModal, setVolunteerModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [copyMsg, setCopyMsg] = useState(false);
    const [progressWidth, setProgressWidth] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);

    // ── FIX 2 & 3: Track current volunteer's Volunteer-model ID ──
    const [myVolunteerId, setMyVolunteerId] = useState<number | null>(null);

    // ── Fetch Volunteer Profile ID (when logged-in user is a volunteer) ──
    useEffect(() => {
        const isVol = user?.role === "volunteer";
        if (!isVol) {
            setMyVolunteerId(null);
            return;
        }
        profileApi
            .getVolunteerProfile()
            .then((res) => setMyVolunteerId(res.data.id))
            .catch(() => setMyVolunteerId(null));
    }, [user?.role]);

    // ── Fetch Event ──
    useEffect(() => {
        if (!id) return;
        const fetch_ = async () => {
        try {
            setIsLoading(true);
            const res = await eventApi.getById(id);
            setEvent(res.data);
        } catch {
            setError("Event পাওয়া যায়নি।");
        } finally {
            setIsLoading(false);
        }
        };
        fetch_();
    }, [id]);

    // ── Progress bar animation ──
    useEffect(() => {
        if (!event) return;
        const timer = setTimeout(() => {
        setProgressWidth(getProgress(event.volunteer_count, event.needed_people));
        }, 500);
        return () => clearTimeout(timer);
    }, [event]);

    // ── Reveal animation ──
    useEffect(() => {
        const els = document.querySelectorAll(".reveal");
        const obs = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add("active");
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [event]);

    // ── Escape key ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setJoinModal(false);
            setVolunteerModal(false);
            document.body.style.overflow = "";
        }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // ── Role check ──
    const isAdmin = user?.role === "admin";
    const isVolunteer = user?.role === "volunteer";
    const isCustomer = user?.role === "customer";

    // ── FIX 4: Compare Volunteer-model ID, NOT User ID ──
    const isJoined =
        event && isVolunteer && myVolunteerId
        ? (event.volunteers).includes(myVolunteerId)           // ← FIX 4 & 5
        : false;

    const [rewardingId, setRewardingId] = useState<number | null>(null);

    const handleReward = async (volunteerId: number) => {
        try {
        setRewardingId(volunteerId);
        await eventApi.reward(id, volunteerId);
        const res = await eventApi.getById(id);
        setEvent(res.data);
        } catch {
        alert("পয়েন্ট দেওয়া যায়নি।");
        } finally {
        setRewardingId(null);
        }
    };
    const isFutureEvent = event
        ? new Date(event.date) > new Date()
        : false;

    // ── Join ──
    const handleJoin = async () => {
        try {
        setJoining(true);
        await eventApi.join(id);
        const res = await eventApi.getById(id);
        setEvent(res.data);
        setJoinModal(false);
        document.body.style.overflow = "";
        } catch {
        alert("Join করা যায়নি।");
        } finally {
        setJoining(false);
        }
    };

    // ── Share ──
    const shareEvent = () => {
        if (navigator.share) {
        navigator.share({ title: event?.title, url: window.location.href });
        } else {
        copyLink();
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
        setCopyMsg(true);
        setTimeout(() => setCopyMsg(false), 2000);
        });
    };

    const shareToFacebook = () =>
        window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            window.location.href
        )}`,
        "_blank"
        );

    const shareToTwitter = () =>
        window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            window.location.href
        )}&text=${encodeURIComponent(event?.title ?? "")}`,
        "_blank"
        );

    const shareToWhatsApp = () =>
        window.open(
        `https://wa.me/?text=${encodeURIComponent(
            (event?.title ?? "") + " " + window.location.href
        )}`,
        "_blank"
        );

    // ── Modal helpers ──
    const openJoinModal = (e: React.MouseEvent) => {
        e.preventDefault();
        setJoinModal(true);
        document.body.style.overflow = "hidden";
    };

    const closeJoinModal = () => {
        setJoinModal(false);
        document.body.style.overflow = "";
    };

    const openVolunteerModal = (e: React.MouseEvent) => {
        e.preventDefault();
        setVolunteerModal(true);
        document.body.style.overflow = "hidden";
    };

    const closeVolunteerModal = () => {
        setVolunteerModal(false);
        document.body.style.overflow = "";
    };

    // ── Loading / Error ──
    if (isLoading) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">লোড হচ্ছে...</p>
            </div>
        </div>
        );
    }

    if (error || !event) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="text-center">
            <p className="text-red-500 font-medium">{error ?? "Event পাওয়া যায়নি।"}</p>
            <button
                onClick={() => router.back()}
                className="mt-4 text-emerald-600 underline"
            >
                ফিরে যান
            </button>
            </div>
        </div>
        );
    }

    const statusInfo = getStatusInfo(event.status);
    const progress = getProgress(event.volunteer_count, event.needed_people);

    return (
        <>
        {/* ── CSS ── */}
        <style>{`
            .reveal { opacity: 0; transform: translateY(30px); transition: all 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
            .reveal.active { opacity: 1; transform: translateY(0); }
            .reveal-delay-1 { transition-delay: 0.15s; }
            .reveal-delay-2 { transition-delay: 0.3s; }
            .reveal-delay-3 { transition-delay: 0.45s; }
            .gradient-text { background: linear-gradient(135deg, #065f46, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .hero-image-wrapper { position: relative; overflow: hidden; }
            .hero-image-wrapper img { transition: transform 0.5s ease; }
            .hero-image-wrapper:hover img { transform: scale(1.03); }
            .info-card { transition: all 0.3s ease; }
            .info-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
            .stat-box { transition: all 0.3s ease; }
            .stat-box:hover { transform: translateY(-2px); }
            .volunteer-row { transition: all 0.2s ease; }
            .volunteer-row:hover { background: #ecfdf5; }
            .action-btn { transition: all 0.3s ease; position: relative; overflow: hidden; }
            .action-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease; }
            .action-btn:hover::before { left: 100%; }
            .action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(5,150,105,0.3); }
            .modal-overlay { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
            .modal-card { animation: modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
            @keyframes modalPop { from { opacity:0; transform: scale(0.9) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }
            .progress-fill { transition: width 1.5s cubic-bezier(0.25,0.46,0.45,0.94); }
            .status-pulse { animation: statusPulse 2s ease-in-out infinite; }
            @keyframes statusPulse { 0%, 100% { opacity:1; } 50% { opacity:0.7; } }
            .back-btn { transition: all 0.3s ease; }
            .back-btn:hover { transform: translateX(-4px); }
            .point-btn { transition: all 0.3s ease; }
            .point-btn:hover { background: #059669; transform: scale(1.05); }
            .share-btn { transition: all 0.3s ease; }
            .share-btn:hover { transform: scale(1.1); }
            .sticky-action { position: sticky; top: 100px; }
        `}</style>

        <main className="bg-gray-50 min-h-screen">

            {/* ════════ HERO IMAGE ════════ */}
            <div className="hero-image-wrapper relative w-full h-[350px] md:h-[450px] lg:h-[500px]">
            {event.photo ? (
                <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${event.photo}`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center">
                <div className="text-center">
                    <i className="fa-solid fa-calendar-day text-emerald-400/30 text-8xl mb-4"></i>
                    <p className="text-emerald-300/50 font-medium">ইভেন্ট ছবি নেই</p>
                </div>
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 w-full p-5 md:p-8 flex items-center justify-between z-10">
                {/* Back */}
                <Link
                href="/events"
                className="back-btn inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-2.5 rounded-xl border border-white/20 text-sm font-medium hover:bg-white/25"
                >
                <i className="fa-solid fa-arrow-left text-xs"></i>
                সব ইভেন্ট
                </Link>

                {/* Share */}
                <button
                onClick={shareEvent}
                className="share-btn w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/25"
                >
                <i className="fa-solid fa-share-nodes text-sm"></i>
                </button>
            </div>

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 z-10">
                <div className="max-w-5xl mx-auto">

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 ${statusInfo.bg} backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4`}>
                    {statusInfo.pulse ? (
                    <span className="w-2 h-2 bg-white rounded-full status-pulse"></span>
                    ) : (
                    <i className="fa-solid fa-check text-xs"></i>
                    )}
                    {statusInfo.label}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
                    {event.title}
                </h1>

                {/* Quick info chips */}
                <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar-day text-xs"></i>
                    {formatDate(event.date)}
                    </span>
                    <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                    <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-clock text-xs"></i>
                    {event.time}
                    </span>
                    <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                    <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot text-xs"></i>
                    {event.location ?? "নির্ধারিত হয়নি"}
                    </span>
                </div>
                </div>
            </div>
            </div>

            {/* ════════ MAIN CONTENT ════════ */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-6 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ══ LEFT (2 cols) ══ */}
                <div className="lg:col-span-2 space-y-6">

                {/* Event Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden reveal">

                    {/* Description */}
                    <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-info-circle text-emerald-600"></i>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">ইভেন্ট বিবরণ</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{event.description}</p>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Info Grid */}
                    <div className="p-6 md:p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        {/* তারিখ */}
                        <div className="info-card bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                            <i className="fa-solid fa-calendar-day text-blue-600 text-sm"></i>
                        </div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">তারিখ</p>
                        <p className="text-sm font-bold text-gray-800">{formatDate(event.date)}</p>
                        </div>

                        {/* সময় */}
                        <div className="info-card bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                            <i className="fa-solid fa-clock text-purple-600 text-sm"></i>
                        </div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">সময়</p>
                        <p className="text-sm font-bold text-gray-800">{event.time}</p>
                        </div>

                        {/* স্থান */}
                        <div className="info-card bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                            <i className="fa-solid fa-location-dot text-amber-600 text-sm"></i>
                        </div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">স্থান</p>
                        <p className="text-sm font-bold text-gray-800">{event.location ?? "—"}</p>
                        </div>

                        {/* ক্যাটাগরি */}
                        <div className="info-card bg-gray-50 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 mx-auto bg-rose-50 rounded-lg flex items-center justify-center mb-3">
                            <i className="fa-solid fa-tag text-rose-600 text-sm"></i>
                        </div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">ক্যাটাগরি</p>
                        <p className="text-sm font-bold text-gray-800">{event.category ?? "সাধারণ"}</p>
                        </div>
                    </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Organizer & Points */}
                    <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-user-tie text-emerald-700"></i>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">আয়োজক</p>
                            <p className="text-sm font-bold text-gray-800">
                            {event.organizer ?? event.user?.username}
                            </p>
                        </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-trophy text-amber-700"></i>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">ইভেন্ট পয়েন্ট</p>
                            <p className="text-sm font-bold text-gray-800">{event.point} পয়েন্ট</p>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>

                {/* ══ VOLUNTEERS / JOIN SECTION ══ */}
                {isAuthenticated && isFutureEvent && isAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden reveal reveal-delay-1">
                    <div className="px-6 md:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <i className="fa-solid fa-users text-indigo-600"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">স্বেচ্ছাসেবক তালিকা</h2>
                            <p className="text-xs text-gray-400">মোট {event.volunteer_count} জন যোগ দিয়েছেন</p>
                        </div>
                        </div>
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold">
                        {event.volunteer_count}/{event.needed_people}
                        </div>
                    </div>

                    {event.volunteers && event.volunteers.length > 0 ? (
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">নাম</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ইউজার</th>
                                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {event.volunteers.map((volId, idx) => {
                                const rewarded = event.rewarded_volunteers?.includes(volId);
                                return (
                                <tr key={volId} className="volunteer-row">
                                    <td className="px-6 py-4">
                                    <span className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {idx + 1}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <i className="fa-solid fa-user text-emerald-600 text-xs"></i>
                                        </div>
                                        <span className="font-medium text-gray-800">Volunteer #{volId}</span>
                                    </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">#{volId}</td>
                                    <td className="px-6 py-4 text-center">
                                    {!rewarded ? (
                                    <button
                                        onClick={() => handleReward(volId)}
                                        disabled={rewardingId === volId}
                                        className="point-btn inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
                                    >
                                        {rewardingId === volId ? (
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <i className="fa-solid fa-plus text-[10px]"></i>
                                        )}
                                        পয়েন্ট দিন
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs font-medium">
                                        <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>
                                        পয়েন্ট দেওয়া হয়েছে
                                    </span>
                                )}
                                    </td>
                                </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <i className="fa-solid fa-users-slash text-gray-300 text-2xl"></i>
                        </div>
                        <p className="text-gray-400 font-medium">এখনো কেউ যোগ দেয়নি</p>
                        <p className="text-gray-300 text-sm mt-1">প্রথম স্বেচ্ছাসেবক যোগদানের অপেক্ষায়</p>
                        </div>
                    )}
                    </div>
                )}
                </div>

                {/* ══ RIGHT SIDEBAR (1 col) ══ */}
                <div className="lg:col-span-1">
                <div className="sticky-action space-y-5">

                    {/* Progress Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 reveal reveal-delay-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-chart-simple text-emerald-600 text-xs"></i>
                        যোগদান অগ্রগতি
                    </h3>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{event.volunteer_count} জন যোগ দিয়েছেন</span>
                        <span>{event.needed_people} জন</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="progress-fill h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                            style={{ width: `${progressWidth}%` }}
                        ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="stat-box bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-emerald-700">{event.volunteer_count}</p>
                        <p className="text-[11px] text-emerald-600/70 font-medium">যোগদান</p>
                        </div>
                        <div className="stat-box bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-amber-700">{event.needed_people}</p>
                        <p className="text-[11px] text-amber-600/70 font-medium">প্রয়োজন</p>
                        </div>
                    </div>

                    {/* ── Join Button Logic ── */}
                    {isAuthenticated && isFutureEvent ? (
                        <>
                        {isVolunteer && (
                            <>
                            {/* FIX 4: uses myVolunteerId (Volunteer-model ID) */}
                            {!isJoined ? (
                                <button
                                onClick={openJoinModal}
                                className="action-btn mt-5 w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2"
                                >
                                <i className="fa-solid fa-hand-holding-heart"></i>
                                ইভেন্টে যোগ দিন
                                </button>
                            ) : (
                                <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                                <i className="fa-solid fa-circle-check text-emerald-500 text-xl mb-2"></i>
                                <p className="text-emerald-800 text-sm font-semibold">আপনি যোগ দিয়েছেন</p>
                                <p className="text-emerald-600 text-xs mt-1">ধন্যবাদ, ইভেন্টে দেখা হবে!</p>
                                </div>
                            )}
                            </>
                        )}

                        {isCustomer && (
                            <button
                            onClick={openVolunteerModal}
                            className="action-btn mt-5 w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2"
                            >
                            <i className="fa-solid fa-hand-holding-heart"></i>
                            ইভেন্টে যোগ দিন
                            </button>
                        )}
                        </>
                    ) : !isAuthenticated ? (
                        <Link
                        href="/login"
                        className="action-btn mt-5 w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2"
                        >
                        <i className="fa-solid fa-right-to-bracket"></i>
                        লগইন করে যোগ দিন
                        </Link>
                    ) : null}
                    </div>

                    {/* Event Info Mini Card */}
                    <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white relative overflow-hidden reveal reveal-delay-2">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-700/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                        <i className="fa-solid fa-circle-info text-emerald-300"></i>
                        </div>
                        <h4 className="font-bold text-sm mb-3">ইভেন্ট তথ্য</h4>
                        <div className="space-y-3">
                        <div className="flex items-center gap-3 text-emerald-100/80 text-sm">
                            <i className="fa-solid fa-calendar-day text-emerald-400 text-xs w-4"></i>
                            <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-100/80 text-sm">
                            <i className="fa-solid fa-clock text-emerald-400 text-xs w-4"></i>
                            <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-100/80 text-sm">
                            <i className="fa-solid fa-location-dot text-emerald-400 text-xs w-4"></i>
                            <span>{event.location ?? "নির্ধারিত হয়নি"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-100/80 text-sm">
                            <i className="fa-solid fa-trophy text-emerald-400 text-xs w-4"></i>
                            <span>{event.point} পয়েন্ট</span>
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* Share Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 reveal reveal-delay-3">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-share-nodes text-gray-400 text-xs"></i>
                        শেয়ার করুন
                    </h4>
                    <div className="flex items-center gap-3">
                        <button onClick={shareToFacebook} className="share-btn w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100">
                        <i className="fa-brands fa-facebook-f text-sm"></i>
                        </button>
                        <button onClick={shareToTwitter} className="share-btn w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 hover:bg-sky-100">
                        <i className="fa-brands fa-x-twitter text-sm"></i>
                        </button>
                        <button onClick={shareToWhatsApp} className="share-btn w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 hover:bg-green-100">
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        </button>
                        <button onClick={copyLink} className="share-btn w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100">
                        {copyMsg
                            ? <i className="fa-solid fa-check text-sm text-emerald-600"></i>
                            : <i className="fa-solid fa-link text-sm"></i>
                        }
                        </button>
                    </div>
                    {copyMsg && (
                        <p className="text-xs text-emerald-600 font-medium mt-2">✓ লিংক কপি হয়েছে!</p>
                    )}
                    </div>
                </div>
                </div>
            </div>
            </div>

            <div className="h-16"></div>
        </main>

        {/* ════════ JOIN MODAL ════════ */}
        {joinModal && (
            <div
            className="fixed inset-0 bg-black/50 modal-overlay flex items-center justify-center z-[9999] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeJoinModal(); }}
            >
            <div className="modal-card bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl relative">
                <button
                onClick={closeJoinModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                <i className="fa-solid fa-xmark text-lg"></i>
                </button>

                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
                <i className="fa-solid fa-hand-holding-heart text-emerald-600 text-2xl"></i>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">ইভেন্টে যোগদান</h2>
                <p className="text-gray-500 text-sm mb-6">
                আপনি কি নিশ্চিত যে{" "}
                <strong>"{event.title}"</strong> ইভেন্টে যোগ দিতে চান?
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fa-solid fa-calendar-day text-emerald-500 text-xs w-4"></i>
                    <span>{formatDate(event.date)} | {event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fa-solid fa-location-dot text-emerald-500 text-xs w-4"></i>
                    <span>{event.location ?? "নির্ধারিত হয়নি"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fa-solid fa-trophy text-emerald-500 text-xs w-4"></i>
                    <span>{event.point} পয়েন্ট পাবেন</span>
                </div>
                </div>

                <div className="flex gap-3">
                <button
                    onClick={closeJoinModal}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-[15px]"
                >
                    বাতিল
                </button>
                <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold hover:shadow-lg transition-all text-[15px] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {joining ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                    <>
                        <i className="fa-solid fa-check text-sm"></i>
                        হ্যাঁ, যোগ দিন
                    </>
                    )}
                </button>
                </div>
            </div>
            </div>
        )}

        {/* ════════ VOLUNTEER REQUIRED MODAL ════════ */}
        {volunteerModal && (
            <div
            className="fixed inset-0 bg-black/50 modal-overlay flex items-center justify-center z-[9999] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeVolunteerModal(); }}
            >
            <div className="modal-card bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl relative">
                <button
                onClick={closeVolunteerModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                <i className="fa-solid fa-xmark text-lg"></i>
                </button>

                <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
                <i className="fa-solid fa-user-shield text-amber-600 text-2xl"></i>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">স্বেচ্ছাসেবক হোন</h2>
                <p className="text-gray-500 text-sm mb-6">
                ইভেন্টে যোগ দিতে হলে আপনাকে প্রথমে স্বেচ্ছাসেবক হিসেবে নিবন্ধন করতে হবে
                </p>

                <div className="bg-emerald-50/50 rounded-xl p-4 mb-6 text-left space-y-2.5">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                    স্বেচ্ছাসেবক সুবিধা
                </p>
                {[
                    "ইভেন্টে যোগদানের সুযোগ",
                    "পয়েন্ট অর্জন ও পুরস্কার",
                    "কমিউনিটিতে অবদান",
                ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fa-solid fa-check-circle text-emerald-500 text-xs"></i>
                    <span>{item}</span>
                    </div>
                ))}
                </div>

                <div className="flex gap-3">
                <button
                    onClick={closeVolunteerModal}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-[15px]"
                >
                    পরে করব
                </button>
                <Link
                    href="/dashboard"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold hover:shadow-lg transition-all text-[15px] flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-user-plus text-sm"></i>
                    নিবন্ধন করুন
                </Link>
                </div>
            </div>
            </div>
        )}
        </>
    );
}