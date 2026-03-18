import { useState, type KeyboardEvent } from "react";
import { useClaudeStore } from "@/stores/claude/store";
import { Send } from "lucide-react";

export function ClaudeInput() {
  const [input, setInput] = useState("");
  const status = useClaudeStore((s) => s.status);
  const addUserMessage = useClaudeStore((s) => s.addUserMessage);
  const setStatus = useClaudeStore((s) => s.setStatus);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || status === "thinking") return;

    addUserMessage(content);
    setInput("");
    setStatus("thinking");

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("send_claude_message", { content });
    } catch (err) {
      useClaudeStore.getState().setError(
        err instanceof Error ? err.message : "Failed to send message"
      );
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="claude-input-bar">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Claude..."
        rows={1}
        disabled={status === "thinking"}
        className="claude-input-field"
      />
      <button
        onClick={sendMessage}
        disabled={!input.trim() || status === "thinking"}
        className="claude-send-btn"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
