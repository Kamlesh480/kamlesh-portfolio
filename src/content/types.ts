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
