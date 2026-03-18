# OpenDock — Feature Specification

## What is OpenDock?

OpenDock is a desktop productivity suite built with Tauri. It combines a kanban board system, a rich notes editor, a calendar, and a unified dashboard into a single, clean application. It targets individuals and small teams who want focused, offline-first project planning tools without the bloat of Jira or Notion.

OpenDock is part of the **Athion suite** alongside Flux (chat) and Liminal (IDE). All three apps share auth via athion.me. Each app is fully standalone — you'd never know the others exist unless you use them, in which case the experience is seamless.

---

## Core Modules

### 1. Dashboard

The home screen after login. Provides a quick overview of your workspace.

**Features:**
- Summary stats: active boards, open tickets, notes count
- Recent activity feed (last 10 actions across boards and notes)
- Quick-create shortcuts (new board, new note)
- Quick-access cards to jump into Boards, Notes, or Calendar
- Upcoming deadlines from Calendar and board due dates

### 2. Boards (Kanban)

A project planning tool with drag-and-drop kanban boards.

**Features:**
- **Board management**: Create, rename, delete boards
- **Columns**: Create, rename, reorder, delete columns. WIP limits per column.
- **Tickets**: Create, edit, delete tickets with:
  - Title and description (markdown)
  - Priority (low, medium, high, urgent)
  - Issue type (task, bug, story, epic)
  - Assignee (single user)
  - Labels with custom colors
  - Due dates with overdue/due-soon indicators
  - Story point estimates
  - Comments with timestamps
  - Activity log (who changed what, when)
- **Drag and drop**: Reorder tickets within columns, move between columns
- **Sprints**: Create sprints with start/end dates and goals. Assign tickets to sprints.
- **Epics**: Group related tickets under epics with color coding
- **Backlog view**: Flat list of all tickets not in active sprint
- **Filters**: Filter by assignee, priority, label, sprint, due date, search text
- **Bulk actions**: Select multiple tickets, bulk move, bulk assign, bulk delete
- **Keyboard shortcuts**: Quick actions for power users

### 3. Notes

A rich text editor with notebooks, collections, and cross-linking.

**Features:**
- **Collections (Notebooks)**: Group notes into themed collections with custom colors and patterns
- **Rich text editor** (Lexical-based):
  - Headings, bold, italic, underline, strikethrough
  - Bullet lists, numbered lists, checklists
  - Code blocks with syntax highlighting
  - Block quotes
  - Horizontal rules
  - Tables
  - Wiki-style links between notes (`[[Note Title]]`)
- **Note management**: Create, edit, delete, archive, duplicate notes
- **Tags**: Tag notes for cross-cutting organization. Tag cloud view.
- **Search**: Full-text search across all notes with filters
- **Notebook viewer**: Page-by-page reading view with navigation
- **Export**: Export notes to Markdown and PDF
- **Auto-save**: Debounced auto-save with visual indicator
- **Graph view**: Visual map of note connections via wiki links
- **Templates**: Create notes from preset templates
- **Command palette**: Quick navigation (Cmd+K) to jump to any note

### 4. Calendar

A personal and project calendar that works standalone or as the unified timeline for all of OpenDock.

**Standalone features (works without Boards or Notes):**
- **Month, week, day views** with smooth navigation
- **Events**: Create, edit, delete events with title, time, duration, color, description
- **Recurring events**: Daily, weekly, monthly, yearly with end date or count
- **All-day events**: Span one or multiple days
- **Drag to create**: Click and drag on the calendar to create events
- **Drag to reschedule**: Drag existing events to new times/dates
- **Event colors**: Color-code events by category
- **Mini calendar**: Small month picker in sidebar for quick navigation

**Board integration (when Boards module is active):**
- **Ticket due dates** appear on calendar as read-only markers
- **Sprint timelines** shown as horizontal bars across date ranges
- Clicking a ticket marker opens the ticket detail
- Due dates can be set from the calendar by dragging a ticket to a date

**Notes integration (when Notes module is active):**
- Daily notes: click a date to create/open a note for that day
- Notes with dates in their metadata appear as markers

**Cross-app integration (when connected to Athion suite):**
- Flux: Scheduled meetings/calls from Flux voice channels can appear as events
- Liminal: Project milestones from Liminal can appear as markers

### 5. Files

A simple file manager for uploading, organizing, and previewing documents.

