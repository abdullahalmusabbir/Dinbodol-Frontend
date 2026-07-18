// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: {
    id: number;
    username: string;
    email: string;
    role: "admin" | "volunteer" | "customer";
  };
}

export interface RegisterResponse {
  message: string;
  tokens: AuthTokens;
}

export type UserRole = "admin" | "volunteer" | "customer";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

// ============================================
// PROFILE TYPES
// ============================================

export interface CustomerProfile {
  id: number;
  user: User;
  address: string | null;
  date_of_birth: string | null;
  avatar: string | null;
}

export interface VolunteerProfile {
  id: number;
  user: User;
  address: string | null;
  skills: string | null;
  availability: string | null;
  active: boolean;
  point: number;
  event_attendance: number;
  avatar: string | null;
  joined_at: string;
}

export interface AdminProfile {
  id: number;
  user: User;
  date_of_birth: string | null;
  avatar: string | null;
  joined_at: string;
}

// ============================================
// LOST REPORT TYPES
// ============================================

export type LostReportStatus = "পাওয়া" | "হারানো" | "ফেরত পাওয়া";
// Single source of truth — every literal below is type-checked against the union
export const LOST_STATUS = {
    LOST: "হারানো",
    FOUND: "পাওয়া",
    RETURNED: "ফেরত পাওয়া",
} as const satisfies Record<string, LostReportStatus>;

export interface LostReport {
  id: number;
  user: User;
  image: string | null;
  status: LostReportStatus;
  category: string | null;
  item_name: string;
  description: string;
  location: string;
  date: string;
  typePost: string | null;
  reported_at: string;
}

export interface LostReportCreate {
  image?: File | null;
  status?: LostReportStatus;
  category?: string;
  item_name: string;
  description: string;
  location: string;
  date: string;
  typePost?: string;
}

// ============================================
// REPORT TYPES
// ============================================

export type ReportStatus =
  | "pending"
  | "under_analysis"
  | "in_progress"
  | "solved"
  | "closed";

export interface Report {
  id: number;
  user: User;
  image: string | null;
  status: ReportStatus;
  category: string;
  title: string;
  description: string;
  location: string;
  reported_at: string;
}

export interface ReportCreate {
  image?: File | null;
  category: string;
  title: string;
  description: string;
  location: string;
}

// ============================================
// SECURITY REPORT TYPES
// ============================================

export type SecurityReportStatus = "pending" | "in_progress" | "solved" | "closed";
export type SecurityImportance = "low" | "medium" | "high";

export interface SecurityReport {
  id: number;
  user: User;
  location: string | null;
  description: string;
  importance: SecurityImportance;
  status: SecurityReportStatus;
  category: string | null;
  reported_at: string;
}

export interface SecurityReportCreate {
  location?: string;
  description: string;
  importance?: SecurityImportance;
  category?: string;
}

// ============================================
// FORUM TYPES
// ============================================

export interface Comment {
  id: number;
  user: User;
  post: number;
  content: string;
  created_at: string;
}

export interface ForumPost {
  id: number;
  user: User;
  title: string;
  category: string | null;
  content: string;
  view_count: number;
  total_likes: number;
  total_dislikes: number;
  comments: Comment[];
  created_at: string;
}

export interface ForumPostCreate {
  title: string;
  category?: string;
  content: string;
}

export interface CommentCreate {
  content: string;
}

// ============================================
// EVENT TYPES
// ============================================

export type EventStatus = "upcoming" | "ongoing" | "completed";

export interface Event {
  id: number;
  user: User;
  volunteers: number[];
  point: number;
  category: string | null;
  location: string | null;
  status: EventStatus;
  date: string;
  time: string;
  needed_people: number;
  organizer: string | null;
  title: string;
  description: string;
  photo: string | null;
  volunteer_count: number;
  rewarded_volunteers: number[];
  created_at: string;
}

export interface EventCreate {
  point?: number;
  category?: string;
  location?: string;
  status?: EventStatus;
  date: string;
  time: string;
  needed_people: number;
  organizer?: string;
  title: string;
  description: string;
  photo?: File | null;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentStatus = "pending" | "success" | "failed";
export type PaymentMethod =
  | "bkash"
  | "nogod"
  | "rocket"
  | "debit_card"
  | "visa_card"
  | "master_card";

export interface Payment {
  id: number;
  user: User;
  name: string;
  phone: string;
  amount: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  name: string;
  phone: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: number;
  recipient: User;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ============================================
// ADMIN DASHBOARD TYPES
// ============================================

export interface AdminDashboard {
  total_users: number;
  total_customers: number;
  total_volunteers: number;
  total_lost_reports: number;
  total_reports: number;
  total_security_reports: number;
  total_events: number;
  total_forum_posts: number;
  total_payments: number;
}

// ============================================
// API ERROR TYPE
// ============================================

export interface ApiError {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: string | string[] | undefined;
}

// ============================================
// DATE CONTEXT TYPES
// ============================================

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}