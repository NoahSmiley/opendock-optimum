import { useState, useRef, useEffect } from "react";
import { Tag, X, ChevronDown, Plus } from "lucide-react";
import clsx from "clsx";
import type { KanbanLabel } from "@opendock/shared/types";

interface LabelSelectorProps {
  labels: KanbanLabel[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
}

export function LabelSelector({ labels, selectedLabelIds, onToggleLabel }: LabelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabels = labels.filter((label) => selectedLabelIds.includes(label.id));
  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleLabel = (labelId: string) => {
    onToggleLabel(labelId);
  };

  const handleRemoveLabel = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLabel(labelId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
        <Tag className="mr-1 inline h-3 w-3" />
        Labels
      </label>

      {/* Selected labels display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "min-h-[44px] cursor-pointer rounded-lg border bg-white px-3 py-2 transition shadow-sm",
          isOpen
            ? "border-neutral-400 ring-2 ring-neutral-200/60 dark:border-neutral-500 dark:ring-neutral-700/60"
            : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600",
          "dark:bg-neutral-900"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: label.color }}
                onClick={(e) => e.stopPropagation()}
              >
                <span>{label.name}</span>
                <button
                  onClick={(e) => handleRemoveLabel(label.id, e)}
                  className="hover:bg-black/20 rounded-sm p-0.5 transition"
                  aria-label={`Remove ${label.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100/70 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
              <Plus className="h-3 w-3" />
              Add label
            </span>
          )}
          <ChevronDown
            className={clsx(
              "ml-auto h-4 w-4 text-neutral-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {/* Search input */}
          <div className="border-b border-neutral-200 p-2 dark:border-neutral-700">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels..."
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-700/60"
            />
          </div>

          {/* Label options */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredLabels.length > 0 ? (
              filteredLabels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className={clsx(
                      "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition",
                      isSelected
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    )}
                  >
                    <div
                      className="h-4 w-4 flex-shrink-0 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 text-neutral-700 dark:text-neutral-200">{label.name}</span>
                    {isSelected && (
                      <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-neutral-900 dark:bg-white">
                        <svg
                          className="h-3 w-3 text-white dark:text-neutral-900"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center">
                {searchQuery ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No labels found for "{searchQuery}"
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">No labels available</p>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                      Create labels in board settings
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
