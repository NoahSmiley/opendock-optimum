import { apiDelete, apiGet, apiPost } from "@/api/client";
import type { EntityKind, EntityRef, LinkedEntity } from "@/types";

export const fetchLinks = (kind: EntityKind, id: string) =>
  apiGet<LinkedEntity[]>(`/links?kind=${kind}&id=${id}`);

export const createLink = (a: EntityRef, b: EntityRef, source = "manual") =>
  apiPost<unknown>("/links", { a, b, source });

export const deleteLink = (a: EntityRef, b: EntityRef) =>
  apiDelete(`/links?a_kind=${a.kind}&a_id=${a.id}&b_kind=${b.kind}&b_id=${b.id}`);
