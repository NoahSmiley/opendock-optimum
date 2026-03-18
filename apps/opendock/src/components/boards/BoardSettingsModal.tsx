import { useState } from "react";
import { X } from "lucide-react";
import { ColumnSettings } from "./ColumnSettings";
import { LabelSettings } from "./LabelSettings";
import { BoardInfoTab } from "./BoardInfoTab";
import type { Board } from "@/stores/boards/types";

interface BoardSettingsModalProps {
  board: Board;
  onClose: () => void;
}

type Tab = "columns" | "labels" | "info";

export function BoardSettingsModal({ board, onClose }: BoardSettingsModalProps) {
  const [tab, setTab] = useState<Tab>("columns");

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="max-h-[80vh] overflow-hidden rounded-lg bg-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Board Settings</h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex border-b border-neutral-800">
            {(["columns", "labels", "info"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition ${
                  tab === t ? "border-b-2 border-blue-500 text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 120px)" }}>
            {tab === "columns" && <ColumnSettings board={board} />}
            {tab === "labels" && <LabelSettings board={board} />}
            {tab === "info" && <BoardInfoTab board={board} onClose={onClose} />}
          </div>
        </div>
      </div>
    </>
  );
}
