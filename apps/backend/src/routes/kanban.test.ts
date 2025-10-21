import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { SuperAgentTest } from "supertest";
import { createApp } from "../app";
import { prisma } from "../dal/sql/client";
import { store } from "../state";

const TEST_USER = {
  password: "StrongPassword123",
};

function uniqueEmail(label: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(16).slice(2)}`;
  return `kanban-${label}-${suffix}@example.com`;
}

async function resetDatabase(): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  store.reset();
}

async function fetchCsrf(agent: SuperAgentTest): Promise<string> {
  const response = await agent.get("/api/auth/csrf").expect(200);
  expect(response.body.csrfToken).toBeDefined();
  return response.body.csrfToken;
}

async function register(agent: SuperAgentTest): Promise<{ csrf: string }> {
  const csrfToken = await fetchCsrf(agent);
  const email = uniqueEmail("user");
  const response = await agent
    .post("/api/auth/register")
    .set("Content-Type", "application/json")
    .set("X-OPENDOCK-CSRF", csrfToken)
    .send({ email, password: TEST_USER.password });

  expect(response.status).toBe(201);
  return { csrf: response.body.csrfToken as string };
}

describe("kanban routes", () => {
  const app = createApp({ startMonitor: false });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("lists empty boards and users", async () => {
    const agent = request.agent(app);
    const response = await agent.get("/api/kanban/boards").expect(200);
    expect(response.body.boards).toEqual([]);
    expect(response.body.users).toEqual([]);
  });

  it("returns 404 for unknown board stream", async () => {
    const agent = request.agent(app);
    await register(agent);
    await agent.get("/api/kanban/boards/does-not-exist/stream").expect(404);
  });

  it("creates a board, column, ticket, and sprint", async () => {
    const agent = request.agent(app);
    const { csrf } = await register(agent);

    const createBoard = await agent
      .post("/api/kanban/boards")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        name: "Team Board",
        description: "Sprint planning",
        members: [
          { name: "Jane Doe", email: "jane@example.com" },
          { name: "John Doe", email: "john@example.com" },
        ],
      })
      .expect(201);

    const boardId = createBoard.body.board.id as string;
    expect(boardId).toBeDefined();

    const createColumn = await agent
      .post(`/api/kanban/boards/${boardId}/columns`)
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({ title: "Blocked", order: 4 })
      .expect(201);

    const columnId = createColumn.body.column.id as string;
    expect(columnId).toBeDefined();

    const createSprint = await agent
      .post(`/api/kanban/boards/${boardId}/sprints`)
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        name: "Sprint 1",
        goal: "Deliver MVP",
        startDate: "2025-10-21",
        endDate: "2025-11-04",
        status: "planned",
      })
      .expect(201);
    expect(createSprint.body.sprint.name).toBe("Sprint 1");

    const createTicket = await agent
      .post(`/api/kanban/boards/${boardId}/tickets`)
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        columnId,
        title: "Wire up SSE",
        description: "Implement server-sent events for board updates.",
        priority: "high",
        tags: ["sse", "backend"],
      })
      .expect(201);

    const ticketId = createTicket.body.ticket.id as string;
    expect(ticketId).toBeDefined();

    const updateTicket = await agent
      .patch(`/api/kanban/tickets/${ticketId}`)
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        description: "Implement server-sent events with reconnection support.",
        estimate: 5,
      })
      .expect(200);

    expect(updateTicket.body.ticket.estimate).toBe(5);

    const reorder = await agent
      .patch(`/api/kanban/boards/${boardId}/tickets/reorder`)
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        ticketId,
        toColumnId: columnId,
        toIndex: 0,
      })
      .expect(200);

    expect(reorder.body.board.id).toBe(boardId);
  });
});
