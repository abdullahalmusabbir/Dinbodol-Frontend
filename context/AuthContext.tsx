"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, setTokens, clearTokens, profileApi } from "@/lib/api";
import { AuthUser, AuthTokens, UserRole } from "@/types";

// ============================================
// TYPES
// ============================================

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: "customer" | "volunteer";
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokensState] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ---- Load from localStorage on mount ----
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const access = localStorage.getItem("access_token");
        const refresh = localStorage.getItem("refresh_token");

        if (storedUser && access && refresh) {
          setUser(JSON.parse(storedUser));
          setTokensState({ access, refresh });
        }
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const syncUserFromProfile = async (
    role: UserRole,
    fallbackUser: AuthUser
  ): Promise<AuthUser> => {
    try {
      const profileRes =
        role === "admin"
          ? await profileApi.getAdminProfile()
          : role === "volunteer"
          ? await profileApi.getVolunteerProfile()
          : await profileApi.getCustomerProfile();

      const profileUser = profileRes.data?.user;

      if (profileUser) {
        return {
          id: profileUser.id,
          username: profileUser.username,
          email: profileUser.email,
          role,
        };
      }
    } catch {
      // fallback নিচে
    }

    return fallbackUser;
  };

  // ---- Register ----
  const register = useCallback(
    async (data: RegisterData) => {
      setIsLoading(true);
      try {
        const response = await authApi.register(data);
        const { tokens: newTokens } = response.data;

        setTokens(newTokens);
        setTokensState(newTokens);

        const authUser = await syncUserFromProfile(
          (data.role as UserRole) || "customer",
          {
            id: 0,
            username: data.username,
            email: data.email,
            role: (data.role as UserRole) || "customer",
          }
        );

        setUser(authUser);
        localStorage.setItem("user", JSON.stringify(authUser));

        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ---- Login ----
  const login = useCallback(
    async (data: LoginData) => {
      setIsLoading(true);
      try {
        const response = await authApi.login(data);
        const { tokens: newTokens, user: userData } = response.data;

        setTokens(newTokens);
        setTokensState(newTokens);

        const fallbackUser: AuthUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role as UserRole,
        };

        const authUser = await syncUserFromProfile(
          userData.role as UserRole,
          fallbackUser
        );

        setUser(authUser);
        localStorage.setItem("user", JSON.stringify(authUser));

        router.replace("/dashboard");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ---- Google Login ----
  const googleLogin = useCallback(
    async (token: string) => {
      setIsLoading(true);
      try {
        const response = await authApi.googleLogin(token);
        const { tokens: newTokens } = response.data;

        setTokens(newTokens);
        setTokensState(newTokens);

        const authUser = await syncUserFromProfile("customer", {
          id: 0,
          username: "",
          email: "",
          role: "customer",
        });

        setUser(authUser);
        localStorage.setItem("user", JSON.stringify(authUser));

        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ---- Logout ----
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await authApi.logout(refresh);
      }
    } catch {
      // Token already expired - no problem
    } finally {
      clearTokens();
      setUser(null);
      setTokensState(null);
      setIsLoading(false);
      router.replace("/");
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    register,
    login,
    logout,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;