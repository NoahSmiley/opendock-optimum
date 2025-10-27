import { Router } from "express";
import { authRequired } from "../auth";
import type { RequestWithUser } from "../auth/middleware";
import { getGitHubToken } from "../github/state";

interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
}

export function createGitHubRouter(): Router {
  const router = Router();

  router.use(authRequired);

  router.get("/repos", async (req, res) => {
    const user = (req as RequestWithUser).user!;
    const token = getGitHubToken(user.id);

    if (!token) {
      res.status(404).json({
        error: {
          code: "GITHUB_ACCOUNT_NOT_CONNECTED",
          message: "Connect your GitHub account first by signing in with GitHub.",
        },
      });
      return;
    }

    const visibilityParam = typeof req.query.visibility === "string" ? req.query.visibility : "all";
    const visibility = ["public", "private", "all"].includes(visibilityParam) ? visibilityParam : "all";

    try {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&sort=updated&visibility=${visibility}`,
        {
          headers: {
            Authorization: `${token.tokenType} ${token.accessToken}`.trim(),
            Accept: "application/vnd.github+json",
            "User-Agent": "OpenDock/preview",
          },
        },
      );

      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).json({
          error: {
            code: "GITHUB_REPOS_FAILED",
            message: text || "Unable to load repositories from GitHub.",
          },
        });
        return;
      }

      const payload = (await response.json()) as GitHubRepositoryResponse[];
      const repos = payload.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        owner: repo.owner?.login ?? "",
      }));

      res.json({ repositories: repos });
    } catch (error) {
      console.error("[github] failed to list repos", error);
      res.status(500).json({
        error: {
          code: "GITHUB_REPOS_FAILED",
          message: error instanceof Error ? error.message : "Unable to load repositories from GitHub.",
        },
      });
    }
  });

  return router;
}
