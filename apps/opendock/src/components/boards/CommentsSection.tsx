import { useState } from "react";
import { addComment } from "@/stores/boards/actions";
import type { BoardMember, Comment } from "@/stores/boards/types";
import { formatRelativeDate } from "@/lib/utils/ticketHelpers";

interface CommentsSectionProps {
  ticketId: string;
  comments: Comment[];
  members: BoardMember[];
}

export function CommentsSection({ ticketId, comments, members }: CommentsSectionProps) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await addComment(ticketId, text.trim());
    setText("");
    setExpanded(false);
  };

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-neutral-400">Activity</h3>
      <div className="mb-6 flex gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">U</div>
        <div className="flex-1">
          <textarea value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setExpanded(true)}
            placeholder="Add a comment..." rows={expanded ? 3 : 1}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          {expanded && (
            <div className="mt-2 flex gap-2">
              <button onClick={handleSubmit} disabled={!text.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Save</button>
              <button onClick={() => { setText(""); setExpanded(false); }}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800">Cancel</button>
            </div>
          )}
        </div>
      </div>
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((c) => {
            const author = members.find((m) => m.id === c.userId);
            return (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-neutral-200">
                  {author?.name?.slice(0, 2).toUpperCase() || "UN"}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{author?.name || "Unknown"}</span>
                    <span className="text-xs text-neutral-500">{formatRelativeDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-300">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
