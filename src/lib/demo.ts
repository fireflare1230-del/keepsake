/**
 * Demo mode (v1.4): one tap seeds a complete sample family so a judge,
 * teacher, or curious visitor can tour the whole product in a minute,
 * no forms, no setup. Everything is namespaced to one profile id and
 * removable with one tap. Never touches real profiles.
 */

import type { LearnedFact, Profile, ProfileProgress, Visit } from '../types'
import { loadProfiles, setActiveProfile } from './storage'

export const DEMO_PROFILE_ID = 'demo-walter'
const DEMO_FLAG = 'keepsake:demoMode'

export function isDemoActive(): boolean {
  try {
    return (
      localStorage.getItem(DEMO_FLAG) === '1' &&
      loadProfiles().some((p) => p.id === DEMO_PROFILE_ID)
    )
  } catch {
    return false
  }
}

function daysAgo(n: number, hour = 9): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 15, 0, 0)
  return d
}

/** Seeds Walter's family. Existing real profiles are left untouched. */
export function enableDemo(): void {
  const now = new Date().toISOString()

  const profile: Profile = {
    id: DEMO_PROFILE_ID,
    name: 'Walter Hayes (sample)',
    preferredName: 'Walter',
    birthYear: 1946,
    hometown: 'Savannah, Georgia',
    happyMemory:
      'Saturday mornings fishing off the Tybee pier with his brother Gene, splitting a thermos of coffee while the sun came up.',
    family: [
      { id: 'd-p1', name: 'Ruth', relationship: 'Daughter', notes: 'Calls every evening at 7' },
      { id: 'd-p2', name: 'Marcus', relationship: 'Grandson', notes: 'Plays trumpet in the school band' },
      { id: 'd-p3', name: 'Gene', relationship: 'Brother', notes: 'His fishing partner for 60 years' },
    ],
    favoriteMusic: [
      {
        id: 'd-m1',
        title: 'What a Wonderful World, Louis Armstrong',
        youtubeUrl: 'https://www.youtube.com/watch?v=VqhCQZaH4Vs',
        videoId: 'VqhCQZaH4Vs',
      },
    ],
    favorites: {
      sports: ['the Braves'],
      drinks: ['sweet tea'],
      foods: ['shrimp and grits'],
      shows: ['Gunsmoke'],
      hobbies: ['fishing'],
    },
    lifeStory:
      'Grew up two blocks from the Savannah River, one of four boys. Met his wife June at a church picnic in 1967, married 52 years. Worked as a marine mechanic at the port, could fix any engine by ear. Taught all three kids to fish before they could ride bikes.',
    topicsToAvoid: ['June’s passing'],
    factsToReinforce: [
      'Your daughter Ruth calls every evening at 7',
      'Marcus has a band concert coming up, he practices his trumpet just for you',
    ],
    createdAt: daysAgo(21).toISOString(),
    updatedAt: now,
  }

  const visits: Visit[] = [
    {
      id: 'd-v1',
      profileId: DEMO_PROFILE_ID,
      date: daysAgo(0, 9).toISOString(),
      mood: 4,
      theme: 'Music',
      completed: true,
      durationSec: 372,
      mode: 'ai',
      transcript: [
        { role: 'lane', text: 'Good morning, Walter. It’s so good to sit with you today.', ts: daysAgo(0, 9).toISOString() },
        { role: 'patient', text: 'Hello!', ts: daysAgo(0, 9).toISOString() },
        {
          role: 'lane',
          text: 'The music from when we are young stays with us forever. Did you like to sing, or were you more of a listener?',
          suggestions: ['I liked to sing', 'More of a listener', "I'm not sure"],
          ts: daysAgo(0, 9).toISOString(),
        },
        { role: 'patient', text: 'I sang in the church choir, tenor', ts: daysAgo(0, 9).toISOString() },
        {
          role: 'lane',
          text: 'A choir tenor! I can just about hear that sanctuary filling up. Music like that stays in the walls.',
          suggestions: ['It surely does', 'Tell me more', "I'm not sure"],
          ts: daysAgo(0, 9).toISOString(),
        },
        { role: 'patient', text: 'It surely does', ts: daysAgo(0, 9).toISOString() },
      ],
      summary: {
        summary:
          'Walter had a warm, easy visit on the Music theme. He volunteered that he sang tenor in the church choir and his whole tone lifted talking about it. He finished the visit smiling.',
        engagement: 5,
        highlights: [
          'Shared on his own that he sang tenor in the church choir',
          'Hummed along at the mention of Louis Armstrong',
        ],
        flags: [],
        encouragement: 'Music is clearly a golden door for Walter, keep walking through it.',
        generatedBy: 'ai',
      },
      factReinforced: 'Your daughter Ruth calls every evening at 7',
    },
    {
      id: 'd-v2',
      profileId: DEMO_PROFILE_ID,
      date: daysAgo(1, 10).toISOString(),
      mood: 3,
      theme: 'Food & senses',
      completed: true,
      durationSec: 411,
      mode: 'ai',
      transcript: [
        {
          role: 'lane',
          text: 'Sunday dinner smells are the best smells. Are you a sweet tooth or a savory one?',
          suggestions: ['Sweet, always', 'Savory for me', 'Both, honestly'],
          ts: daysAgo(1, 10).toISOString(),
        },
        { role: 'patient', text: 'Savory. My mother made the best shrimp and grits on the coast', ts: daysAgo(1, 10).toISOString() },
      ],
      summary: {
        summary:
          'A steady visit on the Food theme. Walter spoke lovingly about his mother’s cooking and the smell of the Savannah docks. Mood was even; he warmed as the visit went on.',
        engagement: 4,
        highlights: ['Told the story of his mother’s shrimp and grits, unprompted'],
        flags: ['Seemed briefly wistful when supper time came up, worth a gentle eye'],
        encouragement: 'These small daily visits are quietly doing their work.',
        generatedBy: 'ai',
      },
      factReinforced: 'Marcus has a band concert coming up, he practices his trumpet just for you',
    },
    {
      id: 'd-v3',
      profileId: DEMO_PROFILE_ID,
      date: daysAgo(2, 9).toISOString(),
      mood: 5,
      theme: 'Childhood',
      completed: true,
      durationSec: 348,
      mode: 'ai',
      transcript: [
        {
          role: 'lane',
          text: 'When I think of childhood I think of long summer days. Were you more of an outdoors kid or an indoors kid?',
          suggestions: ['Outdoors, always', 'I liked it indoors', "I'm not sure"],
          ts: daysAgo(2, 9).toISOString(),
        },
        { role: 'patient', text: 'Outdoors, always', ts: daysAgo(2, 9).toISOString() },
      ],
      summary: {
        summary:
          'A bright visit on the Childhood theme. Walter was in high spirits and talked about summers on the river with his brothers.',
        engagement: 5,
        highlights: ['Laughed telling a story about his brother Gene and a stolen rowboat'],
        flags: [],
        encouragement: 'Wonderful streak building, the routine is becoming a comfort.',
        generatedBy: 'ai',
      },
    },
    {
      id: 'd-v4',
      profileId: DEMO_PROFILE_ID,
      date: daysAgo(3, 11).toISOString(),
      mood: 4,
      theme: 'Work & pride',
      completed: true,
      durationSec: 296,
      mode: 'ai',
      transcript: [
        {
          role: 'lane',
          text: 'You strike me as somebody who was really good at what they did. Did you work more with your hands or with people?',
          suggestions: ['With my hands', 'With people', 'A bit of both'],
          ts: daysAgo(3, 11).toISOString(),
        },
        { role: 'patient', text: 'With my hands. Engines mostly', ts: daysAgo(3, 11).toISOString() },
      ],
      summary: {
        summary:
          'Walter engaged proudly with the Work theme, describing diagnosing engines by sound alone at the port.',
        engagement: 4,
        highlights: ['“I could tell a bad injector from across the yard.”'],
        flags: [],
        encouragement: 'Pride in good work is a wonderful thread to keep pulling.',
        generatedBy: 'ai',
      },
    },
    {
      id: 'd-v5',
      profileId: DEMO_PROFILE_ID,
      date: daysAgo(5, 9).toISOString(),
      mood: 3,
      theme: 'Places',
      completed: true,
      durationSec: 330,
      mode: 'scripted',
      transcript: [
        {
          role: 'lane',
          text: 'Some houses just feel like home the moment you walk in. Did your favorite house have a good porch or a good yard?',
          suggestions: ['A good porch', 'A good yard', "I'm not sure"],
          ts: daysAgo(5, 9).toISOString(),
        },
        { role: 'patient', text: 'A good porch', ts: daysAgo(5, 9).toISOString() },
      ],
      summary: {
        summary:
          'Walter completed a visit on the theme “Places,” answering 2 times. Mood at check-in: okay.',
        engagement: 3,
        highlights: ['Answered warmly: “A good porch”'],
        flags: [],
        encouragement: 'Showing up is the whole gift, these small visits matter more than they look.',
        generatedBy: 'scripted',
      },
    },
  ]

  const learned: LearnedFact[] = [
    {
      id: 'd-lf1',
      profileId: DEMO_PROFILE_ID,
      category: 'delight',
      value: 'Singing tenor in the church choir',
      quote: 'I sang in the church choir, tenor',
      sourceVisitId: 'd-v1',
      visitDate: daysAgo(0, 9).toISOString(),
      status: 'pending',
    },
    {
      id: 'd-lf2',
      profileId: DEMO_PROFILE_ID,
      category: 'food',
      value: "his mother's shrimp and grits",
      quote: 'My mother made the best shrimp and grits on the coast',
      sourceVisitId: 'd-v2',
      visitDate: daysAgo(1, 10).toISOString(),
      status: 'pending',
    },
    {
      id: 'd-lf3',
      profileId: DEMO_PROFILE_ID,
      category: 'lifeStory',
      value: 'Could diagnose engines by ear at the port',
      quote: 'I could tell a bad injector from across the yard',
      sourceVisitId: 'd-v4',
      visitDate: daysAgo(3, 11).toISOString(),
      status: 'approved',
      decidedAt: daysAgo(3, 12).toISOString(),
    },
  ]

  const progress: ProfileProgress = {
    currentStreak: 4,
    longestStreak: 7,
    lastVisitDate: daysAgo(0).toISOString().slice(0, 10),
    lastThemeIndex: 3,
  }

  try {
    const profiles = loadProfiles().filter((p) => p.id !== DEMO_PROFILE_ID)
    profiles.push(profile)
    localStorage.setItem('keepsake:profiles', JSON.stringify(profiles))
    localStorage.setItem(`keepsake:visits:${DEMO_PROFILE_ID}`, JSON.stringify(visits))
    localStorage.setItem(`keepsake:learned:${DEMO_PROFILE_ID}`, JSON.stringify(learned))
    localStorage.setItem(`keepsake:progress:${DEMO_PROFILE_ID}`, JSON.stringify(progress))
    localStorage.setItem(DEMO_FLAG, '1')
    setActiveProfile(DEMO_PROFILE_ID)
  } catch {
    /* storage full or blocked; demo just doesn't start */
  }
}

/** Removes Walter and everything that was seeded, real data untouched. */
export function disableDemo(): void {
  try {
    localStorage.setItem(
      'keepsake:profiles',
      JSON.stringify(loadProfiles().filter((p) => p.id !== DEMO_PROFILE_ID))
    )
    localStorage.removeItem(`keepsake:visits:${DEMO_PROFILE_ID}`)
    localStorage.removeItem(`keepsake:learned:${DEMO_PROFILE_ID}`)
    localStorage.removeItem(`keepsake:progress:${DEMO_PROFILE_ID}`)
    localStorage.removeItem(`keepsake:draft:${DEMO_PROFILE_ID}`)
    localStorage.removeItem(DEMO_FLAG)
    const remaining = loadProfiles()
    setActiveProfile(remaining[0]?.id ?? '')
    if (!remaining.length) {
      localStorage.setItem('keepsake:app', JSON.stringify({}))
    }
  } catch {
    /* ignore */
  }
}
