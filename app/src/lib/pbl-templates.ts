/**
 * PBL (Project-Based Learning) Templates.
 * Each template defines milestones, roles, and deliverables.
 */

export interface PBLMilestone {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  xpReward: number;
  status: "pending" | "in_progress" | "completed";
}

export interface PBLRole {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

export interface PBLTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  roles: PBLRole[];
  milestones: PBLMilestone[];
  tags: string[];
}

/** Generic PBL templates applicable to many skills */
export const GENERIC_TEMPLATES: PBLTemplate[] = [
  {
    id: "research-paper",
    title: "Mini Research Paper",
    description: "Write a short research paper exploring a topic in depth",
    difficulty: "intermediate",
    estimatedHours: 4,
    roles: [
      { key: "researcher", name: "Researcher", emoji: "🔬", description: "Conducts research and gathers evidence" },
      { key: "writer", name: "Writer", emoji: "✍️", description: "Drafts and edits the paper" },
      { key: "reviewer", name: "Reviewer", emoji: "📋", description: "Reviews for accuracy and clarity" },
    ],
    milestones: [
      { id: "m1", title: "Topic Selection & Outline", description: "Choose a specific angle and create an outline", deliverable: "Outline document", xpReward: 50, status: "pending" },
      { id: "m2", title: "Research & Evidence", description: "Gather sources and key evidence", deliverable: "Annotated bibliography", xpReward: 80, status: "pending" },
      { id: "m3", title: "First Draft", description: "Write the complete first draft", deliverable: "Draft paper", xpReward: 100, status: "pending" },
      { id: "m4", title: "Review & Polish", description: "Review, revise, and finalize", deliverable: "Final paper", xpReward: 70, status: "pending" },
    ],
    tags: ["writing", "research", "analysis"],
  },
  {
    id: "teach-back",
    title: "Teach-Back Challenge",
    description: "Master a concept well enough to teach it to someone else",
    difficulty: "beginner",
    estimatedHours: 2,
    roles: [
      { key: "learner", name: "Learner", emoji: "📚", description: "Studies the material in depth" },
      { key: "teacher", name: "Teacher", emoji: "👩‍🏫", description: "Explains the concept clearly" },
      { key: "evaluator", name: "Evaluator", emoji: "⭐", description: "Assesses the explanation" },
    ],
    milestones: [
      { id: "m1", title: "Deep Dive", description: "Study the topic thoroughly and take notes", deliverable: "Study notes", xpReward: 40, status: "pending" },
      { id: "m2", title: "Create Explanation", description: "Prepare a clear explanation with examples", deliverable: "Teaching outline", xpReward: 60, status: "pending" },
      { id: "m3", title: "Teach & Get Feedback", description: "Deliver your explanation and refine it", deliverable: "Teaching session", xpReward: 80, status: "pending" },
    ],
    tags: ["teaching", "explanation", "mastery"],
  },
  {
    id: "problem-solving",
    title: "Real-World Problem Solver",
    description: "Apply concepts to solve a realistic problem scenario",
    difficulty: "advanced",
    estimatedHours: 6,
    roles: [
      { key: "analyst", name: "Analyst", emoji: "🔍", description: "Breaks down the problem" },
      { key: "designer", name: "Solution Designer", emoji: "💡", description: "Designs the solution approach" },
      { key: "implementer", name: "Implementer", emoji: "⚙️", description: "Executes the solution" },
      { key: "tester", name: "Tester", emoji: "✅", description: "Validates the results" },
    ],
    milestones: [
      { id: "m1", title: "Problem Analysis", description: "Break down the problem and identify key challenges", deliverable: "Problem breakdown", xpReward: 60, status: "pending" },
      { id: "m2", title: "Solution Design", description: "Explore approaches and select the best one", deliverable: "Solution proposal", xpReward: 80, status: "pending" },
      { id: "m3", title: "Implementation", description: "Build/execute the solution step by step", deliverable: "Working solution", xpReward: 120, status: "pending" },
      { id: "m4", title: "Testing & Reflection", description: "Validate results and reflect on learnings", deliverable: "Test report + reflection", xpReward: 60, status: "pending" },
    ],
    tags: ["problem-solving", "application", "critical-thinking"],
  },
];

/** Get templates for a skill (returns generic + any skill-specific ones) */
export function getTemplatesForSkill(_skillSlug: string): PBLTemplate[] {
  // For now, return generic templates. Can be extended with skill-specific ones.
  return GENERIC_TEMPLATES;
}

// localStorage persistence for PBL projects
const STORAGE_KEY = "pbl-projects";

export interface PBLProject {
  id: string;
  skillSlug: string;
  templateId: string;
  templateTitle: string;
  milestones: PBLMilestone[];
  currentMilestone: number;
  userRole: string;
  createdAt: string;
  updatedAt: string;
}

export function getPBLProjects(skillSlug?: string): PBLProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: PBLProject[] = raw ? JSON.parse(raw) : [];
    return skillSlug ? all.filter((p) => p.skillSlug === skillSlug) : all;
  } catch {
    return [];
  }
}

export function savePBLProject(project: PBLProject) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: PBLProject[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      all[idx] = project;
    } else {
      all.unshift(project);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {
    // Storage full
  }
}

export function createPBLProject(skillSlug: string, template: PBLTemplate, userRole: string): PBLProject {
  const now = new Date().toISOString();
  return {
    id: `pbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    skillSlug,
    templateId: template.id,
    templateTitle: template.title,
    milestones: template.milestones.map((m) => ({ ...m, status: "pending" as const })),
    currentMilestone: 0,
    userRole,
    createdAt: now,
    updatedAt: now,
  };
}
