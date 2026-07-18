"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { eventApi } from "@/lib/api";
import { Event, EventStatus, EventCreate } from "@/types";
import Portal from "@/components/dashboard/admin_dashboard/Portal";
// ============================================
// TYPES
// ============================================
type FilterStatus = EventStatus | "all" | "past";

// ============================================
// CONFIGS
// ============================================
const statusConfig: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    border: string;
    dotAnim?: string;
  }
> = {
  upcoming: {
    label: "আসন্ন",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
    border: "border-emerald-200",
  },
  ongoing: {
    label: "চলমান",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
    border: "border-blue-200",
    dotAnim: "animate-pulse",
  },
  completed: {
    label: "সম্পন্ন",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
    border: "border-gray-200",
  },
  past: {
    label: "পূর্ববর্তী",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    border: "border-amber-200",
  },
};

const categoryColors: Record<string, string> = {
  পরিবেশ: "bg-green-50 text-green-700",
  নিরাপত্তা: "bg-red-50 text-red-700",
  প্রশিক্ষণ: "bg-indigo-50 text-indigo-700",
  সচেতনতা: "bg-amber-50 text-amber-700",
  কমিউনিটি: "bg-purple-50 text-purple-700",
};

const categoryColorsBorder: Record<string, string> = {
  পরিবেশ: "bg-green-50 text-green-700 border-green-200",
  নিরাপত্তা: "bg-red-50 text-red-700 border-red-200",
  প্রশিক্ষণ: "bg-indigo-50 text-indigo-700 border-indigo-200",
  সচেতনতা: "bg-amber-50 text-amber-700 border-amber-200",
  কমিউনিটি: "bg-purple-50 text-purple-700 border-purple-200",
};

const CATEGORIES = ["পরিবেশ", "নিরাপত্তা", "প্রশিক্ষণ", "সচেতনতা", "কমিউনিটি"];
const PAGE_SIZE = 10;

// ============================================
// HELPERS
// ============================================
function toBangla(num: number): string {
  const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (x) => d[parseInt(x)]);
}

function formatDateBn(dateStr: string, short = false): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: short ? "short" : "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function deriveStatus(ev: Event): string {
  if (ev.status) return ev.status;
  if (ev.date) {
    return new Date(ev.date) < new Date() ? "past" : "upcoming";
  }
  return "upcoming";
}

function getUserName(ev: Event): string {
  if (!ev.user) return "—";
  const full = `${ev.user.first_name || ""} ${ev.user.last_name || ""}`.trim();
  return full || ev.user.username;
}

// ============================================
// SUB COMPONENTS
// ============================================

// Skeleton
const SkeletonRow = () => (
  <tr>
    <td colSpan={8} className="px-4 py-2">
      <div
        className="h-12 rounded-lg"
        style={{
          background:
            "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </td>
  </tr>
);

// Status Badge Small
function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    border: "border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text} px-2.5 py-1 rounded-full text-[11px] font-semibold`}
    >
      <span
        className={`w-1.5 h-1.5 ${cfg.dot} ${cfg.dotAnim ?? ""} rounded-full`}
      />
      {cfg.label}
    </span>
  );
}

// Status Badge Large
function StatusBadgeLarge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    border: "border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 ${cfg.bg} ${cfg.text} ${cfg.border} px-4 py-1.5 rounded-full text-sm font-semibold border`}
    >
      <span
        className={`w-2 h-2 ${cfg.dot} ${cfg.dotAnim ?? ""} rounded-full`}
      />
      {cfg.label}
    </span>
  );
}

// Category Badge Small
function CategoryBadge({ category }: { category: string | null }) {
  const cls = category
    ? categoryColors[category] ?? "bg-gray-100 text-gray-600"
    : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center gap-1 ${cls} px-2.5 py-1 rounded-full text-[11px] font-semibold`}
    >
      🏷 {category || "—"}
    </span>
  );
}

// Category Badge Large
function CategoryBadgeLarge({ category }: { category: string | null }) {
  const cls = category
    ? categoryColorsBorder[category] ?? "bg-gray-100 text-gray-600 border-gray-200"
    : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${cls} px-4 py-1.5 rounded-full text-sm font-semibold border`}
    >
      🏷 {category || "—"}
    </span>
  );
}

