import { create } from "zustand";
import type { ClaudeStore } from "./types";

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}-${Date.now()}`;

export const useClaudeStore = create<ClaudeStore>((set, get) => ({
  status: "idle",
  messages: [],
  panelOpen: false,
  cliInstalled: null,
  cliAuthed: null,
  error: null,

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: "error" }),

  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: nextId(), role: "user", content, timestamp: Date.now() },
      ],
    })),

  appendAssistantText: (content) => {
    const msgs = get().messages;
    const last = msgs[msgs.length - 1];
    if (last?.role === "assistant") {
      // Replace content (CLI sends full text each time, not deltas)
      set({
        messages: [
          ...msgs.slice(0, -1),
          { ...last, content },
        ],
      });
    } else {
      set({
        messages: [
          ...msgs,
          { id: nextId(), role: "assistant", content, timestamp: Date.now() },
        ],
      });
    }
  },

  addToolActivity: (tool) => {
    const msgs = get().messages;
    const last = msgs[msgs.length - 1];
    if (last?.role === "assistant") {
      set({
        messages: [
          ...msgs.slice(0, -1),
          { ...last, tools: [...(last.tools ?? []), tool] },
        ],
      });
    }
  },

  updateToolOutput: (toolId, output) => {
    const msgs = get().messages;
    const last = msgs[msgs.length - 1];
    if (last?.role === "assistant" && last.tools) {
      const tools = last.tools.map((t) =>
        t.toolId === toolId ? { ...t, output } : t
      );
      set({ messages: [...msgs.slice(0, -1), { ...last, tools }] });
    }
  },

  completeTurn: () => set({ status: "idle" }),
  clearMessages: () => set({ messages: [], error: null }),
  setCliInstalled: (installed) => set({ cliInstalled: installed }),
  setCliAuthed: (authed) => set({ cliAuthed: authed }),
}));
