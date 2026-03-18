import { useState } from "react";
import { updateTicket, deleteTicket } from "@/stores/boards/actions";
import type { Ticket, Board, Label, BoardMember } from "@/stores/boards/types";
import { TicketDetailHeader } from "./TicketDetailHeader";
import { TicketDetailContent } from "./TicketDetailContent";
import { TicketDetailSidebar } from "./TicketDetailSidebar";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface TicketDetailProps {
  ticket: Ticket;
  board: Board;
  labels: Label[];
  members: BoardMember[];
  onClose: () => void;
}

export function TicketDetail({ ticket, board, labels, members, onClose }: TicketDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async (updates: Partial<Ticket>) => {
    await updateTicket(ticket.id, updates);
  };

  const handleDelete = async () => {
    await deleteTicket(ticket.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-7xl -translate-x-1/2 -translate-y-1/2">
        <div className="max-h-[90vh] overflow-hidden rounded-lg bg-neutral-900 shadow-2xl">
          <TicketDetailHeader ticket={ticket} board={board} onClose={onClose} />

          <div className="flex h-[calc(90vh-80px)] overflow-hidden">
            <TicketDetailContent
              ticket={ticket}
              members={members}
              onUpdate={handleUpdate}
            />
            <TicketDetailSidebar
              ticket={ticket}
              board={board}
              members={members}
              labels={labels}
              onUpdate={handleUpdate}
              onRequestDelete={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          title={ticket.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
