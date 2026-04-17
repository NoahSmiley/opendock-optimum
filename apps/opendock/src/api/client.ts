import { invoke } from "@tauri-apps/api/core";

export async function apiGet<T>(path: string): Promise<T> {
  return invoke<T>("api_get", { path });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return invoke<T>("api_post", { path, body });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return invoke<T>("api_patch", { path, body });
}

export async function apiDelete(path: string): Promise<void> {
  await invoke("api_delete", { path });
}
