# JIRA Feature Parity Checklist

## Overview
This document tracks the features needed to achieve functional parity with JIRA while maintaining OpenDock's unique Japanese shop aesthetic.

## Core Features Checklist

### 🎯 High Priority (Quick Wins)

#### Issue Types & Categorization
- [ ] Add issue type field to KanbanTicket model
- [ ] Create issue type selector in ticket creation
- [ ] Add distinct icons for each type:
  - [ ] 🐛 Bug (red accent)
  - [ ] ✅ Task (blue accent)
  - [ ] 📖 Story (green accent)
  - [ ] 🎯 Epic (purple accent)
- [ ] Update ticket cards to show issue type icon
- [ ] Add issue type filter to board toolbar

#### Ticket Key Display
- [ ] Make ticket keys more prominent (e.g., "OD-123")
- [ ] Add project prefix configuration
- [ ] Show ticket key in browser title when viewing ticket
- [ ] Make ticket keys clickable/copyable

#### Quick Filters
- [ ] Add "My Issues" filter (assigned to current user)
- [ ] Add "Recently Updated" filter (last 7 days)
- [ ] Add "Unassigned" filter
- [ ] Create filter bar with one-click presets
- [ ] Save custom filters

#### Keyboard Shortcuts
- [ ] 'c' - Create new ticket
- [ ] '/' - Focus search
- [ ] 'a' - Assign ticket
- [ ] 'e' - Edit ticket
- [ ] 'j/k' - Navigate tickets
- [ ] '?' - Show shortcuts help modal

### 📊 Sprint Management

#### Sprint Planning
- [ ] Create Sprint model with start/end dates
- [ ] Add sprint creation dialog
- [ ] Sprint backlog view
- [ ] Drag tickets into/out of sprints
- [ ] Sprint capacity planning
- [ ] Start/complete sprint actions

#### Sprint Tracking
- [ ] Active sprint board
- [ ] Sprint progress indicator
- [ ] Story points per sprint
- [ ] Sprint goal setting
- [ ] Sprint retrospective notes

### 🏔️ Epic Management

#### Epic Structure
- [ ] Add Epic as special issue type
- [ ] Create epic field in ticket model
- [ ] Epic picker in ticket creation/edit
- [ ] Epic progress tracking (% complete)
- [ ] Epic timeline view
- [ ] Child issues under epics

#### Epic Views
- [ ] Epic roadmap page
- [ ] Epic burndown
- [ ] Epic list with progress bars
- [ ] Epic details panel
- [ ] Epic color coding

### 📈 Reporting & Analytics

#### Charts
- [ ] Sprint burndown chart
- [ ] Sprint velocity chart
- [ ] Cumulative flow diagram
- [ ] Created vs resolved chart
- [ ] Average cycle time
- [ ] Work type distribution

#### Dashboards
- [ ] Personal dashboard
- [ ] Project dashboard
- [ ] Custom widget support
- [ ] Export reports to PDF/CSV

### 🔍 Advanced Search

#### Search Improvements
- [ ] Full-text search across all fields
- [ ] Search history
- [ ] Saved searches
- [ ] Search suggestions/autocomplete
- [ ] JQL-like query builder
- [ ] Search across multiple projects

### 👥 User Management

#### Profile Enhancements
- [ ] User avatar upload
- [ ] User profile pages
- [ ] User activity stream
- [ ] User workload view
- [ ] @mentions in comments
- [ ] User presence indicators

### 🔄 Workflow Management

#### Custom Workflows
- [ ] Configurable column states
- [ ] Workflow transitions rules
- [ ] Required fields on transitions
- [ ] Workflow validators
- [ ] Status categories (To Do, In Progress, Done)
- [ ] Workflow schemes per project

### 🎨 UI/UX Improvements

#### Information Density
- [ ] Compact view mode
- [ ] List view alternative to cards
- [ ] Adjustable card size
- [ ] Collapsible sidebar sections
- [ ] Split view (list + detail)

#### Quick Actions
- [ ] Inline edit on hover
- [ ] Right-click context menu
- [ ] Bulk action toolbar
- [ ] Drag to assign
- [ ] Quick transition buttons
- [ ] Star/watch tickets

### 🔧 Additional Features

#### Components & Versions
- [ ] Project components management
- [ ] Version/release tracking
- [ ] Fix version field
- [ ] Affects version field
- [ ] Release notes generation

#### Time Management
- [ ] Original estimate field
- [ ] Time spent vs remaining
- [ ] Work log entries
- [ ] Time tracking reports
- [ ] Billable hours tracking

#### Integrations
- [ ] Webhook support
- [ ] Email notifications
- [ ] Slack integration
- [ ] Git commit linking
- [ ] CI/CD status display

## Implementation Priority

### Phase 1 - Core Enhancements (Week 1)
1. Issue Types ✅
2. Improved Ticket Keys
3. Quick Filters
4. Keyboard Shortcuts
5. User Avatars

### Phase 2 - Sprint Features (Week 2)
1. Sprint Management
2. Sprint Board
3. Burndown Chart
4. Velocity Tracking

### Phase 3 - Epics & Hierarchy (Week 3)
1. Epic Support
2. Epic Progress
3. Parent-Child Relationships
4. Epic Roadmap

### Phase 4 - Analytics (Week 4)
1. Reporting Dashboard
2. Various Charts
3. Export Functionality
4. Custom Widgets

### Phase 5 - Advanced Features (Week 5+)
1. Custom Workflows
2. Advanced Search
3. Components/Versions
4. Integrations

## Technical Implementation Notes

### Database Schema Updates
```typescript
// Add to KanbanTicket
issueType: 'bug' | 'task' | 'story' | 'epic'
epicId?: string
components?: string[]
fixVersion?: string
storyPoints?: number
timeOriginalEstimate?: number
timeSpent?: number
timeRemaining?: number
```

### New Models Needed
```typescript
interface Sprint {
  id: string
  name: string
  goal?: string
  startDate: string
  endDate: string
  state: 'future' | 'active' | 'closed'
  boardId: string
}

interface Epic {
  id: string
  name: string
  description?: string
  color: string
  startDate?: string
  endDate?: string
  boardId: string
}
```

### API Endpoints to Add
- GET/POST/PUT/DELETE /api/sprints
- GET/POST/PUT/DELETE /api/epics
- GET /api/reports/burndown
- GET /api/reports/velocity
- POST /api/search/advanced
- POST /api/users/avatar

## Success Metrics
- [ ] Feature coverage: 80% of JIRA core features
- [ ] Performance: <100ms page load time maintained
- [ ] User satisfaction: Maintain unique aesthetic
- [ ] Code quality: 90% type coverage
- [ ] Testing: 70% test coverage for new features

## Notes
- Maintain the warm, Japanese shop aesthetic throughout
- Prioritize usability over feature completeness
- Keep the interface clean despite added complexity
- Consider progressive disclosure for advanced features