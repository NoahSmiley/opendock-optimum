import type { ReactNode } from "react";
import type { DroppableProvided } from "@hello-pangea/dnd";
import clsx from "clsx";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";

export interface KanbanColumnProps {
  column: KanbanBoard["columns"][number];
  tickets: KanbanTicket[];
  totalCount: number;
  children: ReactNode;
  footer?: ReactNode;
  droppableProvided: DroppableProvided;
  isDraggingOver?: boolean;
  className?: string;
}

export function KanbanColumn({
  column,
  tickets,
  totalCount,
  children,
  footer,
  droppableProvided,
  isDraggingOver = false,
  className,
}: KanbanColumnProps) {
  return (
    <div
      className={clsx(
        "flex min-w-[22rem] max-w-[22rem] flex-col gap-3 self-start rounded-lg border border-neutral-200 bg-white p-4 transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
      data-column-id={column.id}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{column.title}</h3>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Stage</p>
        </div>
        <span className={clsx(
          "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          column.wipLimit && tickets.length > column.wipLimit
            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
            : column.wipLimit && tickets.length === column.wipLimit
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
        )}>
          {tickets.length}
          {column.wipLimit ? (
            <span className="text-[10px] font-normal uppercase tracking-[0.3em]">
              /{column.wipLimit}
            </span>
          ) : totalCount !== tickets.length ? (
            <span className="text-[10px] font-normal uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              /{totalCount}
            </span>
          ) : null}
        </span>
      </div>
      <div>
        <div
          ref={droppableProvided.innerRef}
          {...droppableProvided.droppableProps}
          className={clsx(
            "flex flex-col gap-2.5 rounded-md border p-1 transition-[border-color,background-color] duration-200 min-h-[6rem]",
            isDraggingOver
              ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
              : "border-transparent",
          )}
        >
          {children}
          {droppableProvided.placeholder}
          {tickets.length === 0 && !isDraggingOver ? (
            totalCount > 0 ? (
              <div className="rounded-md border border-dashed border-neutral-300 bg-white p-4 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-500">
                No issues match the active filters.
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-neutral-300 bg-white p-4 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-500">
                Drop issues here
              </div>
            )
          ) : null}
        </div>
      </div>
      {footer ? <div>{footer}</div> : null}
    </div>
  );
}
