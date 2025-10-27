import { randomBytes } from "crypto";
import { store } from "./state";

export class DeployService {
  private basePort = 4100;
  private portMap = new Map<string, number>();

  deploy({ projectId, buildId, environmentId }: { projectId: string; buildId: string; environmentId: string }) {
    const environment = store.findEnvironmentById(environmentId);
    if (!environment) {
      throw new Error(`Environment ${environmentId} not found for project ${projectId}`);
    }

    const previous = store.findActiveDeploymentByEnvironment(environmentId);
    if (previous) {
      store.updateDeployment(previous.id, { status: "stopped" });
    }

    const port = this.acquirePort(projectId, environmentId);

    return store.createDeployment({
      projectId,
      buildId,
      environmentId,
      port,
      containerId: randomBytes(12).toString("hex"),
      status: "running",
      mode: "simulated",
    });
  }

  private acquirePort(projectId: string, environmentId: string) {
    const key = `${projectId}:${environmentId}`;
    if (this.portMap.has(key)) {
      return this.portMap.get(key)!;
    }
    const port = this.basePort + this.portMap.size;
    this.portMap.set(key, port);
    return port;
  }
}


