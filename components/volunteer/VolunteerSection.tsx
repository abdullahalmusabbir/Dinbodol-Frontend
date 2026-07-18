"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { authApi, profileApi, volunteerApi, setTokens } from "@/lib/api";
import { VolunteerProfile } from "@/types";

// ============================================
// HELPERS
// ============================================
const toBangla = (num: number | string): string => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (d) => banglaDigits[parseInt(d)]);
};

// ============================================
// TYPES
// ============================================
interface FormData {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    phone: string;
    address: string;
    skills: string[];
    availability: string;
    avatar: File | null;
}

// ============================================
// FEATURE CARD
// ============================================
const FeatureCard = ({
    color,
    icon,
    title,
    desc,
    delay,
}: {
    color: string;
    icon: string;
    title: string;
    desc: string;
    delay: string;
}) => (
    <div
        className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden 
        transition-all duration-350 hover:-translate-y-1.5 hover:shadow-2xl ${delay}`}
    >
        <div className={`h-1 bg-gradient-to-r ${color}`} />
        <div className="p-6 text-center">
        <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 
            transition-transform duration-400 group-hover:scale-110 group-hover:-rotate-6
            ${color.includes("blue") ? "bg-blue-50" :
                color.includes("emerald") ? "bg-emerald-50" :
                color.includes("purple") ? "bg-purple-50" : "bg-amber-50"}`}
        >
            <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

