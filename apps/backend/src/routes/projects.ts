import { Router } from "express";
import { z } from "zod";
import {
  BranchNameSchema,
  ProjectCreateSchema,
  ProjectUpdateSchema,
} from "@opendock/shared/projects";
import type { ProjectsRepository } from "../dal";
import { BuildService } from "../buildService";
import { authRequired, requireCsrfProtection } from "../auth";

const RedeploySchema = z
  .object({
    branch: BranchNameSchema.optional(),
    environment: z
      .string()
      .trim()
      .min(1, "Environment is required when provided.")
      .max(120, "Environment slug must be less than 120 characters.")
      .optional(),
  })
  .strict();

function validationError(error: z.ZodError) {
  return {
    error: {
      code: "INVALID_BODY",
      message: "Request body validation failed.",
      details: error.flatten().fieldErrors,
    },
  };
}

export function createProjectsRouter(builds: BuildService, projects: ProjectsRepository): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const result = await projects.listOverview(5);
    res.json({ projects: result });
  });

  router.post("/", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = ProjectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    const payload = parsed.data;
    const existing = await projects.findByRepoUrl(payload.repoUrl);
    if (existing) {
      res.status(409).json({
        error: {
          code: "PROJECT_EXISTS",
          message: "This repository is already connected to OpenDock.",
        },
      });
      return;
    }

    const project = await projects.create(payload);

    const build = builds.enqueue({
      projectId: project.id,
      branch: payload.branch ?? project.branch,
      environmentSlug: "staging",
      reason: "manual",
    });

    res.status(201).json({ project, initialBuildId: build.id });
  });

  router.get("/:projectId", async (req, res) => {
    const detail = await projects.findOverviewById(req.params.projectId, 10);
    if (!detail) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }
    res.json({ project: detail });
  });

  router.post("/:projectId/redeploy", authRequired, requireCsrfProtection, async (req, res) => {
    const project = await projects.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }

    const body = RedeploySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json(validationError(body.error));
      return;
    }

    const build = builds.enqueue({
      projectId: project.id,
      branch: body.data.branch ?? project.branch,
      environmentSlug: body.data.environment ?? "production",
      reason: "manual",
    });

    res.status(202).json({ build });
  });

  router.get("/:projectId/logs", async (req, res) => {
    const project = await projects.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }

    const buildList = await projects.listBuilds(project.id);
    res.json({ builds: buildList });
  });

  router.patch("/:projectId", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = ProjectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    const payload = parsed.data;
    if (!payload.name && !payload.branch && !payload.buildConfig) {
      res.status(400).json({
        error: {
          code: "NO_CHANGES",
          message: "Provide at least one field to update.",
        },
      });
      return;
    }

    const updated = await projects.update(req.params.projectId, payload);
    if (!updated) {
      res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }

    res.json({ project: updated });
  });

  return router;
}
