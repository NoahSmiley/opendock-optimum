import { Router } from "express";
import {
  KanbanCreateBoardSchema,
  KanbanCreateColumnSchema,
  KanbanUpdateColumnSchema,
  KanbanCreateSprintSchema,
  KanbanCreateTicketSchema,
  KanbanCreateTimeLogSchema,
  KanbanReorderTicketSchema,
  KanbanStopTimeLogSchema,
  KanbanUpdateTicketSchema,
  KanbanUpdateBoardSchema,
  KanbanCreateLabelSchema,
  KanbanUpdateLabelSchema,
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

  router.patch("/boards/:boardId/columns/:columnId", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanUpdateColumnSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    const column = await dal.kanban.updateColumn(req.params.boardId, req.params.columnId, parsed.data);
    if (!column) {
      res.status(404).json({ error: { code: "COLUMN_NOT_FOUND", message: "Column not found." } });
      return;
    }
    res.json({ column });
  });

  router.delete("/boards/:boardId/columns/:columnId", authRequired, requireCsrfProtection, async (req, res) => {
    const success = await dal.kanban.deleteColumn(req.params.boardId, req.params.columnId);
    if (!success) {
      res.status(404).json({ error: { code: "COLUMN_NOT_FOUND", message: "Column not found." } });
      return;
    }
    res.json({ success: true });
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
    console.log(`[PATCH /tickets/${req.params.ticketId}] Request received from ${req.get('origin')}`);
    console.log(`[PATCH /tickets/${req.params.ticketId}] Body:`, JSON.stringify(req.body));
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
    console.log(`[PATCH /tickets/${req.params.ticketId}] Success`);
    res.json({ ticket });
  });

  router.delete("/tickets/:ticketId", authRequired, requireCsrfProtection, async (req, res) => {
    const success = await dal.kanban.deleteTicket(req.params.ticketId);
    if (!success) {
      res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } });
      return;
    }
    res.json({ success: true });
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

  // Time log routes
  router.post("/tickets/:ticketId/time-logs/start", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanCreateTimeLogSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const userId = (req as any).user?.id || "anonymous";
    const timeLog = await dal.kanban.startTimeLog(req.params.ticketId, userId, parsed.data);
    if (!timeLog) {
      res.status(400).json({ error: { code: "TIMER_ALREADY_ACTIVE", message: "Timer already running for this ticket." } });
      return;
    }
    res.status(201).json({ timeLog });
  });

  router.post("/tickets/:ticketId/time-logs/:logId/stop", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = KanbanStopTimeLogSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const timeLog = await dal.kanban.stopTimeLog(req.params.logId, parsed.data);
    if (!timeLog) {
      res.status(404).json({ error: { code: "TIME_LOG_NOT_FOUND", message: "Time log not found or already stopped." } });
      return;
    }
    res.json({ timeLog });
  });

  router.get("/tickets/:ticketId/time-logs/active", authRequired, async (req, res) => {
    const userId = (req as any).user?.id || "anonymous";
    const timeLog = await dal.kanban.getActiveTimeLog(req.params.ticketId, userId);
    res.json({ timeLog });
  });

  router.get("/tickets/:ticketId/time-logs", authRequired, async (req, res) => {
    const timeLogs = await dal.kanban.listTimeLogs(req.params.ticketId);
    res.json({ timeLogs });
  });

  router.delete("/time-logs/:logId", authRequired, requireCsrfProtection, async (req, res) => {
    const success = await dal.kanban.deleteTimeLog(req.params.logId);
    if (!success) {
      res.status(404).json({ error: { code: "TIME_LOG_NOT_FOUND", message: "Time log not found." } });
      return;
    }
    res.json({ success: true });
  });

  // Activity endpoints
  router.get("/boards/:boardId/activity", authRequired, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const activities = await dal.kanban.listActivities(req.params.boardId, limit);
    res.json({ activities });
  });

  router.get("/tickets/:ticketId/activity", authRequired, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const activities = await dal.kanban.listTicketActivities(req.params.ticketId, limit);
    res.json({ activities });
  });

  // Label endpoints
  router.get("/boards/:boardId/labels", authRequired, async (req, res) => {
    const labels = await dal.kanban.listLabels(req.params.boardId);
    res.json({ labels });
  });

  router.post("/boards/:boardId/labels", requireCsrfProtection, authRequired, async (req, res) => {
    const parsed = KanbanCreateLabelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const label = await dal.kanban.createLabel(req.params.boardId, parsed.data);
    res.json({ label });
  });

  router.patch("/labels/:labelId", requireCsrfProtection, authRequired, async (req, res) => {
    const parsed = KanbanUpdateLabelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }
    const label = await dal.kanban.updateLabel(req.params.labelId, parsed.data);
    if (!label) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Label not found." } });
      return;
    }
    res.json({ label });
  });

  router.delete("/labels/:labelId", requireCsrfProtection, authRequired, async (req, res) => {
    const deleted = await dal.kanban.deleteLabel(req.params.labelId);
    if (!deleted) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Label not found." } });
      return;
    }
    res.json({ success: true });
  });

  return router;
}
