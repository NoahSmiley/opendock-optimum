import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteEditor } from "@/components/notes/NoteEditor";
import type { Note } from "@/stores/notes/types";

vi.mock("@/components/notes/RichTextEditor", () => ({
  RichTextEditor: ({ onChange }: { onChange?: (c: string) => void }) => (
    <textarea data-testid="mock-editor" onChange={(e) => onChange?.(e.target.value)} />
  ),
}));

vi.mock("@/stores/notes/actions", () => ({
  updateNote: vi.fn().mockResolvedValue({}),
}));

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "n1", title: "Test Title", content: '{"root":{}}', tags: ["tag1", "tag2"],
    isPinned: false, isArchived: false, userId: "u1",
    createdAt: "2026-03-17T00:00:00Z", updatedAt: "2026-03-17T12:00:00Z",
    ...overrides,
  };
}

describe("NoteEditor", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders title input with note title", () => {
    render(<NoteEditor note={makeNote()} onDelete={vi.fn()} />);
    expect(screen.getByDisplayValue("Test Title")).toBeInTheDocument();
  });

  it("renders tags inline", () => {
    render(<NoteEditor note={makeNote()} onDelete={vi.fn()} />);
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<NoteEditor note={makeNote()} onDelete={onDelete} />);
    const deleteBtn = screen.getAllByRole("button").find((b) => b.querySelector(".lucide-trash-2"));
    fireEvent.click(deleteBtn!);
    expect(onDelete).toHaveBeenCalledWith("n1");
  });

  it("updates title on input change", () => {
    render(<NoteEditor note={makeNote()} onDelete={vi.fn()} />);
    const input = screen.getByDisplayValue("Test Title");
    fireEvent.change(input, { target: { value: "New Title" } });
    expect(screen.getByDisplayValue("New Title")).toBeInTheDocument();
  });

  it("shows save status during save", async () => {
    vi.useFakeTimers();
    render(<NoteEditor note={makeNote()} onDelete={vi.fn()} />);
    const input = screen.getByDisplayValue("Test Title");
    fireEvent.change(input, { target: { value: "Changed" } });
    expect(screen.getByText("Saving")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders date in meta bar", () => {
    render(<NoteEditor note={makeNote()} onDelete={vi.fn()} />);
    expect(screen.getByText(/Mar 17, 2026/)).toBeInTheDocument();
  });

  it("shows pin button with correct state", () => {
    render(<NoteEditor note={makeNote({ isPinned: true })} onDelete={vi.fn()} />);
    const pinBtn = screen.getAllByRole("button").find((b) => b.querySelector(".lucide-pin"));
    expect(pinBtn?.className).toContain("amber");
  });
});
