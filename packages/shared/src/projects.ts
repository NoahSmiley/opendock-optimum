import { z } from "zod";
import type {
  Build,
  BuildConfig,
  BuildStatus,
  CommitInfo,
  Deployment,
  DeploymentStatus,
  EnvironmentSummary,
  HealthStatus,
  Project,
  ProjectsResponse,
} from "./types";

const nonEmptyTrimmed = (message: string, max?: number) => {
  let schema = z.string().trim().min(1, message);
  if (typeof max === "number") {
    schema = schema.max(max, message);
  }
  return schema;
};

const RepoUrlPattern =
  /^(https?:\/\/|git@|ssh:\/\/)[\w.@:/\-~]+(\.git)?$/i;

export const ProjectNameSchema = z
  .string()
  .trim()
  .min(1, "Project name is required.")
  .max(120, "Project name must be less than 120 characters.");

export const RepoUrlSchema = z
  .string()
  .trim()
  .min(1, "Repository URL is required.")
  .max(300, "Repository URL must be less than 300 characters.")
  .refine((value) => RepoUrlPattern.test(value), {
    message: "Repository URL must begin with http(s), ssh, or git@.",
  });

export const BranchNameSchema = z
  .string()
  .trim()
  .min(1, "Branch name is required.")
  .max(120, "Branch name must be less than 120 characters.")
  .regex(/^[\w./-]+$/, {
    message: "Branch name may only include letters, numbers, _, ., /, or -.",
  });

const CommandSchema = z
  .string()
  .trim()
  .min(1, "Command is required.")
  .max(200, "Command must be less than 200 characters.");

const OptionalCommandSchema = CommandSchema.optional();

const OptionalPathSchema = z
  .string()
  .trim()
  .min(1, "Workspace path cannot be empty.")
  .max(200, "Workspace path must be less than 200 characters.")
  .optional();

export const BuildStatusSchema = z.enum(["queued", "running", "success", "failed"]);
type _BuildStatusSchemaCheck = z.infer<typeof BuildStatusSchema> extends BuildStatus ? true : never;

export const HealthStatusSchema = z.enum(["unknown", "up", "down"]);
type _HealthStatusSchemaCheck = z.infer<typeof HealthStatusSchema> extends HealthStatus ? true : never;

export const DeploymentStatusSchema = z.enum(["running", "stopped", "failed"]);
type _DeploymentStatusSchemaCheck = z.infer<typeof DeploymentStatusSchema> extends DeploymentStatus ? true : never;

export const CommitInfoSchema = z
  .object({
    sha: nonEmptyTrimmed("Commit SHA is required.").max(
      80,
      "Commit SHA must be less than 80 characters.",
    ),
    message: nonEmptyTrimmed("Commit message is required.").max(
      500,
      "Commit message must be less than 500 characters.",
    ),
    author: nonEmptyTrimmed("Commit author is required.").max(
      160,
      "Commit author must be less than 160 characters.",
    ),
    timestamp: z
      .string()
      .trim()
      .min(1, "Commit timestamp is required."),
  })
  .strict();

type _CommitInfoSchemaCheck = z.infer<typeof CommitInfoSchema> extends CommitInfo ? true : never;

export const BuildConfigSchema = z
  .object({
    installCommand: OptionalCommandSchema,
    buildCommand: OptionalCommandSchema,
    workspacePath: OptionalPathSchema,
  })
  .strict();

type _BuildConfigSchemaCheck = z.infer<typeof BuildConfigSchema> extends BuildConfig ? true : never;

export const BuildSchema = z
  .object({
    id: nonEmptyTrimmed("Build id is required.").max(
      120,
      "Build id must be less than 120 characters.",
    ),
    projectId: nonEmptyTrimmed("Project id is required.").max(
      120,
      "Project id must be less than 120 characters.",
    ),
    status: BuildStatusSchema,
    branch: BranchNameSchema,
    createdAt: z.string().trim(),
    updatedAt: z.string().trim(),
    commit: CommitInfoSchema.optional(),
    logs: z.array(z.string()),
  })
  .strict();

type _BuildSchemaCheck = z.infer<typeof BuildSchema> extends Build ? true : never;

