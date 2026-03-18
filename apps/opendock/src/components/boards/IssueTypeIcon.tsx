import { Bug, CheckCircle, BookOpen, Target } from "lucide-react";
import clsx from "clsx";
import type { IssueType } from "@/stores/boards/types";

const config: Record<IssueType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}> = {
  bug: { icon: Bug, color: "text-red-400", bg: "bg-red-950/30" },
  task: { icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-950/30" },
  story: { icon: BookOpen, color: "text-green-400", bg: "bg-green-950/30" },
  epic: { icon: Target, color: "text-purple-400", bg: "bg-purple-950/30" },
};

const sizeMap = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };

interface IssueTypeIconProps {
  type?: IssueType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IssueTypeIcon({ type = "task", size = "md", className }: IssueTypeIconProps) {
  const { icon: Icon, color, bg } = config[type];
  return (
    <div className={clsx("inline-flex items-center justify-center rounded", bg, color, className)}>
      <Icon className={sizeMap[size]} />
    </div>
  );
}
