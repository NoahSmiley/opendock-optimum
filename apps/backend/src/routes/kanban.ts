import { Router } from "express";
import {
  KanbanCreateBoardSchema,
  KanbanCreateColumnSchema,
  KanbanCreateSprintSchema,
  KanbanCreateTicketSchema,
  KanbanReorderTicketSchema,
  KanbanUpdateTicketSchema,
  KanbanUpdateBoardSchema,
} from "@opendock/shared/kanban";
import { authRequired, requireCsrfProtection } from "../auth";
import { dal } from "../dal";
import { kanbanEvents } from "../events";

function validationError(error: unknown) {
  if (error && typeof error === "object" && "flatten" in error && typeof (error as { flatten: () => unknown }).flatten === "function") {
    const issue = (error as { flatten: () => { fieldErrors: unknown } }).flatten();
    return {
      error: {
        code: "INVALID_PAYLOAD",
        message: "Request validation failed.",
        details: issue.fieldErrors,
      },
    };
  }
  return {
    error: {
      code: "INVALID_PAYLOAD",
      message: "Request validation failed.",
    },
  };
}

export function createKanbanRouter(): Router {
  const router = Router();

  router.get("/boards", async (_req, res) => {
    const [boards, users] = await Promise.all([dal.kanban.listBoards(), dal.kanban.listUsers()]);
    const hydrated = await Promise.all(
      boards.map(async (board) => (await dal.kanban.boardSnapshot(board.id))?.board ?? board),
    );
    res.json({ boards: hydrated, users });
  });

  router.post("/boards", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanCreateBoardSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const snapshot = await dal.kanban.createBoard(parsed.data);
    res.status(201).json(snapshot);
  });

  router.get("/boards/:boardId", authRequired, async (req, res) => {
    const snapshot = await dal.kanban.boardSnapshot(req.params.boardId);
    if (!snapshot) {
      res.status(404).json({ error: { code: "BOARD_NOT_FOUND", message: "Board not found." } });
      return;
    }
    res.json(snapshot);
  });

  router.patch("/boards/:boardId", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanUpdateBoardSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const board = await dal.kanban.updateBoard(req.params.boardId, parsed.data);
    if (!board) {
      res.status(404).json({ error: { code: "BOARD_NOT_FOUND", message: "Board not found." } });
      return;
    }
    res.json({ board });
  });


  router.get("/boards/:boardId/stream", authRequired, async (req, res) => {
    const boardId = req.params.boardId;
    const snapshot = await dal.kanban.boardSnapshot(boardId);
    if (!snapshot) {
      res.status(404).json({ error: { code: "BOARD_NOT_FOUND", message: "Board not found." } });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    (res as typeof res & { flushHeaders?: () => void }).flushHeaders?.();

    res.write(`event: board-snapshot\ndata: ${JSON.stringify({ boardId, snapshot })}\n\n`);

    const unsubscribe = kanbanEvents.subscribe(boardId, res);
    const cleanup = () => {
      unsubscribe();
      res.end();
    };
    req.on("close", cleanup);
    req.on("error", cleanup);
  });

  router.post("/boards/:boardId/columns", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanCreateColumnSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    const board = await dal.kanban.boardSnapshot(req.params.boardId);
    if (!board) {
      res.status(404).json({
        error: { code: "BOARD_NOT_FOUND", message: "Board not found." },
      });
      return;
    }

    const column = await dal.kanban.createColumn(board.board.id, parsed.data);
    res.status(201).json({ column });
  });

  router.post("/boards/:boardId/sprints", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanCreateSprintSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const board = await dal.kanban.boardSnapshot(req.params.boardId);
    if (!board) {
      res.status(404).json({ error: { code: "BOARD_NOT_FOUND", message: "Board not found." } });
      return;
    }
    const sprint = await dal.kanban.createSprint(board.board.id, parsed.data);
    res.status(201).json({ sprint });
  });

  router.post("/boards/:boardId/tickets", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanCreateTicketSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const board = await dal.kanban.boardSnapshot(req.params.boardId);
    if (!board) {
      res.status(404).json({ error: { code: "BOARD_NOT_FOUND", message: "Board not found." } });
      return;
    }
    const columnExists = board.columns.some((column) => column.id === parsed.data.columnId);
    if (!columnExists) {
      res.status(400).json({ error: { code: "COLUMN_NOT_FOUND", message: "Column not found on this board." } });
      return;
    }
    const ticket = await dal.kanban.createTicket(board.board.id, parsed.data);
    res.status(201).json({ ticket });
  });

  router.patch("/tickets/:ticketId", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanUpdateTicketSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const ticket = await dal.kanban.updateTicket(req.params.ticketId, parsed.data);
    if (!ticket) {
      res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } });
      return;
    }
    res.json({ ticket });
  });

  router.patch("/boards/:boardId/tickets/reorder", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanReorderTicketSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const snapshot = await dal.kanban.reorderTicket(req.params.boardId, parsed.data);
    if (!snapshot) {
      res.status(400).json({ error: { code: "REORDER_FAILED", message: "Unable to move ticket." } });
      return;
    }
    res.json(snapshot);
  });

  router.post("/tickets/:ticketId/comments", authRequired, requireCsrfProtection, async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: { code: "INVALID_CONTENT", message: "Comment content is required." } });
      return;
    }
    const comment = await dal.kanban.addComment(req.params.ticketId, (req as any).user?.id || "anonymous", content.trim());
    if (!comment) {
      res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } });
      return;
    }
    res.status(201).json({ comment });
  });

  router.delete("/comments/:commentId", authRequired, requireCsrfProtection, async (req, res) => {
    const success = await dal.kanban.deleteComment(req.params.commentId);
    if (!success) {
      res.status(404).json({ error: { code: "COMMENT_NOT_FOUND", message: "Comment not found." } });
      return;
    }
    res.json({ success: true });
  });

  return router;
}
