/**
 * Project Type System for OpenDock Boards
 *
 * This system allows boards to adapt their terminology and features
 * based on the type of project being managed.
 */

export type ProjectType =
  | "software"      // Software development projects
  | "event"         // Event planning (parties, weddings, conferences)
  | "construction"  // Home improvement, renovations, building
  | "creative"      // Creative projects (art, music, writing, film)
  | "business"      // Business planning, marketing campaigns
  | "education"     // Course planning, curriculum development
  | "research"      // Research projects, studies
  | "general";      // General project management

export interface ProjectTypeConfig {
  id: ProjectType;
  label: string;
  description: string;
  icon: string; // We'll use icon names that can be mapped to Lucide icons

  // Terminology customization
  terminology: {
    item: string;          // What to call a ticket/task (singular)
    items: string;         // What to call tickets/tasks (plural)
    itemTypes: ItemType[]; // Available types for this project

    // Workflow terms
    sprint: string;        // What to call a sprint/phase
    sprints: string;       // Plural of sprint/phase
    backlog: string;       // What to call the backlog

    // Estimation terms
    points: string;        // What to call story points
    pointsDescription: string;
  };

  // Feature flags
  features: {
    sprints: boolean;      // Enable sprint/phase management
    estimation: boolean;   // Enable estimation (points)
    timeTracking: boolean; // Enable time tracking
    components: boolean;   // Enable component tagging
    versions: boolean;     // Enable version/release tracking
    advancedSearch: boolean; // Enable JQL-like search
  };

  // Default columns for new boards
  defaultColumns: string[];
}

export interface ItemType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

// Software Development Configuration
const softwareConfig: ProjectTypeConfig = {
  id: "software",
  label: "Software Development",
  description: "Build software with sprints, bugs, and story points",
  icon: "Code2",

  terminology: {
    item: "Issue",
    items: "Issues",
    itemTypes: [
      { id: "bug", label: "Bug", icon: "Bug", color: "red" },
      { id: "task", label: "Task", icon: "CheckCircle", color: "blue" },
      { id: "story", label: "Story", icon: "BookOpen", color: "green" },
      { id: "epic", label: "Epic", icon: "Target", color: "purple" },
    ],
    sprint: "Sprint",
    sprints: "Sprints",
    backlog: "Backlog",
    points: "Story Points",
    pointsDescription: "Estimate complexity using story points",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: true,
    components: true,
    versions: true,
    advancedSearch: true,
  },

  defaultColumns: ["Backlog", "To Do", "In Progress", "Code Review", "Testing", "Done"],
};

// Event Planning Configuration
const eventConfig: ProjectTypeConfig = {
  id: "event",
  label: "Event Planning",
  description: "Plan parties, weddings, conferences, and gatherings",
  icon: "Calendar",

  terminology: {
    item: "Task",
    items: "Tasks",
    itemTypes: [
      { id: "venue", label: "Venue", icon: "MapPin", color: "blue" },
      { id: "vendor", label: "Vendor", icon: "Users", color: "green" },
      { id: "logistics", label: "Logistics", icon: "Truck", color: "orange" },
      { id: "marketing", label: "Marketing", icon: "Megaphone", color: "purple" },
      { id: "task", label: "Task", icon: "CheckCircle", color: "gray" },
    ],
    sprint: "Phase",
    sprints: "Phases",
    backlog: "Ideas",
    points: "Priority",
    pointsDescription: "Set priority level (1-10)",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: false,
    components: false,
    versions: false,
    advancedSearch: false,
  },

  defaultColumns: ["Ideas", "Planning", "Booked", "Ready", "Complete"],
};

// Construction/Home Improvement Configuration
const constructionConfig: ProjectTypeConfig = {
  id: "construction",
  label: "Construction & Home Improvement",
  description: "Manage renovations, repairs, and building projects",
  icon: "Hammer",

  terminology: {
    item: "Task",
    items: "Tasks",
    itemTypes: [
      { id: "demolition", label: "Demolition", icon: "Trash2", color: "red" },
      { id: "structural", label: "Structural", icon: "Building", color: "gray" },
      { id: "electrical", label: "Electrical", icon: "Zap", color: "yellow" },
      { id: "plumbing", label: "Plumbing", icon: "Droplet", color: "blue" },
      { id: "finishing", label: "Finishing", icon: "Paintbrush", color: "green" },
      { id: "inspection", label: "Inspection", icon: "ClipboardCheck", color: "purple" },
    ],
    sprint: "Phase",
    sprints: "Phases",
    backlog: "Planning",
    points: "Days",
    pointsDescription: "Estimated days to complete",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: true,
    components: false,
    versions: false,
    advancedSearch: false,
  },

  defaultColumns: ["Planning", "Permits", "In Progress", "Inspection", "Complete"],
};

// Creative Projects Configuration
const creativeConfig: ProjectTypeConfig = {
  id: "creative",
  label: "Creative Projects",
  description: "Manage art, music, writing, or film projects",
  icon: "Palette",

  terminology: {
    item: "Task",
    items: "Tasks",
    itemTypes: [
      { id: "concept", label: "Concept", icon: "Lightbulb", color: "yellow" },
      { id: "production", label: "Production", icon: "Video", color: "red" },
      { id: "revision", label: "Revision", icon: "Edit3", color: "orange" },
      { id: "milestone", label: "Milestone", icon: "Flag", color: "green" },
      { id: "task", label: "Task", icon: "CheckCircle", color: "blue" },
    ],
    sprint: "Phase",
    sprints: "Phases",
    backlog: "Ideas",
    points: "Effort",
    pointsDescription: "Effort level (1-10)",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: true,
    components: false,
    versions: true, // For drafts/versions
    advancedSearch: false,
  },

  defaultColumns: ["Ideas", "Planning", "In Production", "Review", "Final"],
};

