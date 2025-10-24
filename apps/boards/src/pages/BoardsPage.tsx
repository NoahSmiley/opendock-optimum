import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart3,
  CalendarClock,
  Expand,
  Kanban as KanbanIcon,
  LayoutGrid,
  ListChecks,
  Loader2,
  Minimize,
  Plus,
  Rocket,
  Search,
  Settings2,
  UsersRound,
  FileCode2,
} from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard, KanbanBoardSnapshot, KanbanTicket, KanbanUser, ProjectsResponse } from "@opendock/shared/types";
import { boardsApi, projectsApi } from "@/lib/api";
import { upsertBoard } from "@/lib/board-state";
import { fetchCsrfToken } from "@/lib/auth-client";
import { useTheme } from "@/theme-provider";
import { ThemeToggle } from "@/theme-toggle";
import { TicketDetailPanel } from "@/components/TicketDetailPanel";

interface BoardState {
  boards: KanbanBoard[];
  users: KanbanUser[];
}

const priorityStyles: Record<KanbanTicket["priority"], string> = {
  high: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  medium: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
};

const priorityAccent: Record<KanbanTicket["priority"], string> = {
  high: "bg-rose-500 dark:bg-rose-400",
  medium: "bg-amber-400 dark:bg-amber-300",
  low: "bg-emerald-400 dark:bg-emerald-300",
};

const formatTicketKey = (ticket: KanbanTicket) => {
  const [prefix] = ticket.id.split("-");
  return prefix ? prefix.toUpperCase() : ticket.id.slice(0, 6).toUpperCase();
};

const createColumnDraft = () => ({
  title: "",
  assigneeId: "",
  priority: "medium" as KanbanTicket["priority"],
});

