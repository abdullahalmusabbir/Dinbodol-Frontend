"use client";

import { useState, useEffect, useRef } from "react";
import { profileApi, authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
    CustomerProfile,
    VolunteerProfile,
    AdminProfile,
    UserRole,
} from "@/types";

// ============================================
// TYPES
// ============================================

type AnyProfile = CustomerProfile | VolunteerProfile | AdminProfile;

interface ProfileField {
    key: string;
    label: string;
    type: "text" | "email" | "date" | "textarea";
    icon: (className: string) => React.ReactNode; // fixed: factory function
    iconBg: string;
    iconColor: string;
    placeholder?: string;
}

interface RoleConfig<P> {
    getProfile: () => Promise<any>;
    updateProfile: (data: FormData) => Promise<any>;
    fields: ProfileField[];
    getMiniStats: (profile: P) => { label: string; value: number | string }[];
    getAccountFields: (profile: P) => {
        label: string;
        value: string;
        iconBg: string;
        iconColor: string;
    }[];
    roleLabel: string;
    roleBadgeColor: string;
}

// ============================================
// SVG ICON HELPERS
// ============================================

const SvgIcon = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className: string;
}) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        {children}
    </svg>
);

const IC = {
    user: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    email: (c: string) => (
        <SvgIcon className={c}>
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </SvgIcon>
    ),
    location: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    calendar: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    edit: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    check: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    camera: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    info: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    warning: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    checkCircle: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    lock: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    key: (c: string) => (
        <SvgIcon className={c}>
        <path
            fillRule="evenodd"
            d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
            clipRule="evenodd"
        />
        </SvgIcon>
    ),
    lightbulb: (c: string) => (
        <SvgIcon className={c}>
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </SvgIcon>
    ),
};

// ============================================
// ROLE CONFIGURATIONS
// ============================================

const ROLE_CONFIGS: Record<
    UserRole,
    | RoleConfig<CustomerProfile>
    | RoleConfig<VolunteerProfile>
    | RoleConfig<AdminProfile>
