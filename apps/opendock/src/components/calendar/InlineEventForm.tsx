import { useState } from "react";
import { X } from "lucide-react";
import type { CalendarEvent, CreateEventInput } from "@/stores/calendar/types";

interface InlineEventFormProps {
  event?: CalendarEvent | null;
  defaultDate?: string;
  onSubmit: (data: CreateEventInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function InlineEventForm({ event, defaultDate, onSubmit, onCancel, onDelete }: InlineEventFormProps) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [startTime, setStartTime] = useState(event?.startTime?.slice(0, 16) ?? `${defaultDate ?? today()}T09:00`);
  const [endTime, setEndTime] = useState(event?.endTime?.slice(0, 16) ?? `${defaultDate ?? today()}T10:00`);
  const [location, setLocation] = useState(event?.location ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(), location: location || undefined,
      startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(),
      allDay, color: event?.color ?? "blue",
    });
  };

  return (
    <form onSubmit={handleSubmit}
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
          className="flex-1 border-none bg-transparent p-0 text-[14px] font-medium text-white outline-none placeholder:text-neutral-600"
          autoFocus />
        <button type="button" onClick={onCancel}
          className="rounded-md p-1 text-neutral-600 transition-colors hover:text-neutral-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[12px]">
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
          className="rounded-md border border-white/[0.06] bg-transparent px-2 py-1 text-[11px] text-neutral-300" />
        <span className="text-neutral-600">to</span>
        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
          className="rounded-md border border-white/[0.06] bg-transparent px-2 py-1 text-[11px] text-neutral-300" />
        <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-neutral-700" />
          All day
        </label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
          className="rounded-md border border-white/[0.06] bg-transparent px-2 py-1 text-[11px] text-neutral-300 placeholder:text-neutral-600" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        {event && onDelete ? (
          <button type="button" onClick={onDelete}
            className="text-[11px] text-neutral-500 transition-colors hover:text-red-400">Delete</button>
        ) : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-md px-3 py-1 text-[11px] text-neutral-500 transition-colors hover:text-neutral-300">Cancel</button>
          <button type="submit" disabled={!title.trim()}
            className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40">
            {event ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

function today(): string {
  return new Date().toISOString().split("T")[0]!;
}
