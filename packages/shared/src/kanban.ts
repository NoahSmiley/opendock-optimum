import { z } from "zod";
import type {
  KanbanBoard,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanEpic,
  KanbanSprint,
  KanbanTicket,
  KanbanTimeLog,
  KanbanUser,
  KanbanActivity,
  KanbanLabel,
  KanbanAttachment,
} from "./types";

const nonEmptyTrimmed = (label: string, max = 160) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be less than ${max + 1} characters.`);

const optionalTrimmed = (label: string, max = 160) =>
  z
    .string()
    .trim()
    .min(1, `${label} must be at least 1 character.`)
    .max(max, `${label} must be less than ${max + 1} characters.`)
    .optional();

export const KanbanIdSchema = nonEmptyTrimmed("Identifier", 120);

export const KanbanUserSchema = z
  .object({
    id: KanbanIdSchema,
    name: nonEmptyTrimmed("User name", 120),
    email: optionalTrimmed("Email", 254),
    avatarColor: nonEmptyTrimmed("Avatar color", 40),
  })
  .strict();
type _KanbanUserSchemaCheck = z.infer<typeof KanbanUserSchema> extends KanbanUser ? true : never;

export const KanbanColumnSchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    title: nonEmptyTrimmed("Column title", 120),
    order: z.number().int().min(0),
    wipLimit: z.number().int().min(1).optional(),
  })
  .strict();
type _KanbanColumnSchemaCheck = z.infer<typeof KanbanColumnSchema> extends KanbanColumn ? true : never;

export const KanbanSprintSchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    name: nonEmptyTrimmed("Sprint name", 120),
    goal: optionalTrimmed("Sprint goal", 240),
    startDate: nonEmptyTrimmed("Sprint start date", 40),
    endDate: nonEmptyTrimmed("Sprint end date", 40),
    status: z.enum(["planned", "active", "completed"]),
  })
  .strict();
type _KanbanSprintSchemaCheck = z.infer<typeof KanbanSprintSchema> extends KanbanSprint ? true : never;

export const KanbanEpicSchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    key: nonEmptyTrimmed("Epic key", 40),
    title: nonEmptyTrimmed("Epic title", 160),
    description: z.string().trim().max(5000).optional(),
    color: nonEmptyTrimmed("Epic color", 40),
    startDate: z.string().trim().max(40).optional(),
    endDate: z.string().trim().max(40).optional(),
    status: z.enum(["open", "in_progress", "done"]),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
    updatedAt: nonEmptyTrimmed("Updated timestamp", 40),
  })
  .strict();
type _KanbanEpicSchemaCheck = z.infer<typeof KanbanEpicSchema> extends KanbanEpic ? true : never;

export const KanbanTimeLogSchema = z
  .object({
    id: KanbanIdSchema,
    ticketId: KanbanIdSchema,
    userId: KanbanIdSchema,
    startedAt: nonEmptyTrimmed("Start timestamp", 40),
    endedAt: optionalTrimmed("End timestamp", 40),
    duration: z.number().int().min(0),
    description: z.string().trim().max(500).optional(),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
    updatedAt: nonEmptyTrimmed("Updated timestamp", 40),
  })
  .strict();
type _KanbanTimeLogSchemaCheck = z.infer<typeof KanbanTimeLogSchema> extends KanbanTimeLog ? true : never;

export const KanbanAttachmentSchema = z
  .object({
    id: KanbanIdSchema,
    ticketId: KanbanIdSchema,
    userId: KanbanIdSchema,
    filename: nonEmptyTrimmed("Filename", 255),
    originalFilename: nonEmptyTrimmed("Original filename", 255),
    mimeType: nonEmptyTrimmed("MIME type", 127),
    size: z.number().int().min(0).max(50 * 1024 * 1024), // Max 50MB
    url: nonEmptyTrimmed("URL", 500),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
    updatedAt: nonEmptyTrimmed("Updated timestamp", 40),
  })
  .strict();
type _KanbanAttachmentSchemaCheck = z.infer<typeof KanbanAttachmentSchema> extends KanbanAttachment ? true : never;

export const KanbanActivitySchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    userId: KanbanIdSchema,
    type: z.enum([
      "ticket_created",
      "ticket_updated",
      "ticket_deleted",
      "ticket_moved",
      "ticket_assigned",
      "comment_added",
      "comment_deleted",
      "attachment_added",
      "attachment_deleted",
      "column_created",
      "column_updated",
      "column_deleted",
      "sprint_created",
      "sprint_updated",
      "board_updated",
    ]),
    ticketId: KanbanIdSchema.optional(),
    columnId: KanbanIdSchema.optional(),
    sprintId: KanbanIdSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
  })
  .strict();
type _KanbanActivitySchemaCheck = z.infer<typeof KanbanActivitySchema> extends KanbanActivity ? true : never;

export const KanbanLabelSchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    name: nonEmptyTrimmed("Label name", 50),
    color: nonEmptyTrimmed("Label color", 20),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
  })
  .strict();
type _KanbanLabelSchemaCheck = z.infer<typeof KanbanLabelSchema> extends KanbanLabel ? true : never;

export const KanbanTicketSchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    columnId: KanbanIdSchema,
    title: nonEmptyTrimmed("Ticket title", 160),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: z.array(KanbanIdSchema),
    tags: z.array(nonEmptyTrimmed("Tag", 40)),
    labelIds: z.array(KanbanIdSchema),
    estimate: z.number().positive().optional(),
    timeSpent: z.number().int().min(0).optional(),
    priority: z.enum(["low", "medium", "high"]),
    sprintId: KanbanIdSchema.optional(),
    dueDate: z.string().trim().max(40).optional(),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
    updatedAt: nonEmptyTrimmed("Updated timestamp", 40),
    order: z.number().int().min(0),
    attachments: z.array(KanbanAttachmentSchema).optional(),
  })
  .strict();
type _KanbanTicketSchemaCheck = z.infer<typeof KanbanTicketSchema> extends KanbanTicket ? true : never;

export const KanbanBoardSchema = z
  .object({
    id: KanbanIdSchema,
    name: nonEmptyTrimmed("Board name", 160),
    description: optionalTrimmed("Board description", 400),
    projectId: KanbanIdSchema.optional(),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
    memberIds: z.array(KanbanIdSchema),
    activeSprintId: KanbanIdSchema.optional(),
    columns: z.array(KanbanColumnSchema),
    tickets: z.array(KanbanTicketSchema),
    sprints: z.array(KanbanSprintSchema),
    epics: z.array(KanbanEpicSchema),
    members: z.array(KanbanUserSchema),
    labels: z.array(KanbanLabelSchema),
  })
  .strict();
type _KanbanBoardSchemaCheck = z.infer<typeof KanbanBoardSchema> extends KanbanBoard ? true : never;

export const KanbanBoardSnapshotSchema = z
  .object({
    board: KanbanBoardSchema,
    columns: z.array(KanbanColumnSchema),
    tickets: z.array(KanbanTicketSchema),
    sprints: z.array(KanbanSprintSchema),
    members: z.array(KanbanUserSchema),
    labels: z.array(KanbanLabelSchema),
  })
  .strict();
type _KanbanBoardSnapshotSchemaCheck = z.infer<typeof KanbanBoardSnapshotSchema> extends KanbanBoardSnapshot
  ? true
  : never;

export const KanbanCreateBoardSchema = z
  .object({
    name: nonEmptyTrimmed("Board name", 160),
    description: optionalTrimmed("Board description", 400),
    projectId: KanbanIdSchema.optional(),
    members: z
      .array(
        z
          .object({
            name: nonEmptyTrimmed("Member name", 120),
            email: optionalTrimmed("Member email", 254),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
export type KanbanCreateBoardInput = z.infer<typeof KanbanCreateBoardSchema>;

export const KanbanUpdateBoardSchema = z
  .object({
    name: optionalTrimmed("Board name", 160),
    description: z
      .string()
      .trim()
      .max(400, "Board description must be less than 401 characters.")
      .nullable()
      .optional(),
    projectId: KanbanIdSchema.nullish(),
  })
  .strict();
export type KanbanUpdateBoardInput = z.infer<typeof KanbanUpdateBoardSchema>;

export const KanbanCreateColumnSchema = z
  .object({
    title: nonEmptyTrimmed("Column title", 120),
    order: z.number().int().min(0).optional(),
  })
  .strict();
export type KanbanCreateColumnInput = z.infer<typeof KanbanCreateColumnSchema>;

export const KanbanUpdateColumnSchema = z
  .object({
    title: optionalTrimmed("Column title", 120),
    wipLimit: z.number().int().min(1).nullable().optional(),
  })
  .strict();
export type KanbanUpdateColumnInput = z.infer<typeof KanbanUpdateColumnSchema>;

export const KanbanCreateTicketSchema = z
  .object({
    columnId: KanbanIdSchema,
    title: nonEmptyTrimmed("Ticket title", 160),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: z.array(KanbanIdSchema).optional(),
    tags: z.array(nonEmptyTrimmed("Tag", 40)).optional(),
    labelIds: z.array(KanbanIdSchema).optional(),
    estimate: z.number().positive().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    sprintId: KanbanIdSchema.optional(),
    dueDate: z.string().trim().max(40).optional(),
  })
  .strict();
export type KanbanCreateTicketInput = z.infer<typeof KanbanCreateTicketSchema>;

export const KanbanUpdateTicketSchema = z
  .object({
    title: nonEmptyTrimmed("Ticket title", 160).optional(),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: z.array(KanbanIdSchema).optional(),
    tags: z.array(nonEmptyTrimmed("Tag", 40)).optional(),
    labelIds: z.array(KanbanIdSchema).optional(),
    estimate: z.number().positive().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    sprintId: KanbanIdSchema.nullish(),
    dueDate: z.string().trim().max(40).nullable().optional(),
  })
  .strict();
export type KanbanUpdateTicketInput = z.infer<typeof KanbanUpdateTicketSchema>;

export const KanbanReorderTicketSchema = z
  .object({
    ticketId: KanbanIdSchema,
    toColumnId: KanbanIdSchema,
    toIndex: z.number().int().min(0),
  })
  .strict();
export type KanbanReorderTicketInput = z.infer<typeof KanbanReorderTicketSchema>;

export const KanbanCreateSprintSchema = z
  .object({
    name: nonEmptyTrimmed("Sprint name", 120),
    goal: optionalTrimmed("Sprint goal", 240),
    startDate: nonEmptyTrimmed("Sprint start date", 40),
    endDate: nonEmptyTrimmed("Sprint end date", 40),
    status: z.enum(["planned", "active", "completed"]).optional(),
  })
  .strict();
export type KanbanCreateSprintInput = z.infer<typeof KanbanCreateSprintSchema>;

export const KanbanCreateTimeLogSchema = z
  .object({
    startedAt: nonEmptyTrimmed("Start timestamp", 40).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict();
export type KanbanCreateTimeLogInput = z.infer<typeof KanbanCreateTimeLogSchema>;

export const KanbanStopTimeLogSchema = z
  .object({
    endedAt: nonEmptyTrimmed("End timestamp", 40).optional(),
  })
  .strict();
export type KanbanStopTimeLogInput = z.infer<typeof KanbanStopTimeLogSchema>;

export const KanbanCreateLabelSchema = z
  .object({
    name: nonEmptyTrimmed("Label name", 50),
    color: nonEmptyTrimmed("Label color", 20),
  })
  .strict();
export type KanbanCreateLabelInput = z.infer<typeof KanbanCreateLabelSchema>;

export const KanbanUpdateLabelSchema = z
  .object({
    name: nonEmptyTrimmed("Label name", 50).optional(),
    color: nonEmptyTrimmed("Label color", 20).optional(),
  })
  .strict();
export type KanbanUpdateLabelInput = z.infer<typeof KanbanUpdateLabelSchema>;
