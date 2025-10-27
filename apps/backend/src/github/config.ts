export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

let cachedConfig: GitHubOAuthConfig | null = null;

export function getGitHubConfig(): GitHubOAuthConfig | null {
  if (cachedConfig) return cachedConfig;

  const clientId = process.env.OPENDOCK_GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.OPENDOCK_GITHUB_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.OPENDOCK_GITHUB_REDIRECT_URI?.trim() ??
    "http://localhost:4000/api/auth/github/callback";
  const scope =
    process.env.OPENDOCK_GITHUB_SCOPE?.trim() ??
    "read:user user:email repo";

  if (!clientId || !clientSecret) {
    return null;
  }

  cachedConfig = {
    clientId,
    clientSecret,
    redirectUri,
    scope,
  };
  return cachedConfig;
}
