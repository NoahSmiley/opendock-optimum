import { Clock, CalendarDays } from "lucide-react";
import type { CalendarEvent } from "@/stores/calendar/types";
import type { Ticket } from "@/stores/boards/types";

interface UpcomingDeadlinesProps {
  events: CalendarEvent[];
  tickets: Ticket[];
}

interface DeadlineItem {
  id: string;
  title: string;
  date: Date;
  type: "event" | "ticket";
}

export function UpcomingDeadlines({ events, tickets }: UpcomingDeadlinesProps) {
  const now = new Date();
  const items: DeadlineItem[] = [];

  for (const e of events) {
    const d = new Date(e.startTime);
    if (d >= now) items.push({ id: e.id, title: e.title, date: d, type: "event" });
  }
  for (const t of tickets) {
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (d >= now) items.push({ id: t.id, title: t.title, date: d, type: "ticket" });
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcoming = items.slice(0, 8);

  return (
    <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/20 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <Clock className="h-3.5 w-3.5" /> Upcoming
      </h3>
      {upcoming.length === 0 && <p className="text-sm text-neutral-600">Nothing upcoming.</p>}
      <div className="flex flex-col gap-2">
        {upcoming.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-800/30">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
            <span className="flex-1 truncate text-sm text-neutral-300">{item.title}</span>
            <span className="shrink-0 text-[11px] text-neutral-500">{formatRelative(item.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
