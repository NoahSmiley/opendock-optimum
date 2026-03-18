import clsx from "clsx";
import type { CalendarEvent } from "@/stores/calendar/types";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick: (event: CalendarEvent) => void;
}

const COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  pink: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  neutral: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
};

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const colors = COLOR_MAP[event.color] ?? COLOR_MAP.indigo;
  const time = !event.allDay ? formatTime(event.startTime) : null;

  return (
    <button onClick={() => onClick(event)}
      className={clsx("w-full truncate rounded border-l-2 text-left transition-opacity hover:opacity-80", colors,
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")}>
      {time && <span className="mr-1 opacity-70">{time}</span>}
      {event.title}
    </button>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "p" : "a";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}
