import { Bug, CheckCircle, BookOpen, Target } from "lucide-react";
import clsx from "clsx";
import type { IssueType } from "@opendock/shared/types";

interface IssueTypeSelectorProps {
  value?: IssueType;
  onChange: (type: IssueType) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const issueTypeConfig: Record<IssueType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  bug: {
    icon: Bug,
    label: "Bug",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  task: {
    icon: CheckCircle,
    label: "Task",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  story: {
    icon: BookOpen,
    label: "Story",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  epic: {
    icon: Target,
    label: "Epic",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
};

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function IssueTypeSelector({
  value = "task",
  onChange,
  size = "md",
  showLabel = true,
}: IssueTypeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-wood-600 dark:text-paper-400">
        Issue Type
      </label>
      <div className="flex gap-1">
        {(Object.keys(issueTypeConfig) as IssueType[]).map((type) => {
          const config = issueTypeConfig[type];
          const Icon = config.icon;
          const isSelected = value === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={clsx(
                "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-all",
                isSelected
                  ? clsx(config.bgColor, config.borderColor, config.color, "shadow-warm-sm")
                  : "border-wood-200 text-wood-500 hover:bg-paper-100 dark:border-wood-700 dark:text-paper-500 dark:hover:bg-wood-800"
              )}
              title={config.label}
            >
              <Icon className={sizeClasses[size]} />
              {showLabel && (
                <span className="text-xs font-medium">{config.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function IssueTypeIcon({
  type,
  size = "md",
  className,
}: {
  type?: IssueType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!type) return null;

  const config = issueTypeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded",
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className={sizeClasses[size]} />
    </div>
  );
}