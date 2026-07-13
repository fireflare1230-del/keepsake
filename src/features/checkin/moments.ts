/**
 * The rotating "special moment" of a visit (v1.1).
 *
 * Music used to be the only mid-visit moment. Now the moment rotates
 * through whatever the profile offers: a favorite song one day, a warm
 * chat about their team the next, a favorite food or show after that.
 * Same calm shape every time: Lane shares, the person taps, Lane
 * responds, done. Nothing to get wrong.
 */

import type { ChipOption } from '../../data/themes'
import type { Favorites, MusicLink, Profile } from '../../types'

export type MomentKind = 'music' | 'favorite'

export interface FavoriteMoment {
  kind: 'favorite'
  category: keyof Favorites
  item: string
  share: string
  chips: ChipOption[]
}

export interface MusicMoment {
  kind: 'music'
  song: MusicLink
}

export type Moment = FavoriteMoment | MusicMoment

/** Warm share-then-invite templates per favorites category. */
function favoriteMoment(category: keyof Favorites, item: string): FavoriteMoment {
  switch (category) {
    case 'sports':
      return {
        kind: 'favorite',
        category,
        item,
        share: `I hear ${item} is your team. A big game on, the crowd roaring, everybody on their feet. That feeling never gets old.`,
        chips: [
          { label: 'We watched every game', ack: 'Every game! A true fan, through thick and thin.' },
          { label: "They're my team", ack: `Your team, win or lose. ${item} is lucky to have you.` },
          { label: "I'm not sure", ack: "That's alright. A good game is good company either way." },
        ],
      }
    case 'drinks':
      return {
        kind: 'favorite',
        category,
        item,
        share: `Somebody told me you are partial to ${item}. Now that is a person of good taste. Just thinking about it is refreshing.`,
        chips: [
          { label: 'My favorite', ack: 'Your favorite, and rightly so. Some things just hit the spot.' },
          { label: 'Nothing better', ack: 'Nothing better, especially on the right kind of day.' },
          { label: 'That sounds good now', ack: 'It does sound good right now! Maybe one is in order after our visit.' },
        ],
      }
    case 'foods':
      return {
        kind: 'favorite',
        category,
        item,
        share: `I heard that ${item} is a favorite of yours. I can just about smell it from here. Food like that is love you can taste.`,
        chips: [
          { label: 'The very best', ack: 'The very best. Made right, nothing comes close.' },
          { label: 'My mouth is watering', ack: 'Mine too! Now we are both hungry, ha.' },
          { label: "I'm not sure", ack: "That's okay. Good food finds us when we need it." },
        ],
      }
    case 'shows':
      return {
        kind: 'favorite',
        category,
        item,
        share: `I hear you are a fan of ${item}. The good ones pull the whole room in, everybody quiet and watching together.`,
        chips: [
          { label: 'I love it', ack: 'A favorite for good reason. The good ones never wear out.' },
          { label: 'We always watched it', ack: 'Always watched it, same time, same chairs. A little ritual of joy.' },
          { label: 'Tell me more', ack: 'The best stories feel like old friends. You can visit them a hundred times and they are always glad to see you.' },
        ],
      }
    case 'hobbies':
      return {
        kind: 'favorite',
        category,
        item,
        share: `I hear ${item} is your kind of fun. The things we do just for the joy of it say a lot about a person.`,
        chips: [
          { label: 'I loved it', ack: 'Loved it, and I bet you were good at it too.' },
          { label: 'Many happy hours', ack: 'Many happy hours. Time spent that way is never wasted.' },
          { label: "I'm not sure", ack: "No matter. The joy is the point, and you clearly found it." },
        ],
      }
  }
}

const CATEGORY_ORDER: (keyof Favorites)[] = [
  'sports',
  'drinks',
  'foods',
  'shows',
  'hobbies',
]

/**
 * Builds the rotation of available moments for a profile, then picks
 * today's by visit count. Music appears once per cycle; each favorites
 * category with entries appears once per cycle (rotating through its own
 * items across cycles).
 */
export function pickMoment(profile: Profile, visitCount: number): Moment | null {
  const kinds: Moment[] = []

  if (profile.favoriteMusic.length > 0) {
    const song =
      profile.favoriteMusic[
        Math.floor(visitCount / 1) % profile.favoriteMusic.length
      ]
    kinds.push({ kind: 'music', song })
  }

  for (const category of CATEGORY_ORDER) {
    const items = profile.favorites[category]
    if (items.length > 0) {
      const item = items[visitCount % items.length]
      kinds.push(favoriteMoment(category, item))
    }
  }

  if (kinds.length === 0) return null
  return kinds[visitCount % kinds.length]
}
