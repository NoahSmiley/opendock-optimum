import { Router } from "express";
import { z } from "zod";
import type { NotesResponse } from "@opendock/shared/types";
import { authRequired, requireCsrfProtection } from "../auth";
import { dal } from "../dal";

function validationError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof (error as { flatten: () => unknown }).flatten === "function"
  ) {
    const issue = (error as { flatten: () => { fieldErrors: unknown } }).flatten();
    return {
      error: {
        code: "INVALID_PAYLOAD",
        message: "Request validation failed.",
        details: issue.fieldErrors,
      },
    };
  }
  return {
    error: {
      code: "INVALID_PAYLOAD",
      message: "Request validation failed.",
    },
  };
}

// Validation Schemas
const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  contentType: z.enum(["markdown", "richtext"]).default("markdown"),
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
});

const UpdateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const CreateFolderSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

const UpdateFolderSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

const CreateCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const UpdateCollectionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export function createNotesRouter(): Router {
  const router = Router();

  // Get all notes and folders
  router.get("/", async (_req, res) => {
    try {
      const notes = await dal.notes.listNotes({ isArchived: false });
      const folders = await dal.notes.listFolders();
      const response: NotesResponse = { notes, folders };
      res.json(response);
    } catch (error) {
      console.error("Failed to list notes:", error);
      res.status(500).json({ error: "Failed to list notes" });
    }
  });

  // Get archived notes
  router.get("/archived", async (_req, res) => {
    try {
      const archivedNotes = await dal.notes.listNotes({ isArchived: true });
      res.json({ notes: archivedNotes });
    } catch (error) {
      console.error("Failed to list archived notes:", error);
      res.status(500).json({ error: "Failed to list archived notes" });
    }
  });

  // Get all tags
  router.get("/tags", async (_req, res) => {
    try {
      const tags = await dal.notes.getAllTags();
      res.json({ tags });
    } catch (error) {
      console.error("Failed to list tags:", error);
      res.status(500).json({ error: "Failed to list tags" });
    }
  });

  // Collections routes (must come before /:id routes)
  // Get all collections
  router.get("/collections", async (_req, res) => {
    try {
      const collections = await dal.notes.listCollections();
      res.json({ collections });
    } catch (error) {
      console.error("Failed to list collections:", error);
      res.status(500).json({ error: "Failed to list collections" });
    }
  });

  // Get notes in a collection
  router.get("/collections/:collectionId/notes", async (req, res) => {
    const { collectionId } = req.params;
    try {
      const notes = await dal.notes.listNotes({ collectionId });
      res.json({ notes });
    } catch (error) {
      console.error("Failed to get notes in collection:", error);
      res.status(500).json({ error: "Failed to get notes in collection" });
    }
  });

  // Add note to collection
  router.post("/collections/:collectionId/notes/:noteId", authRequired, requireCsrfProtection, async (req, res) => {
    const { collectionId, noteId } = req.params;
    try {
      const success = await dal.notes.addNoteToCollection(collectionId, noteId);
      if (!success) {
        res.status(404).json({ error: "Failed to add note to collection" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to add note to collection:", error);
      res.status(500).json({ error: "Failed to add note to collection" });
    }
  });

  // Remove note from collection
  router.delete("/collections/:collectionId/notes/:noteId", authRequired, requireCsrfProtection, async (req, res) => {
    const { collectionId, noteId } = req.params;
    try {
      const success = await dal.notes.removeNoteFromCollection(collectionId, noteId);
      if (!success) {
        res.status(404).json({ error: "Failed to remove note from collection" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove note from collection:", error);
      res.status(500).json({ error: "Failed to remove note from collection" });
    }
  });

  // Get a single collection
  router.get("/collections/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const collection = await dal.notes.getCollectionById(id);
      if (!collection) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ collection });
    } catch (error) {
      console.error("Failed to get collection:", error);
      res.status(500).json({ error: "Failed to get collection" });
    }
  });

  // Create a collection
  router.post("/collections", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = CreateCollectionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    try {
      const collection = await dal.notes.createCollection({
        ...parsed.data,
        userId: "default-user", // TODO: Get from auth
      });
      res.status(201).json({ collection });
    } catch (error) {
      console.error("Failed to create collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  // Update a collection
  router.patch("/collections/:id", authRequired, requireCsrfProtection, async (req, res) => {
    const { id } = req.params;
    const parsed = UpdateCollectionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    try {
      const collection = await dal.notes.updateCollection(id, parsed.data);
      if (!collection) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ collection });
    } catch (error) {
      console.error("Failed to update collection:", error);
      res.status(500).json({ error: "Failed to update collection" });
    }
  });

  // Delete a collection
  router.delete("/collections/:id", authRequired, requireCsrfProtection, async (req, res) => {
    const { id } = req.params;
    try {
      const success = await dal.notes.deleteCollection(id);
      if (!success) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete collection:", error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Create a note
  router.post("/", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = CreateNoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    try {
      const note = await dal.notes.createNote({
        ...parsed.data,
        userId: "default-user", // TODO: Get from auth
      });
      res.status(201).json({ note });
    } catch (error) {
      console.error("Failed to create note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Get a single note
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const note = await dal.notes.getNoteById(id);
      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }
      res.json({ note });
    } catch (error) {
      console.error("Failed to get note:", error);
      res.status(500).json({ error: "Failed to get note" });
    }
  });

  // Update a note
  router.patch("/:id", authRequired, requireCsrfProtection, async (req, res) => {
    const { id } = req.params;
    const parsed = UpdateNoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    try {
      const note = await dal.notes.updateNote(id, parsed.data);
      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }
      res.json({ note });
    } catch (error) {
      console.error("Failed to update note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  // Delete a note
  router.delete("/:id", authRequired, requireCsrfProtection, async (req, res) => {
    const { id } = req.params;
    try {
      const success = await dal.notes.deleteNote(id);
      if (!success) {
        res.status(404).json({ error: "Note not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Get collections for a note
  router.get("/:id/collections", async (req, res) => {
    const { id } = req.params;
    try {
      const collections = await dal.notes.getCollectionsForNote(id);
      res.json({ collections });
    } catch (error) {
      console.error("Failed to get note collections:", error);
      res.status(500).json({ error: "Failed to get note collections" });
    }
  });

  // Get all folders
  router.get("/folders", async (_req, res) => {
    try {
      const folders = await dal.notes.listFolders();
      res.json({ folders });
    } catch (error) {
      console.error("Failed to list folders:", error);
      res.status(500).json({ error: "Failed to list folders" });
    }
  });

  // Create a folder
  router.post("/folders", authRequired, requireCsrfProtection, async (req, res) => {
    const parsed = CreateFolderSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    try {
      const folder = await dal.notes.createFolder({
        ...parsed.data,
        userId: "default-user", // TODO: Get from auth
      });
      res.status(201).json({ folder });
    } catch (error) {
      console.error("Failed to create folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  // Update a folder
  router.patch("/folders/:id", authRequired, requireCsrfProtection, async (req, res) => {
    const { id } = req.params;
    const parsed = UpdateFolderSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(validationError(parsed.error));
      return;
    }

    try {
      const folder = await dal.notes.updateFolder(id, parsed.data);
      if (!folder) {
        res.status(404).json({ error: "Folder not found" });
        return;
      }
      res.json({ folder });
    } catch (error) {
      console.error("Failed to update folder:", error);
      res.status(500).json({ error: "Failed to update folder" });
    }
  });

  // Delete a folder
  router.delete("/folders/:id", authRequired, requireCsrfProtection, async (req, res) => {
    const { id } = req.params;
    try {
      const success = await dal.notes.deleteFolder(id);
      if (!success) {
        res.status(404).json({ error: "Folder not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete folder:", error);
      res.status(500).json({ error: "Failed to delete folder" });
    }
  });

  return router;
}
