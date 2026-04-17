import { useEffect } from "react";
import { LiveSocket } from "@/api/liveSocket";
import { useNotes } from "@/stores/notes";
import { useBoards } from "@/stores/boards";

export function useUserInbox(userId: string | null | undefined) {
  const loadNotes = useNotes((s) => s.load);
  const loadBoards = useBoards((s) => s.loadBoards);

  useEffect(() => {
    if (!userId) return;
    const socket = new LiveSocket("user", userId, (ev) => {
      if (ev.kind === "note_share_added" || ev.kind === "note_share_removed") { loadNotes(); }
      if (ev.kind === "board_share_added" || ev.kind === "board_share_removed") { loadBoards(); }
    });
    socket.start();
    return () => socket.stop();
  }, [userId, loadNotes, loadBoards]);
}
