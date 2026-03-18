import type { ReactNode } from "react";
import type { DroppableProvided } from "@hello-pangea/dnd";
import clsx from "clsx";
import type { Column } from "@/stores/boards/types";

interface KanbanColumnProps {
  column: Column;
  ticketCount: number;
  totalCount?: number;
  children: ReactNode;
  footer?: ReactNode;
  droppableProvided: DroppableProvided;
  isDraggingOver?: boolean;
}

export function KanbanColumn({
  column, ticketCount, totalCount, children, footer, droppableProvided, isDraggingOver = false,
}: KanbanColumnProps) {
  const isFiltered = totalCount !== undefined && totalCount !== ticketCount;
  const isOverLimit = column.wipLimit && ticketCount > column.wipLimit;
  const isAtLimit = column.wipLimit && ticketCount === column.wipLimit;

  return (
    <div className="flex w-72 flex-col gap-2.5 self-start rounded-lg border border-white/[0.06] p-3.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">{column.title}</h3>
        <span className={clsx(
          "text-[11px] tabular-nums",
          isOverLimit ? "text-red-400" : isAtLimit ? "text-amber-400" : "text-neutral-600"
        )}>
          {ticketCount}
          {isFiltered && <span className="text-neutral-700">/{totalCount}</span>}
          {column.wipLimit && <span className="text-neutral-700">/{column.wipLimit}</span>}
        </span>
      </div>
      <div
        ref={droppableProvided.innerRef}
        {...droppableProvided.droppableProps}
        className={clsx(
          "flex flex-col gap-1.5 rounded-md p-0.5 transition-colors duration-150 min-h-[3rem]",
          isDraggingOver ? "bg-white/[0.02]" : "",
        )}
      >
        {children}
        {droppableProvided.placeholder}
        {ticketCount === 0 && !isDraggingOver && (
          <div className="rounded-md border border-dashed border-white/[0.06] py-6 text-center text-[11px] text-neutral-600">
            {isFiltered ? "No matches" : "No issues"}
          </div>
        )}
      </div>
      {footer && <div className="px-0.5">{footer}</div>}
    </div>
  );
}
