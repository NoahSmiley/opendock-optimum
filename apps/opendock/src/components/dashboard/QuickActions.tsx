import { useNavigate } from "react-router-dom";
import { Plus, NotebookPen, Calendar, Upload } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "New Board", icon: Plus, onClick: () => navigate("/boards") },
    { label: "New Note", icon: NotebookPen, onClick: () => navigate("/notes") },
    { label: "New Event", icon: Calendar, onClick: () => navigate("/calendar") },
    { label: "Upload File", icon: Upload, onClick: () => navigate("/files") },
  ];

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick}
            className="flex items-center gap-2 rounded-lg border border-neutral-800/50 bg-neutral-900/30 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800/50 hover:text-white">
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
