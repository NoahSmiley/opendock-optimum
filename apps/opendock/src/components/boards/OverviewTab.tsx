import clsx from "clsx";
import { TrendingUp, AlertTriangle, Users, Layers } from "lucide-react";
import type { BoardSnapshot } from "@/stores/boards/types";

interface OverviewTabProps {
  snapshot: BoardSnapshot;
}

export function OverviewTab({ snapshot }: OverviewTabProps) {
  const { tickets, columns, members } = snapshot;
  const highPriority = tickets.filter((t) => t.priority === "high").length;
  const medPriority = tickets.filter((t) => t.priority === "medium").length;
  const lowPriority = tickets.filter((t) => t.priority === "low").length;
  const unassigned = tickets.filter((t) => (t.assigneeIds ?? []).length === 0).length;
  const sortedCols = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 overflow-y-auto p-6 pl-4 sm:pl-6 lg:pl-8 xl:pl-10 pr-4 sm:pr-6 lg:pr-8 xl:pr-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Layers} label="Total Tickets" value={tickets.length} />
        <StatCard icon={AlertTriangle} label="High Priority" value={highPriority}
          accent={highPriority > 0 ? "text-rose-400" : undefined} iconAccent={highPriority > 0 ? "text-rose-400/60" : undefined} />
        <StatCard icon={Users} label="Unassigned" value={unassigned}
          accent={unassigned > 0 ? "text-amber-400" : undefined} iconAccent={unassigned > 0 ? "text-amber-400/60" : undefined} />
        <StatCard icon={TrendingUp} label="Team Members" value={members.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-800/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-neutral-200">Column Distribution</h3>
          <div className="space-y-4">
            {sortedCols.map((col) => {
              const count = tickets.filter((t) => t.columnId === col.id).length;
              const pct = tickets.length > 0 ? (count / tickets.length) * 100 : 0;
              return (
                <div key={col.id}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-300">{col.title}</span>
                    <span className="tabular-nums text-neutral-500">{count} ticket{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800/80">
                    <div className="h-full rounded-full bg-blue-500/80 transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-neutral-200">Priority Breakdown</h3>
          <div className="space-y-4">
            <PriorityRow label="High" count={highPriority} total={tickets.length} color="bg-rose-500" dot="bg-rose-400" />
            <PriorityRow label="Medium" count={medPriority} total={tickets.length} color="bg-amber-400" dot="bg-amber-300" />
            <PriorityRow label="Low" count={lowPriority} total={tickets.length} color="bg-emerald-400" dot="bg-emerald-400" />
          </div>
          {tickets.length === 0 && (
            <p className="mt-2 text-xs text-neutral-600">No tickets to display.</p>
          )}
        </div>
      </div>

      {members.length > 0 && (
        <div className="rounded-lg border border-neutral-800/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-neutral-200">Team</h3>
          <div className="flex flex-wrap gap-3">
            {members.map((m) => {
              const count = tickets.filter((t) => (t.assigneeIds ?? []).includes(m.id)).length;
              return (
                <div key={m.id} className="flex items-center gap-2.5 rounded-lg border border-neutral-800/40 px-3 py-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: m.avatarColor }}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">{m.name}</p>
                    <p className="text-[11px] text-neutral-500">{count} ticket{count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, iconAccent }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent?: string; iconAccent?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <Icon className={clsx("h-4 w-4", iconAccent || "text-neutral-700")} />
      </div>
      <p className={clsx("mt-2 text-2xl font-semibold tabular-nums", accent || "text-white")}>{value}</p>
    </div>
  );
}

function PriorityRow({ label, count, total, color, dot }: {
  label: string; count: number; total: number; color: string; dot: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-medium text-neutral-300">
          <span className={clsx("h-2 w-2 rounded-full", dot)} />
          {label}
        </span>
        <span className="tabular-nums text-neutral-500">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800/80">
        <div className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }} />
      </div>
    </div>
  );
}
