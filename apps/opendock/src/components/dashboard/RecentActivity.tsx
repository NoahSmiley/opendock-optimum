import { Activity, StickyNote, TicketCheck } from "lucide-react";
import type { Note } from "@/stores/notes/types";
import type { Ticket } from "@/stores/boards/types";

interface RecentActivityProps {
  notes: Note[];
  tickets: Ticket[];
}

interface ActivityItem {
  id: string;
  title: string;
  date: Date;
  type: "note" | "ticket";
}

export function RecentActivity({ notes, tickets }: RecentActivityProps) {
  const items: ActivityItem[] = [];

  for (const n of notes) {
    items.push({ id: n.id, title: n.title || "Untitled", date: new Date(n.updatedAt), type: "note" });
  }
  for (const t of tickets) {
    items.push({ id: t.id, title: t.title, date: new Date(t.updatedAt), type: "ticket" });
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recent = items.slice(0, 8);

  return (
    <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/20 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <Activity className="h-3.5 w-3.5" /> Recent Activity
      </h3>
      {recent.length === 0 && <p className="text-sm text-neutral-600">No recent activity.</p>}
      <div className="flex flex-col gap-2">
        {recent.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-800/30">
            {item.type === "note"
              ? <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-500/60" />
              : <TicketCheck className="h-3.5 w-3.5 shrink-0 text-blue-500/60" />
            }
            <span className="flex-1 truncate text-sm text-neutral-300">{item.title}</span>
            <span className="shrink-0 text-[11px] text-neutral-500">{formatTimeAgo(item.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
