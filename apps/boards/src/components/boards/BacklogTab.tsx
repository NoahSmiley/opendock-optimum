import type { FormEvent } from "react";
import type { KanbanBoard, KanbanColumn } from "@opendock/shared/types";
import { BacklogQuickAddForm } from "./forms/BacklogQuickAddForm";
import type { BacklogFormState } from "./forms/types";

interface BacklogTabProps {
  board: KanbanBoard;
  backlogColumn: KanbanColumn | null;
  backlogForm: BacklogFormState;
  onBacklogFormChange: (field: keyof BacklogFormState, value: string) => void;
  onCreateBacklogTicket: (event: FormEvent, boardId: string, columnId: string) => void;
  creatingBacklogTicket: boolean;
}

export function BacklogTab({
  board,
  backlogColumn,
  backlogForm,
  onBacklogFormChange,
  onCreateBacklogTicket,
  creatingBacklogTicket,
}: BacklogTabProps) {
  if (!backlogColumn) {
    return (
      <section className="mx-auto max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        Add a backlog column to start capturing items here.
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Backlog quick add</h3>
      <BacklogQuickAddForm
        form={backlogForm}
        members={board.members}
        onChange={onBacklogFormChange}
        onSubmit={(event) => onCreateBacklogTicket(event, board.id, backlogColumn.id)}
        creating={creatingBacklogTicket}
      />
    </section>
  );
}
