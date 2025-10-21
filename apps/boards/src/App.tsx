import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  CalendarClock,
  Kanban as KanbanIcon,
  Loader2,
  Plus,
  UsersRound,
} from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard, KanbanTicket, KanbanUser } from "@opendock/shared/types";
import { boardsApi } from "@/lib/api";
import { ThemeProvider, useTheme } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";
import "./index.css";

interface BoardState {
  boards: KanbanBoard[];
  users: KanbanUser[];
}

const priorityStyles: Record<KanbanTicket["priority"], string> = {
  high: "bg-rose-500/20 text-rose-200",
  medium: "bg-amber-500/20 text-amber-200",
  low: "bg-emerald-500/20 text-emerald-200",
};

function TicketCard({
  ticket,
  members,
  sprints,
  onAssigneeChange,
  highlight = false,
  interactive = true,
}: {
  ticket: KanbanTicket;
  members: KanbanUser[];
  sprints: KanbanBoard["sprints"];
  onAssigneeChange: (ticket: KanbanTicket, assigneeId: string) => void;
  highlight?: boolean;
  interactive?: boolean;
}) {
  const assignee = members.find((member) => ticket.assigneeIds.includes(member.id));
  const sprint = sprints.find((item) => item.id === ticket.sprintId);

  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition dark:border-white/10 dark:bg-slate-900",
        highlight && "border-slate-400 shadow-lg dark:border-white/30",
      )}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{ticket.title}</p>
      {ticket.description ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{ticket.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
        <span
          className={clsx(
            "rounded-full px-2 py-1 text-[10px] uppercase tracking-wide",
            priorityStyles[ticket.priority],
          )}
        >
          {ticket.priority}
        </span>
        {ticket.estimate ? (
          <span className="rounded-full border border-slate-200 px-2 py-1 dark:border-white/20">
            {ticket.estimate} pts
          </span>
        ) : null}
        {sprint ? (
          <span className="rounded-full border border-slate-200 px-2 py-1 dark:border-white/20">
            {sprint.name}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-2 text-[11px] text-slate-700 dark:text-slate-200">
        {interactive ? (
          <select
            value={assignee?.id ?? ""}
            onChange={(event) => onAssigneeChange(ticket, event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-wide text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
            {assignee ? assignee.name : "Unassigned"}
          </span>
        )}
        {ticket.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-400">
            {ticket.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 px-2 py-1 dark:border-white/10">
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
  columnId,
  members,
  sprints,
  onAssigneeChange,
}: {
  ticket: KanbanTicket;
  columnId: string;
  members: KanbanUser[];
  sprints: KanbanBoard["sprints"];
  onAssigneeChange: (ticket: KanbanTicket, assigneeId: string) => void;
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
    data: { type: "ticket", columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx("cursor-grab", isDragging && "opacity-70")}
      {...attributes}
      {...listeners}
    >
      <TicketCard
        ticket={ticket}
        members={members}
        sprints={sprints}
        onAssigneeChange={onAssigneeChange}
        highlight={isDragging}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  tickets,
  children,
}: {
  column: KanbanBoard["columns"][number];
  tickets: KanbanTicket[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div className="flex min-w-[22rem] max-w-[22rem] flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{column.title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-300">
          {tickets.length}
        </span>
      </div>
      <SortableContext
        id={column.id}
        items={tickets.map((ticket) => ticket.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={clsx(
            "flex min-h-[6rem] flex-col gap-3",
            isOver && "rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 p-3 dark:border-white/20 dark:bg-white/10",
          )}
        >
          {children}
          {tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-4 text-center text-xs text-slate-400 dark:border-white/10 dark:bg-transparent">
              Drop issues here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

function BoardsAppInner() {
  const [data, setData] = useState<BoardState>({ boards: [], users: [] });
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingBoard, setCreatingBoard] = useState(false);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);
  const [creatingBacklogTicket, setCreatingBacklogTicket] = useState(false);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const [boardForm, setBoardForm] = useState({
    name: "",
    description: "",
    members: "",
  });
  const [columnTitle, setColumnTitle] = useState("");
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

  const refresh = async () => {
    try {
      setError(null);
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
  };

  useEffect(() => {
    void refresh();
  }, []);

  const selectedBoard = useMemo(
    () => data.boards.find((board) => board.id === selectedBoardId) ?? null,
    [data.boards, selectedBoardId],
  );

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
      await boardsApi.createBoard({ name: boardForm.name.trim(), description: boardForm.description.trim() || undefined, members });
      setBoardForm({ name: "", description: "", members: "" });
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTicketId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicketId(null);
    if (!selectedBoard || !over) return;

    const activeTicketId = String(active.id);
    const fromColumnId = active.data.current?.columnId as string | undefined;
    const toColumnId = over.data.current?.columnId as string | undefined;

    if (!fromColumnId || !toColumnId) return;

    const destinationTickets = columnTicketMap.get(toColumnId) ?? [];
    let toIndex = destinationTickets.findIndex((ticket) => ticket.id === over.id);

    if (over.data.current?.type === "column" || toIndex === -1) {
      toIndex = destinationTickets.length;
    }

    try {
      await boardsApi.reorderTicket(selectedBoard.id, {
        ticketId: activeTicketId,
        toColumnId,
        toIndex,
      });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDragCancel = () => {
    setActiveTicketId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 transition dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center gap-4">
          <a
            href="/boards"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.4em] text-slate-500 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
          >
            <ArrowLeft size={14} /> Overview
          </a>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <KanbanIcon size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Boards</p>
              <p className="text-sm text-slate-600 dark:text-slate-200">Delivery planning for OpenDock</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      <main className="px-8 pb-12 pt-8">
        {error ? (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-500 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          {data.boards.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => setSelectedBoardId(board.id)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                selectedBoardId === board.id
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-white/30 dark:hover:text-white",
              )}
            >
              <KanbanIcon className="h-3.5 w-3.5" />
              {board.name}
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreateBoard}>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Board name</label>
              <input
                required
                value={boardForm.name}
                onChange={(event) => setBoardForm((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Description</label>
              <input
                value={boardForm.description}
                onChange={(event) => setBoardForm((prev) => ({ ...prev, description: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Members</label>
              <input
                value={boardForm.members}
                placeholder="Comma-separated names"
                onChange={(event) => setBoardForm((prev) => ({ ...prev, members: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={creatingBoard}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {creatingBoard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create board
            </button>
          </form>
        </section>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300">
            Loading boards…
          </div>
        ) : selectedBoard ? (
          <div className="mt-8 space-y-10">
            <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{selectedBoard.name}</h2>
                {selectedBoard.description ? (
                  <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-300">{selectedBoard.description}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 uppercase tracking-wide dark:border-white/10 dark:bg-slate-900/60">
                    <UsersRound className="h-3.5 w-3.5" /> {selectedBoard.members.length} members
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 uppercase tracking-wide dark:border-white/10 dark:bg-slate-900/60">
                    <CalendarClock className="h-3.5 w-3.5" /> {selectedBoard.sprints.filter((s) => s.status === "active").length} active sprint
                  </span>
                </div>
              </div>
              <form
                onSubmit={(event) => handleCreateSprint(event, selectedBoard.id)}
                className="grid gap-2 rounded-3xl border border-slate-200 bg-white/70 p-5 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <div className="grid gap-2">
                  <label className="uppercase tracking-[0.3em]">Sprint name</label>
                  <input
                    required
                    value={sprintForm.name}
                    onChange={(event) => setSprintForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="uppercase tracking-[0.3em]">Schedule</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={sprintForm.startDate}
                      onChange={(event) => setSprintForm((prev) => ({ ...prev, startDate: event.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                    />
                    <input
                      type="date"
                      required
                      value={sprintForm.endDate}
                      onChange={(event) => setSprintForm((prev) => ({ ...prev, endDate: event.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="uppercase tracking-[0.3em]">Goal</label>
                  <textarea
                    value={sprintForm.goal}
                    onChange={(event) => setSprintForm((prev) => ({ ...prev, goal: event.target.value }))}
                    rows={2}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingSprint}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {creatingSprint ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create sprint
                </button>
              </form>
            </section>

            {backlogColumn ? (
              <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Backlog quick add</h3>
                <form
                  onSubmit={(event) => handleCreateBacklogTicket(event, selectedBoard.id, backlogColumn.id)}
                  className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.3fr)]"
                >
                  <input
                    required
                    value={backlogForm.title}
                    onChange={(event) => setBacklogForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Issue title"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <textarea
                    value={backlogForm.description}
                    onChange={(event) => setBacklogForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={2}
                    placeholder="Description (optional)"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <div className="flex flex-col gap-2">
                    <select
                      value={backlogForm.assigneeId}
                      onChange={(event) => setBacklogForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
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
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingBacklogTicket}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {creatingBacklogTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add to backlog
                  </button>
                </form>
              </section>
            ) : null}

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
              <div className="flex gap-8 overflow-x-auto pb-10">
                {selectedBoard.columns.map((column) => {
                  const tickets = columnTicketMap.get(column.id) ?? [];
                  return (
                    <KanbanColumn key={column.id} column={column} tickets={tickets}>
                      {tickets.map((ticket) => (
                        <SortableTicket
                          key={ticket.id}
                          ticket={ticket}
                          columnId={column.id}
                          members={selectedBoard.members}
                          sprints={selectedBoard.sprints}
                          onAssigneeChange={handleAssigneeChange}
                        />
                      ))}
                    </KanbanColumn>
                  );
                })}
                <form
                  onSubmit={(event) => handleCreateColumn(event, selectedBoard.id)}
                  className="flex min-w-[18rem] max-w-[18rem] flex-col gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500 shadow-sm dark:border-white/20 dark:bg-slate-900/40"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add column</p>
                  <input
                    value={columnTitle}
                    onChange={(event) => setColumnTitle(event.target.value)}
                    placeholder="Column name"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={creatingColumnId === selectedBoard.id}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {creatingColumnId === selectedBoard.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add column
                  </button>
                </form>
              </div>
              <DragOverlay>
                {activeTicket && selectedBoard ? (
                  <div className="pointer-events-none">
                    <TicketCard
                      ticket={activeTicket}
                      members={selectedBoard.members}
                      sprints={selectedBoard.sprints}
                      onAssigneeChange={() => undefined}
                      interactive={false}
                      highlight
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function App() {
  const { theme } = useTheme();
  return <BoardsAppInner key={theme} />;
}

export default function RootApp() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

