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

/**
 * Frontmatter contract for `src/content/blog/*.md`. Everything here is
 * authored by hand in YAML at the top of the post EXCEPT `slug` (derived from
 * the filename) and `readingTime` (computed from the body) — see src/lib/blog.ts.
 */
export interface BlogFrontmatter {
  title: string
  /**
   * Permanent public URL segment, overriding the filename. Set this so the
   * filename can stay organisational while the URL targets search keywords —
   * and so renaming a file never breaks an indexed URL. Once a post is live,
   * treat this as immutable.
   */
  slug?: string
  /**
   * Shorter title for the <title> tag when `title` is long. Google truncates
   * around 60 characters INCLUDING the " | Kamlesh Chhipa" suffix, so a long
   * headline reads fine on the page but gets cut in search results.
   */
  seoTitle?: string
  /** One-line summary — used on cards, meta description, and OG description. */
  description: string
  /** ISO date, e.g. '2026-07-31'. */
  date: string
  /** ISO date; omit until the post is actually revised. */
  updated?: string
  category: string
  tags: string[]
  /** Pins the post to the featured slot on /blog. At most one should be true. */
  featured?: boolean
  /** Set true to keep a post out of the listing, sitemap, and feeds. */
  draft?: boolean
  /** Overrides the auto-generated cover art wording if set. */
  coverTitle?: string
  /**
   * Which schematic the generated cover draws. Omit to infer from
   * category/tags. See src/components/blog/PostCover.tsx.
   */
  cover?: 'pipeline' | 'comparison' | 'layers' | 'timeline'
}

export interface BlogPost extends BlogFrontmatter {
  /** Derived from the filename — the URL is /blog/<slug>. */
  slug: string
  /** Raw markdown body, frontmatter stripped. */
  body: string
  /** Minutes, computed from body word count. */
  readingTime: number
}

/** A heading extracted from a post body, for the table of contents. */
export interface TocEntry {
  id: string
  text: string
  level: 2 | 3
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
