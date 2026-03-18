import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import clsx from "clsx";
import type { ViewMode } from "@/stores/calendar/types";
import { formatMonthYear } from "@/lib/utils/calendar";

interface CalendarHeaderProps {
  selectedDate: Date;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateEvent: () => void;
}

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
  { label: "Day", value: "day" },
];

export function CalendarHeader({
  selectedDate, viewMode, onViewChange, onPrev, onNext, onToday, onCreateEvent,
}: CalendarHeaderProps) {
  return (
    <header className="flex w-full flex-shrink-0 items-center justify-between gap-4 border-b border-neutral-800/50 px-6 py-4">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-white">{formatMonthYear(selectedDate)}</h2>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={onToday}
            className="ml-1 rounded-md px-2.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
            Today
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-neutral-800 bg-neutral-900/50 p-0.5">
          {VIEW_OPTIONS.map(({ label, value }) => (
            <button key={value} onClick={() => onViewChange(value)}
              className={clsx("rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === value ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={onCreateEvent}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500">
          <Plus className="h-3.5 w-3.5" /> New Event
        </button>
      </div>
    </header>
  );
}
