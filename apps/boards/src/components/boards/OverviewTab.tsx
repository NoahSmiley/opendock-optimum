import type { FormEvent } from "react";
import clsx from "clsx";
import type { KanbanBoard, KanbanSprint } from "@opendock/shared/types";
import { priorityAccent } from "@/lib/ticketStyles";
import { SprintCreateForm } from "./forms/SprintCreateForm";
import type { SprintFormState } from "./forms/types";

interface OverviewTabProps {
  board: KanbanBoard;
  boardStats: Array<{ label: string; value: string; icon: any }>;
  teamWorkload: Array<{ key: string; label: string; count: number }>;
  maxWorkloadCount: number;
  priorityBreakdown: {
    items: Array<{ priority: "low" | "medium" | "high"; count: number }>;
    total: number;
  };
  maxPriorityCount: number;
  activeSprint: KanbanSprint | null;
  sprintForm: SprintFormState;
  onSprintFormChange: (field: keyof SprintFormState, value: string) => void;
  onCreateSprint: (event: FormEvent, boardId: string) => void;
  creatingSprint: boolean;
}

export function OverviewTab({
  board,
  boardStats,
  teamWorkload,
  maxWorkloadCount,
  priorityBreakdown,
  maxPriorityCount,
  activeSprint,
  sprintForm,
  onSprintFormChange,
  onCreateSprint,
  creatingSprint,
}: OverviewTabProps) {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{board.name}</h2>
          {board.description ? (
            <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{board.description}</p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Plan and monitor the flow of work across your team.</p>
          )}
        </div>
        {boardStats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {boardStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  {stat.icon}
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">{stat.label}</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {teamWorkload.length > 0 ? (
          <div className="space-y-4 rounded-lg border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Team workload</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                {board.tickets.length} issues
              </span>
            </div>
            <div className="space-y-3">
              {teamWorkload.map((entry) => {
                const percentage =
                  maxWorkloadCount === 0
                    ? 0
                    : Math.max((entry.count / maxWorkloadCount) * 100, entry.count > 0 ? 10 : 0);
                return (
                  <div key={entry.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                      <span className="font-medium text-slate-600 dark:text-slate-200">{entry.label}</span>
                      <span>{entry.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-slate-900 dark:bg-white"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {priorityBreakdown.total > 0 ? (
          <div className="space-y-4 rounded-lg border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Priority mix</h3>
            <div className="space-y-3">
              {priorityBreakdown.items.map((item) => {
                if (item.count === 0) return null;
                const percentage =
                  maxPriorityCount === 0
                    ? 0
                    : Math.max((item.count / maxPriorityCount) * 100, item.count > 0 ? 12 : 0);
                return (
                  <div key={item.priority} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                      <span className="font-medium capitalize text-slate-600 dark:text-slate-200">{item.priority}</span>
                      <span>
                        {item.count} · {Math.round((item.count / priorityBreakdown.total) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                      <div
                        className={clsx("h-full rounded-full", priorityAccent[item.priority])}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div className="space-y-4">
        {activeSprint ? (
          <div className="space-y-3 rounded-lg border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-neutral-950/80 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active sprint</h3>
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{activeSprint.status}</span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
              <p className="font-medium">{activeSprint.name}</p>
              <p>
                {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(activeSprint.startDate))}
                {" – "}
                {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(activeSprint.endDate))}
              </p>
              {activeSprint.goal ? <p className="text-xs text-slate-500 dark:text-slate-400">{activeSprint.goal}</p> : null}
            </div>
          </div>
        ) : null}
        <SprintCreateForm
          form={sprintForm}
          onChange={onSprintFormChange}
          onSubmit={(event) => onCreateSprint(event, board.id)}
          creating={creatingSprint}
        />
      </div>
    </section>
  );
}