// Pagination
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  let s = Math.max(page - 1, 1);
  let e = Math.min(page + 1, totalPages);
  if (page === 1) e = Math.min(3, totalPages);
  if (page === totalPages) s = Math.max(totalPages - 2, 1);
  const pages: number[] = [];
  for (let i = s; i <= e; i++) pages.push(i);
  return (
    <div className="flex items-center gap-1.5">
      {page > 1 && (
        <button
          onClick={() => onChange(page - 1)}
          className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-xs cursor-pointer transition-all"
        >
          ‹
        </button>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
            p === page
              ? "text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300"
          }`}
          style={
            p === page
              ? {
                  background:
                    "linear-gradient(135deg, #059669, #047857)",
                  boxShadow: "0 4px 12px rgba(5,150,105,0.2)",
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
          className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-xs cursor-pointer transition-all"
        >
          ›
        </button>
      )}
    </div>
  );
}

// ============================================
// FORM FIELD
// ============================================
function FormField({
  icon,
  iconBg,
  iconColor,
  label,
  children,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
        <div
          className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center`}
        >
          <span className={`text-xs ${iconColor}`}>{icon}</span>
        </div>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] transition-all";
const inputClsBlue =
  "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] transition-all";
const selectCls =
  "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm appearance-none cursor-pointer focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] transition-all";

// ============================================
// DETAIL PANEL
// ============================================
interface DetailPanelProps {
  event: Event | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  toast: boolean;
}

