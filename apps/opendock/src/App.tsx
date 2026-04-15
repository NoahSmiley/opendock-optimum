import { useState, useCallback } from "react";
import { Shell } from "@/components/Shell";
import { NotesList } from "@/components/NotesList";
import { Editor } from "@/components/Editor";
import { BoardsList } from "@/components/BoardsList";
import { BoardView } from "@/components/BoardView";
import { NewNoteModal } from "@/components/Modal";
import { useNotes } from "@/stores/notes";
import { useBoards } from "@/stores/boards";

export type Tool = "notes" | "boards" | "calendar";

export function App() {
  const [tool, setTool] = useState<Tool>("notes");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [showModal, setShowModal] = useState(false);
  const setActiveNote = useNotes((s) => s.setActive);
  const createNote = useNotes((s) => s.createWithTitle);
  const setActiveBoard = useBoards((s) => s.setActiveBoard);

  const back = useCallback(() => setMobileView("list"), []);
  const selectNote = useCallback((id: string) => { setActiveNote(id); setMobileView("detail"); }, [setActiveNote]);
  const selectBoard = useCallback((id: string) => { setActiveBoard(id); setMobileView("detail"); }, [setActiveBoard]);

  return (
    <Shell tool={tool} setTool={setTool} mobileView={mobileView}>
      {tool === "notes" && (
        <>
          <NotesList onSelect={selectNote} onNew={() => setShowModal(true)} />
          <Editor onBack={back} />
          {showModal && <NewNoteModal onClose={() => setShowModal(false)} onCreate={(t) => { createNote(t); setMobileView("detail"); }} />}
        </>
      )}
      {tool === "boards" && (
        <>
          <BoardsList onSelect={selectBoard} />
          <BoardView onBack={back} />
        </>
      )}
      {tool === "calendar" && <div className="empty">Calendar — coming soon</div>}
    </Shell>
  );
}