// Business Planning Configuration
const businessConfig: ProjectTypeConfig = {
  id: "business",
  label: "Business Planning",
  description: "Plan marketing campaigns, product launches, and business initiatives",
  icon: "Briefcase",

  terminology: {
    item: "Action",
    items: "Actions",
    itemTypes: [
      { id: "strategic", label: "Strategic", icon: "Target", color: "purple" },
      { id: "operational", label: "Operational", icon: "Settings", color: "blue" },
      { id: "marketing", label: "Marketing", icon: "TrendingUp", color: "green" },
      { id: "financial", label: "Financial", icon: "DollarSign", color: "yellow" },
      { id: "task", label: "Task", icon: "CheckCircle", color: "gray" },
    ],
    sprint: "Quarter",
    sprints: "Quarters",
    backlog: "Pipeline",
    points: "Impact",
    pointsDescription: "Business impact (1-10)",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: false,
    components: true, // For departments/teams
    versions: false,
    advancedSearch: true,
  },

  defaultColumns: ["Pipeline", "This Quarter", "In Progress", "Under Review", "Completed"],
};

// Education Configuration
const educationConfig: ProjectTypeConfig = {
  id: "education",
  label: "Education & Training",
  description: "Plan courses, curriculum, and training programs",
  icon: "GraduationCap",

  terminology: {
    item: "Task",
    items: "Tasks",
    itemTypes: [
      { id: "lesson", label: "Lesson", icon: "BookOpen", color: "blue" },
      { id: "assignment", label: "Assignment", icon: "FileText", color: "green" },
      { id: "assessment", label: "Assessment", icon: "ClipboardCheck", color: "orange" },
      { id: "resource", label: "Resource", icon: "Library", color: "purple" },
      { id: "task", label: "Task", icon: "CheckCircle", color: "gray" },
    ],
    sprint: "Module",
    sprints: "Modules",
    backlog: "Curriculum",
    points: "Hours",
    pointsDescription: "Estimated hours",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: true,
    components: false,
    versions: false,
    advancedSearch: false,
  },

  defaultColumns: ["Curriculum", "Preparing", "Active", "Grading", "Complete"],
};

// Research Configuration
const researchConfig: ProjectTypeConfig = {
  id: "research",
  label: "Research Projects",
  description: "Manage academic or scientific research",
  icon: "Microscope",

  terminology: {
    item: "Task",
    items: "Tasks",
    itemTypes: [
      { id: "hypothesis", label: "Hypothesis", icon: "HelpCircle", color: "purple" },
      { id: "experiment", label: "Experiment", icon: "TestTube", color: "blue" },
      { id: "analysis", label: "Analysis", icon: "BarChart", color: "green" },
      { id: "documentation", label: "Documentation", icon: "FileText", color: "orange" },
      { id: "task", label: "Task", icon: "CheckCircle", color: "gray" },
    ],
    sprint: "Phase",
    sprints: "Phases",
    backlog: "Proposals",
    points: "Complexity",
    pointsDescription: "Complexity level (1-10)",
  },

  features: {
    sprints: true,
    estimation: true,
    timeTracking: true,
    components: true, // For research areas
    versions: true, // For paper drafts
    advancedSearch: true,
  },

  defaultColumns: ["Proposals", "Planning", "In Progress", "Analysis", "Published"],
};

// General Project Configuration (Default)
const generalConfig: ProjectTypeConfig = {
  id: "general",
  label: "General Project",
  description: "Flexible project management for any type of work",
  icon: "FolderOpen",

  terminology: {
    item: "Item",
    items: "Items",
    itemTypes: [
      { id: "task", label: "Task", icon: "CheckCircle", color: "blue" },
      { id: "milestone", label: "Milestone", icon: "Flag", color: "green" },
      { id: "issue", label: "Issue", icon: "AlertCircle", color: "orange" },
      { id: "idea", label: "Idea", icon: "Lightbulb", color: "yellow" },
    ],
    sprint: "Phase",
    sprints: "Phases",
    backlog: "Queue",
    points: "Priority",
    pointsDescription: "Priority level (1-10)",
  },

  features: {
    sprints: false,
    estimation: true,
    timeTracking: false,
    components: false,
    versions: false,
    advancedSearch: false,
  },

  defaultColumns: ["To Do", "In Progress", "Review", "Done"],
};

// Export all configurations
export const PROJECT_TYPE_CONFIGS: Record<ProjectType, ProjectTypeConfig> = {
  software: softwareConfig,
  event: eventConfig,
  construction: constructionConfig,
  creative: creativeConfig,
  business: businessConfig,
  education: educationConfig,
  research: researchConfig,
  general: generalConfig,
};

// Helper function to get config for a project type
export function getProjectTypeConfig(type: ProjectType): ProjectTypeConfig {
  return PROJECT_TYPE_CONFIGS[type] || generalConfig;
}

// Helper function to get item types for a project
export function getItemTypesForProject(type: ProjectType): ItemType[] {
  return getProjectTypeConfig(type).terminology.itemTypes;
}

// Helper function to check if a feature is enabled
export function isFeatureEnabled(type: ProjectType, feature: keyof ProjectTypeConfig['features']): boolean {
  return getProjectTypeConfig(type).features[feature];
}