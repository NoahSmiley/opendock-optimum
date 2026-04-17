import { invoke } from "@tauri-apps/api/core";
import type { LiveEvent } from "@/api/live";

const API_HOST = "opendock-api.athion.me";

export class LiveSocket {
  private ws: WebSocket | null = null;
  private stopped = false;
  private attempt = 0;

  constructor(
    private scope: "note" | "board" | "user",
    private id: string,
    private onEvent: (ev: LiveEvent) => void,
  ) {}

  start() { this.stopped = false; this.connect(); }
  stop() { this.stopped = true; this.ws?.close(); this.ws = null; }

  private async connect() {
    if (this.stopped) return;
    try {
      const token = await invoke<string>("auth_token");
      const url = `wss://${API_HOST}/ws?token=${encodeURIComponent(token)}&scope=${this.scope}&id=${this.id}`;
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onmessage = (e) => {
        this.attempt = 0;
        try { this.onEvent(JSON.parse(e.data) as LiveEvent); } catch { /* ignore */ }
      };
      ws.onclose = () => this.reconnect();
      ws.onerror = () => ws.close();
    } catch { this.reconnect(); }
  }

  private reconnect() {
    if (this.stopped) return;
    this.ws = null;
    this.attempt = Math.min(this.attempt + 1, 6);
    const delay = Math.pow(2, this.attempt) * 500;
    setTimeout(() => this.connect(), delay);
  }
}