> = {
    customer: {
        getProfile: () => profileApi.getCustomerProfile(),
        updateProfile: (data) => profileApi.updateCustomerProfile(data),
        fields: [
        {
            key: "full_name",
            label: "পুরো নাম",
            type: "text",
            icon: IC.user,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
        },
        {
            key: "email",
            label: "ইমেইল",
            type: "email",
            icon: IC.email,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            key: "address",
            label: "এলাকা",
            type: "text",
            icon: IC.location,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
        },
        {
            key: "date_of_birth",
            label: "জন্মদিন",
            type: "date",
            icon: IC.calendar,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
        },
        ],
        getMiniStats: () => [
        { label: "মোট রিপোর্ট", value: 0 },
        { label: "সমাধান", value: 0 },
        ],
        getAccountFields: (profile: CustomerProfile) => [
        {
            label: "ইউজারনেম",
            value: profile.user.username,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-500",
        },
        {
            label: "ইমেইল",
            value: profile.user.email || "যুক্ত হয়নি",
            iconBg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            label: "জন্মতারিখ",
            value: profile.date_of_birth
            ? new Date(profile.date_of_birth).toLocaleDateString("bn-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
                })
            : "যুক্ত হয়নি",
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
        },
        {
            label: "এলাকা",
            value: profile.address || "যুক্ত হয়নি",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
        },
        ],
        roleLabel: "কাস্টমার",
        roleBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    volunteer: {
        getProfile: () => profileApi.getVolunteerProfile(),
        updateProfile: (data) => profileApi.updateVolunteerProfile(data),
        fields: [
        {
            key: "full_name",
            label: "পুরো নাম",
            type: "text",
            icon: IC.user,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
        },
        {
            key: "email",
            label: "ইমেইল",
            type: "email",
            icon: IC.email,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            key: "address",
            label: "এলাকা",
            type: "text",
            icon: IC.location,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
        },
        {
            key: "skills",
            label: "দক্ষতা",
            type: "textarea",
            icon: IC.user,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-500",
            placeholder: "আপনার দক্ষতাগুলো লিখুন",
        },
        {
            key: "availability",
            label: "উপলব্ধতা",
            type: "text",
            icon: IC.calendar,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-500",
            placeholder: "যেমন: সপ্তাহান্তে, দিন", // fixed: removed stray quote
        },
        ],
        getMiniStats: (profile: VolunteerProfile) => [
        { label: "পয়েন্ট", value: profile.point || 0 },
        { label: "ইভেন্ট", value: profile.event_attendance || 0 },
        ],
        getAccountFields: (profile: VolunteerProfile) => [
        {
            label: "ইউজারনেম",
            value: profile.user.username,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-500",
        },
        {
            label: "ইমেইল",
            value: profile.user.email || "যুক্ত হয়নি",
            iconBg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            label: "এলাকা",
            value: profile.address || "যুক্ত হয়নি",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
        },
        {
            label: "যোগদান",
            value: profile.joined_at
            ? new Date(profile.joined_at).toLocaleDateString("bn-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
                })
            : "—",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-500",
        },
        ],
        roleLabel: "স্বেচ্ছাসেবক",
        roleBadgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    admin: {
        getProfile: () => profileApi.getAdminProfile(),
        updateProfile: (data) => profileApi.updateAdminProfile(data),
        fields: [
        {
            key: "full_name",
            label: "পুরো নাম",
            type: "text",
            icon: IC.user,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
        },
        {
            key: "email",
            label: "ইমেইল",
            type: "email",
            icon: IC.email,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            key: "date_of_birth",
            label: "জন্মদিন",
            type: "date",
            icon: IC.calendar,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
        },
        ],
        getMiniStats: (profile: AdminProfile) => [
        {
            label: "যোগদান",
            value: profile.joined_at
            ? new Date(profile.joined_at).toLocaleDateString("bn-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
                })
            : "—",
        },
        ],
        getAccountFields: (profile: AdminProfile) => [
        {
            label: "ইউজারনেম",
            value: profile.user.username,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-500",
        },
        {
            label: "ইমেইল",
            value: profile.user.email || "যুক্ত হয়নি",
            iconBg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            label: "জন্মতারিখ",
            value: profile.date_of_birth
            ? new Date(profile.date_of_birth).toLocaleDateString("bn-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
                })
            : "যুক্ত হয়নি",
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
        },
        ],
        roleLabel: "অ্যাডমিন",
        roleBadgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfileC() {
    const { user, isLoading: authLoading } = useAuth();
    const role = user?.role as UserRole | undefined;

    const [profile, setProfile] = useState<AnyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);

    // All possible form fields; role determines which are used
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        address: "",
        date_of_birth: "",
        skills: "",
        availability: "",
    });

    const [originalForm, setOriginalForm] = useState({ ...form });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    // Password state
    const [pwSaving, setPwSaving] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState("");

    const config:
        | RoleConfig<CustomerProfile>
        | RoleConfig<VolunteerProfile>
        | RoleConfig<AdminProfile>
        | null = role ? ROLE_CONFIGS[role] : null;

    // ===== FETCH PROFILE =====
    useEffect(() => {
        if (authLoading) return;
        if (!user?.id || !config) {
        setError("প্রথমে লগইন করুন");
        setLoading(false);
        return;
        }

        const fetchProfile = async () => {
        try {
            const res = await config.getProfile();
            const p = res.data;
            setProfile(p);

            // Initialize form from profile
            setForm({
            first_name: p.user.first_name || "",
            last_name: p.user.last_name || "",
            email: p.user.email || "",
            address: (p as any).address || "",
            date_of_birth: p.date_of_birth || "",
            skills: (p as any).skills || "",
            availability: (p as any).availability || "",
            });
            setOriginalForm({
            first_name: p.user.first_name || "",
            last_name: p.user.last_name || "",
            email: p.user.email || "",
            address: (p as any).address || "",
            date_of_birth: p.date_of_birth || "",
            skills: (p as any).skills || "",
            availability: (p as any).availability || "",
            });
            if (p.avatar) setAvatarPreview(p.avatar);
        } catch {
            setError("প্রোফাইল লোড করতে সমস্যা হয়েছে");
        } finally {
            setLoading(false);
        }
        };

        fetchProfile();
    }, [user?.id, authLoading, config]);

    // ===== EDIT MODE =====
    const handleEnableEdit = () => setIsEditMode(true);

    const handleCancelEdit = () => {
        setForm(originalForm);
        setAvatar(null);
        if (profile?.avatar) setAvatarPreview(profile.avatar);
        else setAvatarPreview("");
        setIsEditMode(false);
        setError("");
    };

    // ===== AVATAR PREVIEW =====
    const handleFileSelect = (file: File) => {
        setAvatar(file);
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    // ===== SAVE PROFILE =====
    const handleSaveProfile = async () => {
        if (!config) return;
        setSaving(true);
        setError("");
        try {
        const data = new FormData();

        // Split full name into first_name + last_name
        const fullName = `${form.first_name} ${form.last_name}`.trim();
        const parts = fullName.split(/\s+/);
        data.append("first_name", parts[0] || "");
        data.append("last_name", parts.slice(1).join(" ") || "");
        data.append("email", form.email);

        // Role-specific fields
        if (role === "customer" || role === "volunteer") {
            data.append("address", form.address);
        }
        if (role === "customer" || role === "admin") {
            if (form.date_of_birth) data.append("date_of_birth", form.date_of_birth);
        }
        if (role === "volunteer") {
            data.append("skills", form.skills);
            data.append("availability", form.availability);
        }

        if (avatar) data.append("avatar", avatar);

        await config.updateProfile(data);

        setOriginalForm(form);
        setSuccess(true);
        setIsEditMode(false);
        setTimeout(() => setSuccess(false), 1500);

        // Re-fetch profile
        const res = await config.getProfile();
        setProfile(res.data);
        } catch {
        setError("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
        } finally {
        setSaving(false);
        }
    };

    // ===== LOADING =====
    if (loading) {
        return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
        </div>
        );
    }

    const fullName =
        profile?.user.first_name || profile?.user.last_name
        ? `${profile?.user.first_name || ""} ${profile?.user.last_name || ""}`.trim()
        : profile?.user.username || "";

    const avatarInitial =
        (profile?.user.first_name?.[0] || profile?.user.username?.[0] || "ব")
        .toUpperCase();

    const miniStats = config && profile ? config.getMiniStats(profile as any) : [];
    const accountFields = config && profile ? config.getAccountFields(profile as any) : [];

    return (
        <div id="content-profile" className="mt-2">
        {/* ===== Section Header ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">প্রোফাইল সেটিংস</h2>
                <p className="text-xs text-gray-400 mt-0.5">আপনার তথ্য দেখুন এবং সম্পাদনা করুন</p>
            </div>
            </div>

            {!isEditMode && (
            <button
                onClick={handleEnableEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-emerald-200 text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition-all cursor-pointer"
            >
                {IC.edit("w-3.5 h-3.5")}
                <span className="hidden sm:inline">প্রোফাইল সম্পাদনা</span>
                <span className="sm:hidden">সম্পাদনা</span>
            </button>
            )}
        </div>

        {/* ===== Toast ===== */}
        {success && (
            <div className="mb-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-[profcToastIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                {IC.checkCircle("w-4 h-4 text-emerald-500")}
                <span className="text-sm font-medium text-emerald-700">প্রোফাইল সফলভাবে আপডেট হয়েছে!</span>
            </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ==================== Left Column ==================== */}
            <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {/* Cover Gradient */}
                <div className="h-24 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='80' cy='20' r='30' fill='rgba(255,255,255,0.05)'/%3E%3Ccircle cx='20' cy='80' r='40' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E")` }} />
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-12 relative z-10">
                <div className="relative cursor-pointer group" onClick={() => isEditMode && fileRef.current?.click()}>
                    <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold">
                        {avatarInitial}
                        </div>
                    )}
                    </div>
                    {isEditMode && (
                    <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center border-4 border-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {IC.camera("w-5 h-5 text-white")}
                    </div>
                    )}
                    <input ref={fileRef} type="file" className="hidden" accept="image/*" disabled={!isEditMode} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                </div>
                </div>

                {/* User Info */}
                <div className="text-center px-5 pb-5 pt-4">
                <h3 className="text-lg font-bold text-gray-900">{fullName}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{profile?.user.username}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config?.roleBadgeColor || "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    {config?.roleLabel || "সদস্য"}
                    </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">ইউজার আইডি: {profile?.user.id}</p>
                </div>

                {/* Mini Stats */}
                <div className="border-t border-gray-50 grid grid-cols-2 divide-x divide-gray-50">
                {miniStats.map((stat, idx) => (
                    <div key={idx} className="text-center py-4">
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{stat.label}</p>
                    </div>
                ))}
                </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    </div>
                    <h4 className="text-sm font-bold text-gray-700">একাউন্ট তথ্য</h4>
                </div>
                </div>

                <div className="divide-y divide-gray-50">
                {accountFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-gray-50">
                    <div className={`w-8 h-8 ${field.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{field.label}</p>
                        <p className="text-sm font-semibold text-gray-700 truncate">{field.value}</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            </div>

            {/* ==================== Right Column ==================== */}
            <div className="lg:col-span-2">
            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-800">ব্যক্তিগত তথ্য</h3>
                </div>
                </div>

                {/* Error */}
                {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                )}

                {/* Fields */}
                <div className="p-6 space-y-5">
                {config?.fields.map((field) => {
                    // Special handling for full_name which maps to first_name + last_name
                    const isFullName = field.key === "full_name";
                    const value = isFullName
                    ? `${form.first_name} ${form.last_name}`.trim()
                    : (form[field.key as keyof typeof form] ?? "");

                    return (
                    <div key={field.key}>
                        <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-600">
                        <div className={`w-6 h-6 ${field.iconBg} rounded-md flex items-center justify-center`}>{field.icon("w-3 h-3")}</div>
                        {field.label}
                        </label>
                        {field.type === "textarea" ? (
                        <textarea
                            value={value}
                            onChange={(e) => {
                            if (isFullName) {
                                const parts = e.target.value.split(/\s+/);
                                setForm({ ...form, first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" });
                            } else {
                                setForm({ ...form, [field.key]: e.target.value });
                            }
                            }}
                            disabled={!isEditMode}
                            rows={3}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 focus:outline-none transition-all duration-300 resize-none ${isEditMode ? "bg-white border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "bg-gray-50 border-gray-200 cursor-default"}`}
                        />
                        ) : (
                        <input
                            type={field.type}
                            value={value}
                            onChange={(e) => {
                            if (isFullName) {
                                const parts = e.target.value.split(/\s+/);
                                setForm({ ...form, first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" });
                            } else {
                                setForm({ ...form, [field.key]: e.target.value });
                            }
                            }}
                            disabled={!isEditMode}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 focus:outline-none transition-all duration-300 ${isEditMode ? "bg-white border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "bg-gray-50 border-gray-200 cursor-default"}`}
                        />
                        )}
                    </div>
                    );
                })}
                </div>

                {/* Save Section */}
                {isEditMode && (
                <div className="px-6 pb-6">
                    <div className="flex gap-3">
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            সংরক্ষণ হচ্ছে...
                        </>
                        ) : (
                        <>
                            {IC.check("w-3 h-3")}
                            সংরক্ষণ করুন
                        </>
                        )}
                    </button>
                    <button onClick={handleCancelEdit} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                        বাতিল
                    </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
                    {IC.info("w-3 h-3 text-gray-300")}
                    পরিবর্তনগুলো সংরক্ষণ করতে "সংরক্ষণ করুন" বাটনে ক্লিক করুন
                    </p>
                </div>
                )}
            </div>

            {/* ===== Password Change Card ===== */}
            <PasswordChangeCard />
            </div>
        </div>
        </div>
    );
}

// ============================================
// PASSWORD CHANGE CARD (Universal)
// ============================================

function PasswordChangeCard() {
    const [pwSaving, setPwSaving] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState("");

    const [pwForm, setPwForm] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError("");

        if (pwForm.new_password !== pwForm.confirm_password) {
        setPwError("নতুন পাসওয়ার্ড মিলছে না");
        return;
        }

        setPwSaving(true);
        try {
        await authApi.changePassword({
            old_password: pwForm.old_password,
            new_password: pwForm.new_password,
        });
        setPwSuccess(true);
        setPwForm({ old_password: "", new_password: "", confirm_password: "" });
        setTimeout(() => setPwSuccess(false), 3000);
        } catch {
        setPwError("পাসওয়ার্ড পরিবর্তন করা যায়নি");
        } finally {
        setPwSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800">পাসওয়ার্ড</h3>
            </div>
        </div>

        <div className="p-6">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                </div>
                <div>
                <p className="text-sm font-semibold text-gray-700">পাসওয়ার্ড পরিবর্তন</p>
                <p className="text-[11px] text-gray-400">সিকিউরিটির জন্য নিয়মিত পরিবর্তন করুন</p>
                </div>
            </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
            {pwError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{pwError}</div>}
            {pwSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">✓ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!</div>}

            {/* Old Password */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">বর্তমান পাসওয়ার্ড</label>
                <input
                type="password"
                value={pwForm.old_password}
                onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                required
                placeholder="বর্তমান পাসওয়ার্ড"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">নতুন পাসওয়ার্ড</label>
                <input
                    type="password"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    required
                    placeholder="নতুন পাসওয়ার্ড"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition-all"
                />
                </div>

                {/* Confirm Password */}
                <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">পাসওয়ার্ড নিশ্চিত</label>
                <input
                    type="password"
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    required
                    placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition-all"
                />
                </div>
            </div>

            <button
                type="submit"
                disabled={pwSaving}
                className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {pwSaving ? (
                <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    পরিবর্তন হচ্ছে...
                </>
                ) : (
                "পরিবর্তন"
                )}
            </button>
            </form>
        </div>
        </div>
    );
}