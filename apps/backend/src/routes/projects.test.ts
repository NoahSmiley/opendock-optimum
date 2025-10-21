import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { SuperAgentTest } from "supertest";
import { createApp } from "../app";
import { prisma } from "../dal/sql/client";
import { store } from "../state";

const TEST_USER = {
  email: "projects-user@example.com",
  password: "StrongPassword123",
};

function uniqueEmail(label: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(16).slice(2)}`;
  const [local, domain] = TEST_USER.email.split("@");
  return `${local}+${label}-${suffix}@${domain ?? "example.com"}`;
}

async function resetDatabase(): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function fetchCsrf(agent: SuperAgentTest): Promise<string> {
  const response = await agent.get("/api/auth/csrf").expect(200);
  expect(response.body.csrfToken).toBeDefined();
  return response.body.csrfToken;
}

async function register(agent: SuperAgentTest, email = uniqueEmail("suite")): Promise<string> {
  const csrf = await fetchCsrf(agent);
  const response = await agent
    .post("/api/auth/register")
    .set("Content-Type", "application/json")
    .set("X-OPENDOCK-CSRF", csrf)
    .send({
      email,
      password: TEST_USER.password,
    })
    .expect(201);
  expect(response.body.csrfToken).toBeDefined();
  return response.body.csrfToken;
}

describe("projects routes", () => {
  const app = createApp({ startMonitor: false });

  beforeEach(async () => {
    await resetDatabase();
    store.reset();
  });

  afterAll(async () => {
    store.reset();
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("returns an empty array when no projects exist", async () => {
    const agent = request.agent(app);
    const response = await agent.get("/api/projects").expect(200);
    expect(response.body.projects).toEqual([]);
  });

  it("creates a project and enqueues an initial build", async () => {
    const agent = request.agent(app);
    const csrf = await register(agent);

    const createResponse = await agent
      .post("/api/projects")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        name: "OpenDock",
        repoUrl: "https://github.com/example/opendock.git",
        branch: "main",
        buildConfig: {
          installCommand: "pnpm install",
          buildCommand: "pnpm build",
        },
      })
      .expect(201);

    const { project, initialBuildId } = createResponse.body;
    expect(project.name).toBe("OpenDock");
    expect(project.repoUrl).toBe("https://github.com/example/opendock.git");
    expect(initialBuildId).toBeDefined();

    const builds = store.listBuilds(project.id);
    expect(builds.length).toBeGreaterThanOrEqual(1);
    expect(builds[0]?.id).toBe(initialBuildId);
  });

  it("rejects duplicate repositories", async () => {
    const agent = request.agent(app);
    const csrf = await register(agent);

    const payload = {
      name: "Duplicated",
      repoUrl: "https://github.com/example/duplicate.git",
      branch: "main",
    };

    await agent
      .post("/api/projects")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send(payload)
      .expect(201);

    const response = await agent
      .post("/api/projects")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", await fetchCsrf(agent))
      .send(payload)
      .expect(409);

    expect(response.body.error?.code).toBe("PROJECT_EXISTS");
  });

  it("updates project settings", async () => {
    const agent = request.agent(app);
    const csrf = await register(agent);

    const createResponse = await agent
      .post("/api/projects")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        name: "Dock",
        repoUrl: "https://github.com/example/dock.git",
        branch: "main",
      })
      .expect(201);

    const projectId = createResponse.body.project.id as string;

    const updateResponse = await agent
      .patch(`/api/projects/${projectId}`)
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", await fetchCsrf(agent))
      .send({
        branch: "develop",
        buildConfig: {
          installCommand: "pnpm install --frozen-lockfile",
        },
      })
      .expect(200);

    expect(updateResponse.body.project.branch).toBe("develop");
    expect(updateResponse.body.project.buildConfig?.installCommand).toBe("pnpm install --frozen-lockfile");
  });

  it("returns build logs for a project", async () => {
    const agent = request.agent(app);
    const csrf = await register(agent);

    const createResponse = await agent
      .post("/api/projects")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        name: "Logs",
        repoUrl: "https://github.com/example/logs.git",
        branch: "main",
      })
      .expect(201);

    const projectId = createResponse.body.project.id as string;

    const logsResponse = await agent.get(`/api/projects/${projectId}/logs`).expect(200);
    expect(Array.isArray(logsResponse.body.builds)).toBe(true);
    expect(logsResponse.body.builds.length).toBeGreaterThanOrEqual(1);
  });

  it("returns a project overview by id", async () => {
    const agent = request.agent(app);
    const csrf = await register(agent);

    const createResponse = await agent
      .post("/api/projects")
      .set("Content-Type", "application/json")
      .set("X-OPENDOCK-CSRF", csrf)
      .send({
        name: "Overview",
        repoUrl: "https://github.com/example/overview.git",
        branch: "main",
        buildConfig: {
          installCommand: "pnpm install",
        },
      })
      .expect(201);

    const projectId = createResponse.body.project.id as string;

    const detailResponse = await agent.get(`/api/projects/${projectId}`).expect(200);
    expect(detailResponse.body.project.id).toBe(projectId);
    expect(detailResponse.body.project.builds?.length).toBeGreaterThanOrEqual(1);

    await agent.get("/api/projects/unknown-id").expect(404);
  });
});
