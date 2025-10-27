import type { Build, BuildConfig } from "@opendock/shared/types";
import type { ProjectCreateInput, ProjectUpdateInput } from "@opendock/shared/projects";
import { normalizeRepoUrl } from "@opendock/shared/projects";
import { store } from "../state";
import type { ProjectsRepository, ProjectOverview } from "./projects.types";

function sanitizeCreateBuildConfig(config?: ProjectCreateInput["buildConfig"]): BuildConfig | undefined {
  if (!config) return undefined;
  const result: BuildConfig = {};
  if (config.installCommand) {
    result.installCommand = config.installCommand;
  }
  if (config.buildCommand) {
    result.buildCommand = config.buildCommand;
  }
  if (config.workspacePath) {
    result.workspacePath = config.workspacePath;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeUpdateBuildConfig(config?: ProjectUpdateInput["buildConfig"]): Partial<BuildConfig> | undefined {
  if (!config) return undefined;
  const result: Partial<BuildConfig> = {};
  let hasChange = false;

  if (Object.prototype.hasOwnProperty.call(config, "installCommand")) {
    hasChange = true;
    const value = config.installCommand;
    result.installCommand = value === null ? undefined : value;
  }

  if (Object.prototype.hasOwnProperty.call(config, "buildCommand")) {
    hasChange = true;
    const value = config.buildCommand;
    result.buildCommand = value === null ? undefined : value;
  }

  if (Object.prototype.hasOwnProperty.call(config, "workspacePath")) {
    hasChange = true;
    const value = config.workspacePath;
    result.workspacePath = value === null ? undefined : value ?? undefined;
  }

  return hasChange ? result : undefined;
}

function summarizeProject(projectId: string, limitRecentBuilds: number): Pick<ProjectOverview, "latestBuild" | "deployment" | "builds" | "environments"> {
  store.ensureDefaultEnvironments(projectId);
  const builds = store.listBuilds(projectId);
  const sorted = builds
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestBuild = sorted[0];
  const recentBuilds = builds.slice(-limitRecentBuilds).reverse();
  const environments = store
    .listEnvironments(projectId)
    .map((environment) => {
      const deployments = store
        .listDeploymentsByEnvironment(environment.id)
        .slice()
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      const recentDeployments = deployments.slice(0, limitRecentBuilds);
      return {
        ...environment,
        latestDeployment: deployments[0],
        recentDeployments,
      };
    });

  const deployment =
    environments.find((env) => env.slug.toLowerCase() === "production")?.latestDeployment ?? environments[0]?.latestDeployment;

  return {
    latestBuild,
    deployment,
    builds: recentBuilds,
    environments,
  };
}

export class StateProjectsRepository implements ProjectsRepository {
  async list() {
    return store.listProjects();
  }

  async listOverview(limitRecentBuilds = 5) {
    const projects = store.listProjects();
    return projects.map((project) => {
      const summary = summarizeProject(project.id, limitRecentBuilds);
      return {
        ...project,
        ...summary,
      };
    });
  }

  async findById(projectId: string) {
    return store.findProject(projectId) ?? null;
  }

  async findOverviewById(projectId: string, limitRecentBuilds = 5) {
    const project = store.findProject(projectId);
    if (!project) return null;
    const summary = summarizeProject(project.id, limitRecentBuilds);
    return {
      ...project,
      ...summary,
    };
  }

  async findByRepoUrl(repoUrl: string) {
    const match = store.findProjectByRepo(repoUrl);
    if (match) {
      return match;
    }
    return store.listProjects().find((project) => normalizeRepoUrl(project.repoUrl) === normalizeRepoUrl(repoUrl)) ?? null;
  }

  async create(input: ProjectCreateInput) {
    return store.createProject({
      name: input.name,
      repoUrl: input.repoUrl,
      branch: input.branch ?? "main",
      buildConfig: sanitizeCreateBuildConfig(input.buildConfig),
    });
  }

  async update(projectId: string, updates: ProjectUpdateInput) {
    const buildConfig = sanitizeUpdateBuildConfig(updates.buildConfig);
    const project = store.updateProject(projectId, {
      name: updates.name,
      branch: updates.branch,
      buildConfig,
    });
    return project ?? null;
  }

  async listBuilds(projectId: string): Promise<Build[]> {
    return store.listBuilds(projectId);
  }
}
