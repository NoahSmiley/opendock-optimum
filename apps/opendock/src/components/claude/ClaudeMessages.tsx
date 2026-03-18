import { useRef, useEffect } from "react";
import { useClaudeStore } from "@/stores/claude/store";
import { renderMarkdown } from "./MarkdownRenderer";
import type { ClaudeMessage } from "@/stores/claude/types";

function MessageBubble({ message }: { message: ClaudeMessage }) {
  const isUser = message.role === "user";
  const toolCount = message.tools?.length ?? 0;

  return (
    <div className={`claude-msg ${isUser ? "claude-msg-user" : "claude-msg-assistant"}`}>
      <div className="claude-msg-content">
        {isUser ? message.content : renderMarkdown(message.content)}
      </div>
      {toolCount > 0 && (
        <div className="claude-tool-summary">
          {toolCount} tool {toolCount === 1 ? "call" : "calls"} made
        </div>
      )}
    </div>
  );
}

export function ClaudeMessages() {
  const messages = useClaudeStore((s) => s.messages);
  const status = useClaudeStore((s) => s.status);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="claude-messages">
      {messages.length === 0 && status === "idle" && (
        <div className="claude-empty">
          <p className="text-[13px] text-neutral-500">
            Ask Claude to help manage your boards, notes, or calendar.
          </p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {status === "thinking" && (
        <div className="claude-msg claude-msg-assistant">
          <span className="claude-thinking">Thinking...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
