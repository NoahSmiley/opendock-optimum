import { useState, useCallback } from "react";
import { Shell } from "@/components/Shell";
import { NotesList } from "@/components/NotesList";
import { Editor } from "@/components/Editor";
import { NewNoteModal } from "@/components/Modal";
import { useNotes } from "@/stores/notes";

export type Tool = "notes" | "boards" | "calendar";

export function App() {
  const [tool, setTool] = useState<Tool>("notes");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [showModal, setShowModal] = useState(false);
  const setActive = useNotes((s) => s.setActive);
  const createWithTitle = useNotes((s) => s.createWithTitle);

  const selectNote = useCallback((id: string) => {
    setActive(id);
    setMobileView("detail");
  }, [setActive]);

  const back = useCallback(() => setMobileView("list"), []);

  return (
    <Shell tool={tool} setTool={setTool} mobileView={mobileView}>
      {tool === "notes" && (
        <>
          <NotesList onSelect={selectNote} onNew={() => setShowModal(true)} />
          <Editor onBack={back} />
          {showModal && <NewNoteModal onClose={() => setShowModal(false)} onCreate={(t) => { createWithTitle(t); setMobileView("detail"); }} />}
        </>
      )}
      {tool === "boards" && <div className="empty">Boards — coming soon</div>}
      {tool === "calendar" && <div className="empty">Calendar — coming soon</div>}
    </Shell>
  );
}
