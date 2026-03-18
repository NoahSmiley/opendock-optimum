import type { Label } from "@/stores/boards/types";

interface LabelPickerProps {
  labels: Label[];
  selected: string[];
  onChange: (labelIds: string[]) => void;
}

export function LabelPicker({ labels, selected, onChange }: LabelPickerProps) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((l) => l !== id)
        : [...selected, id],
    );
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {labels.map((label) => (
        <button
          key={label.id}
          type="button"
          className="label-chip"
          style={{
            background: selected.includes(label.id)
              ? label.color
              : `${label.color}33`,
            color: selected.includes(label.id) ? "#fff" : label.color,
            border: `1px solid ${label.color}`,
          }}
          onClick={() => toggle(label.id)}
        >
          {label.name}
        </button>
      ))}
    </div>
  );
}
