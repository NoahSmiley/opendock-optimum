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
    return "http://localhost:5174";
  }

  return "/boards/app";
}
