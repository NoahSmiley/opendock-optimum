import { useState } from "react";
import clsx from "clsx";
import {
  Code2,
  Calendar,
  Hammer,
  Palette,
  Briefcase,
  GraduationCap,
  Microscope,
  FolderOpen,
} from "lucide-react";
import type { ProjectType } from "@opendock/shared/types";
import { PROJECT_TYPE_CONFIGS } from "@opendock/shared";

const ICON_MAP = {
  Code2,
  Calendar,
  Hammer,
  Palette,
  Briefcase,
  GraduationCap,
  Microscope,
  FolderOpen,
};

interface ProjectTypeSelectorProps {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
  className?: string;
}

export function ProjectTypeSelector({ value, onChange, className }: ProjectTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<ProjectType | null>(null);

  const projectTypes = Object.values(PROJECT_TYPE_CONFIGS);

  return (
    <div className={clsx("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          What type of project is this?
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Choose a project type to customize your board's features and terminology
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {projectTypes.map((config) => {
          const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP];
          const isSelected = value === config.id;
          const isHovered = hoveredType === config.id;

          return (
            <button
              key={config.id}
              type="button"
              onClick={() => onChange(config.id)}
              onMouseEnter={() => setHoveredType(config.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={clsx(
                "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
                "hover:shadow-md"
              )}
            >
              <div className="flex w-full items-start justify-between">
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    isSelected
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-neutral-600 dark:text-neutral-400"
                  )}
                />
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>

              <div className="space-y-1">
                <h4
                  className={clsx(
                    "text-sm font-medium",
                    isSelected
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-neutral-900 dark:text-white"
                  )}
                >
                  {config.label}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {config.description}
                </p>
              </div>

              <div className={clsx(
                "mt-2 flex flex-wrap gap-1 min-h-[20px]",
                !(isHovered || isSelected) && "opacity-0"
              )}>
                {config.terminology.itemTypes.slice(0, 3).map((itemType) => (
                  <span
                    key={itemType.id}
                    className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {itemType.label}
                  </span>
                ))}
                {config.terminology.itemTypes.length > 3 && (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    +{config.terminology.itemTypes.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {value && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Features for {PROJECT_TYPE_CONFIGS[value].label}:
          </h4>
          <div className="grid grid-cols-2 gap-y-1 text-xs">
            {Object.entries(PROJECT_TYPE_CONFIGS[value].features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center gap-1.5">
                <div
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    enabled
                      ? "bg-green-500 dark:bg-green-400"
                      : "bg-neutral-300 dark:bg-neutral-600"
                  )}
                />
                <span
                  className={clsx(
                    enabled
                      ? "text-blue-800 dark:text-blue-200"
                      : "text-neutral-400 dark:text-neutral-500 line-through"
                  )}
                >
                  {formatFeatureName(feature)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFeatureName(feature: string): string {
  const nameMap: Record<string, string> = {
    sprints: "Sprints/Phases",
    estimation: "Estimation",
    timeTracking: "Time Tracking",
    components: "Components",
    versions: "Versions",
    advancedSearch: "Advanced Search",
  };
  return nameMap[feature] || feature;
}