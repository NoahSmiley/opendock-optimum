import type { Build, Project, ProjectsResponse } from "@opendock/shared/types";
import type { ProjectCreateInput, ProjectUpdateInput } from "@opendock/shared/projects";

export type ProjectOverview = ProjectsResponse["projects"][number];

export interface ProjectsRepository {
  list(): Promise<Project[]>;
  listOverview(limitRecentBuilds?: number): Promise<ProjectOverview[]>;
  findById(projectId: string): Promise<Project | null>;
  findByRepoUrl(repoUrl: string): Promise<Project | null>;
  findOverviewById(projectId: string, limitRecentBuilds?: number): Promise<ProjectOverview | null>;
  create(input: ProjectCreateInput): Promise<Project>;
  update(projectId: string, updates: ProjectUpdateInput): Promise<Project | null>;
  listBuilds(projectId: string): Promise<Build[]>;
}