export const DeploymentSchema = z
  .object({
    id: nonEmptyTrimmed("Deployment id is required.").max(
      120,
      "Deployment id must be less than 120 characters.",
    ),
    projectId: nonEmptyTrimmed("Project id is required.").max(
      120,
      "Project id must be less than 120 characters.",
    ),
    environmentId: nonEmptyTrimmed("Environment id is required.").max(
      120,
      "Environment id must be less than 120 characters.",
    ),
    buildId: nonEmptyTrimmed("Build id is required.").max(
      120,
      "Build id must be less than 120 characters.",
    ),
    port: z.number().int().min(0),
    containerId: nonEmptyTrimmed(
      "Container id is required.",
    ).max(120, "Container id must be less than 120 characters."),
    startedAt: z.string().trim(),
    updatedAt: z.string().trim(),
    status: DeploymentStatusSchema,
    healthStatus: HealthStatusSchema,
    lastHealthCheck: z.string().trim().nullable(),
    healthUrl: z.string().trim().url().optional(),
    mode: z.enum(["simulated", "docker"]),
  })
  .strict();

type _DeploymentSchemaCheck = z.infer<typeof DeploymentSchema> extends Deployment ? true : never;

export const EnvironmentSchema = z
  .object({
    id: nonEmptyTrimmed("Environment id is required.").max(
      120,
      "Environment id must be less than 120 characters.",
    ),
    projectId: nonEmptyTrimmed("Project id is required.").max(
      120,
      "Project id must be less than 120 characters.",
    ),
    slug: nonEmptyTrimmed("Environment slug is required.").max(
      120,
      "Environment slug must be less than 120 characters.",
    ),
    name: nonEmptyTrimmed("Environment name is required.").max(
      160,
      "Environment name must be less than 160 characters.",
    ),
    url: z.string().trim().url().optional(),
    order: z.number().int().min(0),
    createdAt: z.string().trim(),
    updatedAt: z.string().trim(),
  })
  .strict();

export const EnvironmentSummarySchema = EnvironmentSchema.extend({
  latestDeployment: DeploymentSchema.optional(),
  recentDeployments: z.array(DeploymentSchema),
}).strict();

type _EnvironmentSummarySchemaCheck = z.infer<typeof EnvironmentSummarySchema> extends EnvironmentSummary ? true : never;

export const ProjectSchema = z
  .object({
    id: nonEmptyTrimmed("Project id is required.").max(
      120,
      "Project id must be less than 120 characters.",
    ),
    name: ProjectNameSchema,
    repoUrl: RepoUrlSchema,
    branch: BranchNameSchema,
    createdAt: z.string().trim(),
    latestCommit: CommitInfoSchema.optional(),
    buildConfig: BuildConfigSchema.optional(),
  })
  .strict();

type _ProjectSchemaCheck = z.infer<typeof ProjectSchema> extends Project ? true : never;

export const ProjectWithRelationsSchema = ProjectSchema.extend({
  latestBuild: BuildSchema.optional(),
  deployment: DeploymentSchema.optional(),
  builds: z.array(BuildSchema).optional(),
  environments: z.array(EnvironmentSummarySchema).optional(),
}).strict();
type _ProjectWithRelationsSchemaCheck = z.infer<typeof ProjectWithRelationsSchema> extends ProjectsResponse["projects"][number]
  ? true
  : never;

export const ProjectsResponseSchema = z
  .object({
    projects: z.array(ProjectWithRelationsSchema),
  })
  .strict();

type _ProjectsResponseSchemaCheck = z.infer<typeof ProjectsResponseSchema> extends ProjectsResponse ? true : never;

export const ProjectDetailResponseSchema = z
  .object({
    project: ProjectWithRelationsSchema,
  })
  .strict();

export type ProjectDetailResponse = z.infer<typeof ProjectDetailResponseSchema>;

const NullableCommandSchema = CommandSchema.nullish();
const NullablePathSchema = z
  .string()
  .trim()
  .max(200, "Workspace path must be less than 200 characters.")
  .nullish();

export const ProjectCreateSchema = z
  .object({
    name: ProjectNameSchema,
    repoUrl: RepoUrlSchema,
    branch: BranchNameSchema.optional().default("main"),
    buildConfig: z
      .object({
        installCommand: OptionalCommandSchema,
        buildCommand: OptionalCommandSchema,
        workspacePath: OptionalPathSchema,
      })
      .strict()
      .optional(),
  })
  .strict();

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;

export const ProjectUpdateSchema = z
  .object({
    name: ProjectNameSchema.optional(),
    branch: BranchNameSchema.optional(),
    buildConfig: z
      .object({
        installCommand: NullableCommandSchema,
        buildCommand: NullableCommandSchema,
        workspacePath: NullablePathSchema,
      })
      .strict()
      .optional(),
  })
  .strict();

export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;

export function normalizeRepoUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.replace(/\.git$/i, "").toLowerCase();
}
