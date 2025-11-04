import type { Note, Folder, Collection, CreateNoteInput, UpdateNoteInput, CreateFolderInput, UpdateFolderInput, CreateCollectionInput, UpdateCollectionInput } from "@opendock/shared/types";
import type { NotesRepository } from "../notes.types";
import { prisma } from "./client";

function mapNote(note: {
  id: string;
  title: string;
  content: string;
  contentType: string;
  folderId: string | null;
  tags: string;
  isPinned: boolean;
  isArchived: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    contentType: note.contentType as "markdown" | "richtext",
    folderId: note.folderId,
    tags: JSON.parse(note.tags || "[]"),
    isPinned: note.isPinned,
    isArchived: note.isArchived,
    userId: note.userId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

function mapFolder(folder: {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}): Folder {
  return {
    id: folder.id,
    name: folder.name,
    color: folder.color,
    icon: folder.icon,
    parentId: folder.parentId,
    userId: folder.userId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

function mapCollection(collection: {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { notes: number };
}): Collection {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    color: collection.color,
    icon: collection.icon,
    userId: collection.userId,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    noteCount: collection._count?.notes,
  };
}

export class PrismaNotesRepository implements NotesRepository {
  async listNotes(params?: {
    userId?: string;
    folderId?: string;
    collectionId?: string;
    tags?: string[];
    isPinned?: boolean;
    isArchived?: boolean;
  }): Promise<Note[]> {
    const where: any = {};

    if (params?.userId) {
      where.userId = params.userId;
    }
    if (params?.folderId !== undefined) {
      where.folderId = params.folderId;
    }
    if (params?.collectionId) {
      where.collections = {
        some: {
          collectionId: params.collectionId,
        },
      };
    }
    if (params?.isPinned !== undefined) {
      where.isPinned = params.isPinned;
    }
    if (params?.isArchived !== undefined) {
      where.isArchived = params.isArchived;
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    let result = notes.map(mapNote);

    // Filter by tags if provided (since tags are stored as JSON string)
    if (params?.tags && params.tags.length > 0) {
      result = result.filter((note) =>
        params.tags!.some((tag) => note.tags.includes(tag))
      );
    }

    return result;
  }

  async getNoteById(id: string): Promise<Note | null> {
    const note = await prisma.note.findUnique({ where: { id } });
    return note ? mapNote(note) : null;
  }

  async createNote(input: CreateNoteInput & { userId: string }): Promise<Note> {
    const note = await prisma.note.create({
      data: {
        title: input.title,
        content: input.content || "",
        contentType: input.contentType || "markdown",
        folderId: input.folderId,
        tags: JSON.stringify(input.tags || []),
        isPinned: input.isPinned || false,
        userId: input.userId,
      },
    });
    return mapNote(note);
  }

  async updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const data: any = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) data.content = input.content;
    if (input.folderId !== undefined) data.folderId = input.folderId;
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
    if (input.isPinned !== undefined) data.isPinned = input.isPinned;
    if (input.isArchived !== undefined) data.isArchived = input.isArchived;

    try {
      const note = await prisma.note.update({
        where: { id },
        data,
      });
      return mapNote(note);
    } catch (error) {
      return null;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      await prisma.note.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async listFolders(params?: {
    userId?: string;
    parentId?: string | null;
  }): Promise<Folder[]> {
    const where: any = {};

    if (params?.userId) {
      where.userId = params.userId;
    }
    if (params?.parentId !== undefined) {
      where.parentId = params.parentId;
    }

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return folders.map(mapFolder);
  }

  async getFolderById(id: string): Promise<Folder | null> {
    const folder = await prisma.folder.findUnique({ where: { id } });
    return folder ? mapFolder(folder) : null;
  }

  async createFolder(input: CreateFolderInput & { userId: string }): Promise<Folder> {
    const folder = await prisma.folder.create({
      data: {
        name: input.name,
        color: input.color,
        icon: input.icon,
        parentId: input.parentId,
        userId: input.userId,
      },
    });
    return mapFolder(folder);
  }

  async updateFolder(
    id: string,
    input: UpdateFolderInput
  ): Promise<Folder | null> {
    const data: any = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.color !== undefined) data.color = input.color;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.parentId !== undefined) data.parentId = input.parentId;

    try {
      const folder = await prisma.folder.update({
        where: { id },
        data,
      });
      return mapFolder(folder);
    } catch (error) {
      return null;
    }
  }

  async deleteFolder(id: string): Promise<boolean> {
    try {
      // First, unlink all notes in this folder
      await prisma.note.updateMany({
        where: { folderId: id },
        data: { folderId: null },
      });

      // Then delete the folder
      await prisma.folder.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllTags(userId?: string): Promise<string[]> {
    const where = userId ? { userId } : {};
    const notes = await prisma.note.findMany({
      where,
      select: { tags: true },
    });

    const tagsSet = new Set<string>();
    notes.forEach((note) => {
      const tags = JSON.parse(note.tags || "[]");
      tags.forEach((tag: string) => tagsSet.add(tag));
    });

    return Array.from(tagsSet);
  }

  async listCollections(params?: { userId?: string }): Promise<Collection[]> {
    const where = params?.userId ? { userId: params.userId } : {};

    const collections = await prisma.collection.findMany({
      where,
      include: {
        _count: {
          select: { notes: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return collections.map(mapCollection);
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });
    return collection ? mapCollection(collection) : null;
  }

  async createCollection(input: CreateCollectionInput & { userId: string }): Promise<Collection> {
    const collection = await prisma.collection.create({
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        userId: input.userId,
      },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });
    return mapCollection(collection);
  }

  async updateCollection(id: string, input: UpdateCollectionInput): Promise<Collection | null> {
    const data: any = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.color !== undefined) data.color = input.color;
    if (input.icon !== undefined) data.icon = input.icon;

    try {
      const collection = await prisma.collection.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { notes: true },
          },
        },
      });
      return mapCollection(collection);
    } catch (error) {
      return null;
    }
  }

  async deleteCollection(id: string): Promise<boolean> {
    try {
      await prisma.collection.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async addNoteToCollection(collectionId: string, noteId: string): Promise<boolean> {
    try {
      await prisma.collectionNote.create({
        data: {
          collectionId,
          noteId,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeNoteFromCollection(collectionId: string, noteId: string): Promise<boolean> {
    try {
      await prisma.collectionNote.deleteMany({
        where: {
          collectionId,
          noteId,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCollectionsForNote(noteId: string): Promise<Collection[]> {
    try {
      const collectionNotes = await prisma.collectionNote.findMany({
        where: { noteId },
        include: {
          collection: {
            include: {
              _count: {
                select: { notes: true },
              },
            },
          },
        },
      });

      return collectionNotes.map((cn) => ({
        id: cn.collection.id,
        name: cn.collection.name,
        description: cn.collection.description,
        color: cn.collection.color,
        icon: cn.collection.icon,
        userId: cn.collection.userId,
        createdAt: cn.collection.createdAt.toISOString(),
        updatedAt: cn.collection.updatedAt.toISOString(),
        noteCount: cn.collection._count.notes,
      }));
    } catch (error) {
      console.error('Failed to get collections for note:', error);
      return [];
    }
  }
}
