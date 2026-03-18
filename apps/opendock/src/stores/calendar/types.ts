export type ViewMode = "month" | "week" | "day";

export type EventColor =
  | "indigo" | "blue" | "cyan" | "emerald" | "amber"
  | "orange" | "rose" | "pink" | "purple" | "neutral";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: EventColor;
  location?: string;
  recurrenceRule?: RecurrenceRule;
  boardTicketId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  endDate?: string;
  count?: number;
  daysOfWeek?: number[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
}

export interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  fetchEvents: (start: string, end: string) => Promise<void>;
}
