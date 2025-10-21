import { Router } from "express";
import { store } from "../state";
import { BuildService } from "../buildService";
import { authRequired, requireCsrfProtection } from "../auth";

export function createProjectsRouter(builds: BuildService): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    const projects = store.listProjects().map((project) => {
      const projectBuilds = store.listBuilds(project.id);
      const latestBuild = projectBuilds
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const deployment = store.findDeploymentByProject(project.id);
      return {
        ...project,
        latestBuild,
        deployment,
        builds: projectBuilds.slice(-5).reverse(),
      };
    });

    res.json({ projects });
  });

  router.post("/", authRequired, requireCsrfProtection, (req, res) => {
    const { name, repoUrl, branch = "main", installCommand, buildCommand } = req.body ?? {};
    if (!name || !repoUrl) {
      res.status(400).json({ error: "name and repoUrl are required" });
      return;
    }

    if (store.findProjectByRepo(repoUrl)) {
      res.status(409).json({ error: "Project already exists for this repository" });
      return;
    }

    const project = store.createProject({
      name,
      repoUrl,
      branch,
      buildConfig: {
        installCommand,
        buildCommand,
      },
    });

    const build = builds.enqueue({
      projectId: project.id,
      branch,
      reason: "manual",
    });

    res.status(201).json({ project, initialBuildId: build.id });
  });

  router.post("/:projectId/redeploy", authRequired, requireCsrfProtection, (req, res) => {
    const project = store.findProject(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const build = builds.enqueue({
      projectId: project.id,
      branch: req.body?.branch ?? project.branch,
      reason: "manual",
    });

    res.status(202).json({ build });
  });

  router.get("/:projectId/logs", (req, res) => {
    const project = store.findProject(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ builds: store.listBuilds(project.id) });
  });

  router.patch("/:projectId", authRequired, requireCsrfProtection, (req, res) => {
    const project = store.updateProject(req.params.projectId, {
      branch: req.body?.branch,
      buildConfig: {
        installCommand: req.body?.installCommand ?? undefined,
        buildCommand: req.body?.buildCommand ?? undefined,
      },
    });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ project });
  });

  return router;
}

