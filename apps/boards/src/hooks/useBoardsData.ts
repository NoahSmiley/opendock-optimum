import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KanbanBoard, KanbanBoardSnapshot, KanbanUser, ProjectsResponse } from "@opendock/shared/types";
import { boardsApi, projectsApi } from "@/lib/api";
import { fetchCsrfToken } from "@/lib/auth-client";
import { upsertBoard } from "@/lib/board-state";
import type { BoardFormState } from "@/components/boards/forms/types";

interface BoardState {
  boards: KanbanBoard[];
  users: KanbanUser[];
}

interface UseBoardsDataResult {
  boards: KanbanBoard[];
  users: KanbanUser[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  selectedBoardId: string | null;
  setSelectedBoardId: (boardId: string | null) => void;
  refreshBoards: () => Promise<void>;
  boardForm: BoardFormState;
  setBoardForm: (updater: BoardFormState | ((previous: BoardFormState) => BoardFormState)) => void;
  showBoardForm: boolean;
  setShowBoardForm: (updater: boolean | ((previous: boolean) => boolean)) => void;
  creatingBoard: boolean;
  handleCreateBoard: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  projects: ProjectsResponse["projects"];
  projectsLoading: boolean;
  projectsError: string | null;
  selectedBoard: KanbanBoard | null;
  projectOptions: Array<{ value: string; label: string }>;
  mutateBoards: (updater: (boards: KanbanBoard[]) => KanbanBoard[]) => void;
}

export function useBoardsData(): UseBoardsDataResult {
  const [state, setState] = useState<BoardState>({ boards: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const [streamRetry, setStreamRetry] = useState(0);

  const [projects, setProjects] = useState<ProjectsResponse["projects"]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [boardForm, setBoardFormState] = useState<BoardFormState>({
    name: "",
    description: "",
    members: "",
    projectId: "",
  });
  const [showBoardForm, setShowBoardFormState] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);

  const refreshBoards = useCallback(async () => {
    try {
      setErrorState(null);
      setLoading(true);
      const response = await boardsApi.listBoards();
      setState({ boards: response.boards, users: response.users });

      if (!selectedBoardId && response.boards.length > 0) {
        setSelectedBoardId(response.boards[0].id);
      } else if (selectedBoardId) {
        const exists = response.boards.some((board) => board.id === selectedBoardId);
        if (!exists && response.boards.length > 0) {
          setSelectedBoardId(response.boards[0].id);
        }
      }
    } catch (err) {
      setErrorState((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedBoardId]);

  useEffect(() => {
    void fetchCsrfToken();
    void refreshBoards();
  }, [refreshBoards]);

  useEffect(() => {
    let active = true;
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await projectsApi.listProjects();
        if (!active) return;
        setProjects(response.projects);
        setProjectsError(null);
      } catch (err) {
        if (!active) return;
        setProjectsError(err instanceof Error ? err.message : "Unable to load projects.");
      } finally {
        if (active) {
          setProjectsLoading(false);
        }
      }
    };
    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  const applySnapshot = useCallback((snapshot: KanbanBoardSnapshot) => {
    setState((prev) => ({
      users: prev.users,
      boards: upsertBoard(prev.boards, snapshot.board),
    }));
  }, []);

  useEffect(() => {
    if (!selectedBoardId) {
      streamRef.current?.close();
      streamRef.current = null;
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    let disposed = false;
    try {
      const source = boardsApi.streamBoard(selectedBoardId);
      streamRef.current = source;

      const handleSnapshot = (event: MessageEvent) => {
        if (disposed) return;
        const payload = JSON.parse(event.data) as { boardId: string; snapshot?: KanbanBoardSnapshot };
        if (payload?.snapshot && payload.boardId === selectedBoardId) {
          applySnapshot(payload.snapshot);
        }
      };

      const fetchAndApply = async () => {
        try {
          const snapshot = await boardsApi.boardSnapshot(selectedBoardId);
          if (!disposed) {
            applySnapshot(snapshot);
          }
        } catch (err) {
          if (!disposed) {
            console.error("Failed to refresh board snapshot", err);
          }
        }
      };

      let ignoreReorderUntil = 0;
      const mutationHandler = (event: Event) => {
        // Ignore ticket-reordered events briefly after a reorder to prevent flickering
        if (event.type === "ticket-reordered" && Date.now() < ignoreReorderUntil) {
          return;
        }
        void fetchAndApply();
      };

      // Expose a way to suppress reorder events temporarily
      (window as any).__suppressTicketReorderEvents = (durationMs: number) => {
        ignoreReorderUntil = Date.now() + durationMs;
      };

      const mutationEvents = ["ticket-created", "ticket-updated", "ticket-reordered", "column-created", "sprint-created"];
      source.addEventListener("board-snapshot", handleSnapshot);
      mutationEvents.forEach((eventName) => {
        source.addEventListener(eventName, mutationHandler);
      });
      source.addEventListener("error", () => {
        if (disposed) return;
        source.close();
        streamRef.current = null;
        setStreamRetry((value) => value + 1);
      });

      return () => {
        disposed = true;
        source.removeEventListener("board-snapshot", handleSnapshot);
        mutationEvents.forEach((eventName) => {
          source.removeEventListener(eventName, mutationHandler);
        });
        source.close();
        if (streamRef.current === source) {
          streamRef.current = null;
        }
      };
    } catch (err) {
      console.error("Unable to start kanban stream", err);
      setStreamRetry((value) => value + 1);
    }
  }, [applySnapshot, selectedBoardId, streamRetry]);

  useEffect(
    () => () => {
      streamRef.current?.close();
      streamRef.current = null;
    },
    [],
  );

  const mutateBoards = useCallback((updater: (boards: KanbanBoard[]) => KanbanBoard[]) => {
    setState((prev) => ({ ...prev, boards: updater(prev.boards) }));
  }, []);

  const handleCreateBoard = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!boardForm.name.trim()) return;

      try {
        setCreatingBoard(true);
        const members = boardForm.members
          .split(",")
          .map((member) => member.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
        await boardsApi.createBoard({
          name: boardForm.name.trim(),
          description: boardForm.description.trim() || undefined,
          projectId: boardForm.projectId ? boardForm.projectId : undefined,
          members,
        });
        setBoardFormState({ name: "", description: "", members: "", projectId: "" });
        setShowBoardFormState(false);
        await refreshBoards();
      } catch (err) {
        setErrorState((err as Error).message);
      } finally {
        setCreatingBoard(false);
      }
    },
    [boardForm, refreshBoards],
  );

  const selectedBoard = useMemo(() => {
    return state.boards.find((board) => board.id === selectedBoardId) ?? null;
  }, [state.boards, selectedBoardId]);

  const projectOptions = useMemo(
    () =>
      projects
        .map((project) => ({ value: project.id, label: project.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projects],
  );

  return {
    boards: state.boards,
    users: state.users,
    loading,
    error,
    setError: (value) => setErrorState(value),
    selectedBoardId,
    setSelectedBoardId,
    refreshBoards,
    boardForm,
    // setters allow functional updates from consumers
    setBoardForm: (updater) =>
      setBoardFormState((prev) => (typeof updater === "function" ? (updater as (prev: BoardFormState) => BoardFormState)(prev) : updater)),
    showBoardForm,
    setShowBoardForm: (updater) =>
      setShowBoardFormState((prev) => (typeof updater === "function" ? (updater as (prev: boolean) => boolean)(prev) : updater)),
    creatingBoard,
    handleCreateBoard,
    projects,
    projectsLoading,
    projectsError,
    selectedBoard,
    projectOptions,
    mutateBoards,
  };
}
