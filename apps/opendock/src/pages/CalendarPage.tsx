import { useEffect, useState, useCallback, useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar/store";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventForm } from "@/components/calendar/EventForm";
import * as calendarApi from "@/lib/api/calendar";
import { addMonths, addWeeks, addDays, toDateString } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/stores/calendar/types";

export function CalendarPage() {
  const { events, selectedDate, viewMode, fetchEvents, setSelectedDate, setViewMode } = useCalendarStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const date = useMemo(() => new Date(selectedDate + "T00:00:00"), [selectedDate]);

  const loadEvents = useCallback(() => {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    fetchEvents(toDateString(start), toDateString(end));
  }, [date, fetchEvents]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const navigate = useCallback((dir: 1 | -1) => {
    const fn = viewMode === "month" ? addMonths : viewMode === "week" ? addWeeks : addDays;
    setSelectedDate(toDateString(fn(date, dir)));
  }, [viewMode, date, setSelectedDate]);

  const handleToday = useCallback(() => setSelectedDate(toDateString(new Date())), [setSelectedDate]);
  const handleSelectDate = useCallback((d: Date) => setSelectedDate(toDateString(d)), [setSelectedDate]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  }, []);

  const handleCreateEvent = useCallback(async (data: Parameters<typeof calendarApi.createEvent>[0]) => {
    await calendarApi.createEvent(data);
    loadEvents();
  }, [loadEvents]);

  const handleUpdateEvent = useCallback(async (data: Parameters<typeof calendarApi.createEvent>[0]) => {
    if (!editingEvent) return;
    await calendarApi.updateEvent(editingEvent.id, data);
    loadEvents();
  }, [editingEvent, loadEvents]);

  const handleDeleteEvent = useCallback(async () => {
    if (!editingEvent) return;
    await calendarApi.deleteEvent(editingEvent.id);
    setShowForm(false);
    setEditingEvent(null);
    loadEvents();
  }, [editingEvent, loadEvents]);

  const closeForm = useCallback(() => { setShowForm(false); setEditingEvent(null); }, []);

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader selectedDate={date} viewMode={viewMode} onViewChange={setViewMode}
        onPrev={() => navigate(-1)} onNext={() => navigate(1)} onToday={handleToday}
        onCreateEvent={() => { setEditingEvent(null); setShowForm(true); }} />
      <div className="min-h-0 flex-1">
        {viewMode === "month" && <MonthView selectedDate={date} events={events} onSelectDate={handleSelectDate} onEventClick={handleEventClick} />}
        {viewMode === "week" && <WeekView selectedDate={date} events={events} onSelectDate={handleSelectDate} onEventClick={handleEventClick} />}
        {viewMode === "day" && <DayView selectedDate={date} events={events} onEventClick={handleEventClick} />}
      </div>
      {showForm && (
        <EventForm event={editingEvent} defaultDate={selectedDate}
          onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined} onClose={closeForm} />
      )}
    </div>
  );
}
