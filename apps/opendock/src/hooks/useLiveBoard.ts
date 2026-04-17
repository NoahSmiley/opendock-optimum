import { useEffect } from "react";
import { LiveSocket } from "@/api/liveSocket";
import { useBoards } from "@/stores/boards";
import { useAuth } from "@/stores/auth";

export function useLiveBoard(boardId: string | null) {
  const applyEvent = useBoards((s) => s.applyEvent);
  const userId = useAuth((s) => s.data.user_id);

  useEffect(() => {
    if (!boardId) return;
    const socket = new LiveSocket("board", boardId, (ev) => {
      if ("actor_id" in ev && ev.actor_id === userId) return;
      applyEvent(ev);
    });
    socket.start();
    return () => socket.stop();
  }, [boardId, applyEvent, userId]);
}
