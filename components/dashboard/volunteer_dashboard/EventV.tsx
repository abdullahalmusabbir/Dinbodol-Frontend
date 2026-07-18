"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { eventApi, profileApi } from "@/lib/api";
import { Event } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ============================================
// TYPES
// ============================================
type FilterType = "all" | "rewarded" | "assigned";

// ============================================
// HELPERS
// ============================================
function toBangla(num: number): string {
    const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (x) => d[parseInt(x)]);
}

function formatDateBn(dateStr: string): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("bn-BD", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return "—";
    }
}

// ============================================
// STATUS INFO
// ============================================
interface StatusInfo {
    label: string;
    badgeCls: string;
    dotCls: string;
    iconBg: string;
    type: "rewarded" | "assigned";
}

function getStatusInfo(event: Event, volunteerId: number | null): StatusInfo {
    const isRewarded =
        volunteerId !== null && event.rewarded_volunteers.includes(volunteerId);

    if (isRewarded) {
        return {
        label: "সম্পন্ন",
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotCls: "bg-emerald-400",
        iconBg: "from-emerald-500 to-green-600",
        type: "rewarded",
        };
    }
    return {
        label: "নিয়োগকৃত",
        badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
        dotCls: "bg-amber-400",
        iconBg: "from-amber-500 to-orange-500",
        type: "assigned",
    };
}

