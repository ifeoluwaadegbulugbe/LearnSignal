// Assessment item bank: 9 items per skill (3 per difficulty level).
// ANSWERS LIVE HERE. Only import this file from server code (server actions, route handlers, seed script).
// No runtime imports: this file is also executed by scripts/gen-seed.ts under Node type-stripping.

export type ItemType = 'mcq' | 'numeric' | 'tap_word_sequence' | 'listen_choose';

export interface ItemContent {
  stem: string;
  audioText?: string;
  options?: string[];
  passage?: string;
  words?: string[];
  picture?: string; // emoji string shown above the stem
}

export interface AssessmentItem {
  id: string;
  skillId: string;
  difficulty: 1 | 2 | 3;
  type: ItemType;
  content: ItemContent;
  answer: string | number | { minAccuracy: number };
}

const items: AssessmentItem[] = [];
const counters: Record<string, number> = {};
function add(skillId: string, difficulty: 1 | 2 | 3, type: ItemType, content: ItemContent, answer: AssessmentItem['answer']) {
  const key = `${skillId}-${difficulty}`;
  counters[key] = (counters[key] ?? 0) + 1;
  items.push({ id: `${key}-${counters[key]}`, skillId, difficulty, type, content, answer });
}

// ---------- L1 Letter sounds (listen_choose) ----------
const l1: [1 | 2 | 3, string, string, string[], string][] = [
  [1, 'Which letter says /m/?', 'Which letter says mmm?', ['m', 'n', 'w'], 'm'],
  [1, 'Which letter says /s/?', 'Which letter says sss?', ['s', 'z', 'c'], 's'],
  [1, 'Which letter says /t/?', 'Which letter says t, t, t?', ['t', 'f', 'l'], 't'],
  [2, 'Which letter says /b/?', 'Which letter says b, b, b?', ['d', 'b', 'p'], 'b'],
  [2, 'Which letter says /p/?', 'Which letter says p, p, p?', ['q', 'b', 'p'], 'p'],
  [2, 'Which letter says /d/?', 'Which letter says d, d, d?', ['b', 'g', 'd'], 'd'],
  [3, 'Which letter makes the first sound in "fish"?', 'Which letter makes the first sound in fish?', ['v', 'f', 's'], 'f'],
  [3, 'Which letter makes the first sound in "goat"?', 'Which letter makes the first sound in goat?', ['g', 'j', 'k'], 'g'],
  [3, 'Which letter makes the first sound in "yam"?', 'Which letter makes the first sound in yam?', ['w', 'j', 'y'], 'y'],
];
for (const [d, stem, audioText, options, answer] of l1) add('L1', d, 'listen_choose', { stem, audioText, options }, answer);

// ---------- L2 Blending (mcq) ----------
const l2: [1 | 2 | 3, string, string[], string][] = [
  [1, 'c – a – t', ['cat', 'cot', 'cut'], 'cat'],
  [1, 's – u – n', ['sin', 'sun', 'son'], 'sun'],
  [1, 'p – i – g', ['peg', 'pug', 'pig'], 'pig'],
  [2, 'm – a – p', ['map', 'mop', 'man'], 'map'],
  [2, 'h – e – n', ['hut', 'hen', 'hit'], 'hen'],
  [2, 'b – u – s', ['bag', 'bat', 'bus'], 'bus'],
  [3, 'f – r – o – g', ['frog', 'from', 'fog'], 'frog'],
  [3, 's – t – o – p', ['spot', 'stop', 'step'], 'stop'],
  [3, 'c – l – a – p', ['clip', 'crab', 'clap'], 'clap'],
];
for (const [d, sounds, options, answer] of l2)
  add('L2', d, 'mcq', { stem: `Blend the sounds: ${sounds}. What word?`, audioText: `Blend the sounds: ${sounds.replace(/–/g, ',')}. What word?`, options }, answer);

// ---------- L3 Common words (listen_choose) ----------
const l3: [1 | 2 | 3, string[], string][] = [
  [1, ['the', 'then', 'they'], 'the'],
  [1, ['an', 'and', 'any'], 'and'],
  [1, ['is', 'it', 'in'], 'is'],
  [2, ['sad', 'said', 'sat'], 'said'],
  [2, ['was', 'saw', 'way'], 'was'],
  [2, ['then', 'them', 'they'], 'they'],
  [3, ['became', 'because', 'before'], 'because'],
  [3, ['before', 'became', 'begin'], 'before'],
  [3, ['purple', 'people', 'pebble'], 'people'],
];
for (const [d, options, answer] of l3)
  add('L3', d, 'listen_choose', { stem: 'Tap the word you hear.', audioText: `Tap the word: ${answer}`, options }, answer);

