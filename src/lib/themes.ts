// ─── Rotating daily themes ────────────────────────────────────────────────────
// Each visit has a theme.  The theme rotates by day-of-year so it cycles
// naturally without repeating the same topic day after day.

export interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const THEMES: Theme[] = [
  { id: 'childhood',  name: 'Childhood',      icon: '🌟', description: 'Early years and growing up'           },
  { id: 'family',     name: 'Family',          icon: '❤️', description: 'Family members and relationships'    },
  { id: 'work',       name: 'Work & Skills',   icon: '🔨', description: 'Career and proud accomplishments'    },
  { id: 'music',      name: 'Music',           icon: '🎵', description: 'Favorite songs and music memories'   },
  { id: 'food',       name: 'Food & Senses',   icon: '🍎', description: 'Favorite foods, smells, and tastes'  },
  { id: 'places',     name: 'Special Places',  icon: '🏡', description: 'Places that meant a lot'             },
  { id: 'holidays',   name: 'Holidays',        icon: '🎄', description: 'Celebrations and traditions'         },
  { id: 'pets',       name: 'Pets',            icon: '🐾', description: 'Animal friends and companions'       },
  { id: 'nature',     name: 'Nature',          icon: '🌸', description: 'Outdoors, seasons, and nature'       },
  { id: 'fun',        name: 'Fun Times',       icon: '😄', description: 'Games, hobbies, and laughter'        },
];

export function getThemeForDate(date: Date = new Date()): Theme {
  const start    = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return THEMES[dayOfYear % THEMES.length];
}

