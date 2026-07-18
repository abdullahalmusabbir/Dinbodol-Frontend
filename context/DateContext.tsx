"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { DateRange } from "@/types";

// ============================================
// TYPES
// ============================================

interface DateContextType {
  selectedDate: Date | null;
  dateRange: DateRange;
  currentMonth: number;
  currentYear: number;

  setSelectedDate: (date: Date | null) => void;
  setDateRange: (range: DateRange) => void;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;

  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  resetDateRange: () => void;

  formatDate: (date: Date | null, format?: string) => string;
  isToday: (date: Date) => boolean;
  isSameDay: (date1: Date | null, date2: Date | null) => boolean;
  isInRange: (date: Date) => boolean;
  isWeekend: (date: Date) => boolean;
}

// ============================================
// CONTEXT
// ============================================

const DateContext = createContext<DateContextType | undefined>(undefined);

// ============================================
// HELPERS
// ============================================

const formatDate = (date: Date | null, format: string = "YYYY-MM-DD"): string => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes);
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// ============================================
// PROVIDER
// ============================================

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // ---- Navigation ----
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(now);
  }, []);

  const resetDateRange = useCallback(() => {
    setDateRange({ startDate: null, endDate: null });
  }, []);

  // ---- Range Check ----
  const isInRange = useCallback(
    (date: Date): boolean => {
      const { startDate, endDate } = dateRange;
      if (!startDate || !endDate) return false;

      const time = date.getTime();
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return time >= start.getTime() && time <= end.getTime();
    },
    [dateRange]
  );

  const value: DateContextType = {
    selectedDate,
    dateRange,
    currentMonth,
    currentYear,

    setSelectedDate,
    setDateRange,
    setCurrentMonth,
    setCurrentYear,

    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    resetDateRange,

    formatDate,
    isToday,
    isSameDay,
    isInRange,
    isWeekend,
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};

// ============================================
// HOOK
// ============================================

export const useDate = (): DateContextType => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error("useDate must be used within DateProvider");
  }
  return context;
};

export default DateContext;