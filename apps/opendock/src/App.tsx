import { useEffect, useState, useCallback } from "react";
import { Shell } from "@/components/Shell";
import { NotesList } from "@/components/NotesList";
import { Editor } from "@/components/Editor";
import { BoardsList } from "@/components/BoardsList";
import { BoardView } from "@/components/BoardView";
import { NewNoteModal } from "@/components/Modal";
import { LoginScreen } from "@/components/LoginScreen";
import { useAuth } from "@/stores/auth";
import { useNotes } from "@/stores/notes";
import { useBoards } from "@/stores/boards";
import { useAppShortcuts } from "@/hooks/useAppShortcuts";
import type { Tool, MobileView } from "@/types";

export function App() {
  const [tool, setTool] = useState<Tool>("notes");
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [showModal, setShowModal] = useState(false);
  const authLoading = useAuth((s) => s.loading);
  const token = useAuth((s) => s.data.token);
  const refresh = useAuth((s) => s.refresh);
  const activeNoteId = useNotes((s) => s.activeId);
  const setActiveNote = useNotes((s) => s.setActive);
  const createNote = useNotes((s) => s.createWithTitle);
  const loadNotes = useNotes((s) => s.load);
  const loadBoards = useBoards((s) => s.loadBoards);
  const setActiveBoard = useBoards((s) => s.setActiveBoard);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (token) { loadNotes(); loadBoards(); } }, [token, loadNotes, loadBoards]);

  const back = useCallback(() => setMobileView("list"), []);
  const selectNote = useCallback((id: string) => { setActiveNote(id); setMobileView("detail"); }, [setActiveNote]);
  const selectBoard = useCallback((id: string) => { setActiveBoard(id); setMobileView("detail"); }, [setActiveBoard]);

  useAppShortcuts({
    setTool,
    onNewNote: useCallback(() => { setTool("notes"); setShowModal(true); }, []),
    onFocusSearch: useCallback(() => { setTool("notes"); window.dispatchEvent(new Event("opendock:focus-search")); }, []),
  });

  if (authLoading) return <div className="login-screen" />;
  if (!token) return <LoginScreen />;

  return (
    <Shell tool={tool} setTool={setTool} mobileView={mobileView}>
      {tool === "notes" && (
        <>
          <NotesList onSelect={selectNote} onNew={() => setShowModal(true)} />
          <Editor key={activeNoteId ?? "empty"} onBack={back} />
          {showModal && <NewNoteModal onClose={() => setShowModal(false)} onCreate={(t) => { createNote(t); setMobileView("detail"); }} />}
        </>
      )}
      {tool === "boards" && (<><BoardsList onSelect={selectBoard} /><BoardView onBack={back} /></>)}
      {tool === "calendar" && <div className="empty">Calendar — coming soon</div>}
    </Shell>
  );
}
