import type { KanbanTicket } from "@opendock/shared/types";

export type SprintFormState = {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
};

export type BacklogFormState = {
  title: string;
  description: string;
  assigneeId: string;
  tags: string;
};

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
