# store.ts

UI state Zustand store — sidebar collapse state and theme preferences.

## State
- `sidebarCollapsed` — whether the sidebar is in compact mode

## Actions
- `toggleSidebar()` — toggle sidebar collapsed state
- `setSidebarCollapsed(collapsed)` — set sidebar state directly

## Used by
- `Sidebar.tsx`, `AppLayout.tsx`
