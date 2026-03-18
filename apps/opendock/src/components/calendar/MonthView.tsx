import clsx from "clsx";
import type { CalendarEvent } from "@/stores/calendar/types";
import { getMonthGrid, isSameDay, DAY_NAMES } from "@/lib/utils/calendar";
import { EventCard } from "./EventCard";

interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ selectedDate, events, onSelectDate, onEventClick }: MonthViewProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const grid = getMonthGrid(year, month);
  const today = new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-neutral-800/50">
        {DAY_NAMES.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {grid.map((date, i) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), date));
          return (
            <DayCell key={i} date={date} isCurrentMonth={isCurrentMonth} isToday={isToday}
              isSelected={isSelected} events={dayEvents} onClick={() => onSelectDate(date)}
              onEventClick={onEventClick} />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({ date, isCurrentMonth, isToday, isSelected, events, onClick, onEventClick }: {
  date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean;
  events: CalendarEvent[]; onClick: () => void; onEventClick: (e: CalendarEvent) => void;
}) {
  return (
    <div onClick={onClick}
      className={clsx("flex min-h-0 cursor-pointer flex-col border-b border-r border-neutral-800/30 p-1 transition-colors hover:bg-neutral-900/50",
        !isCurrentMonth && "opacity-40")}>
      <span className={clsx("mb-0.5 flex h-6 w-6 items-center justify-center self-end rounded-full text-xs font-medium",
        isToday && "bg-indigo-600 text-white",
        isSelected && !isToday && "bg-neutral-700 text-white",
        !isToday && !isSelected && "text-neutral-400")}>
        {date.getDate()}
      </span>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {events.slice(0, 3).map((e) => (
          <EventCard key={e.id} event={e} compact onClick={onEventClick} />
        ))}
        {events.length > 3 && (
          <span className="px-1 text-[10px] text-neutral-500">+{events.length - 3} more</span>
        )}
      </div>
    </div>
  );
}
