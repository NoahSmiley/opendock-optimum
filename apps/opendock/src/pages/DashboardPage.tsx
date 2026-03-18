import { useEffect } from "react";
import { useBoardsStore } from "@/stores/boards/store";
import { useNotesStore } from "@/stores/notes/store";
import { useCalendarStore } from "@/stores/calendar/store";
import { useFilesStore } from "@/stores/files/store";
import { StatCards } from "@/components/dashboard/StatCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { toDateString } from "@/lib/utils/calendar";

export function DashboardPage() {
  const { boards, fetchBoards, activeBoard } = useBoardsStore();
  const { notes, fetchNotes } = useNotesStore();
  const { events, fetchEvents } = useCalendarStore();
  const { files, fetchFiles } = useFilesStore();

  useEffect(() => {
    fetchBoards();
    fetchNotes();
    fetchFiles();
    const now = new Date();
    const start = toDateString(now);
    const end = toDateString(new Date(now.getFullYear(), now.getMonth() + 2, 0));
    fetchEvents(start, end);
  }, [fetchBoards, fetchNotes, fetchEvents, fetchFiles]);

  const tickets = activeBoard?.tickets ?? [];

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto p-6 lg:p-8 xl:p-10">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Your workspace at a glance.</p>
      </div>
      <StatCards boardCount={boards.length} ticketCount={tickets.length} noteCount={notes.length}
        eventCount={events.length} fileCount={files.length} />
      <div className="grid min-h-0 gap-6 lg:grid-cols-2">
        <UpcomingDeadlines events={events} tickets={tickets} />
        <RecentActivity notes={notes} tickets={tickets} />
      </div>
      <QuickActions />
    </div>
  );
}