const priorityFilterOptions: Array<{ value: "all" | KanbanTicket["priority"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function TicketCard({
  ticket,
  column,
  members,
  sprints,
  onAssigneeChange,
  onClick,
  highlight = false,
  interactive = true,
}: {
  ticket: KanbanTicket;
  column?: KanbanBoard["columns"][number];
  members: KanbanUser[];
  sprints: KanbanBoard["sprints"];
  onAssigneeChange: (ticket: KanbanTicket, assigneeId: string) => void;
  onClick?: () => void;
  highlight?: boolean;
  interactive?: boolean;
}) {
  const assignee = members.find((member) => ticket.assigneeIds.includes(member.id));
  const sprint = sprints.find((item) => item.id === ticket.sprintId);
  const isComplete = column?.title.toLowerCase().includes("done") || column?.title.toLowerCase().includes("complete");

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group relative flex flex-col gap-2 rounded-lg border bg-white p-3 pl-5 text-neutral-700 transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:bg-neutral-950 dark:text-neutral-200",
        isComplete
          ? "border-emerald-500 bg-emerald-50/50 hover:border-emerald-600 dark:border-emerald-400 dark:bg-emerald-950/20 dark:hover:border-emerald-300"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800",
        highlight && "ring-2 ring-blue-400/30 dark:ring-blue-500/30",
        onClick && "cursor-pointer",
      )}
    >
      <span aria-hidden className={clsx("absolute inset-y-2 left-2 w-1 rounded-full", priorityAccent[ticket.priority])} />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">
            {formatTicketKey(ticket)}
          </p>
          <p className="text-sm font-medium text-neutral-900 dark:text-white">{ticket.title}</p>
        </div>
        {ticket.estimate ? (
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
            {ticket.estimate} pts
          </span>
        ) : null}
      </div>
      {ticket.description ? (
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{ticket.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
        <span className={clsx("rounded-md px-2 py-1", priorityStyles[ticket.priority])}>{ticket.priority}</span>
        {sprint ? (
          <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-300">
            {sprint.name}
          </span>
        ) : (
          <span className="rounded-md border border-dashed border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
            Backlog
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 pt-0.5">
        {interactive ? (
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Assignee</span>
            <select
              value={assignee?.id ?? ""}
              onChange={(event) => onAssigneeChange(ticket, event.target.value)}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-white">
              {(assignee?.name ?? "UN").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-200">{assignee ? assignee.name : "Unassigned"}</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Assignee</p>
            </div>
          </div>
        )}
        {ticket.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
            {ticket.tags.map((tag) => (
              <span key={tag} className="rounded-md border border-neutral-200 px-2 py-0.5 dark:border-neutral-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SortableTicket({
  ticket,
  column,
  members,
  sprints,
  onAssigneeChange,
  onClick,
}: {
  ticket: KanbanTicket;
  column: KanbanBoard["columns"][number];
  members: KanbanUser[];
  sprints: KanbanBoard["sprints"];
  onAssigneeChange: (ticket: KanbanTicket, assigneeId: string) => void;
  onClick?: () => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: { type: "ticket", columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      key={ticket.id}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
        <TicketCard
          ticket={ticket}
          column={column}
          members={members}
          sprints={sprints}
          onAssigneeChange={onAssigneeChange}
          onClick={onClick}
          highlight={isDragging}
        />
    </div>
  );
}

function KanbanColumn({
  column,
  tickets,
  totalCount,
  children,
  footer,
}: {
  column: KanbanBoard["columns"][number];
  tickets: KanbanTicket[];
  totalCount: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div className="flex min-w-[22rem] max-w-[22rem] flex-col gap-3 self-start rounded-lg border border-neutral-200 bg-white p-4 transition dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{column.title}</h3>
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Stage</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {tickets.length}
          {totalCount !== tickets.length ? (
            <span className="text-[10px] font-normal uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              /{totalCount}
            </span>
          ) : null}
        </span>
      </div>
      <SortableContext id={column.id} items={tickets.map((ticket) => ticket.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx(
            "flex min-h-[6rem] flex-col gap-2.5 rounded-md border border-transparent p-1 transition-colors",
            isOver ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900" : "border-transparent",
          )}
        >
          {children}
          {tickets.length === 0 ? (
            totalCount > 0 ? (
              <div className="rounded-md border border-dashed border-neutral-300 bg-white p-4 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-500">
                No issues match the active filters.
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-neutral-300 bg-white p-4 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-500">
                Drop issues here
              </div>
            )
          ) : null}
        </div>
      </SortableContext>
      {footer ? <div>{footer}</div> : null}
    </div>
  );
}

function BoardsAppInner() {
  const [data, setData] = useState<BoardState>({ boards: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "overview" | "backlog">("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const streamRef = useRef<EventSource | null>(null);
  const [streamRetry, setStreamRetry] = useState(0);
  const [projects, setProjects] = useState<ProjectsResponse['projects']>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [creatingBoard, setCreatingBoard] = useState(false);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);
  const [creatingBacklogTicket, setCreatingBacklogTicket] = useState(false);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const [boardForm, setBoardForm] = useState({ name: "", description: "", members: "", projectId: "" });
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<"all" | KanbanTicket["priority"]>("all");
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>("all");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [activeComposerColumnId, setActiveComposerColumnId] = useState<string | null>(null);
  const [creatingColumnTicketId, setCreatingColumnTicketId] = useState<string | null>(null);
  const [columnDrafts, setColumnDrafts] = useState<Record<string, { title: string; assigneeId: string; priority: KanbanTicket["priority"]; }>>({});
  const [backlogForm, setBacklogForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    tags: "",
  });
  const [sprintForm, setSprintForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await boardsApi.listBoards();
      setData({ boards: response.boards, users: response.users });
      if (!selectedBoardId && response.boards.length > 0) {
        setSelectedBoardId(response.boards[0].id);
      } else if (selectedBoardId) {
        const exists = response.boards.some((board) => board.id === selectedBoardId);
        if (!exists && response.boards.length > 0) {
          setSelectedBoardId(response.boards[0].id);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedBoardId]);

  useEffect(() => {
    void fetchCsrfToken();
    void refresh();
  }, [refresh]);

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
    setData((prev) => ({
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

      const mutationHandler = () => {
        void fetchAndApply();
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

  const selectedBoard = useMemo(() => data.boards.find((board) => board.id === selectedBoardId) ?? null, [data.boards, selectedBoardId]);

  const columnTicketMap = useMemo(() => {
    const map = new Map<string, KanbanTicket[]>();
    if (!selectedBoard) return map;
    selectedBoard.columns.forEach((column) => {
      const tickets = selectedBoard.tickets
        .filter((ticket) => ticket.columnId === column.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      map.set(column.id, tickets);
    });
    return map;
  }, [selectedBoard]);

  const activeTicket = useMemo(() => {
    if (!selectedBoard || !activeTicketId) return undefined;
    return selectedBoard.tickets.find((ticket) => ticket.id === activeTicketId);
  }, [selectedBoard, activeTicketId]);

  const backlogColumn = selectedBoard?.columns[0];

  useEffect(() => {
    setActiveTab("board");
  }, [selectedBoardId]);

  const activeSprint = useMemo(() => {
    if (!selectedBoard) return null;
    return selectedBoard.sprints.find((sprint) => sprint.status === "active") ?? null;
  }, [selectedBoard]);

  useEffect(() => {
    setSearchQuery("");
    setSelectedAssigneeFilter("all");
    setSelectedPriorityFilter("all");
    setSelectedSprintFilter("all");
    setShowUnassignedOnly(false);
    setRecentOnly(false);
    setActiveComposerColumnId(null);
    setColumnDrafts({});
  }, [selectedBoardId]);

  type BoardStat = { label: string; value: string | number; icon: ReactNode };

  const boardStats = useMemo<BoardStat[]>(() => {
    if (!selectedBoard) return [];
    return [
      { label: "Columns", value: selectedBoard.columns.length, icon: <LayoutGrid className="h-4 w-4" /> },
      { label: "Tickets", value: selectedBoard.tickets.length, icon: <ListChecks className="h-4 w-4" /> },
      { label: "Active sprint", value: activeSprint ? activeSprint.name : "No active sprint", icon: <CalendarClock className="h-4 w-4" /> },
      { label: "Members", value: selectedBoard.members.length, icon: <UsersRound className="h-4 w-4" /> },
    ];
  }, [activeSprint, selectedBoard]);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filtersActive = useMemo(
    () =>
      Boolean(
        normalizedSearchQuery ||
          selectedAssigneeFilter !== "all" ||
          selectedPriorityFilter !== "all" ||
          selectedSprintFilter !== "all" ||
          showUnassignedOnly ||
          recentOnly,
      ),
    [normalizedSearchQuery, selectedAssigneeFilter, selectedPriorityFilter, selectedSprintFilter, showUnassignedOnly, recentOnly],
  );

  const projectOptions = useMemo(() =>
    projects
      .map((project) => ({ value: project.id, label: project.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  [projects]);

  const sprintOptions = useMemo(() => {
    if (!selectedBoard) return [{ value: "all", label: "All work" }];
    const options: Array<{ value: string; label: string }> = [{ value: "all", label: "All work" }];
    const sortedSprints = [...selectedBoard.sprints].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    sortedSprints.forEach((sprint) => {
      options.push({
        value: sprint.id,
        label: `${sprint.name}${sprint.status === "active" ? " (Active)" : ""}`,
      });
    });
    const hasBacklogTickets = selectedBoard.tickets.some((ticket) => !ticket.sprintId);
    if (hasBacklogTickets) {
      options.splice(1, 0, { value: "backlog", label: "Backlog" });
    }
    return options;
  }, [selectedBoard]);

  const teamWorkload = useMemo(() => {
    if (!selectedBoard) return [] as Array<{ key: string; label: string; count: number }>;
    const counts = new Map<string, number>();
    selectedBoard.members.forEach((member) => counts.set(member.id, 0));
    let unassigned = 0;
    selectedBoard.tickets.forEach((ticket) => {
      if (ticket.assigneeIds.length === 0) {
        unassigned += 1;
      } else {
        ticket.assigneeIds.forEach((assigneeId) => {
          counts.set(assigneeId, (counts.get(assigneeId) ?? 0) + 1);
        });
      }
    });
    const entries = selectedBoard.members.map((member) => ({
      key: member.id,
      label: member.name,
      count: counts.get(member.id) ?? 0,
    }));
    if (unassigned > 0) {
      entries.push({ key: "unassigned", label: "Unassigned", count: unassigned });
    }
    return entries.sort((a, b) => b.count - a.count);
  }, [selectedBoard]);

  const maxWorkloadCount = useMemo(() => {
    return teamWorkload.reduce((max, item) => Math.max(max, item.count), 0);
  }, [teamWorkload]);

  const priorityBreakdown = useMemo(() => {
    if (!selectedBoard) {
      return { total: 0, items: [] as Array<{ priority: KanbanTicket["priority"]; count: number }> };
    }
    const counts: Record<KanbanTicket["priority"], number> = { high: 0, medium: 0, low: 0 };
    selectedBoard.tickets.forEach((ticket) => {
      counts[ticket.priority] += 1;
    });
    const items = (Object.keys(counts) as Array<KanbanTicket["priority"]>).map((priority) => ({
      priority,
      count: counts[priority],
    }));
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return { total, items };
  }, [selectedBoard]);

  const maxPriorityCount = useMemo(() => {
    return priorityBreakdown.items.reduce((max, item) => Math.max(max, item.count), 0);
  }, [priorityBreakdown]);

  const passesFilters = useCallback(
    (ticket: KanbanTicket) => {
      const matchesSearch =
        !normalizedSearchQuery ||
        ticket.title.toLowerCase().includes(normalizedSearchQuery) ||
        (ticket.description?.toLowerCase().includes(normalizedSearchQuery) ?? false) ||
        ticket.tags.some((tag) => tag.toLowerCase().includes(normalizedSearchQuery));
      const matchesAssignee =
        selectedAssigneeFilter === "all"
          ? true
          : selectedAssigneeFilter === "unassigned"
            ? ticket.assigneeIds.length === 0
            : ticket.assigneeIds.includes(selectedAssigneeFilter);
      const matchesPriority =
        selectedPriorityFilter === "all" ? true : ticket.priority === selectedPriorityFilter;
      const matchesSprint =
        selectedSprintFilter === "all"
          ? true
          : selectedSprintFilter === "backlog"
            ? !ticket.sprintId
            : ticket.sprintId === selectedSprintFilter;
      const matchesUnassigned = showUnassignedOnly ? ticket.assigneeIds.length === 0 : true;
      const matchesRecency = !recentOnly
        ? true
        : Date.now() - new Date(ticket.updatedAt).getTime() <= 1000 * 60 * 60 * 24 * 7;

      return (
        matchesSearch &&
        matchesAssignee &&
        matchesPriority &&
        matchesSprint &&
        matchesUnassigned &&
        matchesRecency
      );
    },
    [
      normalizedSearchQuery,
      recentOnly,
      selectedAssigneeFilter,
      selectedPriorityFilter,
      selectedSprintFilter,
      showUnassignedOnly,
    ],
  );

  const getColumnDraft = useCallback(
    (columnId: string) => columnDrafts[columnId] ?? createColumnDraft(),
    [columnDrafts],
  );

  const updateColumnDraft = useCallback(
    (columnId: string, patch: Partial<{ title: string; assigneeId: string; priority: KanbanTicket["priority"]; }>) => {
      setColumnDrafts((prev) => {
        const previous = prev[columnId] ?? createColumnDraft();
        return {
          ...prev,
          [columnId]: { ...previous, ...patch },
        };
      });
    },
    [],
  );

  const handleColumnComposerOpen = useCallback((columnId: string) => {
    setActiveComposerColumnId(columnId);
    setColumnDrafts((prev) => {
      if (prev[columnId]) return prev;
      return {
        ...prev,
        [columnId]: createColumnDraft(),
      };
    });
  }, []);

  const handleColumnComposerCancel = useCallback(() => {
    setActiveComposerColumnId(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedAssigneeFilter("all");
    setSelectedPriorityFilter("all");
    setSelectedSprintFilter("all");
    setShowUnassignedOnly(false);
    setRecentOnly(false);
  }, []);

  const handleCreateBoard = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setBoardForm({ name: "", description: "", members: "", projectId: "" });
      setShowBoardForm(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleCreateColumn = async (event: React.FormEvent<HTMLFormElement>, boardId: string) => {
    event.preventDefault();
    if (!columnTitle.trim()) return;
    try {
      setCreatingColumnId(boardId);
      await boardsApi.createColumn(boardId, columnTitle.trim());
      setColumnTitle("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingColumnId(null);
    }
  };

  const handleCreateBacklogTicket = async (
    event: React.FormEvent<HTMLFormElement>,
    boardId: string,
    columnId: string,
  ) => {
    event.preventDefault();
    if (!backlogForm.title.trim()) return;
    try {
      setCreatingBacklogTicket(true);
      await boardsApi.createTicket(boardId, {
        columnId,
        title: backlogForm.title.trim(),
        description: backlogForm.description.trim() || undefined,
        assigneeIds: backlogForm.assigneeId ? [backlogForm.assigneeId] : undefined,
        tags: backlogForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setBacklogForm({ title: "", description: "", assigneeId: "", tags: "" });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingBacklogTicket(false);
    }
  };

  const handleAssigneeChange = async (ticket: KanbanTicket, assigneeId: string) => {
    try {
      await boardsApi.updateTicket(ticket.id, { assigneeIds: assigneeId ? [assigneeId] : [] });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleTicketUpdate = async (ticketId: string, updates: Partial<KanbanTicket>) => {
    try {
      await boardsApi.updateTicket(ticketId, updates);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const handleAddComment = async (ticketId: string, content: string) => {
    try {
      await boardsApi.addComment(ticketId, content);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await boardsApi.deleteComment(commentId);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const handleCreateSprint = async (event: React.FormEvent<HTMLFormElement>, boardId: string) => {
    event.preventDefault();
    if (!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate) return;
    try {
      setCreatingSprint(true);
      await boardsApi.createSprint(boardId, {
        name: sprintForm.name,
        goal: sprintForm.goal || undefined,
        startDate: sprintForm.startDate,
        endDate: sprintForm.endDate,
      });
      setSprintForm({ name: "", goal: "", startDate: "", endDate: "" });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingSprint(false);
    }
  };

  const handleColumnTicketSubmit = async (event: React.FormEvent<HTMLFormElement>, columnId: string) => {
    event.preventDefault();
    if (!selectedBoard) return;
    const draft = getColumnDraft(columnId);
    if (!draft.title.trim()) return;
    try {
      setCreatingColumnTicketId(columnId);
      await boardsApi.createTicket(selectedBoard.id, {
        columnId,
        title: draft.title.trim(),
        assigneeIds: draft.assigneeId ? [draft.assigneeId] : undefined,
        priority: draft.priority,
      });
      setColumnDrafts((prev) => ({
        ...prev,
        [columnId]: createColumnDraft(),
      }));
      setActiveComposerColumnId(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingColumnTicketId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTicketId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicketId(null);
    if (!selectedBoard || !over) return;

    const activeTicketId = String(active.id);
    const fromColumnId = active.data.current?.columnId as string | undefined;
    let toColumnId = over.data.current?.columnId as string | undefined;

    if (!fromColumnId) return;

    if (!toColumnId) {
      const overTicket = selectedBoard.tickets.find((ticket) => ticket.id === String(over.id));
      toColumnId = overTicket?.columnId;
    }

    if (!toColumnId) return;

    const sourceTickets = [...(columnTicketMap.get(fromColumnId) ?? [])];
    const destinationTickets =
      fromColumnId === toColumnId
        ? sourceTickets
        : [...(columnTicketMap.get(toColumnId) ?? [])];

    const oldIndex = sourceTickets.findIndex((ticket) => ticket.id === activeTicketId);
    if (oldIndex === -1) return;

    let newIndex = destinationTickets.findIndex((ticket) => ticket.id === String(over.id));
    if (over.data.current?.type === "column" || newIndex === -1) {
      newIndex = destinationTickets.length;
    }

    const nextTickets = selectedBoard.tickets.map((ticket) => ({ ...ticket }));

    if (fromColumnId === toColumnId) {
      const boundedIndex = Math.max(0, Math.min(newIndex, destinationTickets.length - 1));
      if (boundedIndex === oldIndex) {
        return;
      }

      const reordered = arrayMove(destinationTickets, oldIndex, boundedIndex).map((ticket, index) => ({
        ...ticket,
        order: index,
      }));

      for (const ticket of nextTickets) {
        if (ticket.columnId === fromColumnId) {
          const updated = reordered.find((item) => item.id === ticket.id);
          if (updated) {
            ticket.order = updated.order;
          }
        }
      }

      newIndex = boundedIndex;
    } else {
      const withoutActive = sourceTickets
        .filter((ticket) => ticket.id !== activeTicketId)
        .map((ticket, index) => ({ ...ticket, order: index }));

      const withActive = [
        ...destinationTickets.slice(0, newIndex),
        { ...sourceTickets[oldIndex], columnId: toColumnId },
        ...destinationTickets.slice(newIndex),
      ].map((ticket, index) => ({ ...ticket, columnId: toColumnId, order: index }));

      for (const ticket of nextTickets) {
        if (ticket.id === activeTicketId) {
          const updated = withActive.find((item) => item.id === ticket.id);
          if (updated) {
            ticket.columnId = updated.columnId;
            ticket.order = updated.order;
          }
          continue;
        }
        if (ticket.columnId === fromColumnId) {
          const updated = withoutActive.find((item) => item.id === ticket.id);
          if (updated) {
            ticket.order = updated.order;
          }
          continue;
        }
        if (ticket.columnId === toColumnId) {
          const updated = withActive.find((item) => item.id === ticket.id);
          if (updated) {
            ticket.order = updated.order;
          }
        }
      }
    }

    setData((prev) => ({
      ...prev,
      boards: prev.boards.map((board) =>
        board.id === selectedBoard.id ? { ...board, tickets: nextTickets } : board,
      ),
    }));

    try {
      await boardsApi.reorderTicket(selectedBoard.id, {
        ticketId: activeTicketId,
        toColumnId,
        toIndex: newIndex,
      });
    } catch (err) {
      setError((err as Error).message);
      await refresh();
    }
  };

  const handleDragCancel = () => {
    setActiveTicketId(null);
  };

  const sidebarSections = [
    {
      title: "Planning",
      items: [
        { label: "Timeline", icon: CalendarClock, active: false },
        { label: "Kanban board", icon: KanbanIcon, active: true },
        { label: "Reports", icon: BarChart3, active: false },
      ],
    },
    {
      title: "Project",
      items: [
        { label: "Issues", icon: ListChecks, active: false },
        { label: "Components", icon: LayoutGrid, active: false },
      ],
    },
    {
      title: "Development",
      items: [
        { label: "Code", icon: FileCode2, active: false },
        { label: "Releases", icon: Rocket, active: false },
      ],
    },
  ] as const;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white text-neutral-900 transition-colors dark:bg-black dark:text-neutral-100">
      <aside className={clsx(
        "fixed left-0 top-0 hidden h-screen flex-shrink-0 flex-col overflow-y-auto bg-white pb-6 pt-4 transition-all duration-300 dark:bg-black lg:flex",
        sidebarCollapsed ? "w-16 px-3" : "w-64 px-6"
      )}>
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className={clsx(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <span className="whitespace-nowrap text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              OpenDock
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-white">
              Boards
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <Expand className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </button>
        </div>
        <div className={clsx(
          "mb-6 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
        )}>
          <div>
            <p className="whitespace-nowrap text-xs text-neutral-400 dark:text-neutral-500">Projects</p>
            <p className="mt-1 whitespace-nowrap text-base font-semibold text-neutral-900 dark:text-white">Beyond Gravity</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex-1 space-y-8 overflow-y-auto">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <p className={clsx(
                "overflow-hidden text-xs font-semibold uppercase text-neutral-400 transition-all duration-300 dark:text-neutral-500",
                sidebarCollapsed ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
              )}>{section.title}</p>
              <ul className={clsx("space-y-1", !sidebarCollapsed && "mt-3")}>
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white",
                        item.active && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
                        sidebarCollapsed && "justify-center"
                      )}
                      title={item.label}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className={clsx(
                        "overflow-hidden whitespace-nowrap transition-all duration-300",
                        sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      )}>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className={clsx(
            "overflow-hidden transition-all duration-300",
            sidebarCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
          )}>
            <div className="flex items-center justify-between text-xs uppercase text-neutral-400 dark:text-neutral-500">
              <span className="whitespace-nowrap">Boards</span>
              <span>{data.boards.length}</span>
            </div>
            <div className="mt-3 space-y-1">
              {data.boards.length > 0 ? (
                data.boards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => setSelectedBoardId(board.id)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white",
                      selectedBoardId === board.id &&
                        "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
                    )}
                  >
                    <span className="truncate">{board.name}</span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">{board.tickets.length}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-500">No boards yet.</p>
              )}
            </div>
          </div>
        </div>
        <div className={clsx(
          "mt-6 overflow-hidden border-t border-neutral-200 pt-4 transition-all duration-300 dark:border-neutral-800",
          sidebarCollapsed ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
        )}>
          <button
            type="button"
            onClick={() => setShowBoardForm((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            New board
          </button>
          {showBoardForm ? (
            <form className="mt-4 space-y-3" onSubmit={handleCreateBoard}>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Board name
                <input
                  required
                  value={boardForm.name}
                  onChange={(event) => setBoardForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Description
                <textarea
                  value={boardForm.description}
                  onChange={(event) => setBoardForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Members
                <input
                  value={boardForm.members}
                  onChange={(event) => setBoardForm((prev) => ({ ...prev, members: event.target.value }))}
                  placeholder="Comma separated names"
                  className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Project
                <select
                  value={boardForm.projectId}
                  onChange={(event) => setBoardForm((prev) => ({ ...prev, projectId: event.target.value }))}
                  disabled={projectsLoading}
                  className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15 disabled:opacity-60"
                >
                  <option value="">No project</option>
                  {projectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {projectsError ? (
                <p className="text-xs text-rose-500 dark:text-rose-300">{projectsError}</p>
              ) : null}
              <button
                type="submit"
                disabled={creatingBoard}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {creatingBoard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create board
              </button>
            </form>
          ) : null}
        </div>
      </aside>
      <div className={clsx(
        "flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <header className={clsx(
          "fixed right-0 top-0 z-50 bg-white transition-all duration-300 dark:bg-black",
          sidebarCollapsed ? "left-0 lg:left-16" : "left-0 lg:left-64"
        )}>
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  OpenDock
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">/</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Boards
                </span>
              </div>
              <nav className="hidden items-center gap-6 text-sm text-neutral-500 dark:text-neutral-300 sm:flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={clsx(
                    "transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "overview" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("board")}
                  className={clsx(
                    "transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "board" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Board
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("backlog")}
                  className={clsx(
                    "transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "backlog" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Backlog
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mt-[57px] flex h-[calc(100vh-57px)] min-w-0 flex-col overflow-x-hidden bg-white dark:bg-black">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          {error ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-500 dark:border-rose-400/30 dark:text-rose-200">
              {error}
            </div>
          ) : null}
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 lg:hidden">
            <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                <span>Boards</span>
                <span>{data.boards.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {data.boards.length > 0 ? (
                  data.boards.map((board) => (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => setSelectedBoardId(board.id)}
                      className={clsx(
                        "flex w-full items-center justify-between rounded-lg border border-transparent bg-white/70 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white",
                        selectedBoardId === board.id &&
                          "border-slate-900 bg-slate-900/80 text-white shadow-sm dark:border-white/30 dark:bg-white/15 dark:text-white",
                      )}
                    >
                      <span className="truncate">{board.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{board.tickets.length}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-500/80">No boards yet.</p>
                )}
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setShowBoardForm((value) => !value)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <Plus className="h-4 w-4" />
                New board
              </button>
              {showBoardForm ? (
                <form className="mt-4 space-y-3" onSubmit={handleCreateBoard}>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    Board name
                    <input
                      required
                      value={boardForm.name}
                      onChange={(event) => setBoardForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    Description
                    <textarea
                      value={boardForm.description}
                      onChange={(event) => setBoardForm((prev) => ({ ...prev, description: event.target.value }))}
                      rows={3}
                      className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    Members
                    <input
                      value={boardForm.members}
                      onChange={(event) => setBoardForm((prev) => ({ ...prev, members: event.target.value }))}
                      placeholder="Comma separated names"
                      className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                    Project
                    <select
                      value={boardForm.projectId}
                      onChange={(event) => setBoardForm((prev) => ({ ...prev, projectId: event.target.value }))}
                      disabled={projectsLoading}
                      className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15 disabled:opacity-60"
                    >
                      <option value="">No project</option>
                      {projectOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {projectsError ? (
                    <p className="text-xs text-rose-500 dark:text-rose-300">{projectsError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={creatingBoard}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {creatingBoard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create board
                  </button>
                </form>
              ) : null}
            </div>
          </div>
          {loading ? (
            <div className="mx-auto mt-8 max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 px-6 py-10 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Loading boards…
            </div>
          ) : selectedBoard ? (
            <>
            {activeTab === "board" && (
              <header className="flex w-full flex-shrink-0 border-b border-neutral-200 bg-white/95 py-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-black/90">
                <div className="flex w-full flex-col gap-4 px-4 sm:px-6 lg:px-8 xl:px-10 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1 lg:min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{selectedBoard.name}</h2>
                      <span className="text-xs uppercase text-neutral-400 dark:text-neutral-500">
                        {selectedBoard.tickets.length} tickets
                      </span>
                    </div>
                    {selectedBoard.description ? (
                      <p className="hidden text-xs text-neutral-500 dark:text-neutral-400 sm:block">{selectedBoard.description}</p>
                    ) : (
                      <p className="hidden text-xs text-neutral-500 dark:text-neutral-500 sm:block">Keep work visible across every stage.</p>
                    )}
                  </div>
                  <div className="flex w-full flex-col gap-3 lg:ml-auto lg:max-w-[640px] lg:items-end">
                    <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end lg:justify-end">
                      <label className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm text-neutral-600 shadow-sm focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus-within:border-neutral-600 dark:focus-within:ring-neutral-800/60">
                        <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        <input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Search issues, tags, people"
                          className="w-32 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 sm:w-48"
                        />
                      </label>
                      <select
                        value={selectedAssigneeFilter}
                        onChange={(event) => setSelectedAssigneeFilter(event.target.value)}
                        className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
                      >
                        <option value="all">All assignees</option>
                        <option value="unassigned">Unassigned</option>
                        {selectedBoard.members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedSprintFilter}
                        onChange={(event) => setSelectedSprintFilter(event.target.value)}
                        className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
                      >
                        {sprintOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end lg:justify-end">
                      <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/90 px-1.5 py-1 text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        {priorityFilterOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedPriorityFilter(option.value)}
                            className={clsx(
                              "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase transition",
                              selectedPriorityFilter === option.value
                                ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
                                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setShowUnassignedOnly((value) => {
                            const next = !value;
                            if (next) {
                              setSelectedAssigneeFilter("all");
                            }
                            return next;
                          })
                        }
                        className={clsx(
                          "rounded-full border border-neutral-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white",
                          showUnassignedOnly && "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-white/30 dark:bg-white dark:text-neutral-900",
                        )}
                      >
                        Unassigned
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecentOnly((value) => !value)}
                        className={clsx(
                          "rounded-full border border-neutral-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white",
                          recentOnly && "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-white/30 dark:bg-white dark:text-neutral-900",
                        )}
                      >
                        Updated 7d
                      </button>
                      {filtersActive ? (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </header>
            )}
            <div className="mt-8 space-y-8">
              {activeTab === "overview" ? (
                <section className="mx-auto grid max-w-7xl gap-6 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedBoard.name}</h2>
                      {selectedBoard.description ? (
                        <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{selectedBoard.description}</p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Plan and monitor the flow of work across your team.</p>
                      )}
                    </div>
                {boardStats.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {boardStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                          >
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                              {stat.icon}
                            </span>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">{stat.label}</p>
                              <p className="text-base font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                            </div>
                          </div>
                    ))}
                  </div>
                ) : null}
                {teamWorkload.length > 0 ? (
                  <div className="space-y-4 rounded-lg border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950/80">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Team workload</h3>
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                        {selectedBoard.tickets.length} issues
                      </span>
                    </div>
                    <div className="space-y-3">
                      {teamWorkload.map((entry) => {
                        const percentage =
                          maxWorkloadCount === 0
                            ? 0
                            : Math.max((entry.count / maxWorkloadCount) * 100, entry.count > 0 ? 10 : 0);
                        return (
                          <div key={entry.key} className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                              <span className="font-medium text-slate-600 dark:text-slate-200">{entry.label}</span>
                              <span>{entry.count}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-slate-900 dark:bg-white"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {priorityBreakdown.total > 0 ? (
                  <div className="space-y-4 rounded-lg border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950/80">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Priority mix</h3>
                    <div className="space-y-3">
                      {priorityBreakdown.items.map((item) => {
                        if (item.count === 0) return null;
                        const percentage =
                          maxPriorityCount === 0
                            ? 0
                            : Math.max((item.count / maxPriorityCount) * 100, item.count > 0 ? 12 : 0);
                        return (
                          <div key={item.priority} className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                              <span className="font-medium capitalize text-slate-600 dark:text-slate-200">{item.priority}</span>
                              <span>
                                {item.count} · {Math.round((item.count / priorityBreakdown.total) * 100)}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                              <div
                                className={clsx("h-full rounded-full", priorityAccent[item.priority])}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-4">
                {activeSprint ? (
                  <div className="space-y-3 rounded-lg border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-neutral-950/80 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active sprint</h3>
                      <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{activeSprint.status}</span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
                      <p className="font-medium">{activeSprint.name}</p>
                      <p>
                        {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(activeSprint.startDate))}
                        {" – "}
                        {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(activeSprint.endDate))}
                      </p>
                      {activeSprint.goal ? <p className="text-xs text-slate-500 dark:text-slate-400">{activeSprint.goal}</p> : null}
                    </div>
                  </div>
                ) : null}
                <form
                  onSubmit={(event) => handleCreateSprint(event, selectedBoard.id)}
                  className="grid gap-3 rounded-lg border border-slate-200/70 bg-white/70 p-5 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                >
                  <div className="grid gap-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Sprint name</label>
                    <input
                      required
                      value={sprintForm.name}
                      onChange={(event) => setSprintForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Schedule</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={sprintForm.startDate}
                        onChange={(event) => setSprintForm((prev) => ({ ...prev, startDate: event.target.value }))}
                        className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                      />
                      <input
                        type="date"
                        required
                        value={sprintForm.endDate}
                        onChange={(event) => setSprintForm((prev) => ({ ...prev, endDate: event.target.value }))}
                        className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Goal</label>
                    <textarea
                      value={sprintForm.goal}
                      onChange={(event) => setSprintForm((prev) => ({ ...prev, goal: event.target.value }))}
                      rows={2}
                      className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingSprint}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {creatingSprint ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create sprint
                  </button>
                </form>
              </div>
                </section>
              ) : null}
              {activeTab === "backlog" ? (
                backlogColumn ? (
                  <section className="mx-auto max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Backlog quick add</h3>
                    <form
                      onSubmit={(event) => handleCreateBacklogTicket(event, selectedBoard.id, backlogColumn.id)}
                      className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.32fr)]"
                    >
                      <input
                        required
                        value={backlogForm.title}
                        onChange={(event) => setBacklogForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Issue title"
                        className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                      />
                      <textarea
                        value={backlogForm.description}
                        onChange={(event) => setBacklogForm((prev) => ({ ...prev, description: event.target.value }))}
                        rows={2}
                        placeholder="Description (optional)"
                        className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                      />
                      <div className="flex flex-col gap-2">
                        <select
                          value={backlogForm.assigneeId}
                          onChange={(event) => setBacklogForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
                          className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                        >
                          <option value="">Unassigned</option>
                          {selectedBoard.members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={backlogForm.tags}
                          onChange={(event) => setBacklogForm((prev) => ({ ...prev, tags: event.target.value }))}
                          placeholder="Tags (comma-separated)"
                          className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={creatingBacklogTicket}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        {creatingBacklogTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add to backlog
                      </button>
                    </form>
                  </section>
                ) : (
                  <section className="mx-auto max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    Add a backlog column to start capturing items here.
                  </section>
                )
              ) : null}
            {activeTab === "board" && selectedBoard ? (
              <div className="mt-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <div className="overflow-x-auto">
                    <div className="mx-auto flex w-max gap-5 px-4 pb-6 sm:px-6 lg:px-10">
                      {selectedBoard.columns.map((column) => {
                        const rawTickets = columnTicketMap.get(column.id) ?? [];
                        const filteredTickets = rawTickets.filter(passesFilters);
                        const draft = getColumnDraft(column.id);
                        const composerOpen = activeComposerColumnId === column.id;
                        return (
                          <KanbanColumn
                            key={column.id}
                            column={column}
                            tickets={filteredTickets}
                            totalCount={rawTickets.length}
                            footer={
                              <div className="space-y-3">
                                {composerOpen ? (
                                  <form
                                    onSubmit={(event) => handleColumnTicketSubmit(event, column.id)}
                                    className="space-y-3 rounded-md border border-slate-200/70 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-neutral-950"
                                  >
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                        Issue summary
                                        <input
                                          required
                                          value={draft.title}
                                          onChange={(event) => updateColumnDraft(column.id, { title: event.target.value })}
                                          className="mt-2 w-full rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/10 dark:bg-black dark:text-slate-100 dark:focus:border-white/30 dark:focus:ring-white/20"
                                          placeholder="Describe the work"
                                        />
                                      </label>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                        Assignee
                                        <select
                                          value={draft.assigneeId}
                                          onChange={(event) => updateColumnDraft(column.id, { assigneeId: event.target.value })}
                                          className="rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/10 dark:bg-black dark:text-slate-100 dark:focus:border-white/30 dark:focus:ring-white/20"
                                        >
                                          <option value="">Unassigned</option>
                                          {selectedBoard.members.map((member) => (
                                            <option key={member.id} value={member.id}>
                                              {member.name}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                        Priority
                                        <select
                                          value={draft.priority}
                                          onChange={(event) =>
                                            updateColumnDraft(column.id, {
                                              priority: event.target.value as KanbanTicket["priority"],
                                            })
                                          }
                                          className="rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/10 dark:bg-black dark:text-slate-100 dark:focus:border-white/30 dark:focus:ring-white/20"
                                        >
                                          <option value="high">High</option>
                                          <option value="medium">Medium</option>
                                          <option value="low">Low</option>
                                        </select>
                                      </label>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="submit"
                                        disabled={creatingColumnTicketId === column.id}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                      >
                                        {creatingColumnTicketId === column.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Plus className="h-4 w-4" />
                                        )}
                                        Add issue
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleColumnComposerCancel}
                                        className="rounded-md border border-slate-200/70 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleColumnComposerOpen(column.id)}
                                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300/60 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-white/20 dark:text-slate-300 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Create issue
                                  </button>
                                )}
                              </div>
                            }
                          >
                            {filteredTickets.map((ticket) => (
                              <SortableTicket
                                key={ticket.id}
                                ticket={ticket}
                                column={column}
                                members={selectedBoard.members}
                                sprints={selectedBoard.sprints}
                                onAssigneeChange={handleAssigneeChange}
                                onClick={() => setSelectedTicketId(ticket.id)}
                              />
                            ))}
                          </KanbanColumn>
                        );
                      })}
                      <form
                        onSubmit={(event) => handleCreateColumn(event, selectedBoard.id)}
                        className="flex min-w-[20rem] max-w-[20rem] flex-col gap-3 self-start rounded-lg border border-dashed border-slate-300/70 bg-white/60 p-5 text-sm text-slate-500 shadow-sm dark:border-white/20 dark:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add column</p>
                        <input
                          value={columnTitle}
                          onChange={(event) => setColumnTitle(event.target.value)}
                          placeholder="Column name"
                          className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2.5 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
                        />
                        <button
                          type="submit"
                          disabled={creatingColumnId === selectedBoard.id}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          {creatingColumnId === selectedBoard.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          Add column
                        </button>
                      </form>
                    </div>
                  </div>
                  <DragOverlay>
                    {activeTicket && selectedBoard ? (
                      <div className="pointer-events-none scale-105 rotate-2 cursor-grabbing shadow-2xl">
                        <TicketCard
                          ticket={activeTicket}
                          column={selectedBoard.columns.find((col) => col.id === activeTicket.columnId)}
                          members={selectedBoard.members}
                          sprints={selectedBoard.sprints}
                          onAssigneeChange={handleAssigneeChange}
                          interactive={false}
                          highlight
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            ) : null}
            </div>
            </>
          ) : (
            <div className="mx-auto mt-12 max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 px-8 py-12 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Select a board from the sidebar to get started.
            </div>
          )}
        </main>
      </div>
      {/* Ticket Detail Panel */}
      {selectedTicketId && selectedBoard && (() => {
        const selectedTicket = selectedBoard.tickets.find((t) => t.id === selectedTicketId);
        return selectedTicket ? (
          <TicketDetailPanel
            ticket={selectedTicket}
            members={selectedBoard.members}
            onClose={() => setSelectedTicketId(null)}
            onUpdate={handleTicketUpdate}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : null;
      })()}
    </div>
  );
}

export default function BoardsPage() {
  const { theme } = useTheme();
  return <BoardsAppInner key={theme} />;
}