// ---------- L4 Reading short sentences (tap_word_sequence) ----------
const l4: [1 | 2 | 3, string][] = [
  [1, 'I see a cat.'],
  [1, 'The sun is hot.'],
  [1, 'Ada can run.'],
  [2, 'The goat ate the grass.'],
  [2, 'Musa has a red ball.'],
  [2, 'We go to school today.'],
  [3, 'Ngozi and Tolu play in the big yard.'],
  [3, 'The market is busy in the morning.'],
  [3, 'My mother cooks rice and beans at night.'],
];
for (const [d, sentence] of l4)
  add('L4', d, 'tap_word_sequence', { stem: 'Ask the child to read this sentence aloud. Tap each word as it is read.', passage: sentence, words: sentence.split(' ') }, { minAccuracy: 0.9 });

// ---------- L5 Literal comprehension (mcq with passage) ----------
const passages: [1 | 2 | 3, string, [string, string[], string][]][] = [
  [1, 'Ada sells oranges at the market. She has a big basket. Many people buy from her.', [
    ['What did Ada sell?', ['bread', 'oranges', 'fish'], 'oranges'],
    ['Where does Ada sell?', ['at the market', 'at school', 'at the farm'], 'at the market'],
    ['What does Ada have?', ['a small bag', 'a red car', 'a big basket'], 'a big basket'],
  ]],
  [2, 'Musa wakes up early. He feeds the chickens and then walks to school. His teacher smiles at him.', [
    ['What does Musa feed?', ['chickens', 'goats', 'dogs'], 'chickens'],
    ['Where does Musa walk?', ['to the market', 'to school', 'to the river'], 'to school'],
    ['When does Musa wake up?', ['late', 'at noon', 'early'], 'early'],
  ]],
  [3, 'It was raining hard. Tolu stayed inside and read a book. When the rain stopped, she went out to play.', [
    ['Why did Tolu stay inside?', ['she was sick', 'it was raining', 'it was night'], 'it was raining'],
    ['What did Tolu do inside?', ['read a book', 'cooked food', 'slept'], 'read a book'],
    ['When did Tolu go out to play?', ['in the morning', 'before the rain', 'when the rain stopped'], 'when the rain stopped'],
  ]],
];
for (const [d, passage, qs] of passages)
  for (const [stem, options, answer] of qs) add('L5', d, 'mcq', { stem, passage, options }, answer);

// ---------- L6 Inference & vocabulary (mcq) ----------
const l6: [1 | 2 | 3, string, string[], string][] = [
  [1, 'Ada was thrilled. She was…', ['happy', 'sleepy', 'hungry'], 'happy'],
  [1, 'Musa yawned and closed his eyes. He was…', ['angry', 'tired', 'fast'], 'tired'],
  [1, 'The soup was steaming. It was…', ['cold', 'sweet', 'hot'], 'hot'],
  [2, 'Tolu shivered in the cold rain. She felt…', ['cold', 'hot', 'proud'], 'cold'],
  [2, 'The tiny ant carried a crumb. "Tiny" means…', ['very big', 'very small', 'very fast'], 'very small'],
  [2, 'Ngozi won the race and smiled. She felt…', ['sad', 'scared', 'proud'], 'proud'],
  [3, 'The road was crowded with cars and people. "Crowded" means…', ['full', 'empty', 'quiet'], 'full'],
  [3, 'Musa whispered so the baby would not wake. "Whispered" means…', ['shouted', 'spoke softly', 'sang'], 'spoke softly'],
  [3, "Ada's plant drooped because she forgot to water it. \"Drooped\" means…", ['grew tall', 'turned red', 'hung down'], 'hung down'],
];
for (const [d, stem, options, answer] of l6) add('L6', d, 'mcq', { stem, options }, answer);

