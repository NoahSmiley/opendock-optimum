import { useEffect } from "react";
import { useClaudeStore } from "@/stores/claude/store";

interface ClaudeEvent {
  kind: "text_delta" | "tool_use" | "tool_result" | "turn_complete" | "error";
  content?: string;
  tool_id?: string;
  name?: string;
  input?: unknown;
  output?: string;
  message?: string;
}

export function useClaudeEvents() {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const unlistenFn = await listen<ClaudeEvent>("claude:event", (event) => {
          const store = useClaudeStore.getState();
          const e = event.payload;

          switch (e.kind) {
            case "text_delta":
              store.appendAssistantText(e.content ?? "");
              break;
            case "tool_use":
              store.addToolActivity({
                toolId: e.tool_id ?? "",
                name: e.name ?? "",
                input: e.input,
              });
              break;
            case "tool_result":
              store.updateToolOutput(e.tool_id ?? "", e.output ?? "");
              break;
            case "turn_complete":
              store.completeTurn();
              break;
            case "error":
              store.setError(e.message ?? "Unknown error");
              break;
          }
        });
        unlisten = unlistenFn;
      } catch {
        // Not in Tauri environment
      }
    })();

    return () => unlisten?.();
  }, []);
}
