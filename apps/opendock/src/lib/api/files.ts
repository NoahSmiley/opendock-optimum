import { request } from "./base";
import type { FileItem, FileFolder } from "@/stores/files/types";

export async function fetchFiles(folderId?: string): Promise<FileItem[]> {
  const qs = folderId ? `?folderId=${folderId}` : "";
  const res = await request<{ files: FileItem[] }>(`/api/files${qs}`);
  return res.files;
}

export async function fetchFolders(): Promise<FileFolder[]> {
  const res = await request<{ folders: FileFolder[] }>("/api/files/folders");
  return res.folders;
}

export async function createFolder(name: string, parentId?: string | null): Promise<FileFolder> {
  return request<FileFolder>("/api/files/folders", {
    method: "POST",
    body: { name, parentId },
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  return request<void>(`/api/files/folders/${folderId}`, { method: "DELETE" });
}

export async function uploadFile(file: File, folderId?: string | null): Promise<FileItem> {
  const formData = new FormData();
  formData.append("file", file);
  if (folderId) formData.append("folderId", folderId);

  const res = await fetch("/api/files/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json();
}

export async function deleteFile(fileId: string): Promise<void> {
  return request<void>(`/api/files/${fileId}`, { method: "DELETE" });
}

export async function moveFile(fileId: string, folderId: string | null): Promise<FileItem> {
  return request<FileItem>(`/api/files/${fileId}`, {
    method: "PATCH",
    body: { folderId },
  });
}
