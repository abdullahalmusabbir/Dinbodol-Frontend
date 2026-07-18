"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    switch (user?.role) {
      case "admin":
        router.replace("/dashboard/admin");
        break;
      case "volunteer":
        router.replace("/dashboard/volunteer");
        break;
      case "customer":
        router.replace("/dashboard/customer");
        break;
      default:
        router.replace("/");
    }
  }, [user, isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4" />
        <p className="text-gray-500 text-sm">রিডাইরেক্ট হচ্ছে...</p>
      </div>
    </div>
  );
}