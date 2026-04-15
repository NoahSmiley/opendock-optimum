import { useState, useEffect } from "react";
import { useNotes } from "@/stores/notes";
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
import { NewNoteModal } from "@/components/Modal";

export function App() {
  const [showModal, setShowModal] = useState(false);
  const createWithTitle = useNotes((s) => s.createWithTitle);
  const search = useNotes((s) => s.search);
  const setSearch = useNotes((s) => s.setSearch);

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
    <div className="app">
      <Sidebar onNew={() => setShowModal(true)} />
      <Editor />
      {showModal && <NewNoteModal onClose={() => setShowModal(false)} onCreate={createWithTitle} />}
    </div>
  );
}
