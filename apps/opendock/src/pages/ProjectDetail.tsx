import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock4,
  GitBranch,
  PlayCircle,
  Server,
} from "lucide-react";
import type { BuildStatus, ProjectsResponse } from "@opendock/shared/types";
import { fetchProject, fetchProjectLogs, triggerRedeploy } from "@/lib/api";

type ProjectWithRelations = ProjectsResponse["projects"][number];

type DetailState =
  | { status: "loading"; project?: undefined; error?: undefined }
  | { status: "ready"; project: ProjectWithRelations; error?: undefined }
  | { status: "error"; project?: undefined; error: string }
  | { status: "not-found"; project?: undefined; error?: undefined };

const statusClasses: Record<BuildStatus, string> = {
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  running: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [redeploying, setRedeploying] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setState({ status: "error", error: "Missing project id in route." });
      return;
    }
    let mounted = true;
    setState({ status: "loading" });
    fetchProject(projectId)
      .then((response) => {
        if (!mounted) return;
        setState({ status: "ready", project: response.project });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        if (err instanceof Error && err.message.includes("404")) {
          setState({ status: "not-found" });
        } else {
          setState({
            status: "error",
            error: err instanceof Error ? err.message : "Unable to load this project.",
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const activeProjectId = state.status === "ready" ? state.project.id : null;
  const activeProjectBranch = state.status === "ready" ? state.project.branch : null;

  const reloadLogs = useCallback(async () => {
    if (!activeProjectId) return;
    setRefreshingLogs(true);
    try {
      const { builds } = await fetchProjectLogs(activeProjectId);
      setState((prev) => (prev.status === "ready" && prev.project.id === activeProjectId
        ? { status: "ready", project: { ...prev.project, builds } }
        : prev));
    } catch (err) {
      console.error("Failed to refresh logs", err);
    } finally {
      setRefreshingLogs(false);
    }
  }, [activeProjectId]);

  const handleRedeploy = useCallback(async () => {
    if (!activeProjectId || !activeProjectBranch) return;
    setRedeploying(true);
    try {
      await triggerRedeploy(activeProjectId, activeProjectBranch);
      await reloadLogs();
    } catch (err) {
      console.error("Failed to trigger redeploy", err);
    } finally {
      setRedeploying(false);
    }
  }, [activeProjectBranch, activeProjectId, reloadLogs]);

  if (state.status === "loading") {
    return (
      <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white/80 p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-300">
        Loading project…
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Project not found</h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard#projects")}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-300">
          We couldn’t find that project. It may have been removed or you might not have permission to view it.
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-6 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Unable to load project</h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard#projects")}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        </div>
        <p>{state.error}</p>
      </div>
    );
  }

  const project = state.project;
  const latestBuild = project.latestBuild;
  const builds = project.builds ?? [];

  const buildHistory = useMemo(
    () =>
      builds
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [builds],
  );

  return (
    <div className="space-y-10">
      <header className="space-y-8 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/dashboard#projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">
            <GitBranch className="h-4 w-4" />
            {project.branch}
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">{project.name}</h1>
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
          >
            {project.repoUrl}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">
            Track build health, deployment status, and history for this repository. Redeploy to trigger a fresh build using
            the commands you configured during setup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRedeploy}
            disabled={redeploying}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <PlayCircle className="h-4 w-4" />
            {redeploying ? "Queueing redeploy…" : "Redeploy"}
          </button>
          <button
            type="button"
            onClick={reloadLogs}
            disabled={refreshingLogs}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20"
          >
            <Server className="h-4 w-4" />
            {refreshingLogs ? "Refreshing logs…" : "Refresh logs"}
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent builds</h2>
            <span className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">
              {buildHistory.length} runs
            </span>
          </div>
          {buildHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/40 p-6 text-sm text-neutral-500 dark:border-white/20 dark:bg-neutral-900/40 dark:text-neutral-300">
              No builds yet. Trigger one with the redeploy button.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/60 dark:border-white/10 dark:bg-neutral-900/40">
              <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-white/10">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Build</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Branch</th>
                    <th className="px-4 py-3 text-left">Queued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {buildHistory.map((build) => (
                    <tr key={build.id} className="hover:bg-neutral-50/70 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-300">
                        {build.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[build.status]}`}>
                          <StatusIcon status={build.status} className="h-3.5 w-3.5" />
                          {build.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-300">{build.branch}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-300">
                        {new Date(build.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Latest build</h3>
            {latestBuild ? (
              <dl className="mt-4 space-y-3 text-sm text-neutral-500 dark:text-neutral-300">
                <div>
                  <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[latestBuild.status]}`}>
                      <StatusIcon status={latestBuild.status} className="h-3.5 w-3.5" />
                      {latestBuild.status.toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Queued</dt>
                  <dd className="mt-1">{new Date(latestBuild.createdAt).toLocaleString()}</dd>
                </div>
                {latestBuild.commit && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Commit</dt>
                    <dd className="mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-300">
                      {latestBuild.commit.sha.slice(0, 12)} — {latestBuild.commit.message}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-300">
                No builds have run yet. Redeploy to kick off the first one.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Deployment</h3>
            {project.deployment ? (
              <dl className="mt-4 space-y-3 text-sm text-neutral-500 dark:text-neutral-300">
                <div className="flex items-center justify-between">
                  <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Status</dt>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    project.deployment.healthStatus === "up"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                  }`}>
                    {project.deployment.healthStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Port</dt>
                  <dd className="mt-1 font-mono text-xs">{project.deployment.port}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">Last health check</dt>
                  <dd className="mt-1">
                    {project.deployment.lastHealthCheck
                      ? new Date(project.deployment.lastHealthCheck).toLocaleString()
                      : "Not reported"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-300">
                No deployment is running. Redeploy this project to start one.
              </p>
            )}
          </div>
        </aside>
      </section>
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
