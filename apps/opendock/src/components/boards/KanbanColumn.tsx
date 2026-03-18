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
  column,
  ticketCount,
  totalCount,
  children,
  footer,
  droppableProvided,
  isDraggingOver = false,
}: KanbanColumnProps) {
  const isFiltered = totalCount !== undefined && totalCount !== ticketCount;
  const isOverLimit = column.wipLimit && ticketCount > column.wipLimit;
  const isAtLimit = column.wipLimit && ticketCount === column.wipLimit;

  return (
    <div className="flex min-w-[24rem] max-w-[24rem] flex-col gap-3 self-start rounded-lg border border-neutral-800/60 p-5 transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-200">{column.title}</h3>
        <span className={clsx(
          "flex items-center gap-1 rounded-full bg-neutral-800/50 px-2.5 py-0.5 text-xs font-medium transition-colors",
          isOverLimit
            ? "text-red-400"
            : isAtLimit
              ? "text-amber-400"
              : "text-neutral-400"
        )}>
          {ticketCount}
          {isFiltered && <span className="text-[10px] font-normal text-neutral-600">/{totalCount}</span>}
          {column.wipLimit && (
            <span className="text-[10px] font-normal">/{column.wipLimit}</span>
          )}
        </span>
      </div>
      <div
        ref={droppableProvided.innerRef}
        {...droppableProvided.droppableProps}
        className={clsx(
          "flex flex-col gap-2 rounded-md border p-0.5 transition-[border-color,background-color] duration-200 min-h-[4rem]",
          isDraggingOver
            ? "border-neutral-700/50 bg-neutral-800/30"
            : "border-transparent",
        )}
      >
        {children}
        {droppableProvided.placeholder}
        {ticketCount === 0 && !isDraggingOver && (
          <div className="rounded-md border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-600">
            {isFiltered ? "No issues match filters" : "Drop issues here"}
          </div>
        )}
      </div>
      {footer && <div>{footer}</div>}
    </div>
  );
}