function DetailPanel({
  event,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  toast,
}: DetailPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (event) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsOpen(true))
      );
    } else {
      setIsOpen(false);
    }
  }, [event]);

  if (!event && !isOpen) return null;

  const status = event ? deriveStatus(event) : "";
  const dateStr = event
    ? event.date
      ? formatDateBn(event.date) + (event.time ? " — " + event.time : "")
      : "—"
    : "—";
  const dateShort = event
    ? event.date
      ? formatDateBn(event.date, true)
      : "—"
    : "—";

  return (
    <Portal>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 z-[9998] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backdropFilter: "blur(6px)" }}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9999] overflow-y-auto transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {event && (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-10">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <svg
                      className="w-4 h-4 text-white"
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
                    <h3 className="text-lg font-bold text-gray-900">
                      ইভেন্ট বিবরণ
                    </h3>
                    <p className="text-xs text-gray-400">
                      আইডি: E{event.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
              {/* Toast */}
              {toast && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-sm font-medium text-emerald-700">
                    সফলভাবে আপডেট হয়েছে!
                  </span>
                </div>
              )}

              {/* Event Header */}
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {event.title || "—"}
                </h4>
                <div className="mb-2">
                  <CategoryBadgeLarge category={event.category} />
                </div>
                <div className="mb-2">
                  <StatusBadgeLarge status={status} />
                </div>
                <p className="text-xs text-gray-400">{dateShort}</p>
              </div>

              {/* Photo */}
              {event.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.photo}
                  alt="Event Poster"
                  className="w-full rounded-2xl border border-gray-100 object-cover max-h-56"
                />
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 text-center hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <span className="text-emerald-500">👥</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {event.needed_people
                      ? toBangla(event.needed_people)
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    প্রয়োজনীয় স্বেচ্ছাসেবক
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100/50 text-center hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-10 h-10 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                    <span className="text-amber-500">⭐</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {event.point ? toBangla(event.point) : "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">পয়েন্ট</p>
                </div>
              </div>

              {/* Info List */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {[
                  {
                    icon: "👤",
                    bg: "bg-emerald-50",
                    label: "আয়োজক",
                    value: event.organizer || "উল্লেখ করা হয়নি",
                  },
                  {
                    icon: "✍",
                    bg: "bg-teal-50",
                    label: "পোস্টকারী",
                    value: getUserName(event),
                  },
                  {
                    icon: "📍",
                    bg: "bg-red-50",
                    label: "স্থান",
                    value: event.location || "উল্লেখ করা হয়নি",
                  },
                  {
                    icon: "🏷",
                    bg: "bg-purple-50",
                    label: "বিভাগ",
                    value: event.category || "—",
                  },
                  {
                    icon: "📅",
                    bg: "bg-indigo-50",
                    label: "তারিখ ও সময়",
                    value: dateStr,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-emerald-50/40 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-gray-500 text-xs">📝</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-700">বিবরণ</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {event.description || "কোনো বিবরণ দেওয়া হয়নি"}
                </p>
              </div>

              {/* Admin Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-xs">⚙</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-700">
                    অ্যাডমিন কন্ট্রোল
                  </h4>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    স্ট্যাটাস পরিবর্তন
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      onStatusChange(event.id, e.target.value)
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] appearance-none cursor-pointer transition-all"
                  >
                    <option value="upcoming">🟢 আসন্ন (Upcoming)</option>
                    <option value="ongoing">🔵 চলমান (Ongoing)</option>
                    <option value="completed">✅ সম্পন্ন (Completed)</option>
                  </select>
                </div>
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 flex items-start gap-2">
                    <span>ℹ</span>
                    <span>
                      স্ট্যাটাস পরিবর্তন করলে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pb-6">
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => onEdit(event.id), 350);
                  }}
                  className="w-full py-3 rounded-2xl bg-white border-2 border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  ✏ ইভেন্ট সম্পাদনা করুন
                </button>
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => onDelete(event.id), 350);
                  }}
                  className="w-full py-3 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  🗑 ইভেন্ট মুছে ফেলুন
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Portal>
  );
}

// ============================================
// EVENT FORM PANEL
// ============================================
interface EventFormData {
  title: string;
  category: string;
  location: string;
  date: string;
  time: string;
  needed_people: string;
  point: string;
  description: string;
  organizer: string;
  status: string;
  photo: File | null;
}

const defaultForm: EventFormData = {
  title: "",
  category: "",
  location: "",
  date: "",
  time: "",
  needed_people: "",
  point: "",
  description: "",
  organizer: "",
  status: "upcoming",
  photo: null,
};

interface EventFormPanelProps {
  mode: "new" | "update";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ev: Event) => void;
  initialData?: EventFormData;
  eventId?: number;
  currentPhoto?: string | null;
}

function EventFormPanel({
  mode,
  isOpen,
  onClose,
  onSuccess,
  initialData,
  eventId,
  currentPhoto,
}: EventFormPanelProps) {
  const [form, setForm] = useState<EventFormData>(
    initialData ?? defaultForm
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? defaultForm);
      setMsg(null);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPanelOpen(true))
      );
    } else {
      setPanelOpen(false);
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setPanelOpen(false);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "photo") {
          if (v instanceof File) formData.append("photo", v);
        } else {
          formData.append(k, v as string);
        }
      });
      let res;
      if (mode === "new") {
        res = await eventApi.create(formData);
      } else {
        res = await eventApi.update(eventId!, formData);
      }
      setMsg({
        text:
          mode === "new"
            ? "ইভেন্ট সফলভাবে তৈরি হয়েছে!"
            : "ইভেন্ট সফলভাবে আপডেট হয়েছে!",
        type: "success",
      });
      onSuccess(res.data as Event);
      setTimeout(handleClose, 1200);
    } catch {
      setMsg({ text: "সমস্যা হয়েছে, আবার চেষ্টা করুন।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/30 z-[9998] transition-opacity duration-300 ${
          panelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backdropFilter: "blur(6px)" }}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9999] overflow-y-auto transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                mode === "update"
                  ? "from-emerald-600 to-teal-700"
                  : "from-emerald-500 to-emerald-700"
              } flex items-center justify-center shadow-md shadow-emerald-500/20`}
            >
              <span className="text-white text-sm">
                {mode === "update" ? "✏" : "+"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {mode === "new"
                ? "নতুন ইভেন্ট তৈরি করুন"
                : "ইভেন্ট আপডেট করুন"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {msg && (
            <div
              className={`text-sm rounded-xl px-4 py-3 border ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <FormField
              icon="H"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="ইভেন্টের শিরোনাম"
            >
              <input
                type="text"
                required
                placeholder="ইভেন্টের শিরোনাম লিখুন"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className={inputCls}
              />
            </FormField>

            {/* Category */}
            <FormField
              icon="🏷"
              iconBg="bg-green-50"
              iconColor="text-green-500"
              label="বিভাগ"
            >
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className={selectCls}
              >
                <option value="">বিভাগ নির্বাচন করুন</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Location */}
            <FormField
              icon="📍"
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="স্থান"
            >
              <input
                type="text"
                placeholder="ইভেন্টের স্থান লিখুন"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                className={inputCls}
              />
            </FormField>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                icon="📅"
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
                label="তারিখ"
              >
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                  className={inputCls}
                />
              </FormField>
              <FormField
                icon="🕐"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
                label="সময়"
              >
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) =>
                    setForm({ ...form, time: e.target.value })
                  }
                  className={inputCls}
                />
              </FormField>
            </div>

            {/* Needed People */}
            <FormField
              icon="👥"
              iconBg="bg-amber-50"
              iconColor="text-amber-500"
              label="প্রয়োজনীয় স্বেচ্ছাসেবক সংখ্যা"
            >
              <input
                type="number"
                required
                placeholder="সংখ্যা লিখুন"
                value={form.needed_people}
                onChange={(e) =>
                  setForm({ ...form, needed_people: e.target.value })
                }
                className={inputCls}
              />
            </FormField>

            {/* Point */}
            <FormField
              icon="⭐"
              iconBg="bg-yellow-50"
              iconColor="text-yellow-500"
              label="পয়েন্ট"
            >
              <input
                type="number"
                placeholder="পয়েন্ট লিখুন"
                value={form.point}
                onChange={(e) =>
                  setForm({ ...form, point: e.target.value })
                }
                className={inputCls}
              />
            </FormField>

            {/* Description */}
            <FormField
              icon="📝"
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
              label="ইভেন্টের বিবরণ"
            >
              <textarea
                rows={4}
                placeholder="ইভেন্টের বিস্তারিত বিবরণ লিখুন"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`${inputCls} resize-none`}
              />
            </FormField>

            {/* Organizer */}
            <FormField
              icon="👤"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              label="আয়োজকের নাম"
            >
              <input
                type="text"
                placeholder="আয়োজকের নাম লিখুন"
                value={form.organizer}
                onChange={(e) =>
                  setForm({ ...form, organizer: e.target.value })
                }
                className={inputCls}
              />
            </FormField>

            {/* Photo */}
            <FormField
              icon="🖼"
              iconBg="bg-pink-50"
              iconColor="text-pink-500"
              label="ইভেন্ট পোস্টার"
            >
              {mode === "update" && currentPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPhoto}
                  alt="Poster"
                  className="w-24 h-24 object-cover rounded-xl border border-gray-200 mb-2"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({
                    ...form,
                    photo: e.target.files?.[0] ?? null,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </FormField>

            {/* Status */}
            <FormField
              icon="⚙"
              iconBg="bg-gray-100"
              iconColor="text-gray-500"
              label="স্ট্যাটাস"
            >
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className={selectCls}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </FormField>

            {/* Buttons */}
            <div className="flex gap-3 pt-2 pb-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading
                  ? "..."
                  : mode === "new"
                  ? "+ ইভেন্ট তৈরি করুন"
                  : "✓ আপডেট করুন"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ============================================
// DELETE MODAL
// ============================================
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!isOpen) return null;
  return (
    <Portal>
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] p-4"
      style={{ backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl"
        style={{ animation: "deletePop 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-red-500 text-xl">🗑</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          ইভেন্ট মুছে ফেলুন?
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          এই ইভেন্ট স্থায়ীভাবে মুছে যাবে এবং আর ফিরিয়ে আনা যাবে না।
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            🗑 {loading ? "..." : "মুছুন"}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function EventA() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailToast, setDetailToast] = useState(false);

  const [newPanelOpen, setNewPanelOpen] = useState(false);
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // FETCH
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        const res = await eventApi.getAll();
        setEvents(res.data as Event[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedEvent(null);
        setNewPanelOpen(false);
        setUpdatePanelOpen(false);
        setDeleteModalOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Body overflow — ✅ FIX: panel গুলো ঠিকমতো hide হবে
  useEffect(() => {
    const anyOpen =
      !!selectedEvent ||
      newPanelOpen ||
      updatePanelOpen ||
      deleteModalOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedEvent, newPanelOpen, updatePanelOpen, deleteModalOpen]);

  // ============================================
  // FILTER
  // ============================================
  const filtered = events
    .filter((ev) => {
      const status = deriveStatus(ev);
      if (filterStatus === "all") return true;
      return status === filterStatus;
    })
    .filter((ev) => {
      if (!filterDate) return true;
      return (
        ev.date &&
        new Date(ev.date).toISOString().split("T")[0] === filterDate
      );
    })
    .filter((ev) => {
      if (!search) return true;
      const term = search.toLowerCase();
      const userName = getUserName(ev).toLowerCase();
      return (
        `e${ev.id}`.includes(term) ||
        (ev.title || "").toLowerCase().includes(term) ||
        (ev.category || "").toLowerCase().includes(term) ||
        (ev.location || "").toLowerCase().includes(term) ||
        (ev.time || "").toLowerCase().includes(term) ||
        userName.includes(term)
      );
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = useCallback((val: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 250);
  }, []);

  // ============================================
  // STATUS UPDATE
  // ============================================
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await eventApi.update(id, {
        status: newStatus as EventStatus,
      });
      setEvents((prev) =>
        prev.map((ev) => (ev.id === id ? res.data : ev))
      );
      if (selectedEvent?.id === id) setSelectedEvent(res.data);
      setDetailToast(true);
      setTimeout(() => setDetailToast(false), 2500);
    } catch {
      alert("আপডেট করতে সমস্যা হয়েছে");
    }
  };

  // ============================================
  // DELETE
  // ============================================
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await eventApi.delete(deleteId);
      setEvents((prev) => prev.filter((ev) => ev.id !== deleteId));
      setDeleteModalOpen(false);
      setDeleteId(null);
    } catch {
      alert("ইভেন্ট মুছতে সমস্যা হয়েছে");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================
  // FILTER BUTTONS
  // ============================================
  const filterButtons: {
    status: FilterStatus;
    label: string;
    dot?: string;
    dotAnim?: string;
    icon?: string;
  }[] = [
    { status: "all", label: "সব", icon: "☰" },
    { status: "upcoming", label: "আসন্ন", dot: "bg-emerald-400" },
    {
      status: "ongoing",
      label: "চলমান",
      dot: "bg-blue-400",
      dotAnim: "animate-pulse",
    },
    { status: "completed", label: "সম্পন্ন", dot: "bg-gray-400" },
    { status: "past", label: "পূর্ববর্তী", dot: "bg-amber-400" },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes deletePop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
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
                ইভেন্ট পরিচালনা
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                সকল ইভেন্ট দেখুন, ফিল্টার এবং পরিচালনা করুন
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNewPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
              style={{
                background: "linear-gradient(to right, #059669, #047857)",
              }}
            >
              + নতুন ইভেন্ট
            </button>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
              {loading ? "—" : toBangla(filtered.length)} টি ইভেন্ট
            </span>
          </div>
        </div>

        {/* ===== FILTER BAR ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((fb) => {
                const isActive = filterStatus === fb.status;
                return (
                  <button
                    key={fb.status}
                    onClick={() => {
                      setFilterStatus(fb.status);
                      setPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
                      isActive
                        ? "text-white border-transparent font-semibold"
                        : "border-gray-200 text-gray-600 bg-white hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, #059669, #047857)",
                            boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
                          }
                        : {}
                    }
                  >
                    {fb.dot ? (
                      <span
                        className={`w-2 h-2 ${
                          isActive ? "bg-white" : fb.dot
                        } ${fb.dotAnim ?? ""} rounded-full`}
                      />
                    ) : (
                      <span className="text-xs">{fb.icon}</span>
                    )}
                    {fb.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="ID, ধরন, পোস্টকারী, এলাকা, সময়..."
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                  📅
                </span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-auto pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-4">
              <table className="w-full">
                <tbody>
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">
                কোনো ইভেন্ট পাওয়া যায়নি
              </h3>
              <p className="text-gray-400 text-sm">
                ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100/50">
                    {[
                      { icon: "#", label: "আইডি" },
                      { icon: "🏷", label: "ধরন" },
                      { icon: "🕐", label: "সময়" },
                      { icon: "👤", label: "পোস্টকারী" },
                      { icon: "📍", label: "এলাকা" },
                      { icon: "⚙", label: "স্ট্যাটাস", center: true },
                      { icon: "📅", label: "তারিখ" },
                      { icon: "", label: "অ্যাকশন", center: true },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-5 py-3.5 text-xs font-bold text-emerald-700 uppercase tracking-wider ${
                          col.center ? "text-center" : "text-left"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 ${
                            col.center ? "justify-center" : ""
                          }`}
                        >
                          <span className="text-[10px] text-emerald-500">
                            {col.icon}
                          </span>
                          {col.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((ev) => {
                    const status = deriveStatus(ev);
                    const userName = getUserName(ev);
                    return (
                      <tr
                        key={ev.id}
                        className="transition-all duration-200 hover:bg-emerald-50/40"
                      >
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700">
                            E{ev.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <CategoryBadge category={ev.category} />
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">
                          {ev.time || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-500 text-xs">
                                👤
                              </span>
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[100px]">
                              {userName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <span className="text-emerald-400 text-[10px]">
                              📍
                            </span>
                            <span className="truncate max-w-[100px]">
                              {ev.location || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500">
                            {formatDateBn(ev.date, true)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => setSelectedEvent(ev)}
                              title="বিবরণ"
                              className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 cursor-pointer transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditEvent(ev);
                                setUpdatePanelOpen(true);
                              }}
                              title="সম্পাদনা"
                              className="w-8 h-8 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 cursor-pointer transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => {
                                setDeleteId(ev.id);
                                setDeleteModalOpen(true);
                              }}
                              title="মুছুন"
                              className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 cursor-pointer transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== PAGINATION ===== */}
        {!loading && filtered.length > 0 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {toBangla((currentPage - 1) * PAGE_SIZE + 1)}–
              {toBangla(
                Math.min(currentPage * PAGE_SIZE, filtered.length)
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

      {/* ===== DETAIL PANEL ===== */}
      <DetailPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(id) => {
          const ev = events.find((e) => e.id === id);
          if (ev) {
            setEditEvent(ev);
            setUpdatePanelOpen(true);
          }
        }}
        onDelete={(id) => {
          setDeleteId(id);
          setDeleteModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
        toast={detailToast}
      />

      {/* ===== NEW EVENT PANEL ===== */}
      <EventFormPanel
        mode="new"
        isOpen={newPanelOpen}
        onClose={() => setNewPanelOpen(false)}
        onSuccess={(ev) => setEvents((prev) => [ev, ...prev])}
      />

      {/* ===== UPDATE EVENT PANEL ===== */}
      {editEvent && (
        <EventFormPanel
          mode="update"
          isOpen={updatePanelOpen}
          onClose={() => {
            setUpdatePanelOpen(false);
            setEditEvent(null);
          }}
          onSuccess={(ev) =>
            setEvents((prev) =>
              prev.map((e) => (e.id === ev.id ? ev : e))
            )
          }
          eventId={editEvent.id}
          currentPhoto={editEvent.photo}
          initialData={{
            title: editEvent.title || "",
            category: editEvent.category || "",
            location: editEvent.location || "",
            date: editEvent.date || "",
            time: editEvent.time || "",
            needed_people: String(editEvent.needed_people || ""),
            point: String(editEvent.point || ""),
            description: editEvent.description || "",
            organizer: editEvent.organizer || "",
            status: editEvent.status || "upcoming",
            photo: null,
          }}
        />
      )}

      {/* ===== DELETE MODAL ===== */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}