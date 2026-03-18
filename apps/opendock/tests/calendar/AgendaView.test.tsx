import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgendaView } from "@/components/calendar/AgendaView";
import type { CalendarEvent } from "@/stores/calendar/types";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1", title: "Test Event", startTime: "2026-03-17T09:00:00Z",
    endTime: "2026-03-17T10:00:00Z", allDay: false, color: "blue",
    userId: "u1", createdAt: "2026-03-17T00:00:00Z", updatedAt: "2026-03-17T00:00:00Z",
    ...overrides,
  };
}

describe("AgendaView", () => {
  it("shows empty state when no events", () => {
    render(<AgendaView events={[]} selectedDate={new Date("2026-03-17")} onEventClick={vi.fn()} />);
    expect(screen.getByText("No upcoming events")).toBeInTheDocument();
  });

  it("renders events grouped by day", () => {
    const events = [
      makeEvent({ id: "1", title: "Morning", startTime: "2026-03-17T09:00:00Z" }),
      makeEvent({ id: "2", title: "Afternoon", startTime: "2026-03-17T14:00:00Z" }),
      makeEvent({ id: "3", title: "Next Day Event", startTime: "2026-03-18T10:00:00Z" }),
    ];
    render(<AgendaView events={events} selectedDate={new Date("2026-03-17")} onEventClick={vi.fn()} />);
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
    expect(screen.getByText("Next Day Event")).toBeInTheDocument();
  });

  it("calls onEventClick when clicking an event", () => {
    const onClick = vi.fn();
    const event = makeEvent({ title: "Click me" });
    render(<AgendaView events={[event]} selectedDate={new Date("2026-03-17")} onEventClick={onClick} />);
    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledWith(event);
  });

  it("shows location when present", () => {
    const event = makeEvent({ location: "Room 42" });
    render(<AgendaView events={[event]} selectedDate={new Date("2026-03-17")} onEventClick={vi.fn()} />);
    expect(screen.getByText("Room 42")).toBeInTheDocument();
  });

  it("shows All day for all-day events", () => {
    const event = makeEvent({ allDay: true });
    render(<AgendaView events={[event]} selectedDate={new Date("2026-03-17")} onEventClick={vi.fn()} />);
    expect(screen.getByText("All day")).toBeInTheDocument();
  });

  it("shows time range for timed events", () => {
    const event = makeEvent({ startTime: "2026-03-17T09:00:00Z", endTime: "2026-03-17T10:30:00Z" });
    render(<AgendaView events={[event]} selectedDate={new Date("2026-03-17")} onEventClick={vi.fn()} />);
    // Time display depends on timezone but should contain a time range with "–"
    const timeEl = screen.getByText(/\d+[ap]\s*–\s*\d+/);
    expect(timeEl).toBeInTheDocument();
  });

  it("filters out events before selectedDate", () => {
    const oldEvent = makeEvent({ id: "old", title: "Old Event", startTime: "2026-03-10T09:00:00Z" });
    const newEvent = makeEvent({ id: "new", title: "New Event", startTime: "2026-03-20T09:00:00Z" });
    render(<AgendaView events={[oldEvent, newEvent]} selectedDate={new Date(2026, 2, 15)} onEventClick={vi.fn()} />);
    expect(screen.queryByText("Old Event")).not.toBeInTheDocument();
    expect(screen.getByText("New Event")).toBeInTheDocument();
  });
});