// ---------- N1 Number recognition (listen_choose) ----------
const n1: [1 | 2 | 3, number, number[]][] = [
  [1, 3, [3, 8, 5, 2]], [1, 7, [1, 7, 4, 9]], [1, 5, [6, 2, 5, 3]],
  [2, 12, [21, 12, 2, 13]], [2, 14, [14, 41, 4, 15]], [2, 11, [10, 1, 11, 17]],
  [3, 17, [71, 7, 16, 17]], [3, 19, [19, 91, 9, 18]], [3, 20, [2, 12, 20, 10]],
];
for (const [d, n, opts] of n1)
  add('N1', d, 'listen_choose', { stem: 'Tap the number you hear.', audioText: `Which number is ${n}?`, options: opts.map(String) }, String(n));

// ---------- N2 Counting (numeric with picture) ----------
const n2: [1 | 2 | 3, string, number, string][] = [
  [1, '🥭', 3, 'mangoes'], [1, '⭐', 5, 'stars'], [1, '🍊', 4, 'oranges'],
  [2, '🥭', 7, 'mangoes'], [2, '⚽', 8, 'balls'], [2, '🍊', 6, 'oranges'],
  [3, '⭐', 12, 'stars'], [3, '🥭', 15, 'mangoes'], [3, '🍊', 18, 'oranges'],
];
for (const [d, e, n, noun] of n2)
  add('N2', d, 'numeric', { stem: `How many ${noun}?`, audioText: `How many ${noun}?`, picture: e.repeat(n) }, n);

// ---------- N3 Addition / N4 Subtraction (numeric) ----------
const n3: [1 | 2 | 3, number, number][] = [[1, 2, 3], [1, 4, 1], [1, 3, 3], [2, 7, 2], [2, 5, 4], [2, 6, 3], [3, 8, 5], [3, 9, 6], [3, 7, 7]];
for (const [d, a, b] of n3) add('N3', d, 'numeric', { stem: `${a} + ${b} = ?`, audioText: `${a} plus ${b}` }, a + b);
const n4: [1 | 2 | 3, number, number][] = [[1, 5, 2], [1, 4, 1], [1, 6, 3], [2, 9, 4], [2, 8, 5], [2, 10, 6], [3, 13, 6], [3, 15, 7], [3, 12, 5]];
for (const [d, a, b] of n4) add('N4', d, 'numeric', { stem: `${a} − ${b} = ?`, audioText: `${a} take away ${b}` }, a - b);

// ---------- N5 Place value (mcq) ----------
const n5: [1 | 2 | 3, string, string[], string][] = [
  [1, 'How many tens are in 34?', ['4', '3', '34'], '3'],
  [1, 'How many ones are in 52?', ['2', '5', '52'], '2'],
  [1, 'How many tens are in 60?', ['0', '60', '6'], '6'],
  [2, 'What is the value of 4 in 47?', ['4', '40', '47'], '40'],
  [2, 'What is the value of 8 in 83?', ['80', '8', '83'], '80'],
  [2, 'What is the value of 2 in 25?', ['25', '2', '20'], '20'],
  [3, '3 tens and 6 ones make…', ['63', '36', '9'], '36'],
  [3, '7 tens and 0 ones make…', ['7', '17', '70'], '70'],
  [3, 'Which number is bigger?', ['58', '85'], '85'],
];
for (const [d, stem, options, answer] of n5) add('N5', d, 'mcq', { stem, options }, answer);

// ---------- N6 Word problems (numeric) ----------
const n6: [1 | 2 | 3, string, number][] = [
  [1, 'Ada has 3 oranges. She gets 2 more. How many oranges does she have now?', 5],
  [1, 'Musa has 6 sweets and eats 2. How many sweets are left?', 4],
  [1, 'There are 4 goats. 3 more goats come. How many goats are there?', 7],
  [2, 'Tolu has 12 sweets and gives 5 away. How many sweets are left?', 7],
  [2, 'Ngozi buys 9 eggs, then 6 more. How many eggs does she have?', 15],
  [2, 'A bus has 14 people. 4 people get off. How many are on the bus now?', 10],
  [3, 'Ada gave away 5 mangoes and has 8 left. How many did she have at first?', 13],
  [3, 'Musa has 7 pencils. Tolu has 5 more than Musa. How many pencils does Tolu have?', 12],
  [3, 'There are 18 chairs and 11 children sit down. How many chairs are empty?', 7],
];
for (const [d, stem, answer] of n6) add('N6', d, 'numeric', { stem, audioText: stem }, answer);

export const ITEMS: AssessmentItem[] = items;
export const ITEM_BY_ID: Record<string, AssessmentItem> = Object.fromEntries(items.map((i) => [i.id, i]));
