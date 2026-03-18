import { create } from "zustand";
import * as calendarApi from "@/lib/api/calendar";
import type { CalendarState } from "./types";

const today = new Date().toISOString().split("T")[0]!;

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  selectedDate: today,
  viewMode: "month",
  isLoading: false,
  error: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),

  fetchEvents: async (start, end) => {
    set({ isLoading: true, error: null });
    try {
      const result = await calendarApi.fetchEvents(start, end);
      set({ events: Array.isArray(result) ? result : [], isLoading: false });
    } catch (err) {
      set({ events: [], error: (err as Error).message, isLoading: false });
    }
  },
}));