// ============================================
// SKELETON CARD
// ============================================
const SkeletonCard = () => (
    <div
        className="h-32 rounded-2xl"
        style={{
        background:
            "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        }}
    />
);

// ============================================
// PAGINATION
// ============================================
interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
}

function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    let s = Math.max(page - 1, 1);
    let e = Math.min(page + 1, totalPages);
    if (page === 1) e = Math.min(3, totalPages);
    if (page === totalPages) s = Math.max(totalPages - 2, 1);

    const pages = [];
    for (let i = s; i <= e; i++) pages.push(i);

    return (
        <div className="flex items-center gap-1.5">
        {page > 1 && (
            <button
            onClick={() => onChange(page - 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer transition-all duration-300 hover:-translate-y-px"
            >
            ‹
            </button>
        )}
        {pages.map((p) => (
            <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 hover:-translate-y-px ${
                p === page
                ? "text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={
                p === page
                ? {
                    background:
                        "linear-gradient(135deg, #059669, #047857)",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
                }
                : {}
            }
            >
            {toBangla(p)}
            </button>
        ))}
        {page < totalPages && (
            <button
            onClick={() => onChange(page + 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs cursor-pointer transition-all duration-300 hover:-translate-y-px"
            >
            ›
            </button>
        )}
        </div>
    );
}

// ============================================
// EVENT CARD
// ============================================
interface EventCardProps {
    event: Event;
    volunteerId: number | null;
}

function EventCard({ event, volunteerId }: EventCardProps) {
    const status = getStatusInfo(event, volunteerId);
    const dateStr = event.date ? formatDateBn(event.date) : "—";

    return (
        <Link href={`/eventdetails/${event.id}`} className="block group">
        <div
            className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 transition-all duration-300 group-hover:-translate-y-0.5"
            style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 30px rgba(0, 0, 0, 0.06)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "#d1fae5";
            }}
            onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 2px 8px rgba(0,0,0,0.04)";
            (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgb(243 244 246)";
            }}
        >
            <div className="flex flex-col gap-4">
            {/* Top Row: Icon + Title + Badge */}
            <div className="flex items-start gap-4">
                <div
                className={`w-12 h-12 bg-gradient-to-br ${status.iconBg} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}
                >
                <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                    className={`inline-flex items-center gap-1.5 ${status.badgeCls} px-2.5 py-1 rounded-full text-[11px] font-semibold border`}
                    >
                    <span
                        className={`w-1.5 h-1.5 ${status.dotCls} rounded-full`}
                    />
                    {status.label}
                    </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                    {event.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {event.description || ""}
                </p>
                </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex flex-wrap items-center gap-4 ml-0 md:ml-16">
                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg
                    className="w-3 h-3 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                    </svg>
                </div>
                <span className="font-medium">{dateStr}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                    <svg
                    className="w-3 h-3 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    </svg>
                </div>
                <span className="font-medium">{event.location || "—"}</span>
                </div>

                {/* Time */}
                {event.time && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    </div>
                    <span className="font-medium">{event.time}</span>
                </div>
                )}

                {/* Point */}
                {event.point ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674a1 1 0 00.95-.69L11.049 2.927z"
                        />
                    </svg>
                    </div>
                    <span className="font-medium">
                    {toBangla(event.point)} পয়েন্ট
                    </span>
                </div>
                ) : null}
            </div>
            </div>
        </div>
        </Link>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
const PER_PAGE = 5;

export default function Eventv() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [volunteerProfileId, setVolunteerProfileId] = useState<number | null>(null);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    // Fetch volunteer profile to get the actual Volunteer model ID
    useEffect(() => {
        if (!user || user.role !== "volunteer") {
            setLoading(false);
            return;
        }
        
        (async () => {
            try {
                const res = await profileApi.getVolunteerProfile();
                // Volunteer model এর আসল ID সেট করুন
                setVolunteerProfileId(res.data.id);
            } catch {
                setLoading(false);
            }
        })();
    }, [user]);

    // ============================================
    // FETCH EVENTS
    // ============================================
    useEffect(() => {
        if (volunteerProfileId === null) return;
        
        (async () => {
        try {
            const res = await eventApi.getAll();
            // শুধু সেই events যেগুলোতে current volunteer আছে
            const myEvents = (res.data as Event[]).filter((ev) =>
            ev.volunteers.includes(volunteerProfileId)
            );
            setEvents(myEvents);
        } catch {
            // handle silently
        } finally {
            setLoading(false);
        }
        })();
    }, [volunteerProfileId]);

    // ============================================
    // SEARCH HANDLER
    // ============================================
    const handleSearch = useCallback((val: string) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
        setSearch(val);
        setPage(1);
        }, 250);
    }, []);

    // ============================================
    // FILTER
    // ============================================
    const filtered = events
        .filter((ev) => {
        if (filterType === "all") return true;
        const status = getStatusInfo(ev, volunteerProfileId);
        return status.type === filterType;
        })
        .filter((ev) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            (ev.title || "").toLowerCase().includes(term) ||
            (ev.description || "").toLowerCase().includes(term) ||
            (ev.location || "").toLowerCase().includes(term)
        );
        });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const paginated = filtered.slice(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE
    );

    const filterButtons: {
        type: FilterType;
        label: string;
        dot?: string;
        icon?: string;
    }[] = [
        { type: "all", label: "সব", icon: "☰" },
        { type: "rewarded", label: "সম্পন্ন", dot: "bg-emerald-400" },
        { type: "assigned", label: "নিয়োগকৃত", dot: "bg-amber-400" },
    ];

    // ============================================
    // RENDER
    // ============================================
    return (
        <>
        {/* Shimmer Style */}
        <style>{`
            @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
            }
            @keyframes volEvtFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
            }
        `}</style>

        <div className="mt-2">
            {/* ===== SECTION HEADER ===== */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                </div>
                <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    যোগদান করা ইভেন্ট
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    আপনার সকল ইভেন্টের তালিকা
                </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                {loading ? "—" : toBangla(filtered.length)} টি ইভেন্ট
                </span>
            </div>
            </div>

            {/* ===== FILTER BAR ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                {filterButtons.map((fb) => {
                    const isActive = filterType === fb.type;
                    return (
                    <button
                        key={fb.type}
                        onClick={() => {
                        setFilterType(fb.type);
                        setPage(1);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-300 cursor-pointer hover:-translate-y-px ${
                        isActive
                            ? "text-white border-transparent"
                            : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                        }`}
                        style={
                        isActive
                            ? {
                                background:
                                "linear-gradient(135deg, #059669, #047857)",
                                boxShadow:
                                "0 4px 12px rgba(5, 150, 105, 0.25)",
                            }
                            : {}
                        }
                    >
                        {fb.dot ? (
                        <span
                            className={`w-2 h-2 ${isActive ? "bg-white" : fb.dot} rounded-full`}
                        />
                        ) : (
                        <span className="text-xs">{fb.icon}</span>
                        )}
                        {fb.label}
                    </button>
                    );
                })}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="ইভেন্ট খুঁজুন..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-100 focus:border-emerald-400 focus:outline-none transition-colors"
                />
                </div>
            </div>
            </div>

            {/* ===== LOADING SKELETON ===== */}
            {loading && (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
            )}

            {/* ===== EMPTY STATE ===== */}
            {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
                <div
                className="inline-block mb-4"
                style={{ animation: "volEvtFloat 3s ease-in-out infinite" }}
                >
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center">
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
                        d="M6 18L18 6M6 6l12 12"
                    />
                    </svg>
                </div>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                কোনো ইভেন্ট নেই
                </h3>
                <p className="text-gray-400 text-sm">
                আপনি কোনো ইভেন্টে যোগদান করেননি
                </p>
            </div>
            )}

            {/* ===== EVENTS LIST ===== */}
            {!loading && filtered.length > 0 && (
            <div className="space-y-4">
                {paginated.map((ev) => (
                <EventCard key={ev.id} event={ev} volunteerId={volunteerProfileId} />
                ))}
            </div>
            )}

            {/* ===== PAGINATION ===== */}
            {!loading && filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                {toBangla((currentPage - 1) * PER_PAGE + 1)}–
                {toBangla(
                    Math.min(currentPage * PER_PAGE, filtered.length)
                )}{" "}
                / {toBangla(filtered.length)} টি
                </p>
                <Pagination
                page={currentPage}
                totalPages={totalPages}
                onChange={(p) => setPage(p)}
                />
            </div>
            )}
        </div>
        </>
    );
}