import clsx from "clsx";
import type { CalendarEvent } from "@/stores/calendar/types";
import { getWeekDays, isSameDay, HOURS, formatHour, DAY_NAMES } from "@/lib/utils/calendar";
import { EventCard } from "./EventCard";

interface WeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ selectedDate, events, onSelectDate, onEventClick }: WeekViewProps) {
  const days = getWeekDays(selectedDate);
  const today = new Date();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WeekHeader days={days} today={today} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <TimeGutter />
        <div className="grid flex-1 grid-cols-7">
          {days.map((day, di) => (
            <DayColumn key={di} day={day} events={events.filter((e) => isSameDay(new Date(e.startTime), day))}
              onEventClick={onEventClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekHeader({ days, today, selectedDate, onSelectDate }: {
  days: Date[]; today: Date; selectedDate: Date; onSelectDate: (d: Date) => void;
}) {
  return (
    <div className="grid grid-cols-[56px_1fr] border-b border-neutral-800/50">
      <div />
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDate);
          return (
            <button key={i} onClick={() => onSelectDate(d)}
              className="flex flex-col items-center py-2 transition-colors hover:bg-neutral-900/50">
              <span className="text-[10px] font-semibold uppercase text-neutral-500">{DAY_NAMES[d.getDay()]}</span>
              <span className={clsx("mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday && "bg-indigo-600 text-white", isSelected && !isToday && "bg-neutral-700 text-white",
                !isToday && !isSelected && "text-neutral-300")}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeGutter() {
  return (
    <div className="w-14 shrink-0 border-r border-neutral-800/30">
      {HOURS.map((h) => (
        <div key={h} className="flex h-14 items-start justify-end pr-2 pt-0.5">
          <span className="text-[10px] text-neutral-600">{formatHour(h)}</span>
        </div>
      ))}
    </div>
  );
}

function DayColumn({ day: _day, events, onEventClick }: {
  day: Date; events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void;
}) {
  return (
    <div className="relative border-r border-neutral-800/30">
      {HOURS.map((h) => (
        <div key={h} className="h-14 border-b border-neutral-800/20" />
      ))}
      {events.map((e) => {
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        const top = (start.getHours() + start.getMinutes() / 60) * 56;
        const height = Math.max(((end.getTime() - start.getTime()) / 3600000) * 56, 20);
        return (
          <div key={e.id} className="absolute left-0.5 right-1" style={{ top: `${top}px`, height: `${height}px` }}>
            <EventCard event={e} onClick={onEventClick} />
          </div>
        );
      })}
    </div>
  );
}