**Features:**
- **Upload**: Drag-and-drop file upload with progress indicator
- **Folders**: Create, rename, delete folders. Nest folders for hierarchy.
- **File list**: Sort by name, date, size, type. Grid and list view toggles.
- **Preview**: Inline preview for images, PDFs, markdown, plain text. Download for everything else.
- **Search**: Search files by name and tag
- **Tags**: Tag files for cross-cutting organization
- **Storage info**: Show used/available storage
- **Linked files**: Files attached to board tickets or notes are visible here too (single source of truth)

**Board integration:**
- Attach files to tickets directly from the Files module
- Ticket attachments browsable in Files under an auto-generated "Board Attachments" folder

**Notes integration:**
- Embed file references in notes (images render inline, other files as download links)

### 6. Shell (App Chrome)

The Tauri desktop wrapper and navigation shell.

**Features:**
- **Custom titlebar**: Platform-native window controls (macOS traffic lights, Windows buttons)
- **Window dragging**: Drag region on titlebar
- **Zoom controls**: Ctrl+scroll, Ctrl+/-/0 with persistence
- **Sidebar navigation**: Switch between Dashboard, Boards, Notes, Calendar, Files
- **Authentication**: Email/password login and registration
- **Theme**: Dark theme with CSS custom properties (light theme later)
- **Responsive layout**: Collapsible sidebar

---

## Public Pages (Web Only)

These pages are for the marketing site / web version, not the desktop app:

- **Landing**: Product overview and sign-up CTA
- **Features**: Feature descriptions
- **Pricing**: Subscription tiers
- **About**: Team and mission
- **Roadmap**: Public development roadmap

---

## Backend API

Express server providing REST endpoints for all modules.

**Auth:**
- POST /api/auth/register — Create account
- POST /api/auth/login — Authenticate
- POST /api/auth/logout — End session
- GET /api/auth/session — Current user

**Boards:**
- GET /api/kanban/boards — List boards
- POST /api/kanban/boards — Create board
- GET /api/kanban/boards/:id — Board snapshot (columns, tickets, members)
- PATCH /api/kanban/boards/:id — Update board
- POST /api/kanban/boards/:id/columns — Create column
- PATCH /api/kanban/boards/:id/columns/:colId — Update column
- DELETE /api/kanban/boards/:id/columns/:colId — Delete column
- POST /api/kanban/boards/:id/tickets — Create ticket
- PATCH /api/kanban/boards/:id/tickets/:ticketId — Update ticket
- DELETE /api/kanban/boards/:id/tickets/:ticketId — Delete ticket
- POST /api/kanban/boards/:id/tickets/:ticketId/reorder — Reorder ticket
- POST /api/kanban/boards/:id/tickets/:ticketId/comments — Add comment
- DELETE /api/kanban/boards/:id/tickets/:ticketId/comments/:commentId — Delete comment
- GET /api/kanban/boards/:id/activities — Activity feed
- POST /api/kanban/boards/:id/sprints — Create sprint
- PATCH /api/kanban/boards/:id/sprints/:sprintId — Update sprint
- CRUD /api/kanban/boards/:id/labels — Label management
- POST /api/kanban/boards/:id/tickets/:ticketId/attachments — Upload attachment
- GET /api/kanban/boards/:id/stream — SSE real-time updates

**Notes:**
- GET /api/notes — List notes
- POST /api/notes — Create note
- GET /api/notes/:id — Get note
- PATCH /api/notes/:id — Update note
- DELETE /api/notes/:id — Delete note
- GET /api/notes/collections — List collections
- POST /api/notes/collections — Create collection
- PATCH /api/notes/collections/:id — Update collection
- DELETE /api/notes/collections/:id — Delete collection
- POST /api/notes/collections/:id/notes — Add note to collection
- DELETE /api/notes/collections/:id/notes/:noteId — Remove note from collection
- GET /api/notes/tags — List all tags
- GET /api/notes/folders — List folders
- POST /api/notes/folders — Create folder

**Calendar:**
- GET /api/calendar/events — List events (query by date range)
- POST /api/calendar/events — Create event
- GET /api/calendar/events/:id — Get event
- PATCH /api/calendar/events/:id — Update event
- DELETE /api/calendar/events/:id — Delete event
- GET /api/calendar/events/upcoming — Next N upcoming events (for dashboard)

**Files:**
- GET /api/files — List files (query by folderId, tags)
- POST /api/files/upload — Upload file (multipart)
- GET /api/files/:id — Get file metadata
- GET /api/files/:id/download — Download file
- PATCH /api/files/:id — Update metadata (name, tags, folderId)
- DELETE /api/files/:id — Delete file
- GET /api/files/folders — List folders
- POST /api/files/folders — Create folder
- PATCH /api/files/folders/:id — Rename/move folder
- DELETE /api/files/folders/:id — Delete folder
- GET /api/files/storage — Storage usage stats

