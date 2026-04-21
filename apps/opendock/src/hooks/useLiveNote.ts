import { useEffect } from "react";
import { LiveSocket } from "@/api/liveSocket";
import { useNotes } from "@/stores/notes";
import { useLinks } from "@/stores/links";

export function useLiveNote(noteId: string | null) {
  const applyEvent = useNotes((s) => s.applyEvent);
  const applyLink = useLinks((s) => s.applyEvent);

  useEffect(() => {
    if (!noteId) return;
    const socket = new LiveSocket("note", noteId, (ev) => {
      applyEvent(ev);
      applyLink(ev);
    });
    socket.start();
    return () => socket.stop();
  }, [noteId, applyEvent, applyLink]);
}
