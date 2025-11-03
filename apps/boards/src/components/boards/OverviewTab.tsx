import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";
import { CheckCircle2, Circle, AlertCircle, Users } from "lucide-react";

interface OverviewTabProps {
  board: KanbanBoard;
}

export function OverviewTab({ board }: OverviewTabProps) {
  // Calculate column stats
  const columnStats = board.columns.map(column => {
    const tickets = board.tickets.filter(t => t.columnId === column.id);
    return {
      column,
      count: tickets.length,
      percentage: board.tickets.length > 0 ? (tickets.length / board.tickets.length) * 100 : 0,
    };
  });

  // Calculate priority breakdown
  const priorityStats = {
    high: board.tickets.filter(t => t.priority === "high").length,
    medium: board.tickets.filter(t => t.priority === "medium").length,
    low: board.tickets.filter(t => t.priority === "low").length,
  };

  // Calculate assignee stats
  const assigneeStats = board.members.map(member => {
    const count = board.tickets.filter(t => t.assigneeIds.includes(member.id)).length;
    return { member, count };
  }).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count);

  const unassignedCount = board.tickets.filter(t => t.assigneeIds.length === 0).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-10">
      {/* Board Info */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{board.name}</h2>
        {board.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{board.description}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Tickets</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{board.tickets.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900">
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">High Priority</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{priorityStats.high}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
              <Circle className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Unassigned</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{unassignedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Team Members</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{board.members.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column Distribution */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Column Distribution</h3>
          <div className="space-y-4">
            {columnStats.map(({ column, count, percentage }) => (
              <div key={column.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{column.title}</span>
                  <span className="text-neutral-500 dark:text-neutral-400">{count} ({Math.round(percentage)}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-blue-500 dark:bg-blue-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Workload */}
        {assigneeStats.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Team Workload</h3>
            <div className="space-y-3">
              {assigneeStats.map(({ member, count }) => (
                <div key={member.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{member.name}</span>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {count} {count === 1 ? "ticket" : "tickets"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Breakdown */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Priority Breakdown</h3>
          <div className="space-y-3">
            {priorityStats.high > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">High Priority</span>
                <span className="text-sm font-semibold text-rose-900 dark:text-rose-100">{priorityStats.high}</span>
              </div>
            )}
            {priorityStats.medium > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Medium Priority</span>
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">{priorityStats.medium}</span>
              </div>
            )}
            {priorityStats.low > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Low Priority</span>
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{priorityStats.low}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
