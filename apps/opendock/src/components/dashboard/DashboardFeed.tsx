import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, StickyNote, TicketCheck } from "lucide-react";
import type { CalendarEvent } from "@/stores/calendar/types";
import type { Ticket } from "@/stores/boards/types";
import type { Note } from "@/stores/notes/types";

interface DashboardFeedProps {
  events: CalendarEvent[];
  tickets: Ticket[];
  notes: Note[];
}

interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  section: "upcoming" | "recent";
  type: "event" | "ticket" | "note";
  route: string;
}

export function DashboardFeed({ events, tickets, notes }: DashboardFeedProps) {
  const { upcoming, recent } = useMemo(() => buildFeed(events, tickets, notes), [events, tickets, notes]);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-10">
      <FeedSection label="Coming up" items={upcoming} onNavigate={navigate}
        empty="Nothing upcoming" />
      <FeedSection label="Recently touched" items={recent} onNavigate={navigate}
        empty="No recent activity" />
    </div>
  );
}

function FeedSection({ label, items, onNavigate, empty }: {
  label: string; items: FeedItem[]; onNavigate: (path: string) => void; empty: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-600">{label}</h3>
      {items.length === 0 && <p className="py-4 text-[12px] text-neutral-600">{empty}</p>}
      <div className="flex flex-col">
        {items.map((item) => (
          <button key={`${item.type}-${item.id}`} onClick={() => onNavigate(item.route)}
            className="flex items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-white/[0.03]">
            <FeedIcon type={item.type} />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-neutral-300">{item.title}</span>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-neutral-600">{item.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedIcon({ type }: { type: FeedItem["type"] }) {
  const cls = "h-3.5 w-3.5 shrink-0 text-neutral-600";
  if (type === "event") return <CalendarDays className={cls} />;
  if (type === "note") return <StickyNote className={cls} />;
  return <TicketCheck className={cls} />;
}

function buildFeed(events: CalendarEvent[], tickets: Ticket[], notes: Note[]) {
  const now = new Date();
  const upcoming: FeedItem[] = [];
  const recent: FeedItem[] = [];

  for (const e of events) {
    const d = new Date(e.startTime);
    if (d >= now) {
      upcoming.push({ id: e.id, title: e.title, subtitle: relFuture(d), date: d, section: "upcoming", type: "event", route: "/calendar" });
    }
  }
  for (const t of tickets) {
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (d >= now) {
        upcoming.push({ id: t.id, title: t.title, subtitle: relFuture(d), date: d, section: "upcoming", type: "ticket", route: "/boards" });
      }
    }
    recent.push({ id: t.id, title: t.title, subtitle: relPast(new Date(t.updatedAt)), date: new Date(t.updatedAt), section: "recent", type: "ticket", route: "/boards" });
  }
  for (const n of notes) {
    recent.push({ id: n.id, title: n.title || "Untitled", subtitle: relPast(new Date(n.updatedAt)), date: new Date(n.updatedAt), section: "recent", type: "note", route: "/notes" });
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  recent.sort((a, b) => b.date.getTime() - a.date.getTime());
  return { upcoming: upcoming.slice(0, 8), recent: recent.slice(0, 10) };
}

function relFuture(d: Date): string {
  const days = Math.floor((d.getTime() - Date.now()) / 864e5);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relPast(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 6e4);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
