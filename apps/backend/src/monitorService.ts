import cron, { ScheduledTask } from "node-cron";
import type { Deployment } from "@opendock/shared/types";
import { store } from "./state";

export class MonitorService {
  private task: ScheduledTask | null = null;

  start() {
    if (this.task) return;
    this.task = cron.schedule("*/1 * * * *", () => {
      const deployments: Deployment[] = store.snapshot().deployments.filter((deployment) => deployment.status === "running");
      deployments.forEach((deployment) => {
        store.updateHealth(deployment.id, "up");
      });
    });
  }

  stop() {
    this.task?.stop();
    this.task = null;
  }
}
