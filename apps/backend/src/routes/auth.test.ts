import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { SuperAgentTest } from "supertest";
import { createApp } from "../app";
import { prisma } from "../dal/sql/client";
import { hashPassword } from "../auth/passwords";
import { __resetAuthRateLimiter } from "./auth";

const TEST_EMAIL = "user@example.com";
const TEST_PASSWORD = "ValidPassword123";
const WRONG_PASSWORD = "WrongPassword123";

async function resetDatabase(): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUser(email: string, password: string): Promise<void> {
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      displayName: "Seed User",
      role: "member",
    },
  });
}

async function fetchCsrf(agent: SuperAgentTest): Promise<string> {
  const response = await agent.get("/api/auth/csrf").expect(200);
  expect(response.body.csrfToken).toBeDefined();
  return response.body.csrfToken;
}

async function postJsonWithCsrf(agent: SuperAgentTest, path: string, body: unknown, csrfToken?: string) {
  const token = csrfToken ?? (await fetchCsrf(agent));
  return agent
    .post(path)
    .set("Content-Type", "application/json")
    .set("X-OPENDOCK-CSRF", token)
    .send(body);
}

function expectCookie(response: request.Response, cookieName: string): void {
  const header = response.headers["set-cookie"];
  expect(header, "expected Set-Cookie header").toBeDefined();
  const cookies = Array.isArray(header) ? header : [header];
  expect(cookies.some((cookie) => typeof cookie === "string" && cookie.startsWith(`${cookieName}=`))).toBe(true);
}

describe("auth routes", () => {
  const app = createApp({ startMonitor: false });

  beforeAll(async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    __resetAuthRateLimiter();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("registers a new user and sets cookies", async () => {
    const agent = request.agent(app);
    const csrfToken = await fetchCsrf(agent);
    const response = await agent
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrfToken)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, displayName: "Test User" })
      .expect(201);

    expect(response.body.user.email).toBe(TEST_EMAIL);
    expectCookie(response, "od.sid");
    expectCookie(response, "od.csrf");
  });

  it("logs in an existing user", async () => {
    const agent = request.agent(app);
    const registerResponse = await postJsonWithCsrf(agent, "/api/auth/register", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(registerResponse.status).toBe(201);
    const logoutCsrf = registerResponse.body.csrfToken;
    await agent.post("/api/auth/logout").set("X-OPENDOCK-CSRF", logoutCsrf).expect(204);

    const loginResponse = await postJsonWithCsrf(agent, "/api/auth/login", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe(TEST_EMAIL);
  });

  it("rejects invalid credentials", async () => {
    const agent = request.agent(app);
    const registerResponse = await postJsonWithCsrf(agent, "/api/auth/register", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(registerResponse.status).toBe(201);
    const logoutCsrf = registerResponse.body.csrfToken;
    await agent.post("/api/auth/logout").set("X-OPENDOCK-CSRF", logoutCsrf).expect(204);

    const response = await postJsonWithCsrf(agent, "/api/auth/login", {
      email: TEST_EMAIL,
      password: WRONG_PASSWORD,
    });
    expect(response.status).toBe(401);
  });

  it("rejects requests without a CSRF token", async () => {
    await seedUser(TEST_EMAIL, TEST_PASSWORD);
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(403);
  });

  it("enforces a rate limit on repeated login attempts", async () => {
    await seedUser(TEST_EMAIL, TEST_PASSWORD);
    const agent = request.agent(app);
    const csrfToken = await fetchCsrf(agent);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await agent
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .set("X-OPENDOCK-CSRF", csrfToken)
        .send({ email: TEST_EMAIL, password: WRONG_PASSWORD })
        .expect(401);
    }

    await agent
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrfToken)
      .send({ email: TEST_EMAIL, password: WRONG_PASSWORD })
      .expect(429);
  });
});
