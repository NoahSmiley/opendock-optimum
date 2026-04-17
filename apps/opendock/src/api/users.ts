import { apiGet } from "@/api/client";
import type { UserSummary } from "@/types";

export const searchUsers = (query: string) =>
  apiGet<UserSummary[]>(`/users/search?q=${encodeURIComponent(query)}`);
