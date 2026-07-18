import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { AuthTokens } from "@/types";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://diptodip.pythonanywhere.com";

// ============================================
// AXIOS INSTANCE
// ============================================

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR - Token Attach
// ============================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const access = localStorage.getItem("access_token");
      if (access && config.headers) {
        config.headers["Authorization"] = `Bearer ${access}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - Token Refresh
// ============================================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh,
        });

        const newAccess: string = res.data.access;
        localStorage.setItem("access_token", newAccess);

        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// TOKEN HELPERS
// ============================================

export const setTokens = (tokens: AuthTokens) => {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

// ============================================
// AUTH APIs
// ============================================

export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    role?: "customer" | "volunteer";
  }) => api.post("/auth/register/", data),

  login: (data: { username: string; password: string }) =>
    api.post("/auth/login/", data),

  logout: (refresh: string) => api.post("/auth/logout/", { refresh }),

  googleLogin: (token: string) => api.post("/auth/google/", { token }),

  refreshToken: (refresh: string) =>
    api.post("/auth/token/refresh/", { refresh }),

  forgetPassword: (email: string) =>
    api.post("/auth/forget-password/", { email }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post("/auth/change-password/", data),
};

// ============================================
// PROFILE APIs
// ============================================

export const profileApi = {
  getCustomerProfile: () => api.get("/profile/customer/"),
  updateCustomerProfile: (data: FormData | object) =>
    api.patch("/profile/customer/", data),

  getVolunteerProfile: () => api.get("/profile/volunteer/"),
  updateVolunteerProfile: (data: FormData | object) =>
    api.patch("/profile/volunteer/", data),

  getAdminProfile: () => api.get("/profile/admin/"),
  updateAdminProfile: (data: FormData | object) =>
    api.patch("/profile/admin/", data),
};

// ============================================
// LOST REPORT APIs
// ============================================

export const lostReportApi = {
  getAll: () => api.get("/lost-reports/"),
  getById: (id: number) => api.get(`/lost-reports/${id}/`),
  create: (data: FormData) =>
    api.post("/lost-reports/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData | object) =>
    api.patch(`/lost-reports/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    }),
  delete: (id: number) => api.delete(`/lost-reports/${id}/`),
};

// ============================================
// REPORT APIs
// ============================================

export const reportApi = {
  getAll: () => api.get("/reports/"),
  getById: (id: number) => api.get(`/reports/${id}/`),
  create: (data: FormData) =>
    api.post("/reports/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData | object) =>
    api.patch(`/reports/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    }),
  delete: (id: number) => api.delete(`/reports/${id}/`),
  downloadPDF: (id: number) =>
    api.get(`/reports/${id}/download/`, { responseType: "blob" }),
};

// ============================================
// SECURITY REPORT APIs
// ============================================

export const securityReportApi = {
  getAll: () => api.get("/security-reports/"),
  getById: (id: number) => api.get(`/security-reports/${id}/`),
  create: (data: object) => api.post("/security-reports/", data),
  update: (id: number, data: object) =>
    api.patch(`/security-reports/${id}/`, data),
  delete: (id: number) => api.delete(`/security-reports/${id}/`),
};

// ============================================
// FORUM APIs
// ============================================

export const forumApi = {
  getAll: () => api.get("/forum/"),
  getById: (id: number) => api.get(`/forum/${id}/`),
  create: (data: object) => api.post("/forum/", data),
  update: (id: number, data: object) => api.patch(`/forum/${id}/`, data),
  delete: (id: number) => api.delete(`/forum/${id}/`),
  like: (id: number) => api.post(`/forum/${id}/like/`),
  dislike: (id: number) => api.post(`/forum/${id}/dislike/`),

  // Comments
  getComments: (postId: number) => api.get(`/forum/${postId}/comments/`),
  createComment: (postId: number, data: { content: string }) =>
    api.post(`/forum/${postId}/comments/`, data),
  deleteComment: (commentId: number) => api.delete(`/comments/${commentId}/`),
};

// ============================================
// EVENT APIs
// ============================================

export const eventApi = {
  getAll: () => api.get("/events/"),
  getById: (id: number) => api.get(`/events/${id}/`),
  create: (data: FormData) =>
    api.post("/events/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData | object) =>
    api.patch(`/events/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    }),
  delete: (id: number) => api.delete(`/events/${id}/`),
  join: (id: number) => api.post(`/events/${id}/join/`),
  reward: (eventId: number, volunteerId: number) =>
    api.post(`/events/${eventId}/reward/`, { volunteer_id: volunteerId }),
};


// ============================================
// NOTIFICATION APIs
// ============================================

export const notificationApi = {
  getAll: () => api.get("/notifications/"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.patch("/notifications/read-all/"),
  delete: (id: number) => api.delete(`/notifications/${id}/`),
};

// ============================================
// PAYMENT APIs
// ============================================

export const paymentApi = {
  getAll: () => api.get("/payments/"),
  getById: (id: number) => api.get(`/payments/${id}/`),
  create: (data: object) => api.post("/payments/", data),
};

// ============================================
// SUBSCRIBE API
// ============================================

export const subscribeApi = {
  subscribe: (email: string) => api.post("/subscribe/", { email }),
};

// ============================================
// ADMIN APIs
// ============================================

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard/"),
};

// ============================================
// VOLUNTEER APIs
// ============================================
export const volunteerApi = {
  getAll: () => api.get("/volunteers/"),
};

export const adminVolunteerApi = {
  approve: (id: number) =>
    api.patch(`/volunteers/${id}/`, { active: true }),
  reject: (id: number) =>
    api.patch(`/volunteers/${id}/`, { active: false }),
  delete: (id: number) =>
    api.delete(`/volunteers/${id}/`),
};

export default api;