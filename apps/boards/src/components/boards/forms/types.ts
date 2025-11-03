import type { KanbanTicket } from "@opendock/shared/types";

export type ColumnDraftState = {
  title: string;
  assigneeId: string;
  priority: KanbanTicket["priority"];
};

export type BoardFormState = {
  name: string;
  description: string;
  members: string;
  projectId: string;
};
