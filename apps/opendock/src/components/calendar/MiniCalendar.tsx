import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGrid, isSameDay, formatMonthYear } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/stores/calendar/types";

interface MiniCalendarProps {
  date: Date;
  events: CalendarEvent[];
  onSelectDate: (d: Date) => void;
  onNavigateMonth: (dir: 1 | -1) => void;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MiniCalendar({ date, events, onSelectDate, onNavigateMonth }: MiniCalendarProps) {
  const grid = getMonthGrid(date.getFullYear(), date.getMonth());
  const today = new Date();
  const month = date.getMonth();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-medium text-neutral-300">{formatMonthYear(date)}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onNavigateMonth(-1)}
            className="rounded-md p-1 text-neutral-500 transition-colors hover:text-neutral-300">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onNavigateMonth(1)}
            className="rounded-md p-1 text-neutral-500 transition-colors hover:text-neutral-300">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {DAYS.map((d, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-medium text-neutral-600">{d}</div>
        ))}
        {grid.map((day, i) => {
          const isMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, date);
          const hasEvents = events.some((e) => isSameDay(new Date(e.startTime), day));
          return (
            <button key={i} onClick={() => onSelectDate(day)}
              className={clsx("relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition-colors",
                !isMonth && "text-neutral-700",
                isMonth && !isToday && !isSelected && "text-neutral-400 hover:bg-white/[0.04]",
                isToday && "bg-blue-600 text-white",
                isSelected && !isToday && "bg-white/[0.08] text-white")}>
              {day.getDate()}
              {hasEvents && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
