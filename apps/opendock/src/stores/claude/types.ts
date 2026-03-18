export interface ClaudeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ClaudeToolActivity[];
  timestamp: number;
}

export interface ClaudeToolActivity {
  toolId: string;
  name: string;
  input: unknown;
  output?: string;
}

export type ClaudeStatus = "idle" | "setup" | "thinking" | "error";

export interface ClaudeStore {
  status: ClaudeStatus;
  messages: ClaudeMessage[];
  panelOpen: boolean;
  cliInstalled: boolean | null;
  cliAuthed: boolean | null;
  error: string | null;

  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setStatus: (status: ClaudeStatus) => void;
  addUserMessage: (content: string) => void;
  appendAssistantText: (content: string) => void;
  addToolActivity: (tool: ClaudeToolActivity) => void;
  updateToolOutput: (toolId: string, output: string) => void;
  completeTurn: () => void;
  setError: (error: string) => void;
  clearMessages: () => void;
  setCliInstalled: (installed: boolean) => void;
  setCliAuthed: (authed: boolean) => void;
}