export function getThemeById(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

// ─── Scripted fallback exchanges ──────────────────────────────────────────────
// Used when the user has no API key.  These follow all the evidence-based rules:
//   • Never ask "Do you remember?" — state warmly and invite
//   • Validate feelings, never correct
//   • Easy yes/no or either/or choices
//   • Sensory anchors where possible
//   • Short — 1–3 sentences

export interface FallbackExchange {
  message: string;
  suggestions: string[];
}

export const FALLBACK_EXCHANGES: Record<string, FallbackExchange[]> = {
  childhood: [
    {
      message: "I love hearing about when you were young. What was it like where you grew up — more of a busy town, or peaceful countryside?",
      suggestions: ["A small, quiet town", "A busy city", "Out in the countryside", "Tell me more"],
    },
    {
      message: "Those early years shape so much of who we are. Summers must have been something special. Did you love being outdoors?",
      suggestions: ["Oh yes, always outside!", "I preferred indoors", "We had a beautiful yard", "It depended on the weather"],
    },
    {
      message: "It sounds like you had such a rich childhood. I bet there are moments that still make you smile when you think back.",
      suggestions: ["Playing with friends", "Time with my family", "School days", "So many good memories"],
    },
    {
      message: "Those memories are real treasures. You carry them with you every day, even when you don't realize it.",
      suggestions: ["That means a lot", "I love remembering", "Those were good times", "Thank you, Lane"],
    },
  ],
  family: [
    {
      message: "Family is such a treasure. Who in your family always knew how to make you laugh?",
      suggestions: ["My mother", "My father", "A sibling", "One of my children"],
    },
    {
      message: "Family gatherings must have been something special. Was there a favorite meal that always appeared at the table?",
      suggestions: ["Oh yes, there was!", "Sunday dinners were the best", "Holidays had the best food", "Tell me more"],
    },
    {
      message: "The love in a family stays with a person forever. You clearly have a lot of love in your heart.",
      suggestions: ["Family means everything to me", "Those were wonderful times", "I miss those days", "Thank you, Lane"],
    },
    {
      message: "I know the people who love you are so glad to have you in their lives.",
      suggestions: ["That's lovely to hear", "I feel that too", "They mean the world to me", "Thank you"],
    },
  ],
  work: [
    {
      message: "I'd love to hear about your working years. Was there something you were really good at — something that came naturally to you?",
      suggestions: ["Working with people", "Using my hands", "Solving problems", "Teaching or helping others"],
    },
    {
      message: "That sounds like meaningful work. Was there a moment in your career — or even just a regular day — that made you feel really proud?",
      suggestions: ["Yes, I remember one...", "I loved my coworkers", "I worked hard every single day", "Tell me more"],
    },
    {
      message: "The things we do with our hands and hearts leave a lasting mark on the world. You should feel very proud of everything you built.",
      suggestions: ["Thank you, Lane", "I did my best", "It was a good, full life", "I loved that work"],
    },
  ],
  music: [
    {
      message: "Music has such a wonderful way of taking us back. Is there a song that always brings a smile — something from years ago that still feels special?",
      suggestions: ["Yes, there's one song...", "I love so many old songs", "Music always moves me", "I'm not sure which one"],
    },
    {
      message: "Beautiful. Music really does hold our memories. Did you ever love to dance, or perhaps play an instrument?",
      suggestions: ["I loved to dance!", "I played an instrument", "I just loved listening", "We danced at every party"],
    },
    {
      message: "I love imagining you dancing and enjoying music. Those are the best kinds of memories — ones you can almost hear.",
      suggestions: ["Those were wonderful nights", "Music still makes me happy", "I love remembering those times", "Thank you, Lane"],
    },
  ],
  food: [
    {
      message: "Food is such a wonderful way to remember the people we love. Was there a dish that someone special always made — something that felt like home?",
      suggestions: ["My mother's cooking", "A holiday recipe", "Something from my childhood", "Oh, so many dishes!"],
    },
    {
      message: "That sounds absolutely delicious. Is there a smell or taste that instantly takes you back to a happy time?",
      suggestions: ["Fresh baked bread", "A big Sunday dinner", "Something sweet", "The smell of coffee in the morning"],
    },
    {
      message: "Those sensory memories are so powerful. Food really does carry love in it. You have such beautiful memories to treasure.",
      suggestions: ["Food was always special", "I still love those flavors", "Those were good times", "Thank you"],
    },
  ],
  places: [
    {
      message: "Places hold so much of who we are. Is there a special place — maybe from your past — that still feels like home in your heart?",
      suggestions: ["My childhood home", "A favorite vacation spot", "A special town I loved", "A quiet place in nature"],
    },
    {
      message: "That sounds like a beautiful place. What do you remember most about it — the way it looked, how it smelled, or how it made you feel?",
      suggestions: ["The way it looked", "How peaceful it felt", "The people who were there", "The sounds and smells"],
    },
    {
      message: "Places like that stay with us forever. Just hearing you describe it, I can almost picture it. It sounds truly special.",
      suggestions: ["It really was special", "I'd love to go back someday", "Those memories are precious", "Thank you, Lane"],
    },
  ],
  holidays: [
    {
      message: "Holidays are filled with the best kinds of memories. Was there a holiday or celebration that was always your absolute favorite?",
      suggestions: ["Christmas", "Thanksgiving", "Easter", "A birthday celebration"],
    },
    {
      message: "Those celebrations sound wonderful. Did your family have a special tradition that you looked forward to every year?",
      suggestions: ["Yes, we had one!", "We always had a big gathering", "We had a special meal together", "Tell me more"],
    },
    {
      message: "Holiday traditions are like gifts we give to our future selves. It sounds like your family really knew how to celebrate together.",
      suggestions: ["Family made everything special", "I treasure those memories", "Those were magical times", "Thank you, Lane"],
    },
  ],
  pets: [
    {
      message: "Pets hold such a special place in our hearts. Did you ever have a beloved pet — maybe a dog or a cat — who was truly part of the family?",
      suggestions: ["Yes, I had a wonderful dog!", "I had a dear cat", "We had other animals too", "Tell me more"],
    },
    {
      message: "Animals have a wonderful way of loving us completely. What was your favorite thing about your pet — were they sweet, or funny, or very loyal?",
      suggestions: ["So loyal and sweet", "They always made me laugh", "They followed me everywhere", "They were very smart"],
    },
    {
      message: "It sounds like your pet was a true member of the family. The love we share with animals is pure and unconditional — a real gift.",
      suggestions: ["They were family to me", "I still think about them", "Pets are such precious gifts", "Thank you, Lane"],
    },
  ],
  nature: [
    {
      message: "There's something so peaceful about being in nature. Did you have a favorite season — perhaps spring with all the blossoms, or autumn with its colors?",
      suggestions: ["I loved spring!", "Summer was my favorite", "Autumn is so beautiful", "I loved crisp winter days"],
    },
    {
      message: "That's such a beautiful season. Was there a place outdoors — a garden, a park, a river — where you loved to spend time?",
      suggestions: ["In a garden", "Near the water", "Walking in the woods", "In my own backyard"],
    },
    {
      message: "Being close to nature has a way of filling the heart with peace. It sounds like the outdoors has always been a real source of happiness for you.",
      suggestions: ["Nature always healed me", "I still love being outside", "Those were peaceful times", "Thank you, Lane"],
    },
  ],
  fun: [
    {
      message: "Life is sweeter when we make time for fun! What was something you truly loved to do in your free time — something that always brought you joy?",
      suggestions: ["Card games or board games", "Gardening", "Reading", "Sports or being active"],
    },
    {
      message: "That sounds so enjoyable! Did you have friends or family you especially loved sharing those good times with?",
      suggestions: ["My very best friend", "My family, always", "A whole group of friends", "Tell me more"],
    },
    {
      message: "A life with laughter and good company is such a gift. You clearly know how to enjoy the beautiful things. That's something to be very proud of.",
      suggestions: ["Life has been very good", "I do love to laugh", "Good times are everything", "Thank you, Lane"],
    },
  ],
};
