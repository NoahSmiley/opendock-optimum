import { useEffect } from "react";
import { useBoardsStore } from "@/stores/boards/store";
import { useNotesStore } from "@/stores/notes/store";
import { useCalendarStore } from "@/stores/calendar/store";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";
import { toDateString } from "@/lib/utils/calendar";

export function DashboardPage() {
  const { fetchBoards, activeBoard } = useBoardsStore();
  const { notes, fetchNotes } = useNotesStore();
  const { events, fetchEvents } = useCalendarStore();

  useEffect(() => {
    fetchBoards();
    fetchNotes();
    const now = new Date();
    const start = toDateString(now);
    const end = toDateString(new Date(now.getFullYear(), now.getMonth() + 2, 0));
    fetchEvents(start, end);
  }, [fetchBoards, fetchNotes, fetchEvents]);

  const tickets = activeBoard?.tickets ?? [];

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-2xl px-8">
        <h1 className="text-[15px] font-medium text-white">Home</h1>
        <p className="mt-1 text-[12px] text-neutral-600">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <div className="mt-8">
          <DashboardFeed events={events} tickets={tickets} notes={notes} />
        </div>
      </div>
    </div>
  );
}
