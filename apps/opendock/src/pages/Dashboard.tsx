import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock4,
  GitBranch,
  PlayCircle,
  Server,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BuildStatus, HealthStatus, ProjectsResponse } from "@opendock/shared/types";
import type { ProjectCreateInput } from "@opendock/shared/projects";
import { getApiBaseUrl, RequestError } from "@opendock/shared/api";
import { createProject, fetchGitHubRepositories, fetchProjects, type GitHubRepositorySummary } from "@/lib/api";
import { getBoardsAppUrl } from "@/lib/config";
import { isBoardsUrlExternal, launchBoardsApp } from "@/lib/boards";

type DashboardState =
  | { status: "idle" | "loading"; projects: ProjectsResponse["projects"]; error?: undefined }
  | { status: "error"; projects: ProjectsResponse["projects"]; error: string }
  | { status: "ready"; projects: ProjectsResponse["projects"]; error?: undefined };

const buildStatusStyles: Record<BuildStatus, string> = {
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  running: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
};

const deploymentStatusStyles: Record<HealthStatus, string> = {
  up: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  down: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  unknown: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200",
};

type CreateProjectFormState = {
  name: string;
  repoUrl: string;
  branch: string;
  installCommand: string;
  buildCommand: string;
  workspacePath: string;
};

type CreateProjectStatus =
  | { status: "idle"; error?: undefined }
  | { status: "saving"; error?: undefined }
  | { status: "error"; error: string };

const createFormDefaults = (): CreateProjectFormState => ({
  name: "",
  repoUrl: "",
  branch: "main",
  installCommand: "",
  buildCommand: "",
  workspacePath: "",
});

