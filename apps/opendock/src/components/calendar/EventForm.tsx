import { useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import type { CalendarEvent, EventColor, CreateEventInput } from "@/stores/calendar/types";

interface EventFormProps {
  event?: CalendarEvent | null;
  defaultDate?: string;
  onSubmit: (data: CreateEventInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const COLORS: EventColor[] = [
  "indigo", "blue", "cyan", "emerald", "amber", "orange", "rose", "pink", "purple", "neutral",
];
const COLOR_BG: Record<string, string> = {
  indigo: "bg-indigo-500", blue: "bg-blue-500", cyan: "bg-cyan-500", emerald: "bg-emerald-500",
  amber: "bg-amber-500", orange: "bg-orange-500", rose: "bg-rose-500", pink: "bg-pink-500",
  purple: "bg-purple-500", neutral: "bg-neutral-500",
};

export function EventForm({ event, defaultDate, onSubmit, onDelete, onClose }: EventFormProps) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startTime, setStartTime] = useState(event?.startTime?.slice(0, 16) ?? `${defaultDate ?? today()}T09:00`);
  const [endTime, setEndTime] = useState(event?.endTime?.slice(0, 16) ?? `${defaultDate ?? today()}T10:00`);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState<EventColor>(event?.color ?? "indigo");
  const [location, setLocation] = useState(event?.location ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(), description: description || undefined, location: location || undefined,
      startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(),
      allDay, color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{event ? "Edit Event" : "New Event"}</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
            className="w-full rounded-lg border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" autoFocus />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)"
            className="w-full rounded-lg border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-neutral-400">
              Start
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-white" />
            </label>
            <label className="text-xs text-neutral-400">
              End
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-white" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
            All day
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
            rows={2} className="w-full rounded-lg border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs text-neutral-500">Color</span>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={clsx("h-5 w-5 rounded-full transition-all", COLOR_BG[c],
                  color === c ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110" : "opacity-60 hover:opacity-100")} />
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          {event && onDelete ? (
            <button type="button" onClick={onDelete} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Delete</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors">
              {event ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().split("T")[0]!;
}
