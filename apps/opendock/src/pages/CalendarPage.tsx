import { useEffect, useState, useCallback, useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar/store";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { AgendaView } from "@/components/calendar/AgendaView";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { InlineEventForm } from "@/components/calendar/InlineEventForm";
import * as calendarApi from "@/lib/api/calendar";
import { addMonths, toDateString } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/stores/calendar/types";

export function CalendarPage() {
  const { events, selectedDate, fetchEvents, setSelectedDate } = useCalendarStore();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = useMemo(() => new Date(selectedDate + "T00:00:00"), [selectedDate]);

  const loadEvents = useCallback(() => {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    fetchEvents(toDateString(start), toDateString(end));
  }, [date, fetchEvents]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSelectDate = useCallback((d: Date) => setSelectedDate(toDateString(d)), [setSelectedDate]);
  const handleNavigateMonth = useCallback((dir: 1 | -1) => {
    setSelectedDate(toDateString(addMonths(date, dir)));
  }, [date, setSelectedDate]);

  const handleCreateEvent = useCallback(async (data: Parameters<typeof calendarApi.createEvent>[0]) => {
    try {
      setError(null);
      await calendarApi.createEvent(data);
      setShowCreate(false);
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  }, [loadEvents]);

  const handleUpdateEvent = useCallback(async (data: Parameters<typeof calendarApi.createEvent>[0]) => {
    if (!editingEvent) return;
    try {
      setError(null);
      await calendarApi.updateEvent(editingEvent.id, data);
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    }
  }, [editingEvent, loadEvents]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    try {
      await calendarApi.deleteEvent(id);
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }, [loadEvents]);

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader selectedDate={date} onCreateEvent={() => { setError(null); setShowCreate(true); }} />
      {error && (
        <div className="shrink-0 bg-red-900/20 px-6 py-2 text-[12px] text-red-400">{error}</div>
      )}
      <div className="flex min-h-0 flex-1">
        <CalendarSidebar date={date} events={events}
          onSelectDate={handleSelectDate} onNavigateMonth={handleNavigateMonth} />
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {showCreate && (
            <div className="mb-6">
              <InlineEventForm defaultDate={selectedDate}
                onSubmit={handleCreateEvent} onCancel={() => setShowCreate(false)} />
            </div>
          )}
          {editingEvent && (
            <div className="mb-6">
              <InlineEventForm event={editingEvent}
                onSubmit={handleUpdateEvent} onCancel={() => setEditingEvent(null)}
                onDelete={() => handleDeleteEvent(editingEvent.id)} />
            </div>
          )}
          <AgendaView events={events} selectedDate={date} onEventClick={setEditingEvent} />
        </div>
      </div>
    </div>
  );
}

function CalendarSidebar({ date, events, onSelectDate, onNavigateMonth }: {
  date: Date; events: CalendarEvent[];
  onSelectDate: (d: Date) => void; onNavigateMonth: (dir: 1 | -1) => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.04] p-5 lg:block">
      <MiniCalendar date={date} events={events}
        onSelectDate={onSelectDate} onNavigateMonth={onNavigateMonth} />
    </aside>
  );
}
