import { Check } from "lucide-react";
import type { Label } from "@/stores/boards/types";

interface LabelMenuProps {
  labels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onClose: () => void;
}

export function LabelMenu({ labels, selectedIds, onToggle, onClose }: LabelMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-700 bg-neutral-800 shadow-lg">
        {labels.map((l) => {
          const selected = selectedIds.includes(l.id);
          return (
            <button key={l.id} onClick={() => onToggle(l.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-700">
              <div className="flex h-4 w-4 items-center justify-center rounded border border-neutral-600">
                {selected && <Check className="h-3 w-3 text-blue-500" />}
              </div>
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: l.color }} />
              <span className="text-white">{l.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
