/**
 * Streak milestones (PDR v1.3 §3). Celebrates showing up, never memory.
 * There is deliberately no "streak lost" state anywhere: missing a day
 * simply starts a fresh count, without comment.
 */

export interface Milestone {
  days: number
  emoji: string
  title: string
  line: string
}

export const MILESTONES: Milestone[] = [
  {
    days: 3,
    emoji: '🌱',
    title: 'Three days in a row',
    line: 'A habit is taking root. These minutes are already adding up.',
  },
  {
    days: 7,
    emoji: '☀️',
    title: 'A whole week together',
    line: 'Seven days of showing up. That is what love looks like, daily.',
  },
  {
    days: 14,
    emoji: '🌼',
    title: 'Two weeks of visits',
    line: 'The visit is part of the day now, and the day is better for it.',
  },
  {
    days: 30,
    emoji: '🌻',
    title: 'A whole month',
    line: 'Thirty days of warm minutes. A garden of them, really.',
  },
  {
    days: 60,
    emoji: '🌳',
    title: 'Two months strong',
    line: 'What started as an idea is a tradition now.',
  },
  {
    days: 100,
    emoji: '💛',
    title: 'One hundred days',
    line: 'A hundred visits of kindness. Extraordinary, and quietly so.',
  },
]

/** The milestone landed on exactly today, if any. */
export function milestoneFor(streak: number): Milestone | undefined {
  return MILESTONES.find((m) => m.days === streak)
}

/** All milestones earned at or below the longest streak, for the shelf. */
export function earnedMilestones(longestStreak: number): Milestone[] {
  return MILESTONES.filter((m) => m.days <= longestStreak)
}
