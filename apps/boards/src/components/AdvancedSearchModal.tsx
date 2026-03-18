import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, Save } from "lucide-react";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";

type FilterOperator = "is" | "is not" | "contains" | "does not contain" | ">" | "<" | ">=" | "<=" | "in" | "not in";

interface SearchFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | string[];
  isActive: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilter[];
  createdAt: string;
  isDefault?: boolean;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: KanbanBoard;
  onApplyFilters: (filters: SearchFilter[]) => void;
}

const FIELD_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "issueType", label: "Issue Type" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
  { value: "labels", label: "Labels" },
  { value: "sprint", label: "Sprint" },
  { value: "dueDate", label: "Due Date" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
  { value: "storyPoints", label: "Story Points" },
  { value: "tags", label: "Tags" },
];

const OPERATOR_OPTIONS: Record<string, FilterOperator[]> = {
  title: ["contains", "does not contain", "is", "is not"],
  description: ["contains", "does not contain", "is", "is not"],
  issueType: ["is", "is not", "in", "not in"],
  priority: ["is", "is not"],
  assignee: ["is", "is not", "in", "not in"],
  labels: ["contains", "does not contain", "in", "not in"],
  sprint: ["is", "is not"],
  dueDate: [">", "<", ">=", "<=", "is", "is not"],
  createdAt: [">", "<", ">=", "<="],
  updatedAt: [">", "<", ">=", "<="],
  storyPoints: ["is", "is not", ">", "<", ">=", "<="],
  tags: ["contains", "does not contain", "in", "not in"],
};

