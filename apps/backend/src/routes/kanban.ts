import { Router } from "express";
import type { KanbanColumn } from "@opendock/shared/types";
import { store } from "../state";
import { authRequired, requireCsrfProtection } from "../auth";

export function createKanbanRouter(): Router {
  const router = Router();

  router.get("/boards", (_req, res) => {
    const boards = store.listBoards().map((board) => {
      const snapshot = store.boardSnapshot(board.id);
      return snapshot?.board ?? board;
    });
    res.json({ boards, users: store.listUsers() });
  });

  router.post("/boards", authRequired, requireCsrfProtection, (req, res) => {
    const { name, description, projectId, members } = req.body ?? {};
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const snapshot = store.createBoard({ name, description, projectId, members });
    res.status(201).json(store.boardSnapshot(snapshot.id));
  });

  router.post("/boards/:boardId/columns", authRequired, requireCsrfProtection, (req, res) => {
    const { title } = req.body ?? {};
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const board = store.boardSnapshot(req.params.boardId);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const column = store.createColumn(req.params.boardId, { title });
    res.status(201).json({ column });
  });

  router.post("/boards/:boardId/sprints", authRequired, requireCsrfProtection, (req, res) => {
    const { name, goal, startDate, endDate, status } = req.body ?? {};
    if (!name || !startDate || !endDate) {
      res.status(400).json({ error: "name, startDate, and endDate are required" });
      return;
    }
    const board = store.boardSnapshot(req.params.boardId);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const sprint = store.createSprint(req.params.boardId, { name, goal, startDate, endDate, status });
    res.status(201).json({ sprint });
  });

  router.post("/boards/:boardId/tickets", authRequired, requireCsrfProtection, (req, res) => {
    const { columnId, title, description, assigneeIds, tags, estimate, priority, sprintId } = req.body ?? {};
    if (!columnId || !title) {
      res.status(400).json({ error: "columnId and title are required" });
      return;
    }
    const board = store.boardSnapshot(req.params.boardId);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const columnExists = board.columns.some((column: KanbanColumn) => column.id === columnId);
    if (!columnExists) {
      res.status(400).json({ error: "Invalid columnId" });
      return;
    }
    const ticket = store.createTicket(req.params.boardId, {
      columnId,
      title,
      description,
      assigneeIds,
      tags,
      estimate,
      priority,
      sprintId,
    });
    res.status(201).json({ ticket });
  });

  router.patch("/tickets/:ticketId", authRequired, requireCsrfProtection, (req, res) => {
    const ticket = store.updateTicket(req.params.ticketId, req.body ?? {});
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json({ ticket });
  });

  router.patch("/boards/:boardId/tickets/reorder", authRequired, requireCsrfProtection, (req, res) => {
    const { ticketId, toColumnId, toIndex } = req.body ?? {};
    if (!ticketId || !toColumnId || typeof toIndex !== "number") {
      res.status(400).json({ error: "ticketId, toColumnId, toIndex required" });
      return;
    }
    const snapshot = store.moveTicket(ticketId, toColumnId, Number(toIndex));
    if (!snapshot) {
      res.status(400).json({ error: "Unable to move ticket" });
      return;
    }
    res.json(snapshot);
  });

  return router;
}


