import { useCallback, useMemo, useState } from "react";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";
import type { DueDateFilter } from "@/components/boards/BoardToolbar";

interface UseBoardFiltersParams {
  selectedBoard: KanbanBoard | null;
  columnTicketMap: Map<string, KanbanTicket[]>;
}

interface UseBoardFiltersResult {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedAssigneeFilter: string;
  setSelectedAssigneeFilter: React.Dispatch<React.SetStateAction<string>>;
  selectedPriorityFilter: "all" | KanbanTicket["priority"];
  setSelectedPriorityFilter: React.Dispatch<React.SetStateAction<"all" | KanbanTicket["priority"]>>;
  selectedSprintFilter: string;
  setSelectedSprintFilter: React.Dispatch<React.SetStateAction<string>>;
  selectedDueDateFilter: DueDateFilter;
  setSelectedDueDateFilter: React.Dispatch<React.SetStateAction<DueDateFilter>>;
  selectedLabelFilter: string;
  setSelectedLabelFilter: React.Dispatch<React.SetStateAction<string>>;
  showUnassignedOnly: boolean;
  setShowUnassignedOnly: React.Dispatch<React.SetStateAction<boolean>>;
  recentOnly: boolean;
  setRecentOnly: React.Dispatch<React.SetStateAction<boolean>>;
  filtersActive: boolean;
  columnIdSet: Set<string>;
  filteredTicketMap: Map<string, KanbanTicket[]>;
  sprintOptions: Array<{ value: string; label: string }>;
  resetFilters: () => void;
}

export function useBoardFilters({ selectedBoard, columnTicketMap }: UseBoardFiltersParams): UseBoardFiltersResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<"all" | KanbanTicket["priority"]>("all");
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>("all");
  const [selectedDueDateFilter, setSelectedDueDateFilter] = useState<DueDateFilter>("all");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>("all");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filtersActive = useMemo(
    () =>
      Boolean(
        normalizedSearchQuery ||
          selectedAssigneeFilter !== "all" ||
          selectedPriorityFilter !== "all" ||
          selectedSprintFilter !== "all" ||
          selectedDueDateFilter !== "all" ||
          selectedLabelFilter !== "all" ||
          showUnassignedOnly ||
          recentOnly,
      ),
    [normalizedSearchQuery, selectedAssigneeFilter, selectedPriorityFilter, selectedSprintFilter, selectedDueDateFilter, selectedLabelFilter, showUnassignedOnly, recentOnly],
  );

  const columnIdSet = useMemo(() => {
    if (!selectedBoard) return new Set<string>();
    return new Set(selectedBoard.columns.map((column) => column.id));
  }, [selectedBoard]);

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

      // Due date filter logic
      const matchesDueDate = (() => {
        if (selectedDueDateFilter === "all") return true;
        if (selectedDueDateFilter === "no-due-date") return !ticket.dueDate;
        if (!ticket.dueDate) return false;

        const dueDate = new Date(ticket.dueDate);
        const now = new Date();
        const diffMs = dueDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (selectedDueDateFilter) {
          case "overdue":
            return diffDays < 0;
          case "due-this-week":
            return diffDays >= 0 && diffDays <= 7;
          case "due-this-month":
            return diffDays >= 0 && diffDays <= 30;
          default:
            return true;
        }
      })();

      const matchesLabel =
        selectedLabelFilter === "all"
          ? true
          : selectedLabelFilter === "no-label"
            ? (ticket.labelIds?.length ?? 0) === 0
            : ticket.labelIds?.includes(selectedLabelFilter) ?? false;

      const matchesUnassigned = showUnassignedOnly ? ticket.assigneeIds.length === 0 : true;
      const matchesRecency = !recentOnly
        ? true
        : Date.now() - new Date(ticket.updatedAt).getTime() <= 1000 * 60 * 60 * 24 * 7;

      return (
        matchesSearch &&
        matchesAssignee &&
        matchesPriority &&
        matchesSprint &&
        matchesDueDate &&
        matchesLabel &&
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
      selectedDueDateFilter,
      selectedLabelFilter,
      showUnassignedOnly,
    ],
  );

  const filteredTicketMap = useMemo(() => {
    const map = new Map<string, KanbanTicket[]>();
    if (!selectedBoard) return map;
    selectedBoard.columns.forEach((column) => {
      const rawTickets = columnTicketMap.get(column.id) ?? [];
      map.set(column.id, rawTickets.filter(passesFilters));
    });
    return map;
  }, [columnTicketMap, passesFilters, selectedBoard]);

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

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedAssigneeFilter("all");
    setSelectedPriorityFilter("all");
    setSelectedSprintFilter("all");
    setSelectedDueDateFilter("all");
    setSelectedLabelFilter("all");
    setShowUnassignedOnly(false);
    setRecentOnly(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    selectedAssigneeFilter,
    setSelectedAssigneeFilter,
    selectedPriorityFilter,
    setSelectedPriorityFilter,
    selectedSprintFilter,
    setSelectedSprintFilter,
    selectedDueDateFilter,
    setSelectedDueDateFilter,
    selectedLabelFilter,
    setSelectedLabelFilter,
    showUnassignedOnly,
    setShowUnassignedOnly,
    recentOnly,
    setRecentOnly,
    filtersActive,
    columnIdSet,
    filteredTicketMap,
    sprintOptions,
    resetFilters,
  };
}
