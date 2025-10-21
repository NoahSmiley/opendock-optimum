OpenDock Project Status — 2025-10-20
====================================

Project Goal
------------
Deliver a hobbyist-friendly DevOps workbench that feels “Apple-clean,” centred on:
- Account-based access with secure auth (session cookies, CSRF, bcrypt).
- A pluggable data layer (JSON for demo, Prisma/SQL for prod) powering projects, kanban, and simulated CI/CD.
- A calm docs/roadmap shell plus a kanban workspace and lightweight pipeline simulator.

Current Progress
----------------
- ✅ Authentication back-end (Prisma + session cookies + CSRF) with rate limiting, plus a front-end auth flow wired through `AuthProvider`.
- ✅ Test coverage for password policies and auth routes, including CSRF enforcement and rate limiting.
- ✅ Monorepo plumbing: pnpm workspace config, local `@opendock/shared` package resolution, Prisma CLI usage fixed for tests.
- ⚠️ Front-end dashboard, projects CRUD, kanban boards, and CI/CD simulator still rely on legacy JSON/demo data.

Next Milestones
---------------
1. **Projects + Dashboard (Milestone 2)**  
   - Define Project schemas (Zod + shared types).  
   - Implement JSON DAL CRUD + API routes.  
   - Build dashboard UI with empty states and create-project flow.
2. **Kanban v1 (Milestone 3)**  
   - Board/column/ticket DAL, SSE updates, drag-and-drop UI.
3. **CI/CD Simulation (Milestone 4)**  
   - Build/deploy state machine, background worker, log streaming.
4. **Polish & A11y (Milestone 5)**  
   - Command palette, focus states, first-run onboarding, theming polish.

Risks & Considerations
----------------------
- Need to keep JSON provider compat while introducing SQL-backed features.
- SSE channels and job runner will require careful resource management in dev server.
- Testing matrix will expand (API + Playwright); ensure tooling scripts are in place before later milestones.
