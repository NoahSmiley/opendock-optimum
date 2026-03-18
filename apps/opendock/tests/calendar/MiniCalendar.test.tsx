import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import type { CalendarEvent } from "@/stores/calendar/types";

function makeEvent(startTime: string): CalendarEvent {
  return {
    id: "e1", title: "Evt", startTime, endTime: startTime,
    allDay: false, color: "blue", userId: "u1",
    createdAt: startTime, updatedAt: startTime,
  };
}

describe("MiniCalendar", () => {
  it("renders month name and year", () => {
    render(<MiniCalendar date={new Date(2026, 2, 17)} events={[]}
      onSelectDate={vi.fn()} onNavigateMonth={vi.fn()} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it("renders day headers", () => {
    render(<MiniCalendar date={new Date(2026, 2, 17)} events={[]}
      onSelectDate={vi.fn()} onNavigateMonth={vi.fn()} />);
    // S appears twice (Sun, Sat), T appears twice (Tue, Thu)
    expect(screen.getAllByText("S")).toHaveLength(2);
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("calls onNavigateMonth when clicking arrows", () => {
    const onNav = vi.fn();
    render(<MiniCalendar date={new Date(2026, 2, 17)} events={[]}
      onSelectDate={vi.fn()} onNavigateMonth={onNav} />);
    const buttons = screen.getAllByRole("button");
    // First two buttons are prev/next
    fireEvent.click(buttons[0]!);
    expect(onNav).toHaveBeenCalledWith(-1);
    fireEvent.click(buttons[1]!);
    expect(onNav).toHaveBeenCalledWith(1);
  });

  it("calls onSelectDate when clicking a day", () => {
    const onSelect = vi.fn();
    render(<MiniCalendar date={new Date(2026, 2, 17)} events={[]}
      onSelectDate={onSelect} onNavigateMonth={vi.fn()} />);
    // Click on day 15 (should be a button in the grid)
    const day15 = screen.getAllByRole("button").find((b) => b.textContent === "15");
    fireEvent.click(day15!);
    expect(onSelect).toHaveBeenCalled();
    const called = onSelect.mock.calls[0]![0] as Date;
    expect(called.getDate()).toBe(15);
    expect(called.getMonth()).toBe(2);
  });

  it("renders 42 day cells", () => {
    render(<MiniCalendar date={new Date(2026, 2, 17)} events={[]}
      onSelectDate={vi.fn()} onNavigateMonth={vi.fn()} />);
    // 2 nav buttons + 42 day buttons = 44 total buttons
    const allButtons = screen.getAllByRole("button");
    expect(allButtons.length).toBe(44);
  });
});
