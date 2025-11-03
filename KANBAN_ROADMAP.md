# Kanban Board Feature Roadmap

Last Updated: 2025-11-01

## Current Status

### ✅ Implemented Features
- [x] Drag & Drop ticket reordering (@hello-pangea/dnd)
- [x] Board Management (create, list)
- [x] Column Management (create, rename, delete)
- [x] Ticket Management (create, update, reorder, delete)
- [x] Filtering (search, assignee, priority, sprint, due date)
- [x] Comments (add, delete)
- [x] Sprints (create with dates and goals)
- [x] Real-time Updates (EventSource streaming)
- [x] Priority Levels (Low, Medium, High with visual indicators)
- [x] Multi-assignee support
- [x] Backlog tab
- [x] Overview tab with analytics
- [x] Dark mode support
- [x] Delete confirmation dialogs
- [x] Inline editing for column names
- [x] Column dropdown menu with options
- [x] Bulk operations (select, move, assign, delete)
- [x] Due dates with visual warnings (overdue/due-soon badges)
- [x] Time tracking with live timer and progress bars
- [x] Time logs history with delete functionality
- [x] Activity log with filtering and "who did what when" tracking

---

## 🎯 Implementation Phases

### Phase 1: Core CRUD Operations (Priority: HIGH) - 1-2 days
Essential functionality needed for basic kanban workflow.

#### 1.1 Delete Tickets ✅
- [x] Add delete button to ticket detail panel
- [x] Implement confirmation modal
- [x] Add DELETE API endpoint `/api/kanban/tickets/:id`
- [x] Update real-time sync to handle deletions
- [x] Add optimistic UI updates (handled by real-time sync)

#### 1.2 Edit/Delete Columns ✅
- [x] Add column header dropdown menu
- [x] Implement rename column inline editing
- [x] Add delete column with confirmation
- [x] Add PATCH API endpoint `/api/kanban/boards/:boardId/columns/:id`
- [x] Add DELETE API endpoint `/api/kanban/boards/:boardId/columns/:id`
- [x] Handle ticket reassignment when deleting column
- [x] Update real-time sync for column operations

#### 1.3 Edit Board Details ✅
- [x] Add board settings modal/panel
- [x] Convert settings to sidebar tab page
- [x] Implement column management in settings
- [x] Add board info display with statistics
- [x] UI/UX improvements to match app theme

#### 1.4 Bulk Operations ✅
- [x] Add checkbox selection to tickets
- [x] Implement "select all" functionality
- [x] Add bulk action toolbar (move, delete, assign)
- [x] Implement bulk move modal with column selection
- [x] Implement bulk assign modal with team member selection
- [x] Show selection count and clear selection
- [ ] Add POST API endpoint `/api/kanban/boards/:id/bulk-operations` (future optimization)

---

### Phase 2: Time Management (Priority: HIGH) - 2-3 days
Critical for project tracking and deadlines.

#### 2.1 Due Dates ✅
- [x] Add due date picker to ticket detail panel
- [x] Add due date badge to ticket cards
- [x] Implement visual warnings for overdue tickets
- [x] Add due date filter in toolbar
- [x] Show due date in ticket list view

#### 2.2 Time Tracking ✅
- [x] Add time estimate field to tickets (already existed)
- [x] Implement time logging (start/stop timer)
- [x] Show time spent vs. estimated
- [x] Add time tracking API endpoints
- [x] Time tracking UI component with live timer
- [x] Time logs history display
- [x] Progress bar visualization
- [ ] Display time summary in overview tab (future enhancement)

#### 2.3 Reminders & Notifications
- [ ] Implement browser notifications for due dates
- [ ] Add email notification system
- [ ] Allow users to set custom reminders
- [ ] Add notification preferences
- [ ] Show notification bell icon with count

#### 2.4 Calendar View
- [ ] Create calendar component
- [ ] Map tickets to calendar dates
- [ ] Allow drag-and-drop between dates
- [ ] Add month/week/day views
- [ ] Sync with due dates

---

### Phase 3: Collaboration Features (Priority: MEDIUM) - 2-3 days
Enhance team collaboration and communication.

