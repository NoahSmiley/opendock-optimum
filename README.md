# OpenDock Monorepo

A Shadcn-inspired DevOps workbench with a dedicated kanban workspace. The monorepo hosts three apps:

- `apps/opendock` - primary shell (dashboard, docs, roadmap).
- `apps/boards` - full-screen kanban experience.
- `apps/backend` - Express API powering builds, deployments, and boards.

Shared types and utilities live in `packages/shared`.

## Getting Started

```bash
# Install once at the workspace root
npm install

# Start backend API
npm run dev:backend

# In another terminal, start the shell
npm run dev:opendock

# Optional: start Boards in its own window
npm run dev:boards
```

The shell runs on [http://localhost:5173](http://localhost:5173) by default, the Boards workspace on [http://localhost:5174](http://localhost:5174), and the API on [http://localhost:4000](http://localhost:4000).

### GitHub OAuth (optional)

To enable “Sign in with GitHub” and repository discovery, provide the following environment variables for the backend (`apps/backend/.env`):

```
OPENDOCK_GITHUB_CLIENT_ID=your_client_id
OPENDOCK_GITHUB_CLIENT_SECRET=your_client_secret
# Optional overrides
# OPENDOCK_GITHUB_REDIRECT_URI=http://localhost:4000/api/auth/github/callback
# OPENDOCK_GITHUB_SCOPE=read:user user:email repo
```

After configuring, restarting the backend will expose `/api/auth/github/login` for OAuth sign-in.

To point the shell at a different Boards host, set `VITE_BOARDS_URL` inside `apps/opendock`. You can also inject `window.__OPENDOCK_BOARDS_URL` from `index.html` if the URL needs to be decided at runtime. The defaults fall back to `http://localhost:5174` during development and `/boards/app` in production builds.

## Feature Highlights

- **Shadcn-inspired layout** - light/dark themes, spacious typography, and calm cards.
- **Projects dashboard** - connect repos, view builds, redeploy, and inspect logs.
- **Dedicated Boards app** - backlog quick-add, sprint planning, and drag-and-drop tickets.
- **Shared data model** - types and API helpers are shared across apps.
- **Express backend** - file-backed state, build simulation, deployment tracking, and kanban routes.

## Directory Structure

```text
apps/
  backend/      # Express + TypeScript API
  opendock/     # Shell UI (docs, dashboard, roadmap)
  boards/       # Full-screen kanban workspace
packages/
  shared/       # Types and fetch helper shared across apps
```

## API Routes

- `GET /api/projects` - list projects with build/deploy metadata.
- `POST /api/projects` - create a project and queue the first build.
- `POST /api/projects/:id/redeploy` - enqueue a manual redeploy.
- `GET /api/projects/:id/logs` - fetch build logs.
- `GET /api/kanban/boards` - list boards, columns, tickets, users.
- `POST /api/kanban/boards` - create a board.
- `POST /api/kanban/boards/:id/columns` - add a column.
- `POST /api/kanban/boards/:id/tickets` - add a ticket.
- `PATCH /api/kanban/tickets/:id` - update a ticket.
- `PATCH /api/kanban/boards/:id/tickets/reorder` - drag-and-drop reorder.

## Theming

Both frontend apps share the same design tokens and support a light/dark mode toggle. Theme preference is persisted to `localStorage` and reacts to system changes.

## Next Steps

- Replace simulated build/deploy steps with real docker workflows.
- Add WebSocket updates for live kanban collaboration.
- Integrate authentication and role-based access for teams.
