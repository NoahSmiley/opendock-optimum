import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import type { Note } from "@/stores/notes/types";

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "1", title: "Test Note", content: "", tags: [],
    isPinned: false, isArchived: false, userId: "u1",
    createdAt: "2026-03-17T00:00:00Z", updatedAt: "2026-03-17T00:00:00Z",
    ...overrides,
  };
}

describe("NotesSidebar", () => {
  it("renders notes list", () => {
    const notes = [makeNote({ id: "1", title: "Alpha" }), makeNote({ id: "2", title: "Beta" })];
    render(<NotesSidebar notes={notes} selectedNote={null} onSelectNote={vi.fn()} onCreateNote={vi.fn()} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("shows empty state when no notes", () => {
    render(<NotesSidebar notes={[]} selectedNote={null} onSelectNote={vi.fn()} onCreateNote={vi.fn()} />);
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("filters notes by search", () => {
    const notes = [makeNote({ id: "1", title: "Meeting notes" }), makeNote({ id: "2", title: "Shopping list" })];
    render(<NotesSidebar notes={notes} selectedNote={null} onSelectNote={vi.fn()} onCreateNote={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "meeting" } });
    expect(screen.getByText("Meeting notes")).toBeInTheDocument();
    expect(screen.queryByText("Shopping list")).not.toBeInTheDocument();
  });

  it("sorts pinned notes first", () => {
    const notes = [
      makeNote({ id: "1", title: "Unpinned", isPinned: false, updatedAt: "2026-03-17T10:00:00Z" }),
      makeNote({ id: "2", title: "Pinned", isPinned: true, updatedAt: "2026-03-17T05:00:00Z" }),
    ];
    render(<NotesSidebar notes={notes} selectedNote={null} onSelectNote={vi.fn()} onCreateNote={vi.fn()} />);
    const buttons = screen.getAllByRole("button").filter((b) => b.textContent?.includes("Pinned") || b.textContent?.includes("Unpinned"));
    expect(buttons[0]?.textContent).toContain("Pinned");
    expect(buttons[1]?.textContent).toContain("Unpinned");
  });

  it("calls onSelectNote when clicking a note", () => {
    const onSelect = vi.fn();
    const note = makeNote({ id: "1", title: "Click me" });
    render(<NotesSidebar notes={[note]} selectedNote={null} onSelectNote={onSelect} onCreateNote={vi.fn()} />);
    fireEvent.click(screen.getByText("Click me"));
    expect(onSelect).toHaveBeenCalledWith(note);
  });

  it("calls onCreateNote when clicking New", () => {
    const onCreate = vi.fn();
    render(<NotesSidebar notes={[]} selectedNote={null} onSelectNote={vi.fn()} onCreateNote={onCreate} />);
    fireEvent.click(screen.getByText("New"));
    expect(onCreate).toHaveBeenCalled();
  });

  it("highlights selected note", () => {
    const note = makeNote({ id: "1", title: "Selected" });
    render(<NotesSidebar notes={[note]} selectedNote={note} onSelectNote={vi.fn()} onCreateNote={vi.fn()} />);
    const btn = screen.getByText("Selected").closest("button");
    expect(btn?.className).toContain("bg-white");
  });
});
