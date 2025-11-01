import { useState, useEffect, useCallback } from "react";
import { Play, Square, Clock, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { KanbanTicket, KanbanTimeLog, KanbanUser } from "@opendock/shared/types";
import { formatDuration, formatDurationLong, calculateTimeProgress } from "@/lib/ticketStyles";
import { ConfirmDialog } from "./ConfirmDialog";

interface TimeTrackerProps {
  ticket: KanbanTicket;
  members: KanbanUser[];
  onStartTimer: () => Promise<void>;
  onStopTimer: (logId: string) => Promise<void>;
  onDeleteTimeLog: (logId: string) => Promise<void>;
  activeTimeLog: KanbanTimeLog | null;
  timeLogs: KanbanTimeLog[];
  isLoading?: boolean;
}

export function TimeTracker({
  ticket,
  members,
  onStartTimer,
  onStopTimer,
  onDeleteTimeLog,
  activeTimeLog,
  timeLogs,
  isLoading = false,
}: TimeTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  // Calculate elapsed time for active timer
  useEffect(() => {
    if (!activeTimeLog) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeTimeLog.startedAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeTimeLog]);

  const handleDeleteClick = useCallback((logId: string) => {
    setDeletingLogId(logId);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingLogId) {
      await onDeleteTimeLog(deletingLogId);
      setShowDeleteConfirm(false);
      setDeletingLogId(null);
    }
  }, [deletingLogId, onDeleteTimeLog]);

  const progress = calculateTimeProgress(ticket.timeSpent, ticket.estimate);
  const hasEstimate = ticket.estimate && ticket.estimate > 0;

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <Clock className="h-4 w-4" />
          Time Tracking
        </h3>
        {hasEstimate && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Estimate: {ticket.estimate}h
          </span>
        )}
      </div>

      {/* Timer Controls */}
      <div className="space-y-3">
        {activeTimeLog ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-green-700 dark:text-green-300">
                  Timer Running
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>
              <button
                onClick={() => onStopTimer(activeTimeLog.id)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onStartTimer}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <Play className="h-4 w-4" />
            Start Timer
          </button>
        )}

        {/* Time Spent vs Estimate Progress */}
        {hasEstimate && ticket.timeSpent !== undefined && ticket.timeSpent > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span>Time Spent</span>
              <span className="font-medium">
                {formatDuration(ticket.timeSpent)} / {ticket.estimate}h
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className={clsx(
                  "h-full transition-all duration-300",
                  progress >= 100
                    ? "bg-red-500 dark:bg-red-400"
                    : progress >= 80
                      ? "bg-amber-500 dark:bg-amber-400"
                      : "bg-green-500 dark:bg-green-400"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {progress >= 100 && (
              <div className="text-xs font-medium text-red-600 dark:text-red-400">
                Over estimate by {formatDuration(ticket.timeSpent - (ticket.estimate * 3600))}
              </div>
            )}
          </div>
        )}

        {/* Total Time Spent (no estimate) */}
        {!hasEstimate && ticket.timeSpent !== undefined && ticket.timeSpent > 0 && (
          <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Time Spent
            </div>
            <div className="mt-1 font-mono text-lg font-semibold text-neutral-900 dark:text-white">
              {formatDuration(ticket.timeSpent)}
            </div>
          </div>
        )}
      </div>

      {/* Time Logs List */}
      {timeLogs.length > 0 && (
        <div className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Time Logs ({timeLogs.length})
          </h4>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {timeLogs.map((log) => {
              const user = members.find((m) => m.id === log.userId);
              const isActive = !log.endedAt;

              return (
                <div
                  key={log.id}
                  className={clsx(
                    "flex items-center justify-between rounded-md border p-2",
                    isActive
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                      : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: user?.avatarColor || "#666" }}
                      >
                        {(user?.name || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-white">
                          {user?.name || "Unknown"}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {new Date(log.startedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatDuration(log.duration)}
                      </div>
                      {isActive && (
                        <div className="text-[10px] font-medium uppercase text-green-600 dark:text-green-400">
                          Running
                        </div>
                      )}
                    </div>
                    {!isActive && (
                      <button
                        onClick={() => handleDeleteClick(log.id)}
                        className="rounded p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                        title="Delete time log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Time Log"
        message="Are you sure you want to delete this time log? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingLogId(null);
        }}
      />
    </div>
  );
}