---

## Cross-App Integration (Athion Suite)

OpenDock, Flux Chat, and Liminal IDE are all part of the Athion ecosystem. Each app works perfectly alone — you'd never know the others exist. But if you use multiple, the experience is seamless.

### Design Principles
- **Invisible until active**: No "Connect Flux" prompts. Integration surfaces only when the user has configured the other apps.
- **Graceful degradation**: Every feature works standalone. Cross-app data is additive, never required.
- **Shared identity**: All apps authenticate via athion.me. One account, one session, same user ID.

### OpenDock ↔ Flux Chat

| From | To | What |
|------|----|------|
| Board ticket | Flux channel | Link a ticket to the channel where it was discussed. Shows channel name + last message. Click opens Flux. |
| Board ticket | Flux message | Reference a specific message as ticket context. Shows excerpt + author. |
| Calendar event | Flux voice channel | "Join call" button opens Flux voice. Voice participants show on the event. |
| Note | Flux message | Embed a message quote in a note (author, content, timestamp). |
| Dashboard | Flux presence | Green dots on team avatars showing who's online in Flux. |
| OpenDock activity | Flux status | Flux shows "Planning: [board name]" or "Writing: [note title]" in presence. |
| Flux chat | OpenDock ticket | Paste `opendock://ticket/123` in Flux — renders rich preview card (title, status, priority). |

### OpenDock ↔ Liminal IDE

| From | To | What |
|------|----|------|
| Board ticket | Liminal branch/PR | Ticket shows linked PR status (open/merged/closed). Auto-updates. |
| Board ticket | Liminal project | Create tickets from Liminal ("file a bug from IDE"). |
| Note | Liminal file | Reference a source file with syntax-highlighted preview. |
| Calendar | Liminal milestones | Project milestones appear as calendar markers. |

### Data Model

Every linkable entity gets an `integrations` JSON field:

```
Integration {
  app: "flux" | "liminal"
  type: "channel" | "message" | "voice" | "branch" | "pr" | "project"
  id: string
  serverId?: string
  label: string
  url?: string
  metadata?: object   // Cached display data (channel name, message excerpt, PR status)
}
```

### Deep Links

- `opendock://ticket/abc123` — Opens ticket detail
- `opendock://note/abc123` — Opens note
- `opendock://calendar/2026-03-17` — Opens calendar to date
- `flux://channel/abc123?server=xyz` — Opens Flux channel
- `flux://voice/abc123?server=xyz` — Joins Flux voice
- `liminal://project/abc123` — Opens Liminal project

---

## Data Model

**User**: id, email, passwordHash, displayName, role, createdAt

**Board**: id, name, description, createdAt, memberIds

**Column**: id, boardId, name, position, wipLimit

**Ticket**: id, boardId, columnId, title, description, priority, issueType, assigneeId, position, storyPoints, dueDate, sprintId, epicId, createdAt, updatedAt

**Sprint**: id, boardId, name, goal, startDate, endDate, status

**Epic**: id, boardId, name, color, status

**Label**: id, boardId, name, color

**Comment**: id, ticketId, authorId, content, createdAt

**Activity**: id, boardId, ticketId, userId, type, detail, createdAt

**Note**: id, title, content, tags[], folderId, archived, pinned, createdAt, updatedAt

**Collection**: id, name, description, color, pattern, icon, createdAt

**CollectionNote**: collectionId, noteId

**Folder**: id, name, parentId

**CalendarEvent**: id, title, description, startTime, endTime, allDay, color, recurrence, sourceType (manual | ticket-due | sprint | external), sourceId, createdAt, updatedAt

**File**: id, name, mimeType, size, folderId, tags[], storagePath, uploadedBy, createdAt, updatedAt

**FileFolder**: id, name, parentId, createdAt

---

## What OpenDock is NOT

- Not a CI/CD or deployment tool (no builds, pipelines, monitoring)
- Not a chat app (that's Flux)
- Not an IDE (that's Liminal)
- Not a time tracker (backend has it, UI deferred to later)
- Not a real-time collaboration tool (single user or turn-based, not Google Docs style)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| State | Zustand |
| Styling | CSS + CSS custom properties |
| Rich editor | Lexical |
| Drag and drop | @dnd-kit |
| Backend | Express 5 + TypeScript |
| Database | Prisma (SQLite dev, Postgres prod) |
| Monorepo | pnpm workspaces |
| Validation | Zod |
