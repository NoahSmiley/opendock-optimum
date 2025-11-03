import type { KanbanTicket, KanbanBoard } from "@opendock/shared/types";

/**
 * Generate a JIRA-style ticket key (e.g., "OD-123")
 * Uses the board's project key if available, otherwise uses "OD" as default
 */
export const generateTicketKey = (board: KanbanBoard, ticketNumber: number): string => {
  const projectKey = board.projectKey || "OD";
  return `${projectKey}-${ticketNumber}`;
};

/**
 * Extract ticket number from a ticket ID
 * Assumes format like "board-123-uuid" and extracts the number
 */
export const getTicketNumber = (ticketId: string): number => {
  // Try to extract a number from the ticket ID
  const match = ticketId.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  // Fallback: use a hash of the ID to generate a consistent number
  let hash = 0;
  for (let i = 0; i < ticketId.length; i++) {
    const char = ticketId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 10000; // Keep it to 4 digits max
};

/**
 * Format a ticket key for display
 * If the ticket has a key property, use it; otherwise generate one
 */
export const formatTicketKey = (ticket: KanbanTicket & { key?: string }, board?: KanbanBoard): string => {
  if (ticket.key) {
    return ticket.key;
  }

  if (board) {
    const ticketNumber = getTicketNumber(ticket.id);
    return generateTicketKey(board, ticketNumber);
  }

  // Fallback to the old method if no board is provided
  const [prefix] = ticket.id.split("-");
  return prefix ? prefix.toUpperCase() : ticket.id.slice(0, 6).toUpperCase();
};

/**
 * Get the next available ticket number for a board
 */
export const getNextTicketNumber = (board: KanbanBoard): number => {
  let maxNumber = 0;

  board.tickets.forEach(ticket => {
    const ticketWithKey = ticket as KanbanTicket & { key?: string };
    if (ticketWithKey.key) {
      const match = ticketWithKey.key.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    } else {
      // Try to extract number from ID as fallback
      const num = getTicketNumber(ticket.id);
      if (num > maxNumber && num < 10000) { // Ignore hash-generated numbers
        maxNumber = num;
      }
    }
  });

  return maxNumber + 1;
};