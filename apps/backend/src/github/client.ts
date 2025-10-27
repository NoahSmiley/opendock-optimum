const USER_AGENT = "OpenDock/preview";

export interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
}

interface GitHubEmail {
  email: string;
  primary?: boolean;
  verified?: boolean;
  visibility?: "public" | null;
}

export interface GitHubAccessTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
}

export async function exchangeCodeForToken(options: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<GitHubAccessTokenResponse> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      redirect_uri: options.redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub token exchange failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as GitHubAccessTokenResponse & { error?: string; error_description?: string };
  if ((data as { error?: string }).error) {
    throw new Error(`GitHub token exchange error: ${(data as { error_description?: string }).error_description ?? "unknown error"}`);
  }

  return data;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load GitHub user: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as GitHubUser;
  return payload;
}

export async function fetchPrimaryEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      return null;
    }
    const text = await response.text();
    throw new Error(`Failed to load GitHub emails: ${response.status} ${text}`);
  }

  const emails = (await response.json()) as GitHubEmail[];
  if (!Array.isArray(emails)) {
    return null;
  }

  const primary = emails.find((email) => email.primary && email.verified) ?? emails[0];
  return primary?.email ?? null;
}
