import { useState, useEffect } from "react";
import { useNotes } from "@/stores/notes";
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
import { NewNoteModal } from "@/components/Modal";

export function App() {
  const [showModal, setShowModal] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const createWithTitle = useNotes((s) => s.createWithTitle);
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setSearch = useNotes((s) => s.setSearch);

  // Switch to editor when a note is selected on mobile
  useEffect(() => {
    if (activeId) setMobileView("editor");
  }, [activeId]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); setShowModal(true); }
      if (e.ctrlKey && e.key === "f") { e.preventDefault(); document.querySelector<HTMLInputElement>(".sidebar-search input")?.focus(); }
      if (e.key === "Escape" && search) { setSearch(""); }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [search, setSearch]);

  return (
    <div className="app" data-mobile-view={mobileView}>
      <Sidebar onNew={() => setShowModal(true)} />
      <Editor onBack={() => setMobileView("list")} />
      {showModal && <NewNoteModal onClose={() => setShowModal(false)} onCreate={createWithTitle} />}
    </div>
  );
}
