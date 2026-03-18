export interface NoteTemplate {
  id: string;
  name: string;
  category: 'meeting' | 'project' | 'personal' | 'academic' | 'creative' | 'general';
  description: string;
  icon: string;
  content: string;
}

export const noteTemplates: NoteTemplate[] = [
  // Meeting Templates
  {
    id: 'meeting-agenda',
    name: 'Meeting Agenda',
    category: 'meeting',
    description: 'Structured agenda for team meetings',
    icon: '📋',
    content: `# Meeting Agenda

**Date:** {{date}}
**Time:** {{time}}
**Attendees:**
-
-

## Agenda Items

### 1. Item One
- Discussion points:
  -
  -

### 2. Item Two
- Discussion points:
  -
  -

## Action Items
- [ ]
- [ ]

## Next Steps
-
`,
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    category: 'meeting',
    description: 'Capture meeting notes and decisions',
    icon: '📝',
    content: `# Meeting Minutes

**Date:** {{date}}
**Time:** {{time}}
**Location:**
**Attendees:**
-
-

## Summary


## Discussion Points

### Topic 1


### Topic 2


## Decisions Made
-
-

## Action Items
| Task | Assignee | Due Date |
|------|----------|----------|
|      |          |          |

## Next Meeting
**Date:**
**Topics:**
-
`,
  },
  {
    id: 'one-on-one',
    name: 'One-on-One Meeting',
    category: 'meeting',
    description: 'Template for individual check-ins',
    icon: '👥',
    content: `# One-on-One Meeting

**Date:** {{date}}
**Participant:**
**Duration:**

## Check-in
How are you doing?


## Wins & Accomplishments
-
-

## Challenges & Blockers
-
-

## Goals & Development
Short-term:
-

Long-term:
-

## Feedback
From me:


From you:


## Action Items
- [ ]
- [ ]

## Next Session Topics
-
`,
  },

  // Project Templates
  {
    id: 'project-brief',
    name: 'Project Brief',
    category: 'project',
    description: 'High-level project overview',
    icon: '🎯',
    content: `# Project Brief

**Project Name:**
**Owner:**
**Start Date:** {{date}}
**Target Launch:**

## Executive Summary


## Problem Statement


## Goals & Objectives
1.
2.
3.

## Success Metrics
| Metric | Target | Actual |
|--------|--------|--------|
|        |        |        |

## Stakeholders
- **Sponsor:**
- **Team:**
- **Users:**

## Scope
### In Scope
-
-

### Out of Scope
-
-

## Timeline & Milestones
- [ ] Milestone 1 -
- [ ] Milestone 2 -
- [ ] Milestone 3 -

## Risks & Dependencies
**Risks:**
-

**Dependencies:**
-

## Resources Required
-
-
`,
  },
  {
    id: 'project-retrospective',
    name: 'Project Retrospective',
    category: 'project',
    description: 'Reflect on project outcomes',
    icon: '🔍',
    content: `# Project Retrospective

**Project:**
**Date:** {{date}}
**Team:**
-
-

## What Went Well ✅
-
-
-

## What Could Be Improved 🔧
-
-
-

## What We Learned 💡
-
-
-

## Action Items for Next Time
- [ ]
- [ ]
- [ ]

## Metrics Review
| Metric | Target | Actual | Variance |
|--------|--------|--------|----------|
|        |        |        |          |

## Team Feedback


## Next Steps
-
`,
  },

  // Personal Templates
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    category: 'personal',
    description: 'Daily reflection and planning',
    icon: '📖',
    content: `# Daily Journal - {{date}}

## Morning ☀️

**Mood:**
**Energy Level:** /10

**Top 3 Priorities:**
1.
2.
3.

**Intention for the day:**


## Throughout the Day 📌

**Highlights:**
-
-

**Challenges:**
-
-

**Gratitude:**
-
-

## Evening Reflection 🌙

**What went well:**


**What could be better:**


**Lessons learned:**


**Tomorrow's focus:**
-
`,
  },
  {
    id: 'goal-tracker',
    name: 'Goal Tracker',
    category: 'personal',
    description: 'Track and achieve your goals',
    icon: '🎯',
    content: `# Goal Tracker

**Created:** {{date}}

## Long-term Vision (1-5 years)


## Annual Goals
### Career
- [ ]

### Health
- [ ]

### Personal Development
- [ ]

### Relationships
- [ ]

## Quarterly Objectives (Q_)
1.
2.
3.

## Monthly Milestones
- [ ] Week 1:
- [ ] Week 2:
- [ ] Week 3:
- [ ] Week 4:

## Progress Tracking
| Goal | Status | Progress | Notes |
|------|--------|----------|-------|
|      |        |          |       |

## Reflections & Adjustments


`,
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    category: 'personal',
    description: 'Build and maintain habits',
    icon: '✓',
    content: `# Habit Tracker - {{date}}

## Habits to Build

### Morning Routine
- [ ] Wake up at __:__
- [ ]
- [ ]
- [ ]

### Daily Practices
- [ ]
- [ ]
- [ ]

### Evening Routine
- [ ]
- [ ]
- [ ] Sleep by __:__

## Weekly Streak
| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
|     |     |     |     |     |     |     |

## Monthly Progress
**Consistency:** __%
**Best streak:** __ days
**Current streak:** __ days

## Notes & Adjustments


`,
  },

  // Academic Templates
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    category: 'academic',
    description: 'Systematic note-taking method',
    icon: '📚',
    content: `# Cornell Notes

**Subject:**
**Topic:**
**Date:** {{date}}

---

## Notes


### Key Points
-
-
-

### Details






---

## Cues & Questions
-
-
-

---

## Summary



---

## Action Items
- [ ]
- [ ]
`,
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    category: 'academic',
    description: 'Track research and sources',
    icon: '🔬',
    content: `# Research Notes

**Topic:**
**Date:** {{date}}
**Research Question:**


## Sources

### Source 1
**Author:**
**Title:**
**Publication:**
**Year:**
**URL/DOI:**

**Key Findings:**
-
-

**Quotes:**
>

**Notes:**


### Source 2
**Author:**
**Title:**
**Publication:**
**Year:**
**URL/DOI:**

**Key Findings:**
-
-

**Quotes:**
>

**Notes:**


## Synthesis


## Next Steps
- [ ]
- [ ]

## Bibliography


`,
  },

  // Creative Templates
  {
    id: 'blog-post',
    name: 'Blog Post',
    category: 'creative',
    description: 'Structure for blog articles',
    icon: '✍️',
    content: `# [Blog Post Title]

**Date:** {{date}}
**Category:**
**Tags:**
**Target Audience:**

## Headline Ideas
1.
2.
3.

## Hook / Introduction


## Main Points

### Point 1:


### Point 2:


### Point 3:


## Key Takeaways
-
-
-

## Call to Action


## SEO Notes
**Keywords:**
**Meta Description:**


## Images Needed
-
-

## Publishing Checklist
- [ ] Proofread
- [ ] Add images
- [ ] Optimize SEO
- [ ] Add internal links
- [ ] Schedule social posts
`,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    category: 'creative',
    description: 'Capture creative ideas',
    icon: '💡',
    content: `# Brainstorming Session

**Topic:**
**Date:** {{date}}
**Participants:**
-

## Challenge/Opportunity


## Initial Ideas
-
-
-
-
-

## Mind Map


## Promising Concepts

### Concept 1
**Description:**


**Pros:**
-

**Cons:**
-

### Concept 2
**Description:**


**Pros:**
-

**Cons:**
-

## Next Steps
- [ ]
- [ ]

## Parking Lot (Ideas to revisit)
-
`,
  },

  // General Templates
  {
    id: 'blank',
    name: 'Blank Note',
    category: 'general',
    description: 'Start from scratch',
    icon: '📄',
    content: '',
  },
  {
    id: 'checklist',
    name: 'Checklist',
    category: 'general',
    description: 'Simple task list',
    icon: '☑️',
    content: `# Checklist

**Created:** {{date}}

## Tasks
- [ ]
- [ ]
- [ ]
- [ ]
- [ ]

## Completed
- [x]
`,
  },
  {
    id: 'quick-note',
    name: 'Quick Note',
    category: 'general',
    description: 'Fast capture',
    icon: '⚡',
    content: `# Quick Note - {{date}}


`,
  },
];

/**
 * Replace template variables with actual values
 */
export function processTemplateContent(template: string): string {
  const now = new Date();

  return template
    .replace(/\{\{date\}\}/g, now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .replace(/\{\{time\}\}/g, now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }))
    .replace(/\{\{user\}\}/g, 'User'); // Could be replaced with actual user name
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: NoteTemplate['category']): NoteTemplate[] {
  return noteTemplates.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): NoteTemplate | undefined {
  return noteTemplates.find(t => t.id === id);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): NoteTemplate['category'][] {
  return ['general', 'meeting', 'project', 'personal', 'academic', 'creative'];
}
