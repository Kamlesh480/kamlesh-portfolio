export interface ExperienceEntry {
  slug: string
  company: string
  role: string
  location: string
  /** Optional: omit entirely for entries that should show no dates (e.g.
   * personal projects framed without an employment timeline). */
  range?: { start: string; end: string | 'Present' }
  summary: string
  highlights: string[]
  stack: string[]
}

export type SkillCategory = 'backend' | 'data-ai' | 'frontend' | 'cloud-devops'

export interface SkillEntry {
  id: string
  label: string
  category: SkillCategory
}

export interface SkillGroup {
  category: SkillCategory
  label: string
  description: string
  skills: string[]
}

export interface ProjectChallenge {
  title: string
  description: string
}

/** One option that was on the table for a DecisionRecord. */
export interface DecisionOption {
  label: string
  note: string
  /** Exactly one option per record should be the chosen path. */
  chosen?: boolean
}

/**
 * An architecture decision record — the reasoning behind a system choice that
 * already shipped. Every field must be traceable to the same source documents
 * that govern `experience.ts`/`projects.ts` (see the Content Accuracy Rule):
 * these describe decisions actually made, not hypothetical designs.
 */
export interface DecisionRecord {
  slug: string
  title: string
  /** Where the decision was made, e.g. 'BrightEdge · AI Hyper Cube'. */
  context: string
  problem: string
  options: DecisionOption[]
  decision: string
  /** What was deliberately given up — a record with no cost isn't a decision. */
  tradeoff: string
  outcomes: string[]
}

export interface ProjectEntry {
  slug: string
  title: string
  role: string
  /** Optional: omit entirely for entries that should show no dates. */
  period?: string
  summary: string
  problem: string
  solution: string
  stack: string[]
  outcomes: string[]
  challenges?: ProjectChallenge[]
}
