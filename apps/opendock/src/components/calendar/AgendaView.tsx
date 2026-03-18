import { useMemo } from "react";
import { isSameDay } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/stores/calendar/types";

interface AgendaViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

export function AgendaView({ events, selectedDate, onEventClick }: AgendaViewProps) {
  const grouped = useMemo(() => groupByDay(events, selectedDate), [events, selectedDate]);

  if (grouped.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13px] text-neutral-500">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {grouped.map(({ date, label, events: dayEvents }) => (
        <div key={date}>
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</h3>
          <div className="flex flex-col gap-1">
            {dayEvents.map((e) => (
              <AgendaItem key={e.id} event={e} onClick={onEventClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgendaItem({ event, onClick }: { event: CalendarEvent; onClick: (e: CalendarEvent) => void }) {
  const time = event.allDay ? "All day" : formatTimeRange(event.startTime, event.endTime);
  return (
    <button onClick={() => onClick(event)}
      className="flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]">
      <div className="h-8 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: colorValue(event.color) }} />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-neutral-200">{event.title}</span>
        {event.location && <span className="block truncate text-[11px] text-neutral-600">{event.location}</span>}
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">{time}</span>
    </button>
  );
}

const COLOR_VALUES: Record<string, string> = {
  indigo: "#818cf8", blue: "#64cfe9", cyan: "#22d3ee", emerald: "#34d399",
  amber: "#fbbf24", orange: "#fb923c", rose: "#fb7185", pink: "#f472b6",
  purple: "#a78bfa", neutral: "#737373",
};

function colorValue(color: string): string {
  return COLOR_VALUES[color] ?? COLOR_VALUES.blue!;
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "p" : "a";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

interface DayGroup { date: string; label: string; events: CalendarEvent[] }

function groupByDay(events: CalendarEvent[], selectedDate: Date): DayGroup[] {
  const today = new Date();
  const sorted = [...events]
    .filter((e) => new Date(e.startTime) >= startOfDay(selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const groups = new Map<string, CalendarEvent[]>();
  for (const e of sorted) {
    const key = new Date(e.startTime).toDateString();
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  return [...groups.entries()].slice(0, 14).map(([key, evts]) => {
    const d = new Date(key);
    return { date: key, label: formatDayLabel(d, today), events: evts };
  });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDayLabel(date: Date, today: Date): string {
  if (isSameDay(date, today)) return "Today";
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