#### 3.1 File Attachments ✅
- [x] Add file upload UI to ticket detail
- [x] Implement drag-and-drop file upload
- [x] Add POST API endpoint `/api/kanban/tickets/:id/attachments`
- [x] Store files (local/S3/cloud storage)
- [x] Show attachment previews (images)
- [x] Add file download functionality
- [x] Show attachment count on ticket cards

#### 3.2 Mentions
- [ ] Implement @mention autocomplete in comments
- [ ] Link mentions to user profiles
- [ ] Send notifications when mentioned
- [ ] Highlight mentioned users
- [ ] Add mention parsing backend

#### 3.3 Activity Log ✅
- [x] Create activity feed component
- [x] Track all ticket/board changes
- [x] Add GET API endpoint `/api/kanban/boards/:id/activity`
- [x] Show "who did what when" format
- [x] Filter activity by user/type
- [x] Add activity stream to ticket detail

#### 3.4 Real-time Presence
- [ ] Show active users viewing board
- [ ] Display user avatars in header
- [ ] Show who's editing which ticket
- [ ] Add cursor tracking (optional)
- [ ] Implement WebSocket presence system

---

### Phase 4: Organization Features (Priority: MEDIUM) - 3-4 days
Better organization and workflow management.

#### 4.1 Labels/Tags System ✅
- [x] Create label management UI
- [x] Add color picker for labels
- [x] Implement label search/filter
- [x] Show labels on ticket cards
- [x] Add label API endpoints (CRUD)
- [x] Allow multiple labels per ticket

#### 4.2 Swimlanes
- [ ] Add swimlane toggle to board view
- [ ] Implement horizontal grouping (by assignee, priority)
- [ ] Allow drag-and-drop between swimlanes
- [ ] Add swimlane configuration UI
- [ ] Persist swimlane preferences

#### 4.3 WIP Limits ✅
- [x] Add WIP limit setting to columns
- [x] Show visual warning when limit exceeded
- [x] Display count: "3/5" on column header
- [ ] Block drag when limit would be exceeded (optional - not implemented)
- [x] Add WIP limit to column settings

#### 4.4 Board Templates
- [ ] Create template selector on board creation
- [ ] Pre-configure columns for common workflows:
  - [ ] Basic Kanban (To Do, In Progress, Done)
  - [ ] Scrum (Backlog, Sprint, In Progress, Review, Done)
  - [ ] Bug Tracking (New, Triage, In Progress, Fixed, Verified)
  - [ ] Support (New, Assigned, In Progress, Resolved)
- [ ] Allow saving custom templates
- [ ] Import/export templates

---

### Phase 5: Advanced Features (Priority: LOW) - 3-4 days
Power user features and workflow optimization.

#### 5.1 Keyboard Shortcuts
- [ ] Add keyboard shortcut overlay (show with `?`)
- [ ] Implement navigation shortcuts:
  - [ ] `n` - New ticket
  - [ ] `/` - Focus search
  - [ ] `Esc` - Close modals
  - [ ] `j/k` - Navigate tickets
  - [ ] `e` - Edit ticket
  - [ ] `d` - Delete ticket
- [ ] Add quick actions (Cmd+Enter to save)
- [ ] Make shortcuts customizable

#### 5.2 Export/Import
- [ ] Add export button to board menu
- [ ] Implement CSV export (tickets list)
- [ ] Implement JSON export (full board data)
- [ ] Add PDF export (board snapshot)
- [ ] Create import wizard
- [ ] Support importing from Trello, Jira

#### 5.3 Automation Rules
- [ ] Create automation rule builder UI
- [ ] Implement triggers (ticket moved, created, etc.)
- [ ] Add actions (assign, label, move, notify)
- [ ] Allow conditional logic (if/then)
- [ ] Store and execute rules backend
- [ ] Show automation activity log

#### 5.4 Custom Fields
- [ ] Add custom field editor to board settings
- [ ] Support field types (text, number, date, select)
- [ ] Show custom fields in ticket detail
- [ ] Allow filtering by custom fields
- [ ] Store custom field schema per board

#### 5.5 Reporting & Analytics
- [ ] Create reports tab
- [ ] Add burndown chart for sprints
- [ ] Show velocity tracking
- [ ] Display cycle time metrics
- [ ] Add cumulative flow diagram
- [ ] Show team performance stats
- [ ] Export reports as images/PDFs