// ============================================
// VOLUNTEER CARD (Sidebar)
// ============================================
const VolunteerCard = ({ vol }: { vol: VolunteerProfile }) => {
    const initials = vol.user.first_name
        ? vol.user.first_name[0] + (vol.user.last_name ? vol.user.last_name[0] : "")
        : "ভ";

    return (
        <div
        className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 
            transition-all duration-300 hover:translate-x-1 hover:bg-emerald-50 hover:border-emerald-200"
        >
        <div
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center 
            bg-gradient-to-br from-emerald-100 to-teal-100 flex-shrink-0"
        >
            {vol.avatar ? (
            <img
                src={vol.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                }}
            />
            ) : (
            <span className="text-emerald-600 font-bold text-sm">{initials}</span>
            )}
        </div>
        <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
            {vol.user.first_name} {vol.user.last_name}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
            {vol.address || "ঠিকানা নেই"}
            </p>
        </div>
        <div className="ml-auto">
            <span className="w-2 h-2 bg-emerald-400 rounded-full block" />
        </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function VolunteerSection() {
    const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
    const [volLoading, setVolLoading] = useState(true);
    const [volError, setVolError] = useState(false);
    const [totalVol, setTotalVol] = useState(0);

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(false);
    const [formError, setFormError] = useState("");

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropAreaRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<FormData>({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        phone: "",
        address: "",
        skills: [],
        availability: "",
        avatar: null,
    });

    // Fetch volunteers
    const fetchVolunteers = useCallback(async () => {
        setVolLoading(true);
        setVolError(false);
        try {
            const res = await volunteerApi.getAll();
            const data: VolunteerProfile[] = Array.isArray(res.data)
                ? res.data
                : [res.data];
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setVolunteers(shuffled.slice(0, 5));
        setTotalVol(data.length);
        } catch {
        setVolError(true);
        } finally {
        setVolLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVolunteers();
    }, [fetchVolunteers]);

    // File handling
    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setFileName("📎 " + file.name);
        setForm((prev) => ({ ...prev, avatar: file }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Skills toggle
    const toggleSkill = (skill: string) => {
        setForm((prev) => ({
        ...prev,
        skills: prev.skills.includes(skill)
            ? prev.skills.filter((s) => s !== skill)
            : [...prev.skills, skill],
        }));
    };

    // Form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (form.password !== form.confirm_password) {
        setFormError("পাসওয়ার্ড মিলছে না");
        return;
        }

        setSubmitting(true);
        try {
        // Register user
        const registerRes = await authApi.register({
            username: form.username || form.email,
            email: form.email,
            password: form.password,
            role: "volunteer",
        });

        const { tokens: newTokens } = registerRes.data;
        setTokens(newTokens);

        // Update profile
        const profileData = new FormData();
        profileData.append("first_name", form.first_name);
        profileData.append("last_name", form.last_name);
        profileData.append("address", form.address);
        profileData.append("skills", form.skills.join(", "));
        profileData.append("availability", form.availability);
        if (selectedFile) {
            profileData.append("avatar", selectedFile);
        }

        await profileApi.updateVolunteerProfile(profileData);

        // Show toast
        setToast(true);
        setTimeout(() => setToast(false), 3500);

        // Reset form
        setForm({
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            password: "",
            confirm_password: "",
            phone: "",
            address: "",
            skills: [],
            availability: "",
            avatar: null,
        });
        setSelectedFile(null);
        setFileName("");
        fetchVolunteers();
        } catch (err: any) {
        const data = err?.response?.data;
        if (data && typeof data === "object") {
            const msgs = Object.values(data).flat().join("\n");
            setFormError(msgs);
        } else {
            setFormError("সার্ভারের সাথে সংযোগ করা যায়নি");
        }
        } finally {
        setSubmitting(false);
        }
    };

    const inputClass =
        "w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 text-sm border-2 border-gray-200 " +
        "focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] focus:outline-none transition-all";

    const skillsList = [
        { value: "Community Service", label: "কমিউনিটি সেবা" },
        { value: "Technical Support", label: "টেকনিকাল সাপোর্ট" },
        { value: "Healthcare", label: "স্বাস্থ্য সেবা" },
        { value: "Education", label: "শিক্ষা" },
        { value: "Environment", label: "পরিবেশ" },
        { value: "Other", label: "অন্যান্য" },
    ];

    const addressOptions = [
        { value: "Dhaka North City", label: "ঢাকা নর্থ সিটি" },
        { value: "Dhaka South City", label: "ঢাকা সাউথ সিটি" },
        { value: "Mirpur", label: "মিরপুর" },
        { value: "Uttara", label: "উত্তরা" },
        { value: "Gulshan", label: "গুলশান" },
        { value: "Banani", label: "বনানী" },
        { value: "Baridhara", label: "বারিধারা" },
        { value: "Mohammadpur", label: "মোহাম্মদপুর" },
        { value: "Dhanmondi", label: "ধানমন্ডি" },
        { value: "Tejgaon", label: "তেজগাঁও" },
        { value: "Paltan", label: "পল্টন" },
        { value: "Motijheel", label: "মতিঝিল" },
        { value: "Ramna", label: "রমনা" },
        { value: "Shahbagh", label: "শাহবাগ" },
        { value: "Pallabi", label: "পল্লবী" },
        { value: "Mohakhali", label: "মহাখালী" },
        { value: "Banasree", label: "বনশ্রী" },
        { value: "Kawran Bazar", label: "কাওরান বাজার" },
        { value: "Khilgaon", label: "খিলগাঁও" },
        { value: "Kafrul", label: "কাফরুল" },
        { value: "Shyamoli", label: "শ্যামোলী" },
        { value: "Demra", label: "ডেমরা" },
        { value: "Turag", label: "তুরাগ" },
        { value: "Sabujbagh", label: "সবুজবাগ" },
        { value: "Cantonment", label: "ক্যান্টনমেন্ট" },
        { value: "Other", label: "অন্যান্য" },
    ];

    return (
        <>
        <style>{`
            @keyframes toastSlideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
            }
            .toast-anim { animation: toastSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .vol-hero-pattern {
            background-image:
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 40%),
                radial-gradient(circle at 60% 80%, rgba(255,255,255,0.03) 0%, transparent 50%);
            }
            .gradient-text {
            background: linear-gradient(135deg, #065f46, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            }
            @keyframes pulseDot {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            }
            .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
            .submit-shine {
            position: relative;
            overflow: hidden;
            }
            .submit-shine::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transition: left 0.5s ease;
            }
            .submit-shine:hover::before { left: 100%; }
        `}</style>

        {/* ==================== HERO ==================== */}
        <section className="relative bg-emerald-950 min-h-[520px] flex items-center overflow-hidden vol-hero-pattern">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
            <div className="absolute top-20 left-1/4 w-2 h-2 bg-emerald-400/30 rounded-full" />
            <div className="absolute top-32 right-1/3 w-3 h-3 bg-emerald-400/20 rounded-full" />
            <div className="absolute bottom-24 right-1/4 w-2 h-2 bg-emerald-300/20 rounded-full" />

            <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-6 border border-white/15">
                <div className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
                <span className="text-emerald-100 text-sm font-medium">
                স্বেচ্ছাসেবক নিবন্ধন চলছে
                </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
                স্বেচ্ছাসেবক <span className="text-emerald-300">হন</span>
            </h1>

            <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed mb-12">
                আপনার সময় এবং দক্ষতা দিয়ে সমাজের উন্নয়নে অবদান রাখুন
            </p>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
                {[
                { val: "৩.৬০+", label: "মাসিক বৃদ্ধির হার" },
                { val: "৩,২০০+", label: "সফল সমাধানকৃত সমস্যা" },
                { val: "৯০%+", label: "ব্যবহারকারী সন্তুষ্টি" },
                ].map((s, i) => (
                <div
                    key={i}
                    className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl p-5 text-center
                    transition-all duration-350 hover:-translate-y-1 hover:shadow-xl"
                >
                    <p className="text-3xl font-bold text-emerald-300 mb-1">{s.val}</p>
                    <p className="text-emerald-100/70 text-sm font-medium">{s.label}</p>
                </div>
                ))}
            </div>
            </div>

            {/* Wave */}
            <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path
                d="M0 40L48 36C96 32 192 24 288 28C384 32 480 48 576 52C672 56 768 48 864 40C960 32 1056 24 1152 28C1248 32 1344 48 1392 56L1440 64V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0V40Z"
                fill="#f9fafb"
                />
            </svg>
            </div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
                <span className="text-[10px]">⭐</span>
                আমাদের বৈশিষ্ট্যসমূহ
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                কেন আমাদের{" "}
                <span className="gradient-text">প্ল্যাটফর্ম</span> বেছে নেবেন?
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                আমরা সর্বাধুনিক প্রযুক্তি এবং সম্প্রদায়ের সহযোগিতায় একটি কার্যকর সমাধান প্রদান করি
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FeatureCard
                color="from-blue-500 to-blue-600"
                icon="⚡"
                title="দ্রুত প্রতিক্রিয়া"
                desc="যেকোনো সমস্যার জন্য দ্রুততম সময়ে প্রতিক্রিয়া এবং সমাধান"
                delay="delay-100"
                />
                <FeatureCard
                color="from-emerald-500 to-emerald-600"
                icon="🛡️"
                title="সুরক্ষিত তথ্য"
                desc="আপনার সমস্ত তথ্য এনক্রিপ্টেড এবং সম্পূর্ণ সুরক্ষিত"
                delay="delay-200"
                />
                <FeatureCard
                color="from-purple-500 to-purple-600"
                icon="👥"
                title="সহযোগিতা"
                desc="সম্প্রদায়ের সদস্যদের সাথে সহযোগিতা করে সমাধান"
                delay="delay-300"
                />
                <FeatureCard
                color="from-amber-500 to-orange-500"
                icon="📈"
                title="ট্র্যাকিং"
                desc="বাস্তব সময়ে সমস্যার সমাধানের অগ্রগতি ট্র্যাক করুন"
                delay="delay-400"
                />
            </div>
            </div>
        </section>

        {/* ==================== FORM + SIDEBAR ==================== */}
        <section className="py-12 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
                <span className="text-[10px]">🤲</span>
                রেজিস্ট্রেশন ফর্ম
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                স্বেচ্ছাসেবক হিসাবে{" "}
                <span className="gradient-text">যোগ দিন</span>
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                আপনার সম্প্রদায়ের উন্নয়নে সহায়তা করুন — নিচের ফর্মটি পূরণ করুন
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ===== LEFT: Form ===== */}
                <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-5 border-b border-emerald-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <span className="text-white text-sm">👤+</span>
                        </div>
                        <div>
                        <h3 className="font-bold text-gray-900 text-lg">রেজিস্ট্রেশন ফর্ম</h3>
                        <p className="text-xs text-gray-500 mt-0.5">সকল * চিহ্নিত ক্ষেত্র আবশ্যক</p>
                        </div>
                    </div>
                    </div>

                    <div className="p-8">
                    {formError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 whitespace-pre-line">
                        {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* First + Last Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            প্রথম নাম *
                            </label>
                            <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">👤</span>
                            <input
                                type="text"
                                required
                                value={form.first_name}
                                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                className={inputClass}
                                placeholder="আপনার প্রথম নাম"
                            />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            শেষ নাম *
                            </label>
                            <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">👤</span>
                            <input
                                type="text"
                                required
                                value={form.last_name}
                                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                className={inputClass}
                                placeholder="আপনার শেষ নাম"
                            />
                            </div>
                        </div>
                        </div>

                        {/* Username */}
                        <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            ইউজারনেম *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">@</span>
                            <input
                            type="text"
                            required
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className={inputClass}
                            placeholder="আপনার ইউজারনেম"
                            />
                        </div>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            পাসওয়ার্ড *
                            </label>
                            <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔒</span>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className={inputClass}
                                placeholder="আপনার পাসওয়ার্ড"
                            />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            পাসওয়ার্ড নিশ্চিত *
                            </label>
                            <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔒</span>
                            <input
                                type="password"
                                required
                                value={form.confirm_password}
                                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                                className={inputClass}
                                placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                            />
                            </div>
                        </div>
                        </div>

                        {/* Email + Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            ইমেইল *
                            </label>
                            <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">✉️</span>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className={inputClass}
                                placeholder="example@email.com"
                            />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            ফোন নম্বর *
                            </label>
                            <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">📞</span>
                            <input
                                type="tel"
                                required
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className={inputClass}
                                placeholder="০১৭XXXXXXXX"
                            />
                            </div>
                        </div>
                        </div>

                        {/* Address */}
                        <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            আপনার এলাকা *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">📍</span>
                            <select
                            required
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className={`${inputClass} appearance-none`}
                            >
                            <option value="">— এলাকা নির্বাচন করুন —</option>
                            {addressOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                {opt.label}
                                </option>
                            ))}
                            </select>
                        </div>
                        </div>

                        {/* Skills */}
                        <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-3 uppercase tracking-wider">
                            আপনার দক্ষতা *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {skillsList.map((skill) => (
                            <label
                                key={skill.value}
                                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer
                                transition-all duration-200
                                ${form.skills.includes(skill.value)
                                    ? "bg-emerald-50 border-emerald-300"
                                    : "border-gray-100 hover:bg-emerald-50 hover:border-emerald-200"
                                }`}
                            >
                                <input
                                type="checkbox"
                                checked={form.skills.includes(skill.value)}
                                onChange={() => toggleSkill(skill.value)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                />
                                <span
                                className={`text-sm transition-colors
                                    ${form.skills.includes(skill.value)
                                    ? "text-emerald-700 font-semibold"
                                    : "text-gray-700"
                                    }`}
                                >
                                {skill.label}
                                </span>
                            </label>
                            ))}
                        </div>
                        </div>

                        {/* Availability */}
                        <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            আপনার প্রাপ্যতা
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🕐</span>
                            <input
                            type="text"
                            value={form.availability}
                            onChange={(e) => setForm({ ...form, availability: e.target.value })}
                            className={inputClass}
                            placeholder="Weekends, Weekdays"
                            />
                        </div>
                        </div>

                        {/* Avatar Upload */}
                        <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                            ছবি আপলোড করুন
                        </label>
                        <div
                            ref={dropAreaRef}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            className={`rounded-xl p-6 text-center cursor-pointer border-2 border-dashed 
                            transition-all duration-300
                            ${isDragOver
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                            }`}
                        >
                            <span className="text-gray-300 text-3xl block mb-3">☁️</span>
                            <p className="text-sm text-gray-500 font-medium">ক্লিক করুন বা ড্র্যাগ করুন</p>
                            <p className="text-[11px] text-gray-400 mt-1">PNG, JPG (সর্বোচ্চ 5MB)</p>
                            <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                            }}
                            />
                            {fileName && (
                            <p className="text-xs text-emerald-600 font-medium mt-3">{fileName}</p>
                            )}
                        </div>
                        </div>

                        {/* Submit */}
                        <button
                        type="submit"
                        disabled={submitting}
                        className="submit-shine w-full bg-gradient-to-br from-emerald-600 to-emerald-700 
                            text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 
                            transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/35
                            disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                        {submitting ? (
                            <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            প্রসেস হচ্ছে...
                            </>
                        ) : (
                            <>
                            <span className="text-xs">✈️</span>
                            স্বেচ্ছাসেবক হিসাবে রেজিস্ট্রেশন করুন
                            </>
                        )}
                        </button>
                    </form>
                    </div>
                </div>
                </div>

                {/* ===== RIGHT: Sidebar ===== */}
                <div className="lg:col-span-4">
                <div className="sticky top-[100px] space-y-6">
                    {/* Active Volunteers */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 border-b border-emerald-100/50">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                            <span className="text-white text-sm">👥</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">সক্রিয় স্বেচ্ছাসেবক</h3>
                            <p className="text-xs text-gray-500 mt-0.5">সাম্প্রতিক রেজিস্ট্রেশন</p>
                        </div>
                        </div>
                    </div>

                    <div className="p-4">
                        {volLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full" />
                        </div>
                        ) : volError ? (
                        <div className="text-center py-6">
                            <span className="text-gray-300 text-2xl block mb-2">⚠️</span>
                            <p className="text-xs text-gray-400">তথ্য লোড করা যায়নি</p>
                        </div>
                        ) : (
                        <div className="space-y-2.5">
                            {volunteers.map((vol) => (
                            <VolunteerCard key={vol.id} vol={vol} />
                            ))}
                        </div>
                        )}

                        {/* Total */}
                        <div className="mt-5 pt-5 border-t border-gray-100">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                            <p className="text-3xl font-extrabold gradient-text mb-1">
                            {totalVol > 0 ? `${toBangla(totalVol)}+` : "১২৫+"}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">সক্রিয় স্বেচ্ছাসেবক</p>
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* Why Join */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                            <span className="text-amber-500 text-sm">❤️</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">কেন যোগ দেবেন?</h4>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                        { icon: "🏅", color: "border-emerald-200", bg: "bg-emerald-50", text: "সার্টিফিকেট ও স্বীকৃতি পাবেন" },
                        { icon: "👥", color: "border-blue-200", bg: "bg-blue-50", text: "নতুন মানুষের সাথে পরিচয় হবে" },
                        { icon: "🤲", color: "border-purple-200", bg: "bg-purple-50", text: "সমাজে সরাসরি অবদান রাখতে পারবেন" },
                        { icon: "🎓", color: "border-amber-200", bg: "bg-amber-50", text: "নতুন দক্ষতা শিখতে পারবেন" },
                        ].map((item, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${item.color} bg-gray-50/50
                            transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
                        >
                            <div className={`w-6 h-6 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <span className="text-[10px]">{item.icon}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* ==================== TOAST ==================== */}
        {toast && (
            <div className="fixed top-[90px] right-6 z-50 pointer-events-none">
            <div className="toast-anim bg-white rounded-xl shadow-2xl border border-gray-100 px-6 py-4 flex items-center gap-4 max-w-sm">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600">✓</span>
                </div>
                <div>
                <p className="font-bold text-gray-900 text-sm">রেজিস্ট্রেশন সফল!</p>
                <p className="text-gray-500 text-xs mt-0.5">
                    স্বেচ্ছাসেবক হিসেবে সফলভাবে নিবন্ধিত হয়েছেন
                </p>
                </div>
            </div>
            </div>
        )}
        </>
    );
}