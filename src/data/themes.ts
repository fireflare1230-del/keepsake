/**
 * The rotating reminiscence themes (PRD §8.5) and the scripted playbook
 * used in no-key mode (PRD §8.6).
 *
 * Every scripted line obeys the seven golden rules (§8.1):
 *   - share a memory, never demand one ("share, then invite")
 *   - no "do you remember?" — ever
 *   - lean on the senses; favor early life
 *   - chips offer choices, never blanks; an easy exit is always present
 *   - any answer is a win — each line stands warmly on its own no matter
 *     what the person tapped before it
 */

export interface ScriptedTurn {
  message: string
  suggestions: string[]
}

export interface Theme {
  name: string
  emoji: string
  /** Short friendly line for the topic card. */
  cardLine: string
  turns: ScriptedTurn[]
  /** Warm wrap-up if no gentle fact is available to share. */
  closing: string
}

export const THEMES: Theme[] = [
  {
    name: 'Childhood',
    emoji: '☀️',
    cardLine: 'Sunny days and being young',
    turns: [
      {
        message:
          'I picture you as a lively child. Kids back then knew how to find fun anywhere — a stick, a ball, a whole afternoon.',
        suggestions: ['We played outside', 'I was a quiet one', "I'm not sure"],
      },
      {
        message:
          'Whole days outdoors — grass under bare feet, coming home when the streetlights came on. That is a fine way to grow up.',
        suggestions: ['It sure was', 'We had a creek', 'Tell me more'],
      },
      {
        message:
          'Schooldays had a smell all their own — chalk dust and wooden desks. Some loved school, and some just loved the last bell.',
        suggestions: ['I liked school', 'Recess was best', "I'm not sure"],
      },
    ],
    closing: 'Thank you for sitting in those sunny days with me. It was lovely.',
  },
  {
    name: 'Family',
    emoji: '💛',
    cardLine: 'The people we love',
    turns: [
      {
        message:
          'Family kitchens were the warm heart of the house — somebody always stirring something on the stove, somebody always talking.',
        suggestions: ["My mother's kitchen", 'Sunday dinners', 'Tell me more'],
      },
      {
        message:
          'A big Sunday dinner — the good dishes out, everyone talking over each other. And quiet suppers could be just as sweet.',
        suggestions: ['Big and loud', 'Quiet ones', "I'm not sure"],
      },
      {
        message:
          'Weddings held such joy — the music, the cake, everybody dressed their very best and smiling all day.',
        suggestions: ['Ours was lovely', 'I remember dancing', 'Tell me more'],
      },
    ],
    closing: 'Family is a warm thing to sit and think about. Thank you for this.',
  },
  {
    name: 'Work & pride',
    emoji: '🛠️',
    cardLine: 'Good work, done well',
    turns: [
      {
        message:
          'You strike me as somebody who was really good at what they did. Honest work with your own two hands — there is nothing like it.',
        suggestions: ['I worked hard', 'I was good at my job', 'Tell me more'],
      },
      {
        message:
          'That feeling of making or fixing something, then stepping back to look it over — that quiet, proud feeling. It stays with a person.',
        suggestions: ['I know that feeling', 'I built things', "I'm not sure"],
      },
      {
        message:
          'And the people you worked beside — a good crew makes any job lighter. Coffee breaks, inside jokes, looking out for each other.',
        suggestions: ['We had fun', 'Good people', 'Tell me more'],
      },
    ],
    closing: 'A life of good work is something to be proud of. I loved hearing about it.',
  },
  {
    name: 'Music',
    emoji: '🎵',
    cardLine: 'Songs that stay with us',
    turns: [
      {
        message:
          'The music from when we are young stays with us forever. A radio playing in the kitchen, somebody humming along.',
        suggestions: ['I loved the radio', 'I liked to sing', 'Tell me more'],
      },
      {
        message:
          'And dancing — a crowded hall, the band tuning up, shoes polished for the occasion. Even watching from the side was something.',
        suggestions: ['I liked to dance', 'I watched mostly', "I'm not sure"],
      },
      {
        message:
          'Everybody had one singer whose voice felt like it was just for them. One song that made the whole room go quiet.',
        suggestions: ['I had a favorite', 'Music was everything', 'Tell me more'],
      },
    ],
    closing: 'Music keeps the best days close. Thank you for listening with me.',
  },
  {
    name: 'Food & senses',
    emoji: '🍑',
    cardLine: 'Tastes and smells of home',
    turns: [
      {
        message:
          'Sunday-dinner smells — a roast in the oven, bread rising, something sweet cooling on the windowsill. A house that smells like that is a happy house.',
        suggestions: ['Fried chicken', 'Fresh bread', 'Tell me more'],
      },
      {
        message:
          'Sweet tooth or savory — everybody leans one way. A warm slice of pie, or the crispy corner of the casserole.',
        suggestions: ['Sweet, always', 'Savory for me', "I'm not sure"],
      },
      {
        message:
          'Tomatoes still warm off the vine, peaches in July — nothing from a store ever tasted quite like that.',
        suggestions: ['So true', 'We grew our own', 'Tell me more'],
      },
    ],
    closing: 'Good food and good company — the simple things hold the most. Thank you.',
  },
  {
    name: 'Places',
    emoji: '🏡',
    cardLine: 'The places that felt like home',
    turns: [
      {
        message:
          'Some houses just feel like home the moment you walk in — the creak of a certain floorboard, the light in the kitchen in the afternoon.',
        suggestions: ['Our old house', 'I remember the porch', 'Tell me more'],
      },
      {
        message:
          'The seaside or the countryside — both have their magic. Salt air and gulls, or hay fields and honeysuckle.',
        suggestions: ['The seaside', 'The countryside', "I'm not sure"],
      },
      {
        message:
          'And a town where everybody knew you — waving to neighbors from the porch, the bell on the corner-store door.',
        suggestions: ['Good neighbors', 'Small-town life', 'Tell me more'],
      },
    ],
    closing: 'Home is wherever the heart settles. It was lovely to visit those places with you.',
  },
  {
    name: 'Holidays',
    emoji: '🎄',
    cardLine: 'Celebrations and traditions',
    turns: [
      {
        message:
          'Holidays had their own rhythm — the good tablecloth, the house full of cooking smells, everyone arriving at once with cold cheeks.',
        suggestions: ['Christmas morning', 'Thanksgiving', 'Tell me more'],
      },
      {
        message:
          'Every family had its one tradition — the thing you did every single year, no matter what. Those are the sweetest ones.',
        suggestions: ['We sure did', 'The big dinner', "I'm not sure"],
      },
      {
        message:
          'And the children on a holiday morning — those wide eyes. Nothing in the world beats that.',
        suggestions: ['Pure joy', 'I loved that', 'Tell me more'],
      },
    ],
    closing: 'Celebrations come and go, but the warmth stays. Thank you for sharing it.',
  },
  {
    name: 'Pets',
    emoji: '🐕',
    cardLine: 'Faithful friends',
    turns: [
      {
        message:
          'A faithful dog trotting along beside you — animals just know how to be good company, no words needed.',
        suggestions: ['I had a good dog', 'We had cats', 'Tell me more'],
      },
      {
        message:
          'The way they would wait for you — ears up the second they heard your step on the walk. Loyal to the bone.',
        suggestions: ['Always waiting', 'Such love', "I'm not sure"],
      },
      {
        message:
          'They ask for so little — a scratch behind the ears, a warm spot by your feet — and they give everything back.',
        suggestions: ["That's the truth", 'Sweet creatures', 'Tell me more'],
      },
    ],
    closing: 'Faithful friends leave paw prints that stay. That was a sweet visit.',
  },
  {
    name: 'Nature',
    emoji: '🌱',
    cardLine: 'Gardens and green things',
    turns: [
      {
        message:
          'Fresh tomatoes off the vine and dirt under the fingernails — a garden gives back everything you put into it, and then some.',
        suggestions: ['I was a gardener', 'I loved the yard', 'Tell me more'],
      },
      {
        message:
          'Early morning outside — dew on the grass, the birds just starting up. The world feels brand new at that hour.',
        suggestions: ['Morning person', 'I liked evenings', "I'm not sure"],
      },
      {
        message:
          'Rain on a tin roof, or a big shade tree in August — nature knows how to comfort a person without saying a word.',
        suggestions: ['Rain on the roof', 'That shade tree', 'Tell me more'],
      },
    ],
    closing: 'Green and growing things do the heart good. Thank you for walking there with me.',
  },
  {
    name: 'Fun',
    emoji: '🎈',
    cardLine: 'Just for the joy of it',
    turns: [
      {
        message:
          'Everybody had their thing they did purely for the fun of it — cards on the porch, a fishing line in the water, a drive with the windows down.',
        suggestions: ['Fishing', 'Card games', 'Tell me more'],
      },
      {
        message:
          'A good laugh with old friends — the kind where your sides ache and you cannot even say what started it. Those are the best hours.',
        suggestions: ['We laughed a lot', 'Good friends', "I'm not sure"],
      },
      {
        message:
          'Saturday afternoons were made for it — the matinee at the picture show, the ballgame crackling on the radio, lemonade on the steps.',
        suggestions: ['The picture show', 'The ballgame', 'Tell me more'],
      },
    ],
    closing: 'Fun for its own sake — may there always be more of it. That was a joy.',
  },
]
