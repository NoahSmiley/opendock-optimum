import type { BuildRequest } from "@opendock/shared/types";
import { store } from "./state";
import { DeployService } from "./deployService";

interface QueuedBuild extends BuildRequest {
  buildId: string;
}

export class BuildService {
  private queue: QueuedBuild[] = [];
  private processing = false;

  constructor(private readonly deployer: DeployService) {}

  enqueue(request: BuildRequest) {
    const project = store.findProject(request.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const build = store.createBuild(project.id, request.branch ?? project.branch, request.commit);
    if (request.commit) {
      store.appendCommit(project.id, request.commit);
    }

    store.appendBuildLog(build.id, `Build queued (${request.reason})`);

    this.queue.push({
      ...request,
      buildId: build.id,
    });

    void this.processQueue();
    return build;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;
      await this.runJob(job).catch((error) => {
        console.error("[build] job failed", error);
      });
    }

    this.processing = false;
  }

  private async runJob(job: QueuedBuild) {
    const project = store.findProject(job.projectId);
    if (!project) {
      store.setBuildStatus(job.buildId, "failed");
      store.appendBuildLog(job.buildId, "Project missing; aborting");
      return;
    }

    store.setBuildStatus(job.buildId, "running");
    store.appendBuildLog(job.buildId, `Starting pipeline for ${project.repoUrl}#${job.branch ?? project.branch}`);

    await this.simulateStep(job.buildId, "Pulling latest changes", 1000);

    const buildConfig = project.buildConfig ?? {};
    if (buildConfig.installCommand) {
      await this.simulateStep(job.buildId, `Running ${buildConfig.installCommand}`, 1200);
    } else {
      await this.simulateStep(job.buildId, "Installing dependencies", 800);
    }

    if (buildConfig.buildCommand) {
      await this.simulateStep(job.buildId, `Running ${buildConfig.buildCommand}`, 1500);
    } else {
      await this.simulateStep(job.buildId, "Building container image", 1200);
    }

    store.setBuildStatus(job.buildId, "success");
    store.appendBuildLog(job.buildId, "Build completed successfully");

    const deployment = this.deployer.deploy({
      projectId: project.id,
      buildId: job.buildId,
    });

    store.appendBuildLog(
      job.buildId,
      `Deployment started on port ${deployment.port} (container ${deployment.containerId.slice(0, 12)})`,
    );
  }

  private async simulateStep(buildId: string, message: string, duration: number) {
    store.appendBuildLog(buildId, `${message}...`);
    await new Promise((resolve) => setTimeout(resolve, duration));
    store.appendBuildLog(buildId, `${message} complete`);
  }
}
