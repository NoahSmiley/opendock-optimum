type BoardsWindow = Window & { __OPENDOCK_BOARDS_URL?: string };

type ImportMetaLike = {
  env?: {
    VITE_BOARDS_URL?: string;
    DEV?: boolean;
    MODE?: string;
    [key: string]: string | boolean | undefined;
  };
};

export function getBoardsAppUrl(): string {
  if (typeof window !== "undefined") {
    const win = window as BoardsWindow;
    if (win.__OPENDOCK_BOARDS_URL) {
      return win.__OPENDOCK_BOARDS_URL;
    }
  }

  const meta = typeof import.meta !== "undefined" ? (import.meta as unknown as ImportMetaLike) : undefined;
  const env = meta?.env ?? {};

  const envBoardsUrl = typeof env.VITE_BOARDS_URL === "string" ? env.VITE_BOARDS_URL : undefined;
  if (envBoardsUrl && envBoardsUrl.trim().length > 0) {
    return envBoardsUrl.trim();
  }

  const isDev = Boolean(env.DEV ?? env.MODE === "development");
  if (isDev) {
    if (typeof window !== "undefined") {
      const { protocol, hostname, port } = window.location;
      const currentPort = Number.parseInt(port, 10);
      const defaultPorts = [5173, 5174, 5175, 5176];

      if (Number.isFinite(currentPort)) {
        const candidatePort =
          defaultPorts.find((value) => value !== currentPort) ??
          (currentPort > 0 && currentPort < 65535 ? currentPort + 1 : undefined);
        if (candidatePort) {
          return `${protocol}//${hostname}:${candidatePort}`;
        }
      }

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${protocol}//${hostname}:5173`;
      }

      return `${protocol}//${hostname}/boards/app`;
    }

    return "http://localhost:5173";
  }

  return "/boards/app";
}
