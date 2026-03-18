import clsx from "clsx";
import type { CalendarEvent } from "@/stores/calendar/types";
import { isSameDay, HOURS, formatHour } from "@/lib/utils/calendar";
import { EventCard } from "./EventCard";

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({ selectedDate, events, onEventClick }: DayViewProps) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), selectedDate));
  const allDay = dayEvents.filter((e) => e.allDay);
  const timed = dayEvents.filter((e) => !e.allDay);
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DayHeader date={selectedDate} isToday={isToday} />
      {allDay.length > 0 && (
        <div className="flex gap-1 border-b border-neutral-800/50 px-4 py-2">
          {allDay.map((e) => (
            <EventCard key={e.id} event={e} compact onClick={onEventClick} />
          ))}
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <TimeGutter />
        <div className="relative flex-1">
          {HOURS.map((h) => (
            <div key={h} className="h-14 border-b border-neutral-800/20" />
          ))}
          {isToday && <NowLine />}
          {timed.map((e) => {
            const start = new Date(e.startTime);
            const end = new Date(e.endTime);
            const top = (start.getHours() + start.getMinutes() / 60) * 56;
            const height = Math.max(((end.getTime() - start.getTime()) / 3600000) * 56, 20);
            return (
              <div key={e.id} className="absolute left-1 right-4" style={{ top: `${top}px`, height: `${height}px` }}>
                <EventCard event={e} onClick={onEventClick} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayHeader({ date, isToday }: { date: Date; isToday: boolean }) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  return (
    <div className="flex items-center gap-3 border-b border-neutral-800/50 px-6 py-3">
      <span className={clsx("flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold",
        isToday ? "bg-indigo-600 text-white" : "text-neutral-300")}>
        {date.getDate()}
      </span>
      <span className="text-sm font-medium text-neutral-400">{dayName}</span>
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

function NowLine() {
  const now = new Date();
  const top = (now.getHours() + now.getMinutes() / 60) * 56;
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: `${top}px` }}>
      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
      <div className="h-px flex-1 bg-rose-500" />
    </div>
  );
}
