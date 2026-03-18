import { Plus } from "lucide-react";
import { formatMonthYear } from "@/lib/utils/calendar";

interface CalendarHeaderProps {
  selectedDate: Date;
  onCreateEvent: () => void;
}

export function CalendarHeader({ selectedDate, onCreateEvent }: CalendarHeaderProps) {
  return (
    <header className="flex w-full flex-shrink-0 items-center justify-between border-b border-white/[0.04] px-6 py-4">
      <h2 className="text-[15px] font-medium text-white">{formatMonthYear(selectedDate)}</h2>
      <button onClick={onCreateEvent}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500">
        <Plus className="h-3.5 w-3.5" /> New Event
      </button>
    </header>
  );
}
