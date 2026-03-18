import clsx from "clsx";
import { Inbox } from "lucide-react";
import type { Ticket, Label, BoardMember, Column } from "@/stores/boards/types";
import { IssueTypeIcon } from "./IssueTypeIcon";

interface BacklogTabProps {
  tickets: Ticket[];
  columns: Column[];
  labels: Label[];
  members: BoardMember[];
  onTicketClick: (ticket: Ticket) => void;
}

const PRIORITIES = [
  { key: "high" as const, label: "High Priority", dot: "bg-rose-400" },
  { key: "medium" as const, label: "Medium Priority", dot: "bg-amber-300" },
  { key: "low" as const, label: "Low Priority", dot: "bg-emerald-400" },
];

export function BacklogTab({ tickets, columns, labels, members, onTicketClick }: BacklogTabProps) {
  const grouped = groupByPriority(tickets);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-neutral-500">
        <Inbox className="h-10 w-10 text-neutral-700" />
        <p className="text-sm">No tickets in the backlog yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-y-auto p-6 pl-4 sm:pl-6 lg:pl-8 xl:pl-10 pr-4 sm:pr-6 lg:pr-8 xl:pr-10">
      {PRIORITIES.map(({ key, label, dot }) => {
        const group = grouped[key];
        if (group.length === 0) return null;
        return (
          <div key={key} className="rounded-lg border border-neutral-800/60">
            <div className="flex items-center gap-2.5 border-b border-neutral-800/40 px-5 py-3">
              <span className={clsx("h-2 w-2 rounded-full", dot)} />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</h3>
              <span className="rounded-full bg-neutral-800/60 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                {group.length}
              </span>
            </div>
            <div className="divide-y divide-neutral-800/30">
              {group.map((t) => (
                <BacklogRow key={t.id} ticket={t} columns={columns} labels={labels} members={members}
                  onClick={() => onTicketClick(t)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BacklogRow({ ticket: t, columns, labels, members, onClick }: {
  ticket: Ticket; columns: Column[]; labels: Label[]; members: BoardMember[]; onClick: () => void;
}) {
  const col = columns.find((c) => c.id === t.columnId);
  const assignee = members.find((m) => (t.assigneeIds ?? []).includes(m.id));
  const tLabels = labels.filter((l) => (t.labelIds ?? []).includes(l.id));

  return (
    <div onClick={onClick}
      className="flex cursor-pointer items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-neutral-800/30">
      <IssueTypeIcon type={t.issueType || "task"} size="sm" className="shrink-0" />
      <span className="shrink-0 font-mono text-xs text-neutral-600">{t.key ?? t.id.slice(0, 8)}</span>
      <span className="min-w-0 flex-1 truncate font-medium text-neutral-200">{t.title}</span>
      {tLabels.slice(0, 3).map((l) => (
        <span key={l.id} className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} title={l.name} />
      ))}
      {col && (
        <span className="shrink-0 rounded border border-neutral-800/60 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
          {col.title}
        </span>
      )}
      {(t.storyPoints || t.estimate) && (
        <span className="shrink-0 rounded bg-neutral-800/50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-400">
          {t.storyPoints || t.estimate}
        </span>
      )}
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{ backgroundColor: assignee?.avatarColor ?? "#404040", color: "#fff" }}
        title={assignee?.name ?? "Unassigned"}>
        {(assignee?.name ?? "?").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function groupByPriority(tickets: Ticket[]) {
  const high: Ticket[] = [], medium: Ticket[] = [], low: Ticket[] = [];
  for (const t of tickets) {
    if (t.priority === "high") high.push(t);
    else if (t.priority === "medium") medium.push(t);
    else low.push(t);
  }
  return { high, medium, low };
}
