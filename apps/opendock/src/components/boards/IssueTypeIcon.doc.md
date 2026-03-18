# IssueTypeIcon

Renders a color-coded icon for an issue type (bug, task, story, epic).

## Props
- `type` — Issue type; defaults to `"task"`
- `size` — Icon size: `"sm"` | `"md"` | `"lg"`; defaults to `"md"`
- `className` — Additional CSS classes

## Used by
- `BacklogTab.tsx`, ticket card components

## Dependencies
- `clsx`, `lucide-react` (Bug, CheckCircle, BookOpen, Target)
- `@/stores/boards/types` (IssueType)
