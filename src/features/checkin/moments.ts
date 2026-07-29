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
import type { PhotoMeta } from '../../lib/photos'
import type { Favorites, MusicLink, Profile } from '../../types'

export type MomentKind = 'music' | 'favorite' | 'photo'

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

export interface PhotoMoment {
  kind: 'photo'
  photo: PhotoMeta
  /** Lane's warm share line, built from the caption. */
  share: string
  chips: ChipOption[]
}

export type Moment = FavoriteMoment | MusicMoment | PhotoMoment

/** Honest chips for a photo (PDR v1.3 §1.3): feelings and gentle exits. */
export const PHOTO_CHIPS: ChipOption[] = [
  {
    label: "That's a lovely picture",
    ack: 'It really is. Some pictures just hold the warmth right in them.',
  },
  {
    label: 'Tell me about it',
    ack: 'Happily. Every picture like this is a little door into a good day.',
  },
  {
    label: "I'm not sure",
    ack: "That's alright. It's a joy just to look at it together.",
  },
]

function photoMoment(photo: PhotoMeta): PhotoMoment {
  return {
    kind: 'photo',
    photo,
    share: photo.caption
      ? `I found a photo I love: ${photo.caption.replace(/\.?$/, '.')} What a treasure.`
      : 'I found a photo I love. What a treasure to look at together.',
    chips: PHOTO_CHIPS,
  }
}

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
          { label: "That's my team", ack: `Your team, win or lose. ${item} is lucky to have you.` },
          { label: 'I love game day', ack: 'Game day! The crowd, the excitement, everything feels a little bigger.' },
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
          { label: 'That sounds good now', ack: 'It does sound good right now! Maybe one is in order after our visit.' },
          { label: 'I do love that', ack: 'A person of good taste. Some things just hit the spot.' },
          { label: "I'm not sure", ack: "That's alright. It will be there when the mood strikes." },
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
          { label: "It's a good one", ack: 'A good one indeed. The kind that pulls the whole room in.' },
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
          { label: "That's my kind of fun", ack: 'Your kind of fun, and I bet you are good at it too.' },
          { label: 'It makes me smile', ack: 'It makes you smile, and that is the whole point of a pastime.' },
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
 * items across cycles); a photo (v1.3) appears once per cycle too.
 *
 * `photos` arrives from IndexedDB via the caller (this module stays sync).
 */
export function pickMoment(
  profile: Profile,
  visitCount: number,
  photos: PhotoMeta[] = []
): Moment | null {
  const kinds: Moment[] = []

  if (profile.favoriteMusic.length > 0) {
    const song =
      profile.favoriteMusic[
        Math.floor(visitCount / 1) % profile.favoriteMusic.length
      ]
    kinds.push({ kind: 'music', song })
  }

  if (photos.length > 0) {
    kinds.push(photoMoment(photos[visitCount % photos.length]))
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
