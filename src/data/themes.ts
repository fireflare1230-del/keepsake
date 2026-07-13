/**
 * The rotating reminiscence themes (PRD §8.5) and the scripted playbook
 * used in no-key mode (PRD §8.6).
 *
 * The conversation shape follows published dementia-care practice:
 *
 *  - Share, then invite (Alzheimer Society guidance): Lane offers a small
 *    observation of its own first, then asks an easy preference question.
 *    Never "do you remember".
 *  - Branch on the answer (the "shared experiences" exchange pattern):
 *    every chip carries its own acknowledgment, so Lane's next line
 *    actually responds to what the person chose. No more one-sided chat.
 *  - Mirror their words (validation therapy): acknowledgments rephrase
 *    what the person said to show they were heard.
 *  - Imagination over memory (TimeSlips): some turns ask "beautiful
 *    questions" with no right answer at all.
 *  - Any answer is a win: the easy-exit chip always gets a warm,
 *    no-pressure acknowledgment.
 */

export interface ChipOption {
  /** What the person taps, written in their voice. */
  label: string
  /** Lane's acknowledgment of THIS answer, spoken before the next share. */
  ack: string
}

export interface ScriptedTurn {
  /** Lane's share-then-invite line. */
  share: string
  chips: ChipOption[]
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

/** Acknowledgments for typed (free-text) answers, rotated in order. */
export const FREE_TEXT_ACKS = [
  'I love hearing that.',
  'Thank you for telling me that.',
  'That sounds wonderful.',
  "Now that's a good answer.",
]

export const THEMES: Theme[] = [
  {
    name: 'Childhood',
    emoji: '☀️',
    cardLine: 'Sunny days and being young',
    turns: [
      {
        share:
          'When I think of childhood I think of long summer days that never seemed to end. Were you more of an outdoors kid or an indoors kid?',
        chips: [
          {
            label: 'Outdoors, always',
            ack: 'Outdoors, always. Grass under bare feet and home when the streetlights came on.',
          },
          {
            label: 'I liked it indoors',
            ack: 'Cozy indoors. A good spot by the window and something to do with your hands.',
          },
          {
            label: "I'm not sure",
            ack: "That's just fine. Either way, being little had its own kind of magic.",
          },
        ],
      },
      {
        share:
          'Kids always had their one great game. Ours was hide and seek until dark. What kind of games did you like, running games or quiet ones?',
        chips: [
          {
            label: 'Running games',
            ack: 'Running games! Fast and breathless and laughing the whole way.',
          },
          {
            label: 'Card and board games',
            ack: 'Cards and board games. A little friendly competition around the table.',
          },
          {
            label: 'Tell me more',
            ack: 'Happily. Stickball in the street, jacks on the porch, marbles in the dirt. Simple and perfect.',
          },
        ],
      },
      {
        share:
          'Schooldays had a smell all their own. Chalk dust and wooden desks and paste. Did school suit you, or was the last bell your favorite part?',
        chips: [
          {
            label: 'I liked school',
            ack: 'A school lover. Teachers always know the ones who light up in class.',
          },
          {
            label: 'The last bell!',
            ack: 'The last bell, ha! Freedom never sounded so sweet.',
          },
          {
            label: "I'm not sure",
            ack: 'No matter. The best lessons never came from a chalkboard anyway.',
          },
        ],
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
        share:
          'Family kitchens were the warm heart of the house. Somebody always stirring something, somebody always talking. Was your family the big loud kind or the quiet kind?',
        chips: [
          {
            label: 'Big and loud',
            ack: 'Big and loud! Everyone talking over each other and nobody minding one bit.',
          },
          {
            label: 'Quiet and close',
            ack: 'Quiet and close. Those gentle houses hold just as much love.',
          },
          {
            label: "I'm not sure",
            ack: "That's alright. Every family has its own music.",
          },
        ],
      },
      {
        share:
          'Sunday dinner was an event where I come from. The good dishes out, something roasting all afternoon. What did your family gather around, big dinners or little everyday moments?',
        chips: [
          {
            label: 'Big Sunday dinners',
            ack: 'Big Sunday dinners. The table stretched with every leaf it had.',
          },
          {
            label: 'Little everyday moments',
            ack: 'The little everyday moments. Coffee at the table, a chat on the porch. Those add up to a life.',
          },
          {
            label: 'Tell me more',
            ack: 'With pleasure. In most houses the best seat was wherever the cook was, hoping for a taste of something early.',
          },
        ],
      },
      {
        share:
          'Weddings held such joy. The music, the cake, everybody dressed their very best. Do you like weddings?',
        chips: [
          {
            label: 'I love weddings',
            ack: 'A wedding lover! All that hope and happiness in one room.',
          },
          {
            label: 'Ours was lovely',
            ack: 'Yours was lovely. I can just about hear the music and see the smiles.',
          },
          {
            label: "I'm not sure",
            ack: "That's okay. The love is the part that matters, not the party.",
          },
        ],
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
        share:
          'You strike me as somebody who was really good at what they did. Honest work with your own two hands, there is nothing like it. Did you work more with your hands or with people?',
        chips: [
          {
            label: 'With my hands',
            ack: 'With your hands. Making and fixing real things you could stand back and look at.',
          },
          {
            label: 'With people',
            ack: 'With people. That takes a good ear and a good heart.',
          },
          {
            label: 'A bit of both',
            ack: 'A bit of both, the best kind of work there is.',
          },
        ],
      },
      {
        share:
          'That feeling of finishing a job and stepping back to look it over, that quiet proud feeling. It stays with a person. Were you an early bird at work or the one who stayed late?',
        chips: [
          {
            label: 'Early bird',
            ack: 'An early bird. First one in, coffee brewing while the world was still asleep.',
          },
          {
            label: 'I stayed late',
            ack: 'The one who stayed until it was done right. People count on someone like that.',
          },
          {
            label: "I'm not sure",
            ack: 'Either way, the work got done, and done well I bet.',
          },
        ],
      },
      {
        share:
          'A good crew makes any job lighter. Coffee breaks, inside jokes, looking out for each other. Did you have some good people around you?',
        chips: [
          {
            label: 'The best people',
            ack: 'The best people. A crew like that turns work into something you miss.',
          },
          {
            label: 'We had some laughs',
            ack: 'Some good laughs. The jokes nobody outside the crew would even understand.',
          },
          {
            label: 'Tell me more',
            ack: 'Gladly. Somebody always had the radio going, somebody always brought the good sandwiches.',
          },
        ],
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
        share:
          'The music from when we are young stays with us forever. A radio playing in the kitchen, somebody humming along. Did you like to sing, or were you more of a listener?',
        chips: [
          {
            label: 'I liked to sing',
            ack: 'A singer! In the car, in the kitchen, wherever the song found you.',
          },
          {
            label: 'More of a listener',
            ack: 'A listener. Closing your eyes and letting a good song do its work.',
          },
          {
            label: "I'm not sure",
            ack: 'No matter. Music finds everybody one way or another.',
          },
        ],
      },
      {
        share:
          'And dancing! A crowded hall, the band tuning up, shoes polished for the occasion. Were you out on the floor or happier watching from the side?',
        chips: [
          {
            label: 'Out on the floor',
            ack: 'Out on the floor! I bet you could really move.',
          },
          {
            label: 'Watching from the side',
            ack: 'Watching from the side, with the best view in the house.',
          },
          {
            label: 'Tell me more',
            ack: 'Oh, those dance halls. The whole town showed up and the floor bounced all night.',
          },
        ],
      },
      {
        share:
          'Here is a question I love: what is the most beautiful sound in the world? For me it might be rain starting on a roof.',
        chips: [
          {
            label: 'A baby laughing',
            ack: 'A baby laughing. You may have just won the question.',
          },
          {
            label: 'Church bells',
            ack: 'Church bells on a clear morning. That sound carries for miles and years.',
          },
          {
            label: 'Rain on the roof',
            ack: 'Rain on the roof, so we agree. The coziest sound there is.',
          },
        ],
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
        share:
          'Sunday dinner smells are the best smells. A roast in the oven, bread rising, something sweet cooling on the sill. Are you a sweet tooth or a savory one?',
        chips: [
          {
            label: 'Sweet, always',
            ack: 'Sweet, always! Pie cooling on the windowsill was made for people like you.',
          },
          {
            label: 'Savory for me',
            ack: 'Savory. The crispy corner of the casserole, the salty top of the roast.',
          },
          {
            label: 'Both, honestly',
            ack: 'Both, honestly. A wise answer. Why choose?',
          },
        ],
      },
      {
        share:
          'Nothing from a store ever tasted like a tomato still warm off the vine, or a peach in July. Did your family grow anything, or was the market your garden?',
        chips: [
          {
            label: 'We grew our own',
            ack: 'You grew your own. Dirt under the fingernails and supper from the backyard.',
          },
          {
            label: 'The market for us',
            ack: 'The market. Picking the best of the pile is its own kind of skill.',
          },
          {
            label: "I'm not sure",
            ack: 'Either way, summer fruit tastes like summer. That never changes.',
          },
        ],
      },
      {
        share:
          'And a cold drink on a hot day, there is nothing better. Sweet tea, lemonade, a cold bottle of pop. What hits the spot for you?',
        chips: [
          {
            label: 'Sweet tea',
            ack: 'Sweet tea, made proper. The pitcher sweating on the porch table.',
          },
          {
            label: 'Lemonade',
            ack: 'Lemonade! Tart and cold with the ice clinking.',
          },
          {
            label: 'A cold pop',
            ack: 'A cold bottle of pop from the icebox. That first fizzy sip!',
          },
        ],
      },
    ],
    closing: 'Good food and good company. The simple things hold the most. Thank you.',
  },
  {
    name: 'Places',
    emoji: '🏡',
    cardLine: 'The places that felt like home',
    turns: [
      {
        share:
          'Some houses just feel like home the moment you walk in. The creak of a certain floorboard, the light in the kitchen. For me it is a porch. Did your favorite house have a good porch or a good yard?',
        chips: [
          {
            label: 'A good porch',
            ack: 'A good porch. Evenings out there watching the world slow down.',
          },
          {
            label: 'A good yard',
            ack: 'A good yard. Room to breathe and something always growing.',
          },
          {
            label: "I'm not sure",
            ack: 'Home is home either way. The feeling is what you keep.',
          },
        ],
      },
      {
        share:
          'The seaside or the countryside, both have their magic. Salt air and gulls, or hay fields and honeysuckle. Which one calls to you?',
        chips: [
          {
            label: 'The seaside',
            ack: 'The seaside. Waves coming in steady as a heartbeat.',
          },
          {
            label: 'The countryside',
            ack: 'The countryside. Quiet roads and that sweet green smell after rain.',
          },
          {
            label: 'Both sound lovely',
            ack: 'Both it is. A person needs a little salt and a little green in a life.',
          },
        ],
      },
      {
        share:
          'And a town where everybody knew you. Waving from the porch, the bell on the corner store door. Small town or big city, which was yours?',
        chips: [
          {
            label: 'Small town',
            ack: 'A small town. Where the grocer knew your name and your order.',
          },
          {
            label: 'The big city',
            ack: 'The big city! Lights and noise and something always happening.',
          },
          {
            label: 'Tell me more',
            ack: 'Well, in a small town news traveled faster than the paperboy. Everybody knew everything, and mostly that was nice.',
          },
        ],
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
        share:
          'Holidays had their own rhythm. The good tablecloth, the house full of cooking smells, everyone arriving at once with cold cheeks. Which was the big one in your house, Christmas or Thanksgiving?',
        chips: [
          {
            label: 'Christmas',
            ack: 'Christmas! The tree lit up and the little ones too excited to sleep.',
          },
          {
            label: 'Thanksgiving',
            ack: 'Thanksgiving. The whole day built around one glorious table.',
          },
          {
            label: 'We loved them all',
            ack: 'All of them! A house that celebrates is a happy house.',
          },
        ],
      },
      {
        share:
          'Every family had its one tradition, the thing you did every single year no matter what. Ours was somebody falling asleep in the good chair before dessert. Did your family have traditions like that?',
        chips: [
          {
            label: 'We sure did',
            ack: 'You sure did. Those little rituals are the glue of a family.',
          },
          {
            label: 'The food was ours',
            ack: 'The food! One dish that had to be there or it did not count as a holiday.',
          },
          {
            label: "I'm not sure",
            ack: "That's fine. The warm feeling is the tradition, really.",
          },
        ],
      },
      {
        share:
          'And the children on a holiday morning, those wide eyes. Nothing in the world beats that. What do you love most about a holiday, the food, the people, or the quiet after?',
        chips: [
          {
            label: 'The people',
            ack: 'The people. A full house and every chair taken.',
          },
          {
            label: 'The food',
            ack: 'The food, no shame in that! Holidays taste better than regular days.',
          },
          {
            label: 'The quiet after',
            ack: 'The quiet after. Dishes done, lights low, heart full. You and me both.',
          },
        ],
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
        share:
          'A faithful dog trotting along beside you, or a cat claiming the best chair. Animals just know how to be good company. Were you a dog person or a cat person?',
        chips: [
          {
            label: 'Dog person',
            ack: 'A dog person. Loyal to the bone, both of you I bet.',
          },
          {
            label: 'Cat person',
            ack: 'A cat person. They choose their people carefully, so that says something good about you.',
          },
          {
            label: 'I loved them all',
            ack: 'All of them! A soft heart for every creature. The animals always know.',
          },
        ],
      },
      {
        share:
          'The way they would wait for you, ears up the second they heard your step on the walk. Did you have an animal that followed you everywhere?',
        chips: [
          {
            label: 'Like a shadow',
            ack: 'Like a shadow. Never more than a step behind you.',
          },
          {
            label: 'Ours loved everybody',
            ack: 'One of those sweethearts who loved the whole world. The best kind of greeter.',
          },
          {
            label: "I'm not sure",
            ack: "That's alright. Animals leave soft little prints on a life either way.",
          },
        ],
      },
      {
        share:
          'They ask for so little. A scratch behind the ears, a warm spot by your feet, and they give everything back. What do you think animals understand about us?',
        chips: [
          {
            label: 'More than we know',
            ack: 'More than we know. I think you are exactly right.',
          },
          {
            label: 'They feel our moods',
            ack: 'They feel our moods, do they not? Sad days, they just appear beside you.',
          },
          {
            label: 'Tell me more',
            ack: 'I think they understand the important part: who loves them. And they never forget it.',
          },
        ],
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
        share:
          'Fresh tomatoes off the vine and dirt under the fingernails. A garden gives back everything you put into it. Did you like to grow things, flowers or vegetables?',
        chips: [
          {
            label: 'Vegetables',
            ack: 'Vegetables. Supper straight from the backyard, proud as anything.',
          },
          {
            label: 'Flowers',
            ack: 'Flowers. A little beauty on purpose, that takes a generous heart.',
          },
          {
            label: 'I liked the yard',
            ack: 'A yard person. Fresh air and green grass ask nothing of you but time.',
          },
        ],
      },
      {
        share:
          'Early morning outside, dew on the grass, the birds just starting up. The world feels brand new at that hour. Are you a morning person or an evening person?',
        chips: [
          {
            label: 'Morning person',
            ack: 'A morning person. First light and first coffee, the quietest hour there is.',
          },
          {
            label: 'Evening person',
            ack: 'An evening person. Sunset colors and the day winding down easy.',
          },
          {
            label: "I'm not sure",
            ack: 'Both ends of the day have their gifts. No need to pick.',
          },
        ],
      },
      {
        share:
          'Rain on a tin roof, a big shade tree in August. Nature knows how to comfort a person without saying a word. What is your favorite kind of weather?',
        chips: [
          {
            label: 'A warm sunny day',
            ack: 'A warm sunny day. The kind that pulls everybody outside.',
          },
          {
            label: 'A good rain',
            ack: 'A good rain. Cozy inside while the world gets a drink.',
          },
          {
            label: 'Crisp fall air',
            ack: 'Crisp fall air! Sweater weather and leaves showing off.',
          },
        ],
      },
    ],
    closing: 'Green and growing things do the heart good. Thank you for walking there with me.',
  },
  {
    name: 'Sports & games',
    emoji: '🏈',
    cardLine: 'Game days and glory days',
    turns: [
      {
        share:
          'A ballgame crackling on the radio, the crowd rising all at once. There is nothing like game day. Did you like to play sports or watch them?',
        chips: [
          {
            label: 'I liked to play',
            ack: 'A player! Out there in the thick of it where the fun is.',
          },
          {
            label: 'I liked to watch',
            ack: 'A watcher. Best seat in the house and opinions about every call.',
          },
          {
            label: 'A bit of both',
            ack: 'Play in the morning, watch in the afternoon. The full game-day life.',
          },
        ],
      },
      {
        share:
          'Everybody had their game. Baseball in the summer, football in the fall, maybe bowling on league night. Which one was yours?',
        chips: [
          {
            label: 'Baseball',
            ack: 'Baseball. The crack of the bat and a long summer afternoon.',
          },
          {
            label: 'Football',
            ack: 'Football! Cold air, hot cocoa, and the whole town at the game.',
          },
          {
            label: 'Something else',
            ack: 'Something else, even better. Horseshoes, bowling, fishing derbies, it all counts.',
          },
        ],
      },
      {
        share:
          'And rooting for a team is a lifelong thing. Win or lose, you show up. Were you the calm kind of fan or the yelling-at-the-radio kind?',
        chips: [
          {
            label: 'Calm and steady',
            ack: 'Calm and steady. Quietly confident, even in the ninth inning.',
          },
          {
            label: 'Yelling at the radio!',
            ack: 'Ha! Yelling at the radio. The refs could never hear you but you tried.',
          },
          {
            label: "I'm not sure",
            ack: 'Every fan counts, loud or quiet. The team needed you either way.',
          },
        ],
      },
    ],
    closing: 'Game days are good days. Thank you for playing along with me.',
  },
  {
    name: 'Movies & shows',
    emoji: '🎬',
    cardLine: 'The picture show and the good programs',
    turns: [
      {
        share:
          'Saturday at the picture show. A ticket, some popcorn, and the lights going down. That hush before the movie starts is one of my favorite things. Did you like going to the movies?',
        chips: [
          {
            label: 'I loved the movies',
            ack: 'A movie lover. That big screen made everything feel possible.',
          },
          {
            label: 'We watched at home',
            ack: 'Watching at home, everybody gathered around. The couch was the best seat in town.',
          },
          {
            label: "I'm not sure",
            ack: 'No matter. A good story finds you wherever you sit.',
          },
        ],
      },
      {
        share:
          'Westerns, musicals, comedies that made the whole room laugh. Everybody had their kind of picture. Which kind was yours?',
        chips: [
          {
            label: 'Westerns',
            ack: 'Westerns! Big skies, fast horses, and the good guy winning in the end.',
          },
          {
            label: 'Musicals',
            ack: 'Musicals. All that singing and dancing, you leave the theater lighter than you came.',
          },
          {
            label: 'Comedies',
            ack: 'Comedies. A whole room laughing together is good medicine.',
          },
        ],
      },
      {
        share:
          'And the programs everyone watched, the whole neighborhood talking about the same show the next day. Did your family have a program you never missed?',
        chips: [
          {
            label: 'We never missed it',
            ack: 'Never missed it! Same chairs, same time, the whole family settled in.',
          },
          {
            label: 'The evening news',
            ack: 'The evening news. The whole country sitting down together at the same hour.',
          },
          {
            label: 'Tell me more',
            ack: 'The variety shows were something. Music, jokes, a little of everything, and the whole family found something to love.',
          },
        ],
      },
    ],
    closing: 'A good story shared is twice as good. Thanks for watching the memories with me.',
  },
  {
    name: 'Fun',
    emoji: '🎈',
    cardLine: 'Just for the joy of it',
    turns: [
      {
        share:
          'Everybody had their thing they did purely for the fun of it. Cards on the porch, a fishing line in the water, a drive with the windows down. What sounds most like you?',
        chips: [
          {
            label: 'Fishing',
            ack: 'Fishing. Half the fun was the quiet, and the other half was the story after.',
          },
          {
            label: 'Card games',
            ack: 'Cards! A kitchen table, good company, and somebody keeping score a little too seriously.',
          },
          {
            label: 'A long drive',
            ack: 'A drive with the windows down and the radio up. Freedom on four wheels.',
          },
        ],
      },
      {
        share:
          'A good laugh with old friends, the kind where your sides ache and you cannot even say what started it. Those are the best hours. Who could always make you laugh?',
        chips: [
          {
            label: 'My best friend',
            ack: 'Your best friend. The one who only had to look at you and you both lost it.',
          },
          {
            label: 'Family, always',
            ack: 'Family. The old stories get funnier every single year.',
          },
          {
            label: "I'm not sure",
            ack: "That's okay. The laughs found you, that's what matters.",
          },
        ],
      },
      {
        share:
          'Here is a fun one: if you had a whole free Saturday, sunshine and no chores, what would you do with it, something outdoors or something cozy?',
        chips: [
          {
            label: 'Outdoors all day',
            ack: 'Outdoors all day. Sunshine is not to be wasted.',
          },
          {
            label: 'Cozy at home',
            ack: 'Cozy at home. A soft chair, a warm drink, and not one single chore.',
          },
          {
            label: 'A little of both',
            ack: 'A walk in the morning, a nap in the afternoon. You have this figured out.',
          },
        ],
      },
    ],
    closing: 'Fun for its own sake, may there always be more of it. That was a joy.',
  },
]
