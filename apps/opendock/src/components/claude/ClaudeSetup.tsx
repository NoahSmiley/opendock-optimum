import { useState } from "react";
import { useClaudeStore } from "@/stores/claude/store";

export function ClaudeSetup() {
  const cliInstalled = useClaudeStore((s) => s.cliInstalled);
  const cliAuthed = useClaudeStore((s) => s.cliAuthed);
  const setCliInstalled = useClaudeStore((s) => s.setCliInstalled);
  const setCliAuthed = useClaudeStore((s) => s.setCliAuthed);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const installed = await invoke<boolean>("check_claude_status");
      setCliInstalled(installed);
      if (installed) {
        const authed = await invoke<boolean>("check_claude_auth");
        setCliAuthed(authed);
      }
    } catch {
      setCliInstalled(false);
    }
    setChecking(false);
  };

  const startLogin = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("start_claude_login");
      // Wait a bit then re-check
      setTimeout(checkStatus, 5000);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <p className="text-[13px] text-neutral-300">Connect your Claude account</p>

      {cliInstalled === null && (
        <button onClick={checkStatus} disabled={checking} className="claude-setup-btn">
          {checking ? "Checking..." : "Check Claude CLI"}
        </button>
      )}

      {cliInstalled === false && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-neutral-500">
            Install Claude CLI first:
          </p>
          <code className="text-[11px] bg-neutral-900 px-3 py-2 rounded text-neutral-400">
            npm install -g @anthropic-ai/claude-code
          </code>
          <button onClick={checkStatus} className="claude-setup-btn mt-2">
            Re-check
          </button>
        </div>
      )}

      {cliInstalled && cliAuthed === false && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-neutral-500">CLI installed. Sign in to Claude:</p>
          <button onClick={startLogin} className="claude-setup-btn">
            Sign in with Claude
          </button>
          <button onClick={checkStatus} className="claude-setup-btn-secondary mt-1">
            Re-check auth
          </button>
        </div>
      )}

      {cliInstalled && cliAuthed && (
        <p className="text-[12px] text-green-400">Claude is connected.</p>
      )}
    </div>
  );
}
