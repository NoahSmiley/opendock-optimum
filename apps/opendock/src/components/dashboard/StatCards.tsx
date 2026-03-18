import { Kanban, StickyNote, Calendar, FolderOpen, TicketCheck } from "lucide-react";

interface StatCardsProps {
  boardCount: number;
  ticketCount: number;
  noteCount: number;
  eventCount: number;
  fileCount: number;
}

const iconClass = "h-5 w-5";

export function StatCards({ boardCount, ticketCount, noteCount, eventCount, fileCount }: StatCardsProps) {
  const stats = [
    { label: "Boards", value: boardCount, icon: <Kanban className={iconClass} />, color: "text-indigo-400" },
    { label: "Tickets", value: ticketCount, icon: <TicketCheck className={iconClass} />, color: "text-blue-400" },
    { label: "Notes", value: noteCount, icon: <StickyNote className={iconClass} />, color: "text-amber-400" },
    { label: "Events", value: eventCount, icon: <Calendar className={iconClass} />, color: "text-emerald-400" },
    { label: "Files", value: fileCount, icon: <FolderOpen className={iconClass} />, color: "text-rose-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label}
          className="flex items-center gap-3 rounded-xl border border-neutral-800/50 bg-neutral-900/30 px-4 py-3.5">
          <div className={s.color}>{s.icon}</div>
          <div>
            <p className="text-lg font-semibold text-white">{s.value}</p>
            <p className="text-[11px] text-neutral-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
