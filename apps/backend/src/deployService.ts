import { randomBytes } from "crypto";
import { store } from "./state";

export class DeployService {
  private basePort = 4100;
  private portMap = new Map<string, number>();

  deploy({ projectId, buildId }: { projectId: string; buildId: string }) {
    const previous = store.findDeploymentByProject(projectId);
    if (previous) {
      store.updateDeployment(previous.id, { status: "stopped" });
    }

    const port = this.acquirePort(projectId);

    return store.createDeployment({
      projectId,
      buildId,
      port,
      containerId: randomBytes(12).toString("hex"),
      status: "running",
      mode: "simulated",
    });
  }

  private acquirePort(projectId: string) {
    if (this.portMap.has(projectId)) {
      return this.portMap.get(projectId)!;
    }
    const port = this.basePort + this.portMap.size;
    this.portMap.set(projectId, port);
    return port;
  }
}


