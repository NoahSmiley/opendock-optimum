import { useEffect } from "react";
import { LiveSocket } from "@/api/liveSocket";
import { useNotes } from "@/stores/notes";

export function useLiveNote(noteId: string | null) {
  const applyEvent = useNotes((s) => s.applyEvent);

  useEffect(() => {
    if (!noteId) return;
    const socket = new LiveSocket("note", noteId, applyEvent);
    socket.start();
    return () => socket.stop();
  }, [noteId, applyEvent]);
}