#### 5.6 Board Sharing
- [ ] Add share button to board
- [ ] Generate public/private links
- [ ] Implement read-only view for guests
- [ ] Add password protection option
- [ ] Track link access analytics
- [ ] Allow embed code generation

---

### Phase 6: User Experience Improvements (Priority: MEDIUM) - 2-3 days
Polish and refinement for better usability.

#### 6.1 Mobile Optimization
- [ ] Implement touch-friendly drag and drop
- [ ] Optimize layout for small screens
- [ ] Add mobile-specific navigation
- [ ] Test on iOS and Android
- [ ] Add gesture support (swipe actions)

#### 6.2 Undo/Redo
- [ ] Implement action history stack
- [ ] Add undo button (Cmd+Z)
- [ ] Add redo button (Cmd+Shift+Z)
- [ ] Show toast notifications for undo
- [ ] Limit history to last 50 actions

#### 6.3 Advanced Search
- [ ] Add search modal with filters
- [ ] Implement full-text search
- [ ] Search across all fields
- [ ] Save search queries
- [ ] Show search suggestions

#### 6.4 Ticket Templates
- [ ] Create template library
- [ ] Add "Create from template" option
- [ ] Allow custom template creation
- [ ] Share templates across boards
- [ ] Include checklists in templates

---

## Missing Backend API Endpoints

### Must Implement
```typescript
DELETE /api/kanban/tickets/:id
DELETE /api/kanban/boards/:boardId/columns/:id
PATCH /api/kanban/boards/:boardId/columns/:id
POST /api/kanban/tickets/:id/attachments
GET /api/kanban/boards/:boardId/activity
POST /api/kanban/boards/:boardId/bulk-operations
```

### Phase 2+
```typescript
POST /api/kanban/tickets/:id/time-logs
GET /api/kanban/tickets/:id/time-logs
POST /api/kanban/labels
GET /api/kanban/labels
PATCH /api/kanban/labels/:id
DELETE /api/kanban/labels/:id
POST /api/kanban/boards/:id/export
POST /api/kanban/boards/:id/automation-rules
GET /api/kanban/boards/:id/analytics
```

---

## Implementation Guidelines

### Code Quality Standards
- Write TypeScript with strict types
- Add error handling for all API calls
- Implement optimistic UI updates
- Use React hooks and proper memoization
- Follow existing component patterns
- Add loading states and skeletons

### Testing Checklist
- [ ] Test drag-and-drop functionality
- [ ] Verify real-time updates work
- [ ] Check error handling
- [ ] Test on different screen sizes
- [ ] Verify keyboard navigation
- [ ] Test with multiple users

### Performance Considerations
- Lazy load images and attachments
- Virtualize long ticket lists
- Debounce search and filters
- Optimize re-renders with React.memo
- Use Web Workers for heavy computations

---

## Notes
- All features should work with real-time sync
- Maintain consistency with existing design patterns
- Prioritize user experience over complexity
- Keep accessibility in mind (ARIA labels, keyboard nav)
- Document new components and APIs

---

## Progress Tracking

**Completed Features:** 57/70+ planned features
**Current Phase:** Phase 3 & 4 - Collaboration and Organization Features (IN PROGRESS)
**Next Up:** Phase 3.2 - Mentions, Phase 2.3 - Reminders & Notifications, or Phase 2.4 - Calendar View

Last update: Completed Phase 3.1 (File Attachments with drag-and-drop, preview, download, and count badges)

### Completed Phases:
- ✅ Phase 1: Core CRUD Operations (All sections complete)
- ✅ Phase 2.1: Due Dates (Complete with filtering and visual warnings)
- ✅ Phase 2.2: Time Tracking (Complete with live timer and logs)
- ✅ Phase 3.1: File Attachments (Complete with drag-and-drop, preview, download, and count badges)
- ✅ Phase 3.3: Activity Log (Complete with user/type filtering and real-time display)
- ✅ Phase 4.1: Labels/Tags System (Complete with management UI, color picker, and filtering)
- ✅ Phase 4.3: WIP Limits (Complete with visual warnings and settings integration)
