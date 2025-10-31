import { useCallback, useMemo, useState, type FormEvent } from "react";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";
import { boardsApi } from "@/lib/api";
import type { BacklogFormState, ColumnDraftState, SprintFormState } from "@/components/boards/forms/types";

interface UseBoardActionsParams {
  selectedBoard: KanbanBoard | null;
  refreshBoards: () => Promise<void>;
  setError: (error: string | null) => void;
  mutateBoards: () => Promise<void>;
}


export function useBoardActions({ selectedBoard, refreshBoards, setError, mutateBoards }: UseBoardActionsParams) {
  // Column ticket composer state
  const [activeComposerColumnId, setActiveComposerColumnId] = useState<string | null>(null);
  const [columnDrafts, setColumnDrafts] = useState<Record<string, ColumnDraftState>>({});
  const [creatingColumnTicketId, setCreatingColumnTicketId] = useState<string | null>(null);

  // Column creation state
  const [columnTitle, setColumnTitle] = useState("");

  // Sprint form state
  const [sprintForm, setSprintForm] = useState<SprintFormState>({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  // Backlog form state
  const [backlogForm, setBacklogForm] = useState<BacklogFormState>({
    title: "",
    description: "",
    assigneeId: "",
    tags: "",
  });

  // Computed values
  const columnTicketMap = useMemo(() => {
    const map = new Map<string, KanbanTicket[]>();
    if (!selectedBoard) return map;
    selectedBoard.columns.forEach((column) => {
      const tickets = selectedBoard.tickets
        .filter((ticket) => ticket.columnId === column.id)
        .sort((a, b) => a.order - b.order);
      map.set(column.id, tickets);
    });
    return map;
  }, [selectedBoard]);

  const activeTicket = useMemo(() => {
    return null; // Will be set by DnD hook
  }, []);

  const backlogColumn = useMemo(() => {
    if (!selectedBoard) return null;
    return selectedBoard.columns.find((col) => col.title.toLowerCase() === "backlog") ?? null;
  }, [selectedBoard]);

  const activeSprint = useMemo(() => {
    if (!selectedBoard) return null;
    return selectedBoard.sprints.find((sprint) => sprint.status === "active") ?? null;
  }, [selectedBoard]);

  const boardStats = useMemo(() => {
    if (!selectedBoard) return [];
    const totalTickets = selectedBoard.tickets.length;
    const completedTickets = selectedBoard.tickets.filter((t) => {
      const column = selectedBoard.columns.find((c) => c.id === t.columnId);
      return column?.title.toLowerCase() === "done";
    }).length;
    const activeTickets = totalTickets - completedTickets;
    const totalMembers = selectedBoard.members.length;

    return [
      { label: "Active", value: activeTickets.toString(), icon: null },
      { label: "Completed", value: completedTickets.toString(), icon: null },
      { label: "Team", value: totalMembers.toString(), icon: null },
      { label: "Sprints", value: selectedBoard.sprints.length.toString(), icon: null },
    ];
  }, [selectedBoard]);

  const teamWorkload = useMemo(() => {
    if (!selectedBoard) return [];
    const workloadMap = new Map<string, number>();
    selectedBoard.tickets.forEach((ticket) => {
      ticket.assigneeIds.forEach((assigneeId) => {
        workloadMap.set(assigneeId, (workloadMap.get(assigneeId) ?? 0) + 1);
      });
    });
    return selectedBoard.members.map((member) => ({
      key: member.id,
      label: member.name,
      count: workloadMap.get(member.id) ?? 0,
    }));
  }, [selectedBoard]);

  const maxWorkloadCount = useMemo(() => {
    return Math.max(...teamWorkload.map((entry) => entry.count), 0);
  }, [teamWorkload]);

  const priorityBreakdown = useMemo(() => {
    if (!selectedBoard) return { items: [], total: 0 };
    const counts: Record<KanbanTicket["priority"], number> = {
      low: 0,
      medium: 0,
      high: 0,
    };
    selectedBoard.tickets.forEach((ticket) => {
      counts[ticket.priority]++;
    });
    const items = Object.entries(counts).map(([priority, count]) => ({
      priority: priority as KanbanTicket["priority"],
      count,
    }));
    const total = selectedBoard.tickets.length;
    return { items, total };
  }, [selectedBoard]);

  const maxPriorityCount = useMemo(() => {
    return Math.max(...priorityBreakdown.items.map((item) => item.count), 0);
  }, [priorityBreakdown]);

  // Column draft handlers
  const getColumnDraft = useCallback(
    (columnId: string): ColumnDraftState => {
      return (
        columnDrafts[columnId] ?? {
          title: "",
          assigneeId: "",
          priority: "medium" as const,
        }
      );
    },
    [columnDrafts],
  );

  const updateColumnDraft = useCallback((columnId: string, patch: Partial<ColumnDraftState>) => {
    setColumnDrafts((prev) => ({
      ...prev,
      [columnId]: { ...prev[columnId], ...patch },
    }));
  }, []);

  const handleColumnComposerOpen = useCallback((columnId: string) => {
    setActiveComposerColumnId(columnId);
  }, []);

  const handleColumnComposerCancel = useCallback(() => {
    setActiveComposerColumnId(null);
  }, []);

  const handleColumnTicketSubmit = useCallback(
    async (event: FormEvent, columnId: string) => {
      event.preventDefault();
      if (!selectedBoard) return;
      const draft = getColumnDraft(columnId);
      if (!draft.title.trim()) return;

      setCreatingColumnTicketId(columnId);
      try {
        await boardsApi.createTicket(selectedBoard.id, {
          title: draft.title,
          columnId,
          assigneeIds: draft.assigneeId ? [draft.assigneeId] : [],
          priority: draft.priority,
        });
        await refreshBoards();
        setColumnDrafts((prev) => {
          const next = { ...prev };
          delete next[columnId];
          return next;
        });
        setActiveComposerColumnId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create ticket");
      } finally {
        setCreatingColumnTicketId(null);
      }
    },
    [selectedBoard, getColumnDraft, refreshBoards, setError],
  );

  // Column creation handlers
  const handleCreateColumn = useCallback(
    async (event: FormEvent, boardId: string) => {
      event.preventDefault();
      if (!columnTitle.trim()) return;
      try {
        await boardsApi.createColumn(boardId, columnTitle);
        await refreshBoards();
        setColumnTitle("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create column");
      }
    },
    [columnTitle, refreshBoards, setError],
  );

  // Sprint handlers
  const handleSprintFormChange = useCallback((field: keyof SprintFormState, value: string) => {
    setSprintForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateSprint = useCallback(
    async (event: FormEvent, boardId: string) => {
      event.preventDefault();
      if (!sprintForm.name.trim() || !sprintForm.startDate || !sprintForm.endDate) return;
      try {
        await boardsApi.createSprint(boardId, sprintForm);
        await refreshBoards();
        setSprintForm({ name: "", goal: "", startDate: "", endDate: "" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create sprint");
      }
    },
    [sprintForm, refreshBoards, setError],
  );

  // Backlog handlers
  const handleBacklogFormChange = useCallback((field: keyof BacklogFormState, value: string) => {
    setBacklogForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateBacklogTicket = useCallback(
    async (event: FormEvent, boardId: string, columnId: string) => {
      event.preventDefault();
      if (!backlogForm.title.trim()) return;
      try {
        const tags = backlogForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        await boardsApi.createTicket(boardId, {
          title: backlogForm.title,
          description: backlogForm.description,
          columnId,
          assigneeIds: backlogForm.assigneeId ? [backlogForm.assigneeId] : [],
          tags,
        });
        await refreshBoards();
        setBacklogForm({ title: "", description: "", assigneeId: "", tags: "" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create backlog ticket");
      }
    },
    [backlogForm, refreshBoards, setError],
  );

  // Ticket update handlers
  const handleAssigneeChange = useCallback(
    async (ticket: KanbanTicket, assigneeId: string) => {
      try {
        const newAssigneeIds = ticket.assigneeIds.includes(assigneeId)
          ? ticket.assigneeIds.filter((id) => id !== assigneeId)
          : [...ticket.assigneeIds, assigneeId];
        await boardsApi.updateTicket(ticket.id, { assigneeIds: newAssigneeIds });
        await mutateBoards();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update assignee");
      }
    },
    [mutateBoards, setError],
  );

  const handleTicketUpdate = useCallback(
    async (ticketId: string, updates: Partial<KanbanTicket>) => {
      try {
        await boardsApi.updateTicket(ticketId, updates);
        await mutateBoards();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update ticket");
      }
    },
    [mutateBoards, setError],
  );

  const handleAddComment = useCallback(
    async (ticketId: string, content: string) => {
      try {
        await boardsApi.addComment(ticketId, content);
        await mutateBoards();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add comment");
      }
    },
    [mutateBoards, setError],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await boardsApi.deleteComment(commentId);
        await mutateBoards();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete comment");
      }
    },
    [mutateBoards, setError],
  );

  return {
    // State
    activeComposerColumnId,
    setActiveComposerColumnId,
    columnDrafts,
    setColumnDrafts,
    creatingColumnTicketId,
    columnTitle,
    setColumnTitle,
    sprintForm,
    backlogForm,

    // Computed values
    columnTicketMap,
    activeTicket,
    backlogColumn,
    activeSprint,
    boardStats,
    teamWorkload,
    maxWorkloadCount,
    priorityBreakdown,
    maxPriorityCount,

    // Handlers
    getColumnDraft,
    updateColumnDraft,
    handleColumnComposerOpen,
    handleColumnComposerCancel,
    handleColumnTicketSubmit,
    handleCreateColumn,
    handleSprintFormChange,
    handleCreateSprint,
    handleBacklogFormChange,
    handleCreateBacklogTicket,
    handleAssigneeChange,
    handleTicketUpdate,
    handleAddComment,
    handleDeleteComment,
  };
}
