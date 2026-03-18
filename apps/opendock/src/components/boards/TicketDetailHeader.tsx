import { X, Link } from "lucide-react";
import type { Board, Ticket } from "@/stores/boards/types";

interface TicketDetailHeaderProps {
  ticket: Ticket;
  board: Board;
  onClose: () => void;
}

export function TicketDetailHeader({ ticket, board, onClose }: TicketDetailHeaderProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${ticket.key ?? ticket.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-400">{board.name}</span>
        <span className="text-neutral-600">/</span>
        <span className="font-medium text-neutral-300">{ticket.key ?? ticket.id.slice(0, 8)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-800"
          title="Copy link"
        >
          <Link className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-800"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
