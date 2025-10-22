import { z } from "zod";
import type {
  KanbanBoard,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanSprint,
  KanbanTicket,
  KanbanUser,
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

export const KanbanTicketSchema = z
  .object({
    id: KanbanIdSchema,
    boardId: KanbanIdSchema,
    columnId: KanbanIdSchema,
    title: nonEmptyTrimmed("Ticket title", 160),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: z.array(KanbanIdSchema),
    tags: z.array(nonEmptyTrimmed("Tag", 40)),
    estimate: z.number().positive().optional(),
    priority: z.enum(["low", "medium", "high"]),
    sprintId: KanbanIdSchema.optional(),
    createdAt: nonEmptyTrimmed("Created timestamp", 40),
    updatedAt: nonEmptyTrimmed("Updated timestamp", 40),
    order: z.number().int().min(0),
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
    members: z.array(KanbanUserSchema),
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

export const KanbanCreateTicketSchema = z
  .object({
    columnId: KanbanIdSchema,
    title: nonEmptyTrimmed("Ticket title", 160),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: z.array(KanbanIdSchema).optional(),
    tags: z.array(nonEmptyTrimmed("Tag", 40)).optional(),
    estimate: z.number().positive().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    sprintId: KanbanIdSchema.optional(),
  })
  .strict();
export type KanbanCreateTicketInput = z.infer<typeof KanbanCreateTicketSchema>;

export const KanbanUpdateTicketSchema = z
  .object({
    title: nonEmptyTrimmed("Ticket title", 160).optional(),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: z.array(KanbanIdSchema).optional(),
    tags: z.array(nonEmptyTrimmed("Tag", 40)).optional(),
    estimate: z.number().positive().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    sprintId: KanbanIdSchema.nullish(),
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