export default function DashboardPage() {
  const [{ projects, status, error }, setState] = useState<DashboardState>({
    status: "idle",
    projects: [],
  });
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProjectFormState>(() => createFormDefaults());
  const [createStatus, setCreateStatus] = useState<CreateProjectStatus>({ status: "idle" });
  const [githubRepos, setGithubRepos] = useState<GitHubRepositorySummary[]>([]);
  const [githubReposStatus, setGithubReposStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [githubReposError, setGithubReposError] = useState<string | null>(null);
  const [githubReposErrorCode, setGithubReposErrorCode] = useState<string | null>(null);
  const boardsUrl = useMemo(() => getBoardsAppUrl(), []);
  const boardsLaunchTitle = useMemo(
    () => (isBoardsUrlExternal(boardsUrl) ? "Launch Boards in a new window" : "Launch Boards"),
    [boardsUrl],
  );
  const githubLoginUrl = useMemo(() => {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
    const redirectTarget =
      typeof window !== "undefined" && window.location
        ? `${window.location.pathname}${window.location.search}` || "/dashboard"
        : "/dashboard";
    const url = new URL("/api/auth/github/login", `${baseUrl}/`);
    url.searchParams.set("redirect", redirectTarget);
    return url.toString();
  }, []);

  const friendlyError = useCallback(
    (err: unknown) =>
      err instanceof Error ? err.message : "Unable to load projects right now. Please try again shortly.",
    [],
  );

  const loadGitHubRepos = useCallback(async () => {
    setGithubReposStatus("loading");
    setGithubReposError(null);
    setGithubReposErrorCode(null);
    try {
      const response = await fetchGitHubRepositories();
      setGithubRepos(response.repositories);
      setGithubReposStatus("ready");
      setGithubReposErrorCode(null);
    } catch (err) {
      setGithubReposStatus("error");
      if (err instanceof RequestError) {
        setGithubReposError(err.message || "Unable to load GitHub repositories.");
        setGithubReposErrorCode(err.code ?? null);
      } else {
        setGithubReposError(err instanceof Error ? err.message : "Unable to load GitHub repositories.");
        setGithubReposErrorCode(null);
      }
    }
  }, []);

  const refreshProjects = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setState((current) => ({ status: "loading", projects: current.projects }));
      }
      try {
        const response = await fetchProjects();
        setState({ status: "ready", projects: response.projects });
      } catch (err) {
        setState({ status: "error", error: friendlyError(err), projects: [] });
      }
    },
    [friendlyError],
  );

  const handleLaunchBoards = useCallback(() => {
    launchBoardsApp(boardsUrl);
  }, [boardsUrl]);

  useEffect(() => {
    let isActive = true;
    setState((current) => ({ status: "loading", projects: current.projects }));
    fetchProjects()
      .then((response) => {
        if (!isActive) return;
        setState({ status: "ready", projects: response.projects });
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        setState({ status: "error", error: friendlyError(err), projects: [] });
      });
    return () => {
      isActive = false;
    };
  }, [friendlyError]);

  const openCreate = useCallback(() => {
    setCreateStatus({ status: "idle" });
    setCreateForm(createFormDefaults());
    setCreateOpen(true);
    if (githubReposStatus === "idle") {
      void loadGitHubRepos();
    }
  }, [githubReposStatus, loadGitHubRepos]);

  const closeCreate = useCallback(() => {
    if (createStatus.status === "saving") return;
    setCreateStatus({ status: "idle" });
    setCreateOpen(false);
  }, [createStatus.status]);

  const handleCreateChange = useCallback((field: keyof CreateProjectFormState, value: string) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
    if (createStatus.status === "error") {
      setCreateStatus({ status: "idle" });
    }
  }, [createStatus.status]);

  const handleCreateSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (createStatus.status === "saving") return;

      const trimmed = {
        name: createForm.name.trim(),
        repoUrl: createForm.repoUrl.trim(),
        branch: createForm.branch.trim(),
        installCommand: createForm.installCommand.trim(),
        buildCommand: createForm.buildCommand.trim(),
        workspacePath: createForm.workspacePath.trim(),
      };

      if (!trimmed.name || !trimmed.repoUrl) {
        setCreateStatus({ status: "error", error: "Project name and repository URL are required." });
        return;
      }

      setCreateStatus({ status: "saving" });

      const payload: ProjectCreateInput = {
        name: trimmed.name,
        repoUrl: trimmed.repoUrl,
        branch: trimmed.branch || "main",
      };

      const buildConfig: ProjectCreateInput["buildConfig"] = {};
      if (trimmed.installCommand) {
        buildConfig.installCommand = trimmed.installCommand;
      }
      if (trimmed.buildCommand) {
        buildConfig.buildCommand = trimmed.buildCommand;
      }
      if (trimmed.workspacePath) {
        buildConfig.workspacePath = trimmed.workspacePath;
      }
      if (buildConfig && Object.keys(buildConfig).length > 0) {
        payload.buildConfig = buildConfig;
      }

      try {
        await createProject(payload);
        setCreateStatus({ status: "idle" });
        setCreateForm(createFormDefaults());
        setCreateOpen(false);
        await refreshProjects({ silent: true });
      } catch (err) {
        setCreateStatus({
          status: "error",
          error: err instanceof Error ? err.message : "Unable to connect that repository. Please try again.",
        });
      }
    },
    [createForm, createStatus.status, refreshProjects],
  );

  const handleRepositorySelect = useCallback((repo: GitHubRepositorySummary) => {
    setCreateForm((current) => {
      const next: CreateProjectFormState = {
        ...current,
        repoUrl: `https://github.com/${repo.fullName}.git`,
      };
      if (!current.branch || current.branch.trim().length === 0) {
        next.branch = repo.defaultBranch || current.branch;
      }
      if (!current.name || current.name.trim().length === 0) {
        next.name = repo.name;
      }
      return next;
    });
  }, []);

  const selectedGitHubRepoId = useMemo(() => {
    if (!createForm.repoUrl) return null;
    const normalized = createForm.repoUrl.trim().replace(/\.git$/, "");
    const match = githubRepos.find((repo) => {
      const repoUrl = `https://github.com/${repo.fullName}`;
      const repoSsh = `git@github.com:${repo.fullName}`;
      return normalized === repoUrl || normalized === repoSsh || normalized === `${repoSsh}.git`;
    });
    return match ? match.id : null;
  }, [createForm.repoUrl, githubRepos]);

  const stats = useMemo(() => {
    const builds = projects.flatMap((project) => project.builds ?? []);
    const environmentDeployments = projects
      .flatMap((project) => project.environments ?? [])
      .map((environment) => environment.latestDeployment)
      .filter((deployment): deployment is NonNullable<typeof deployment> => Boolean(deployment));

    const runningBuilds = builds.filter((build) => build.status === "running").length;
    const failedBuildsLastFive = builds.filter((build) => build.status === "failed").length;
    const healthyDeployments = environmentDeployments.filter((deployment) => deployment.healthStatus === "up").length;
    const unhealthyDeployments = environmentDeployments.filter((deployment) => deployment.healthStatus === "down").length;

    return {
      projectCount: projects.length,
      runningBuilds,
      failedBuildsLastFive,
      healthyDeployments,
      unhealthyDeployments,
    };
  }, [projects]);

  const environmentCards = useMemo(
    () =>
      projects.flatMap((project) =>
        (project.environments ?? []).map((environment) => ({
          project,
          environment,
        })),
      ),
    [projects],
  );

  const hasActiveDeployments = environmentCards.some(({ environment }) => Boolean(environment.latestDeployment));

  return (
    <div className="space-y-10">
      <header id="overview" className="space-y-6 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500 dark:border-white/10 dark:bg-white/10 dark:text-neutral-200">
            <PlayCircle className="h-3.5 w-3.5" /> Dashboard
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Ship calm. See builds, deployments, and boards at a glance.
          </h1>
          <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-300">
            Connect a repository, watch the first build queue instantly, and keep an eye on deployments and board
            activity without leaving the OpenDock shell.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={GitBranch}
            label="Projects"
            value={stats.projectCount}
            description="Linked repositories with automated builds."
          />
          <StatCard
            icon={Clock4}
            label="Builds running"
            value={stats.runningBuilds}
            description="Live pipeline runs across all projects."
          />
          <StatCard
            icon={AlertCircle}
            label="Recent failures"
            value={stats.failedBuildsLastFive}
            description="Failed builds across the last 5 per project."
            tone={stats.failedBuildsLastFive > 0 ? "warning" : "default"}
          />
          <StatCard
            icon={Server}
            label="Healthy deployments"
            value={`${stats.healthyDeployments}/${stats.healthyDeployments + stats.unhealthyDeployments}`}
            description="Services reporting an UP status."
            tone={stats.unhealthyDeployments > 0 ? "warning" : "default"}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLaunchBoards}
            title={boardsLaunchTitle}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Launch Boards
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
          >
            Connect another repo
          </a>
        </div>
      </header>

      <section id="deployment" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Deployment signals</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Track running services and their health checks without leaving the docs view.
            </p>
          </div>
          <Server className="hidden h-6 w-6 text-neutral-400 dark:text-neutral-500 md:block" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {environmentCards.map(({ project, environment }) => (
            <DeploymentCard key={`${project.id}:${environment.id}`} project={project} environment={environment} />
          ))}
          {!hasActiveDeployments && (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white/40 p-6 text-sm text-neutral-500 dark:border-white/20 dark:bg-neutral-900/40 dark:text-neutral-300">
              Start a deployment from any connected project to monitor uptime here. Redeployments issued from the board
              or API will also surface in this feed.
            </div>
          )}
        </div>
      </section>

      <section id="projects" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Projects</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Latest builds and commit details from the last five runs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              disabled={createStatus.status === "saving" || isCreateOpen}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              Connect repository
            </button>
            <GitBranch className="hidden h-6 w-6 text-neutral-400 dark:text-neutral-500 md:block" />
          </div>
        </div>
        <div className="space-y-3">
          {isCreateOpen && (
            <CreateProjectCard
              form={createForm}
              status={createStatus}
              onChange={handleCreateChange}
              onClose={closeCreate}
              onSubmit={handleCreateSubmit}
              githubRepos={githubRepos}
              githubReposStatus={githubReposStatus}
              githubReposError={githubReposError}
              githubReposErrorCode={githubReposErrorCode}
              githubLoginUrl={githubLoginUrl}
              selectedGitHubRepoId={selectedGitHubRepoId}
              onSelectRepository={handleRepositorySelect}
              onRefreshGitHubRepos={loadGitHubRepos}
            />
          )}
          {status === "loading" && (
            <div className="rounded-3xl border border-neutral-200 bg-white/60 p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/60 dark:text-neutral-300">
              Loading project activity...
            </div>
          )}
          {status === "error" && (
            <div className="rounded-3xl border border-rose-300 bg-rose-50/60 p-6 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}
          {status === "ready" && projects.length === 0 && !isCreateOpen && (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white/40 p-6 text-sm text-neutral-500 dark:border-white/20 dark:bg-neutral-900/40 dark:text-neutral-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>No repositories yet. Connect one to see build history and deployment details here.</p>
                <button
                  type="button"
                  onClick={openCreate}
                  disabled={isCreateOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Connect
                </button>
              </div>
            </div>
          )}
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section id="pipelines" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Pipeline automation</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Opinionated defaults that you can customise for your repo shape.
            </p>
          </div>
          <PlayCircle className="hidden h-6 w-6 text-neutral-400 dark:text-neutral-500 md:block" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile
            title="Instant onboarding"
            description="Provide a Git URL and branch, and OpenDock queues an initial build with sensible npm defaults."
          />
          <InfoTile
            title="Custom commands"
            description="Override install/build scripts per project so Docker images or monorepo tooling stay aligned."
          />
          <InfoTile
            title="Redeploy from anywhere"
            description="Kick off redeployments from the dashboard, Boards workspace, or REST API."
          />
        </div>
      </section>

      <section id="monitor" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Monitoring</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Health signals roll up from your deployments so you can spot outages before they land in stand-up.
            </p>
          </div>
          <Activity className="hidden h-6 w-6 text-neutral-400 dark:text-neutral-500 md:block" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoTile
            icon={CheckCircle2}
            title="Uptime at a glance"
            description="Service health is derived from the backend, surfaced in cards, and mirrored in Boards overlays."
          />
          <InfoTile
            icon={AlertCircle}
            title="Signal-ready"
            description="Wire in your own health checks or WebSocket feeds to update these views in real time."
          />
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description: string;
  tone?: "default" | "warning";
}

function StatCard({ icon: Icon, label, value, description, tone = "default" }: StatCardProps) {
  return (
    <div
      className="rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm transition hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-white/20"
      aria-label={label}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
        {tone === "warning" && <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-300" />}
      </div>
      <p className="mt-6 text-3xl font-semibold text-neutral-900 dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}

interface CreateProjectCardProps {
  form: CreateProjectFormState;
  status: CreateProjectStatus;
  onChange: (field: keyof CreateProjectFormState, value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  githubRepos: GitHubRepositorySummary[];
  githubReposStatus: "idle" | "loading" | "ready" | "error";
  githubReposError: string | null;
  githubReposErrorCode: string | null;
  githubLoginUrl: string;
  selectedGitHubRepoId: number | null;
  onSelectRepository: (repo: GitHubRepositorySummary) => void;
  onRefreshGitHubRepos: () => void;
}

function CreateProjectCard({
  form,
  status,
  onChange,
  onClose,
  onSubmit,
  githubRepos,
  githubReposStatus,
  githubReposError,
  githubReposErrorCode,
  githubLoginUrl,
  selectedGitHubRepoId,
  onSelectRepository,
  onRefreshGitHubRepos,
}: CreateProjectCardProps) {
  const isSaving = status.status === "saving";
  const [repoQuery, setRepoQuery] = useState("");

  const filteredRepos = useMemo(() => {
    if (!repoQuery.trim()) {
      return githubRepos;
    }
    const needle = repoQuery.trim().toLowerCase();
    return githubRepos.filter((repo) => {
      const fullName = `${repo.owner}/${repo.name}`.toLowerCase();
      const description = repo.description?.toLowerCase() ?? "";
      return fullName.includes(needle) || description.includes(needle);
    });
  }, [githubRepos, repoQuery]);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Connect a repository</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">
            We&apos;ll queue the first build immediately and surface redeploys from here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-full border border-transparent p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10 dark:hover:text-neutral-100"
          aria-label="Close create project form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {status.status === "error" && status.error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {status.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300" htmlFor="project-name">
            Project name
          </label>
          <input
            id="project-name"
            name="name"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            required
            disabled={isSaving}
            autoFocus
            placeholder="OpenDock"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300" htmlFor="project-branch">
            Default branch
          </label>
          <input
            id="project-branch"
            name="branch"
            value={form.branch}
            onChange={(event) => onChange("branch", event.target.value)}
            disabled={isSaving}
            placeholder="main"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
              GitHub repository
            </label>
            <button
              type="button"
              onClick={() => {
                if (!isSaving) {
                  void onRefreshGitHubRepos();
                }
              }}
              disabled={isSaving || githubReposStatus === "loading"}
              className="text-xs font-semibold text-neutral-500 underline-offset-4 transition hover:text-neutral-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Refresh
            </button>
          </div>
          {githubReposStatus === "loading" && (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching repositories from GitHub...
            </div>
          )}
          {githubReposStatus === "error" && githubReposError && (
            <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              <p>{githubReposError}</p>
              {githubReposErrorCode === "GITHUB_ACCOUNT_NOT_CONNECTED" && (
                <a
                  href={githubLoginUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-50 dark:hover:bg-amber-500/30"
                >
                  Connect with GitHub
                  <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
          {githubReposStatus === "ready" && githubRepos.length > 0 ? (
            <div className="space-y-3">
              <input
                type="search"
                value={repoQuery}
                onChange={(event) => setRepoQuery(event.target.value)}
                placeholder="Search repositories..."
                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
              />
              <div className="rounded-2xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between gap-3 px-1 pb-2 text-xs uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                  <span>Matching repositories</span>
                  <span>{filteredRepos.length}</span>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1" role="list">
                  {filteredRepos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/60 px-4 py-6 text-center text-xs text-neutral-500 dark:border-white/20 dark:bg-neutral-900/40 dark:text-neutral-400">
                      No repositories match that search. Try a different name.
                    </div>
                  ) : (
                    filteredRepos.map((repo) => {
                      const isSelected = selectedGitHubRepoId === repo.id;
                      return (
                        <button
                          key={repo.id}
                          type="button"
                          role="listitem"
                          aria-pressed={isSelected}
                          disabled={isSaving}
                          onClick={() => onSelectRepository(repo)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-white/20 ${
                            isSelected
                              ? "border-neutral-900 bg-neutral-100 shadow-sm dark:border-white/60 dark:bg-white/10"
                              : "border-transparent bg-white/40 hover:border-neutral-300 hover:bg-white/70 dark:bg-neutral-900/40 dark:hover:border-white/20 dark:hover:bg-neutral-900/60"
                          } ${isSaving ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                  {repo.owner}/{repo.name}
                                </div>
                                {isSelected ? <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-300" /> : null}
                              </div>
                              {repo.description ? (
                                <p className="mt-1 max-h-12 overflow-hidden text-ellipsis text-xs text-neutral-500 dark:text-neutral-400">
                                  {repo.description}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">No description provided.</p>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                repo.private
                                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                  : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                              }`}
                            >
                              {repo.private ? "Private" : "Public"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                            <span className="inline-flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {repo.defaultBranch}
                            </span>
                            <a
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 underline-offset-4 transition hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
                            >
                              View repo
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Choosing a repository will fill in the URL, default branch, and name. You can still edit anything manually.
              </p>
            </div>
          ) : null}
          {githubReposStatus === "ready" && githubRepos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/50 px-4 py-6 text-xs text-neutral-500 dark:border-white/20 dark:bg-neutral-900/50 dark:text-neutral-300">
              No repositories were returned from GitHub. Refresh above or check your account permissions.
            </div>
          ) : null}
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300" htmlFor="project-repo">
            Repository URL
          </label>
          <input
            id="project-repo"
            name="repoUrl"
            value={form.repoUrl}
            onChange={(event) => onChange("repoUrl", event.target.value)}
            required
            disabled={isSaving}
            placeholder="https://github.com/example/opendock.git"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300" htmlFor="project-install">
            Install command
          </label>
          <input
            id="project-install"
            name="installCommand"
            value={form.installCommand}
            onChange={(event) => onChange("installCommand", event.target.value)}
            disabled={isSaving}
            placeholder="pnpm install"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300" htmlFor="project-build">
            Build command
          </label>
          <input
            id="project-build"
            name="buildCommand"
            value={form.buildCommand}
            onChange={(event) => onChange("buildCommand", event.target.value)}
            disabled={isSaving}
            placeholder="pnpm build"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-300" htmlFor="project-workspace">
            Workspace path <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">(optional)</span>
          </label>
          <input
            id="project-workspace"
            name="workspacePath"
            value={form.workspacePath}
            onChange={(event) => onChange("workspacePath", event.target.value)}
            disabled={isSaving}
            placeholder="apps/opendock"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white/30 dark:focus:ring-white/10"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          These commands power the first build and future redeploys. You can tweak them later.
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {isSaving ? "Queueing build…" : "Save & queue build"}
        </button>
      </div>
    </form>
  );
}

function ProjectCard({ project }: { project: ProjectsResponse["projects"][number] }) {
  const latestBuild = project.latestBuild;
  const latestCommit = latestBuild?.commit ?? project.latestCommit;
  const builds = project.builds ?? [];

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm transition hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-white/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{project.name}</h3>
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">{project.branch}</p>
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
          >
            {project.repoUrl}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-200 dark:hover:text-white"
          >
            View project
            <ArrowRight className="h-3 w-3" />
          </Link>
          {latestCommit && (
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Latest commit <span className="font-mono text-xs">{latestCommit.sha.slice(0, 7)}</span> —{" "}
              {latestCommit.message}
            </p>
          )}
        </div>
        {latestBuild ? (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${buildStatusStyles[latestBuild.status]}`}
          >
            <StatusIcon status={latestBuild.status} className="h-3.5 w-3.5" />
            {latestBuild.status.toUpperCase()}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/20 dark:text-neutral-300">
            Awaiting first build
          </span>
        )}
      </div>
      {builds.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm dark:divide-white/10">
            <thead className="bg-neutral-100 text-xs uppercase tracking-[0.35em] text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {builds.map((build) => (
                <tr key={build.id} className="bg-white/60 text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${buildStatusStyles[build.status]}`}
                    >
                      <StatusIcon status={build.status} className="h-3 w-3" />
                      {build.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{build.branch}</td>
                  <td className="px-4 py-3 text-xs">{new Date(build.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

type EnvironmentSnapshot = NonNullable<ProjectsResponse["projects"][number]["environments"]>[number];

function DeploymentCard({
  project,
  environment,
}: {
  project: ProjectsResponse["projects"][number];
  environment: EnvironmentSnapshot;
}) {
  const deployment = environment.latestDeployment;
  const healthStyle = deployment
    ? deploymentStatusStyles[deployment.healthStatus]
    : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";

  const recent = environment.recentDeployments ?? [];

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm transition hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{project.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-white dark:bg-white dark:text-neutral-900">
              {environment.name}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500">/{environment.slug}</span>
            {deployment ? (
              <span className="text-neutral-500 dark:text-neutral-400">Port {deployment.port}</span>
            ) : null}
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${healthStyle}`}>
          {deployment ? (
            <>
              {deployment.healthStatus === "up" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {deployment.healthStatus.toUpperCase()}
            </>
          ) : (
            <>Awaiting deploy</>
          )}
        </span>
      </div>

      {deployment ? (
        <dl className="grid gap-3 text-sm text-neutral-500 dark:text-neutral-300 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Mode</dt>
            <dd className="mt-1 font-medium text-neutral-700 dark:text-neutral-200">{deployment.mode}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Updated</dt>
            <dd className="mt-1">{new Date(deployment.updatedAt).toLocaleString()}</dd>
          </div>
          {deployment.healthUrl && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Health URL</dt>
              <dd className="mt-1">
                <a
                  href={deployment.healthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
                >
                  {deployment.healthUrl}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-300">
          Redeploy this project to light up the {environment.name.toLowerCase()} environment.
        </p>
      )}

      {recent.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">
            Recent deployments
          </h4>
          <ul className="mt-3 space-y-2">
            {recent.slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  {new Date(item.startedAt).toLocaleString()}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${deploymentStatusStyles[item.healthStatus]}`}>
                  {item.healthStatus.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

interface InfoTileProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

function InfoTile({ title, description, icon: Icon }: InfoTileProps) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white/70 p-6 text-sm text-neutral-500 shadow-sm transition hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:border-white/20">
      {Icon && (
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2">{description}</p>
    </div>
  );
}

function StatusIcon({ status, className }: { status: BuildStatus; className?: string }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className={className} />;
    case "failed":
      return <AlertCircle className={className} />;
    case "running":
      return <Activity className={className} />;
    case "queued":
    default:
      return <Clock4 className={className} />;
  }
}