export function AdvancedSearchModal({
  isOpen,
  onClose,
  board,
  onApplyFilters,
}: AdvancedSearchModalProps) {
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchDescription, setSearchDescription] = useState("");
  const [jqlQuery, setJqlQuery] = useState("");
  const [showJqlMode, setShowJqlMode] = useState(false);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`board-${board.id}-saved-searches`);
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, [board.id]);

  const addFilter = () => {
    const newFilter: SearchFilter = {
      id: Date.now().toString(),
      field: "title",
      operator: "contains",
      value: "",
      isActive: true,
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<SearchFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const applyFilters = () => {
    onApplyFilters(filters.filter(f => f.isActive));
    onClose();
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      description: searchDescription,
      filters: filters.filter(f => f.isActive),
      createdAt: new Date().toISOString(),
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem(`board-${board.id}-saved-searches`, JSON.stringify(updatedSearches));

    setShowSaveDialog(false);
    setSearchName("");
    setSearchDescription("");
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
  };

  const deleteSavedSearch = (id: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updatedSearches);
    localStorage.setItem(`board-${board.id}-saved-searches`, JSON.stringify(updatedSearches));
  };

  const parseJQL = () => {
    // Simple JQL parser (can be expanded)
    const parts = jqlQuery.split(" AND ");
    const parsedFilters: SearchFilter[] = [];

    parts.forEach(part => {
      const match = part.match(/(\w+)\s+([\w\s]+)\s+"([^"]+)"/);
      if (match) {
        const [, field, operator, value] = match;
        parsedFilters.push({
          id: Date.now().toString() + Math.random(),
          field: field.toLowerCase(),
          operator: operator.toLowerCase().replace(" ", "_") as FilterOperator,
          value,
          isActive: true,
        });
      }
    });

    setFilters(parsedFilters);
    setShowJqlMode(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="max-h-[85vh] overflow-hidden rounded-lg border-2 border-wood-300 bg-gradient-to-br from-paper-50 to-paper-100 shadow-warm-2xl dark:border-wood-700 dark:from-wood-900 dark:to-wood-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-wood-200 px-6 py-4 dark:border-wood-800">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-wood-600 dark:text-paper-400" />
              <h2 className="font-display text-xl font-semibold text-wood-900 dark:text-paper-100">
                Advanced Search
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJqlMode(!showJqlMode)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-wood-600 transition hover:bg-wood-100 dark:text-paper-400 dark:hover:bg-wood-800"
              >
                {showJqlMode ? "Visual Mode" : "JQL Mode"}
              </button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-wood-500 transition hover:bg-wood-100 hover:text-wood-900 dark:text-paper-400 dark:hover:bg-wood-800 dark:hover:text-paper-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {showJqlMode ? (
              // JQL Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-wood-600 dark:text-paper-400 mb-2">
                    JQL Query
                  </label>
                  <textarea
                    value={jqlQuery}
                    onChange={(e) => setJqlQuery(e.target.value)}
                    placeholder='e.g., issueType = "Bug" AND priority = "High" AND assignee = "Unassigned"'
                    className="w-full rounded-lg border border-wood-300 bg-paper-50 px-4 py-3 text-sm text-wood-900 placeholder-wood-400 outline-none transition focus:border-wood-600 focus:ring-2 focus:ring-wood-600/10 dark:border-wood-700 dark:bg-wood-800 dark:text-paper-100 dark:placeholder-wood-500 dark:focus:border-paper-400 dark:focus:ring-paper-400/10"
                    rows={4}
                  />
                  <p className="mt-2 text-xs text-wood-500 dark:text-paper-500">
                    Enter your search query using JQL syntax. Click "Parse JQL" to convert to visual filters.
                  </p>
                </div>
                <button
                  onClick={parseJQL}
                  className="rounded-lg bg-wood-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-wood-700 dark:bg-paper-100 dark:text-wood-900 dark:hover:bg-paper-200"
                >
                  Parse JQL
                </button>
              </div>
            ) : (
              // Visual Mode
              <div className="space-y-4">
                {/* Saved Searches */}
                {savedSearches.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-wood-600 dark:text-paper-400">
                      Saved Searches
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {savedSearches.map(search => (
                        <div
                          key={search.id}
                          className="flex items-center justify-between rounded-lg border border-wood-200 bg-paper-50 px-3 py-2 dark:border-wood-700 dark:bg-wood-800"
                        >
                          <button
                            onClick={() => loadSavedSearch(search)}
                            className="flex-1 text-left text-sm font-medium text-wood-700 hover:text-wood-900 dark:text-paper-300 dark:hover:text-paper-100"
                          >
                            {search.name}
                          </button>
                          <button
                            onClick={() => deleteSavedSearch(search.id)}
                            className="ml-2 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-wood-600 dark:text-paper-400">
                      Search Filters
                    </h3>
                    <button
                      onClick={addFilter}
                      className="flex items-center gap-1.5 rounded-md bg-wood-100 px-3 py-1.5 text-xs font-medium text-wood-700 transition hover:bg-wood-200 dark:bg-wood-800 dark:text-paper-300 dark:hover:bg-wood-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Filter
                    </button>
                  </div>

                  {filters.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-wood-200 px-8 py-12 text-center dark:border-wood-700">
                      <Search className="mx-auto mb-3 h-12 w-12 text-wood-300 dark:text-wood-600" />
                      <p className="text-sm text-wood-500 dark:text-paper-500">
                        No filters added yet. Click "Add Filter" to start building your search.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filters.map((filter, index) => (
                        <div
                          key={filter.id}
                          className="flex items-center gap-2 rounded-lg border border-wood-200 bg-paper-50 px-3 py-2 dark:border-wood-700 dark:bg-wood-800"
                        >
                          {index > 0 && (
                            <span className="text-xs font-semibold text-wood-500 dark:text-paper-500">
                              AND
                            </span>
                          )}
                          <select
                            value={filter.field}
                            onChange={(e) => updateFilter(filter.id, {
                              field: e.target.value,
                              operator: OPERATOR_OPTIONS[e.target.value]?.[0] || "is"
                            })}
                            className="rounded-md border border-wood-200 bg-white px-2 py-1 text-xs font-medium text-wood-700 dark:border-wood-600 dark:bg-wood-700 dark:text-paper-200"
                          >
                            {FIELD_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                            className="rounded-md border border-wood-200 bg-white px-2 py-1 text-xs font-medium text-wood-700 dark:border-wood-600 dark:bg-wood-700 dark:text-paper-200"
                          >
                            {OPERATOR_OPTIONS[filter.field]?.map(op => (
                              <option key={op} value={op}>
                                {op}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            value={filter.value as string}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            placeholder="Value..."
                            className="flex-1 rounded-md border border-wood-200 bg-white px-2 py-1 text-xs text-wood-700 placeholder-wood-400 dark:border-wood-600 dark:bg-wood-700 dark:text-paper-200 dark:placeholder-wood-500"
                          />

                          <button
                            onClick={() => removeFilter(filter.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-wood-200 px-6 py-4 dark:border-wood-800">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={filters.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-wood-200 bg-white px-4 py-2 text-sm font-medium text-wood-700 transition hover:bg-wood-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-wood-700 dark:bg-wood-900 dark:text-paper-300 dark:hover:bg-wood-800"
            >
              <Save className="h-4 w-4" />
              Save Search
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-wood-200 bg-white px-5 py-2 text-sm font-medium text-wood-700 transition hover:bg-wood-50 dark:border-wood-700 dark:bg-wood-900 dark:text-paper-300 dark:hover:bg-wood-800"
              >
                Cancel
              </button>
              <button
                onClick={applyFilters}
                className="rounded-lg bg-wood-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-wood-700 dark:bg-paper-100 dark:text-wood-900 dark:hover:bg-paper-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-lg border-2 border-wood-300 bg-paper-50 p-6 shadow-warm-xl dark:border-wood-700 dark:bg-wood-900">
              <h3 className="mb-4 text-lg font-semibold text-wood-900 dark:text-paper-100">
                Save Search
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wood-600 dark:text-paper-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full rounded-lg border border-wood-300 bg-white px-3 py-2 text-sm text-wood-900 dark:border-wood-700 dark:bg-wood-800 dark:text-paper-100"
                    placeholder="My custom search..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-600 dark:text-paper-400 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                    className="w-full rounded-lg border border-wood-300 bg-white px-3 py-2 text-sm text-wood-900 dark:border-wood-700 dark:bg-wood-800 dark:text-paper-100"
                    rows={2}
                    placeholder="What does this search do..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="rounded-lg border border-wood-200 bg-white px-4 py-2 text-sm font-medium text-wood-700 hover:bg-wood-50 dark:border-wood-700 dark:bg-wood-800 dark:text-paper-300 dark:hover:bg-wood-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSearch}
                  disabled={!searchName.trim()}
                  className="rounded-lg bg-wood-600 px-4 py-2 text-sm font-semibold text-white hover:bg-wood-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-paper-100 dark:text-wood-900 dark:hover:bg-paper-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Helper function to apply advanced search filters to tickets
export function applyAdvancedFilters(
  tickets: KanbanTicket[],
  filters: SearchFilter[],
  _board: KanbanBoard
): KanbanTicket[] {
  if (filters.length === 0) return tickets;

  return tickets.filter(ticket => {
    return filters.every(filter => {
      const fieldValue = (ticket as any)[filter.field];
      const filterValue = filter.value;

      switch (filter.operator) {
        case "is":
          return fieldValue === filterValue;
        case "is not":
          return fieldValue !== filterValue;
        case "contains":
          return fieldValue?.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
        case "does not contain":
          return !fieldValue?.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
        case ">":
          return fieldValue > filterValue;
        case "<":
          return fieldValue < filterValue;
        case ">=":
          return fieldValue >= filterValue;
        case "<=":
          return fieldValue <= filterValue;
        case "in":
          return Array.isArray(filterValue) ? filterValue.includes(fieldValue) : false;
        case "not in":
          return Array.isArray(filterValue) ? !filterValue.includes(fieldValue) : true;
        default:
          return true;
      }
    });
  });
}