"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "./LoginModal";

export default function Navbar() {
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [userDropOpen, setUserDropOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [lastLoginView, setLastLoginView] = useState<"login" | "register" | "forgot">("login");
    
    const reportsRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const reportsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Scroll ──
    useEffect(() => {
        const onScroll = () => {
        setScrolled(window.scrollY > 10);
        if (mobileOpen) setMobileOpen(false);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [mobileOpen]);

    // ── Outside click ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
        if (reportsRef.current && !reportsRef.current.contains(e.target as Node))
            setReportsOpen(false);
        if (userRef.current && !userRef.current.contains(e.target as Node))
            setUserDropOpen(false);
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    // ── Reports hover ──
    const openReports = useCallback(() => {
        if (reportsTimeout.current) clearTimeout(reportsTimeout.current);
        setReportsOpen(true);
    }, []);
    const closeReports = useCallback((delay = 200) => {
        reportsTimeout.current = setTimeout(() => setReportsOpen(false), delay);
    }, []);

    // ── User dropdown hover ──
    const openUser = useCallback(() => {
        if (userTimeout.current) clearTimeout(userTimeout.current);
        setUserDropOpen(true);
    }, []);
    const closeUser = useCallback((delay = 300) => {
        userTimeout.current = setTimeout(() => setUserDropOpen(false), delay);
    }, []);

    const firstLetter = user?.username?.slice(0, 1).toUpperCase() ?? "";

    return (
        <>
        {/* ── Page Loader ── */}
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800;900&display=swap');
            * { font-family: 'Noto Sans Bengali', sans-serif; }
            .header-transition { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
            .header-scrolled {
            background: rgba(255,255,255,0.95) !important;
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0,0,0,0.06);
            }
            .nav-link { position:relative; padding-bottom:4px; transition:color 0.3s ease; }
            .nav-link::after {
            content:''; position:absolute; bottom:-2px; left:50%;
            width:0; height:2.5px;
            background:linear-gradient(90deg,#059669,#10b981);
            border-radius:999px;
            transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
            transform:translateX(-50%);
            }
            .nav-link:hover::after { width:100%; }
            .profile-ring {
            background:linear-gradient(135deg,#059669,#10b981,#34d399);
            padding:2px; border-radius:50%; transition:all 0.3s ease;
            }
            .profile-ring:hover { transform:scale(1.1); box-shadow:0 0 20px rgba(16,185,129,0.4); }
            .dropdown-glass {
            background:rgba(255,255,255,0.98);
            backdrop-filter:blur(24px);
            border:1px solid rgba(0,0,0,0.06);
            }
            .dropdown-item {
            padding:0.7rem 1rem; font-weight:500; border-radius:8px;
            margin:2px 6px; transition:all 0.2s ease;
            }
            .dropdown-item:hover {
            background:linear-gradient(135deg,#ecfdf5,#d1fae5);
            color:#065f46; transform:translateX(4px);
            }
            .user-dropdown-glass {
            background:rgba(255,255,255,0.98);
            backdrop-filter:blur(24px);
            border:1px solid rgba(0,0,0,0.08);
            box-shadow:0 20px 50px rgba(0,0,0,0.12);
            }
            .user-dropdown-item {
            padding:0.65rem 1rem; font-weight:500; border-radius:10px;
            margin:2px 6px; transition:all 0.2s ease;
            display:flex; align-items:center; gap:0.75rem;
            font-size:14px; color:#374151; text-decoration:none;
            }
            .user-dropdown-item:hover {
            background:linear-gradient(135deg,#ecfdf5,#d1fae5);
            color:#065f46; transform:translateX(3px);
            }
            .logout-item:hover {
            background:linear-gradient(135deg,#fef2f2,#fee2e2) !important;
            color:#991b1b !important;
            }
            .login-btn {
            background:linear-gradient(135deg,#059669,#047857);
            transition:all 0.3s ease; position:relative; overflow:hidden;
            }
            .login-btn::before {
            content:''; position:absolute; top:0; left:-100%;
            width:100%; height:100%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
            transition:left 0.5s ease;
            }
            .login-btn:hover::before { left:100%; }
            .login-btn:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(5,150,105,0.35); }
            .hamburger-line { transition:all 0.3s cubic-bezier(0.4,0,0.2,1); transform-origin:center; }
            .mobile-menu-enter { animation:slideDown 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
            @keyframes slideDown {
            from { opacity:0; transform:translateY(-16px); }
            to   { opacity:1; transform:translateY(0); }
            }
            .mobile-link {
            transition:all 0.2s ease; border-radius:10px; padding:0.75rem 1rem;
            }
            .mobile-link:hover { background:#ecfdf5; color:#065f46; padding-left:1.25rem; }
        `}</style>

        <header
            id="mainHeader"
            className={`fixed top-0 left-0 w-full z-50 header-transition ${
            scrolled ? "header-scrolled" : ""
            }`}
            style={{ backgroundColor: scrolled ? "" : "transparent" }}
        >
            <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="flex justify-between items-center h-[72px]">

                {/* ── Logo ── */}
                <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <Image
                    src="/images/icon.png"
                    alt="logo"
                    width={44}
                    height={44}
                    className="w-full h-full object-contain"
                    />
                </div>
                </Link>

                {/* ── Desktop Nav ── */}
                <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">

                <Link
                    href="/payment"
                    className={`nav-link px-3 py-2 text-[15px] font-medium rounded-lg ${
                    scrolled ? "text-gray-700 hover:text-emerald-700" : "!text-white hover:text-emerald-200"
                    }`}
                >
                    ডোনেশন
                </Link>

                {/* Reports Dropdown */}
                <div
                    ref={reportsRef}
                    className="relative"
                    onMouseEnter={openReports}
                    onMouseLeave={() => closeReports(250)}
                >
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        reportsOpen ? setReportsOpen(false) : setReportsOpen(true);
                    }}
                    className={`nav-link flex items-center space-x-1.5 px-3 py-2 text-[15px] font-medium rounded-lg focus:outline-none ${
                        scrolled ? "text-gray-700 hover:text-emerald-700" : "!text-white"
                    }`}
                    >
                    <span>রিপোর্ট</span>
                    <i
                        className="fa-solid fa-chevron-down text-[10px] transition-transform duration-300"
                        style={{ transform: reportsOpen ? "rotate(180deg)" : "" }}
                    />
                    </button>
                    <div
                    className={`absolute left-0 mt-2 w-52 dropdown-glass rounded-xl shadow-xl z-50 py-2 transition-all duration-300 ${
                        reportsOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 -translate-y-3 scale-95 pointer-events-none"
                    }`}
                    >
                    <Link
                        href="/reports"
                        onClick={() => setReportsOpen(false)}
                        className="flex items-center space-x-3 dropdown-item text-gray-700"
                    >
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-sm w-5 text-center" />
                        <span>সমস্যা রিপোর্ট</span>
                    </Link>
                    <Link
                        href="/safety"
                        onClick={() => setReportsOpen(false)}
                        className="flex items-center space-x-3 dropdown-item text-gray-700"
                    >
                        <i className="fa-solid fa-shield-halved text-blue-500 text-sm w-5 text-center" />
                        <span>নিরাপত্তা সহায়তা</span>
                    </Link>
                    </div>
                </div>

                <Link
                    href="/lost-found"
                    className={`nav-link px-3 py-2 text-[15px] font-medium rounded-lg ${
                    scrolled ? "text-gray-700 hover:text-emerald-700" : "!text-white"
                    }`}
                >
                    হারানো-পাওয়া
                </Link>
                <Link
                    href="/events"
                    className={`nav-link px-3 py-2 text-[15px] font-medium rounded-lg ${
                    scrolled ? "text-gray-700 hover:text-emerald-700" : "!text-white"
                    }`}
                >
                    ইভেন্টস
                </Link>
                <Link
                    href="/volunteer"
                    className={`nav-link px-3 py-2 text-[15px] font-medium rounded-lg ${
                    scrolled ? "text-gray-700 hover:text-emerald-700" : "!text-white"
                    }`}
                >
                    স্বেচ্ছাসেবক
                </Link>

                <div className="w-px h-6 bg-gray-300 mx-2" />

                {user ? (
                    /* ── User Profile Dropdown ── */
                    <div
                    ref={userRef}
                    className="relative"
                    onMouseEnter={openUser}
                    onMouseLeave={() => closeUser(300)}
                    >
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        userDropOpen ? setUserDropOpen(false) : setUserDropOpen(true);
                        }}
                        className="ml-1 focus:outline-none cursor-pointer"
                    >
                        <div className="profile-ring">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-user text-emerald-700 text-sm" />
                        </div>
                        </div>
                    </button>

                    <div
                        className={`absolute right-0 mt-3 w-60 user-dropdown-glass rounded-2xl z-50 py-2 overflow-hidden transition-all duration-300 ${
                        userDropOpen
                            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                            : "opacity-0 -translate-y-3 scale-95 pointer-events-none"
                        }`}
                    >
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {firstLetter}
                            </div>
                            <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
                            <p className="text-[11px] text-gray-400">সক্রিয় অ্যাকাউন্ট</p>
                            </div>
                        </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5">
                        <Link
                            href="/dashboard"
                            onClick={() => setUserDropOpen(false)}
                            className="user-dropdown-item"
                        >
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-gauge-high text-emerald-600 text-xs" />
                            </div>
                            <div>
                            <span className="block text-sm font-medium">ড্যাশবোর্ড</span>
                            <span className="block text-[11px] text-gray-400">আপনার প্যানেল</span>
                            </div>
                        </Link>

                        <div className="h-px bg-gray-100 mx-4 my-1" />

                        <button
                            onClick={() => { setUserDropOpen(false); logout(); }}
                            className="user-dropdown-item logout-item w-full text-left"
                        >
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-right-from-bracket text-red-500 text-xs" />
                            </div>
                            <div>
                            <span className="block text-sm font-medium">লগআউট</span>
                            <span className="block text-[11px] text-gray-400">অ্যাকাউন্ট থেকে বের হোন</span>
                            </div>
                        </button>
                        </div>
                    </div>
                    </div>
                ) : (
                    <button
                    onClick={() => setLoginModalOpen(true)}
                    className="login-btn ml-2 px-5 py-2.5 text-white text-[14px] font-semibold rounded-full"
                    >
                    <i className="fa-solid fa-arrow-right-to-bracket mr-1.5" />
                    লগইন করুন
                    </button>
                )}
                </nav>

                {/* ── Hamburger ── */}
                <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
                >
                <div className="flex flex-col items-center justify-center space-y-[5px]">
                    <span
                    className="hamburger-line block w-[22px] h-[2px] rounded-full"
                    style={{
                        backgroundColor: scrolled ? "#1f2937" : "#fff",
                        transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "",
                    }}
                    />
                    <span
                    className="hamburger-line block w-[22px] h-[2px] rounded-full"
                    style={{
                        backgroundColor: scrolled ? "#1f2937" : "#fff",
                        opacity: mobileOpen ? 0 : 1,
                    }}
                    />
                    <span
                    className="hamburger-line block w-[22px] h-[2px] rounded-full"
                    style={{
                        backgroundColor: scrolled ? "#1f2937" : "#fff",
                        transform: mobileOpen ? "translateY(-7px) rotate(-45deg)" : "",
                    }}
                    />
                </div>
                </button>
            </div>
            </div>

            {/* ── Mobile Menu ── */}
            {mobileOpen && (
            <div className="mobile-menu-enter md:hidden bg-white/98 shadow-2xl px-5 py-6 space-y-1 text-gray-700 font-medium border-t border-gray-100"
                style={{ backdropFilter: "blur(20px)" }}
            >
                <Link href="/payment" className="mobile-link flex items-center space-x-3 text-[15px]">
                <i className="fa-solid fa-hand-holding-heart text-emerald-600 w-5 text-center text-sm" />
                <span>ডোনেশন</span>
                </Link>

                <div className="px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">রিপোর্ট</p>
                </div>

                <Link href="/reports" className="mobile-link flex items-center space-x-3 text-[15px] pl-4">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 w-5 text-center text-sm" />
                <span>সমস্যা রিপোর্ট</span>
                </Link>
                <Link href="/safety" className="mobile-link flex items-center space-x-3 text-[15px] pl-4">
                <i className="fa-solid fa-shield-halved text-blue-500 w-5 text-center text-sm" />
                <span>নিরাপত্তা সহায়তা</span>
                </Link>

                <div className="h-px bg-gray-100 my-2" />

                <Link href="/lost-found" className="mobile-link flex items-center space-x-3 text-[15px]">
                <i className="fa-solid fa-magnifying-glass text-purple-500 w-5 text-center text-sm" />
                <span>হারানো-পাওয়া</span>
                </Link>
                <Link href="/events" className="mobile-link flex items-center space-x-3 text-[15px]">
                <i className="fa-solid fa-calendar-days text-rose-500 w-5 text-center text-sm" />
                <span>ইভেন্টস</span>
                </Link>
                <Link href="/volunteer" className="mobile-link flex items-center space-x-3 text-[15px]">
                <i className="fa-solid fa-people-group text-cyan-600 w-5 text-center text-sm" />
                <span>স্বেচ্ছাসেবক</span>
                </Link>

                <div className="h-px bg-gray-100 my-2" />

                {user ? (
                <>
                    <div className="bg-emerald-50 rounded-xl p-3 mb-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {firstLetter}
                        </div>
                        <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
                        <p className="text-[11px] text-emerald-600">সক্রিয় অ্যাকাউন্ট</p>
                        </div>
                    </div>
                    </div>
                    <Link href="/dashboard" className="mobile-link flex items-center space-x-3 text-[15px]">
                    <i className="fa-solid fa-gauge-high text-emerald-600 w-5 text-center text-sm" />
                    <span>ড্যাশবোর্ড</span>
                    </Link>
                    <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="mobile-link flex items-center space-x-3 text-[15px] text-red-600 w-full"
                    >
                    <i className="fa-solid fa-right-from-bracket text-red-500 w-5 text-center text-sm" />
                    <span>লগআউট</span>
                    </button>
                </>
                ) : (
                <button
                    onClick={() => { setMobileOpen(false); setLoginModalOpen(true); }}
                    className="flex items-center justify-center space-x-2 mt-3 w-full py-3 login-btn text-white rounded-xl font-semibold text-[15px]"
                >
                    <i className="fa-solid fa-arrow-right-to-bracket" />
                    <span>লগইন করুন</span>
                </button>
                )}
            </div>
            )}
        </header>

        {/* ── Login Modal ── */}
        <LoginModal
            isOpen={loginModalOpen}
            onClose={() => setLoginModalOpen(false)}
            initialView={lastLoginView}
            onViewChange={setLastLoginView}
        />
        </>
    );
}