import { request } from "./base";
import type {
  CalendarEvent,
  CreateEventInput,
  UpdateEventInput,
} from "@/stores/calendar/types";

export async function fetchEvents(start: string, end: string): Promise<CalendarEvent[]> {
  const res = await request<{ events: CalendarEvent[] }>(
    `/api/calendar/events?start=${start}&end=${end}`,
  );
  return res.events;
}

export async function fetchEvent(eventId: string): Promise<CalendarEvent> {
  return request<CalendarEvent>(`/api/calendar/events/${eventId}`);
}

export async function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  return request<CalendarEvent>("/api/calendar/events", {
    method: "POST",
    body: input,
  });
}

export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<CalendarEvent> {
  return request<CalendarEvent>(`/api/calendar/events/${eventId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  return request<void>(`/api/calendar/events/${eventId}`, { method: "DELETE" });
}
