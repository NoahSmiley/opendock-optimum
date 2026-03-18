import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineEventForm } from "@/components/calendar/InlineEventForm";
import type { CalendarEvent } from "@/stores/calendar/types";

describe("InlineEventForm", () => {
  it("renders with empty title for new event", () => {
    render(<InlineEventForm defaultDate="2026-03-17" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText("Event title")).toHaveValue("");
  });

  it("renders with event data for editing", () => {
    const event: CalendarEvent = {
      id: "e1", title: "Existing", startTime: "2026-03-17T09:00:00Z",
      endTime: "2026-03-17T10:00:00Z", allDay: false, color: "blue",
      location: "Office", userId: "u1",
      createdAt: "2026-03-17T00:00:00Z", updatedAt: "2026-03-17T00:00:00Z",
    };
    render(<InlineEventForm event={event} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText("Event title")).toHaveValue("Existing");
    expect(screen.getByDisplayValue("Office")).toBeInTheDocument();
  });

  it("calls onSubmit with form data", () => {
    const onSubmit = vi.fn();
    render(<InlineEventForm defaultDate="2026-03-17" onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Event title"), { target: { value: "New Event" } });
    fireEvent.click(screen.getByText("Create"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0]![0];
    expect(data.title).toBe("New Event");
  });

  it("does not submit with empty title", () => {
    const onSubmit = vi.fn();
    render(<InlineEventForm defaultDate="2026-03-17" onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("Create"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel clicked", () => {
    const onCancel = vi.fn();
    render(<InlineEventForm defaultDate="2026-03-17" onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when X clicked", () => {
    const onCancel = vi.fn();
    render(<InlineEventForm defaultDate="2026-03-17" onSubmit={vi.fn()} onCancel={onCancel} />);
    const xBtn = screen.getAllByRole("button").find((b) => b.querySelector(".lucide-x"));
    fireEvent.click(xBtn!);
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows Delete button only when editing", () => {
    const event: CalendarEvent = {
      id: "e1", title: "Edit me", startTime: "2026-03-17T09:00:00Z",
      endTime: "2026-03-17T10:00:00Z", allDay: false, color: "blue",
      userId: "u1", createdAt: "2026-03-17T00:00:00Z", updatedAt: "2026-03-17T00:00:00Z",
    };
    const onDelete = vi.fn();
    render(<InlineEventForm event={event} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows Save instead of Create when editing", () => {
    const event: CalendarEvent = {
      id: "e1", title: "Edit", startTime: "2026-03-17T09:00:00Z",
      endTime: "2026-03-17T10:00:00Z", allDay: false, color: "blue",
      userId: "u1", createdAt: "2026-03-17T00:00:00Z", updatedAt: "2026-03-17T00:00:00Z",
    };
    render(<InlineEventForm event={event} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.queryByText("Create")).not.toBeInTheDocument();
  });

  it("has all-day checkbox", () => {
    render(<InlineEventForm defaultDate="2026-03-17" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("All day")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
});
