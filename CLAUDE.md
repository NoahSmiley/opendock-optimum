# OpenDock

Productivity suite desktop app built with Tauri 2 + React 19 + TypeScript + Vite.

## Product

OpenDock is a suite of productivity tools: Boards (kanban/project planning), Notes (rich text editor with collections), and a Dashboard that ties them together. It is NOT a DevOps/deployment tool. No builds, pipelines, deployments, or monitoring.

## Code Standards — ENFORCED

### File Size
- **Max 150 lines per file. No exceptions.** If a file approaches 150 lines, split it.
- Components: one per file. If a component needs helpers, extract them.
- Stores: split into store.ts, types.ts, actions.ts, selectors.ts per domain.
- This is the single most important rule. Large files become spaghetti. Prevent it.

### File Organization
- Group by feature domain, not by type: `components/boards/`, `components/notes/`, `components/dashboard/`
- Each domain directory gets: components, styles, hooks, types as needed
- Co-locate styles with components: `components/boards/styles/board-column.css`
- Co-locate types with features: `components/boards/types.ts`
- Shared types go in `src/types/`
- Shared utilities go in `src/lib/`

### Naming
- Components: PascalCase.tsx (`BoardColumn.tsx`)
- Hooks: `use` prefix, PascalCase (`useBoardActions.ts`)
- Utilities: camelCase.ts (`formatDate.ts`)
- Stores: `domain/store.ts`, `domain/types.ts`
- CSS: kebab-case.css (`board-column.css`)
- Types/interfaces: PascalCase, no `I` prefix (`BoardColumn`, not `IBoardColumn`)

### Components
- Functional components only. No classes.
- Explicit props interfaces, always typed, always named `ComponentNameProps`.
- One component per file. Extract sub-components to separate files.
- No inline styles except for dynamic values (transforms, positions).
- Prefer composition over configuration — small components composed together, not one mega-component with 20 props.

### State Management
- Zustand stores, organized by domain.
- Keep stores thin — business logic in action helpers, not inline in the store.
- Use `useShallow()` for selectors that return objects/arrays.
- No global mutable state outside stores.

### API Layer
- Pure functions, no classes: `export async function fetchBoards(): Promise<Board[]>`
- Organized by domain: `api/boards.ts`, `api/notes.ts`, `api/auth.ts`
- Single `request<T>()` helper for all HTTP calls.
- Re-export everything from `api/index.ts`.

### CSS
- CSS files co-located with components in `styles/` directories.
- Import all CSS in `main.tsx` (explicit, reviewable).
- Use CSS custom properties for theming.
- No Tailwind utility soup in JSX — if a component needs more than 3-4 utility classes, use a CSS file.

### Imports
- Use `@/` path alias for all imports from src/.
- Use `import type { }` for type-only imports.
- Index files (`index.ts`) for clean re-exports from feature directories.

### What NOT to Do
- No files over 150 lines.
- No "god components" that handle everything.
- No inline business logic in JSX — extract to hooks or helpers.
- No `any` types. Ever.
- No dead code. If it's not used, delete it.
- No commented-out code blocks.
- No placeholder/TODO stubs shipped as features.
- No duplicate code — if two components share logic, extract it.
- No vibe coding — every file should be intentional, small, and single-purpose.
- **No emojis in product UI.** Labels, buttons, pills, badges, empty-state text, icons — none of them use emoji characters. This includes both raw emoji in source (`"📝"`, `"📋"`) and emoji embedded in strings rendered to the user. Use SF Symbols / system icons / PNG/SVG assets / text labels instead. This rule applies to strings that render in Tauri or iOS. Test data, commit messages, code comments, and PR descriptions are out of scope.

## Tech Stack
- **Desktop**: Tauri 2 (Rust shell)
- **Frontend**: React 19 + TypeScript + Vite
- **State**: Zustand
- **Styling**: CSS (co-located), CSS custom properties for theming
- **Editor**: Lexical (for Notes)
- **DnD**: @hello-pangea/dnd (for Boards)
- **Backend**: Express 5 + Prisma (SQLite dev, Postgres prod)
- **Monorepo**: pnpm workspaces

## Architecture
```
apps/
  opendock/          # Main Tauri + React app (single unified frontend)
    src/
      components/    # Feature-grouped: boards/, notes/, dashboard/, shell/
      stores/        # Zustand stores by domain
      lib/           # API layer, utilities
      types/         # Shared type definitions
      styles/        # Global styles, theme
    src-tauri/       # Rust Tauri shell
  backend/           # Express API server
packages/
  shared/            # Shared types, validation schemas
```

The frontend is ONE app (not three separate apps). Boards and Notes are routes within the single React app, not separate Vite builds.
