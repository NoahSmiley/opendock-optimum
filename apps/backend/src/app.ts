
import "dotenv/config";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { store } from "./state";
import { DeployService } from "./deployService";
import { BuildService } from "./buildService";
import { MonitorService } from "./monitorService";
import { createProjectsRouter } from "./routes/projects";
import { createKanbanRouter } from "./routes/kanban";
import { createNotesRouter } from "./routes/notes";
import { createGitHubRouter } from "./routes/github";
import { authRouter } from "./routes/auth";
import { dal } from "./dal";
import { attachUser } from "./auth";

export interface CreateAppOptions {
  startMonitor?: boolean;
}

export function createApp(options: CreateAppOptions = {}) {
  const allowedOrigins = process.env.OPENDOCK_WEB_ORIGIN
    ? process.env.OPENDOCK_WEB_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean)
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5180"];

  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        console.warn(`[CORS] Origin ${origin} is not in allowed list:`, allowedOrigins);
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      allowedHeaders: ["content-type", "x-opendock-csrf", "accept"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      exposedHeaders: ["content-type"],
    }),
  );
  app.use(cookieParser());
  app.use(attachUser);

  const deployer = new DeployService();
  const builds = new BuildService(deployer);
  const monitor = new MonitorService();
  const shouldStartMonitor = options.startMonitor ?? process.env.NODE_ENV !== "test";
  if (shouldStartMonitor) {
    monitor.start();
  }

  console.log(`[dal] using ${dal.kind} data provider`);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/state", (_req, res) => {
    res.json(store.snapshot());
  });

  // Serve uploaded files
  const uploadsPath = path.join(process.cwd(), "uploads");
  app.use("/api/uploads", express.static(uploadsPath));

  app.use("/api/auth", authRouter);
  app.use("/api/github", createGitHubRouter());
  app.use("/api/projects", createProjectsRouter(builds, dal.projects));
  app.use("/api/kanban", createKanbanRouter());
  app.use("/api/notes", createNotesRouter());

  return app;
}
