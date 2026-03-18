import { Check } from "lucide-react";
import type { BoardMember } from "@/stores/boards/types";

interface AssignMenuProps {
  members: BoardMember[];
  assigneeIds: string[];
  onToggle: (memberId: string) => void;
  onClose: () => void;
}

export function AssignMenu({ members, assigneeIds, onToggle, onClose }: AssignMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-700 bg-neutral-800 shadow-lg">
        {members.map((m) => {
          const assigned = assigneeIds.includes(m.id);
          return (
            <button key={m.id} onClick={() => onToggle(m.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-700">
              <div className="flex h-4 w-4 items-center justify-center rounded border border-neutral-600">
                {assigned && <Check className="h-3 w-3 text-blue-500" />}
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: m.avatarColor || "#666" }}>
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-white">{m.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
