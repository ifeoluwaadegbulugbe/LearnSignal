// Built-in (seeded) practice sets: one approved set per skill and difficulty 1–2.
// Used as the visible fallback when AI is disabled, rate-limited, or its output fails validation.
// No runtime imports (read by scripts/gen-seed.ts).

export interface SeedExercise {
  type: 'mcq' | 'numeric' | 'listen_choose';
  stem: string;
  audioText?: string;
  options?: string[];
  answer: string | number;
  hint: string;
  feedbackCorrect: string;
  feedbackTryAgain: string;
  source?: 'seed' | 'ai';
}
export interface SeedExerciseSet { id: string; skillId: string; difficulty: 1 | 2 | 3; items: SeedExercise[] }

const ok = ['Well done!', 'Great work!', 'Yes, that is right!', 'You did it!', 'Super!'];
const fb = (i: number) => ({ feedbackCorrect: ok[i % ok.length], feedbackTryAgain: 'Nice try. Look again and have another go.' });

const sets: SeedExerciseSet[] = [];

// ---- Literacy (hand-written) ----
const letter = (sound: string, say: string, options: string[], answer: string, hint: string, i: number): SeedExercise =>
  ({ type: 'listen_choose', stem: `Which letter says /${sound}/?`, audioText: `Which letter says ${say}?`, options, answer, hint, ...fb(i) });
sets.push({ id: 'seed-L1-1', skillId: 'L1', difficulty: 1, items: [
  letter('a', 'a, a, apple', ['a', 'e', 'o'], 'a', 'Open your mouth wide: a, a.', 0),
  letter('m', 'mmm', ['n', 'm', 'w'], 'm', 'Close your lips and hum: mmm.', 1),
  letter('s', 'sss', ['s', 'z', 'x'], 's', 'It sounds like a snake: sss.', 2),
  letter('t', 't, t, t', ['l', 'f', 't'], 't', 'Tap your tongue behind your teeth: t.', 3),
  letter('p', 'p, p, p', ['p', 'q', 'b'], 'p', 'Pop your lips: p.', 4),
]});

const blend = (sounds: string, options: string[], answer: string, i: number): SeedExercise =>
  ({ type: 'mcq', stem: `Blend the sounds: ${sounds}. What word?`, audioText: `Blend the sounds: ${sounds.replace(/-/g, ',')}`, options, answer, hint: 'Say each sound, then say them faster and join them.', ...fb(i) });
sets.push({ id: 'seed-L2-1', skillId: 'L2', difficulty: 1, items: [
  blend('h-a-t', ['hat', 'hot', 'hit'], 'hat', 0), blend('d-o-g', ['dig', 'dog', 'dug'], 'dog', 1), blend('b-e-d', ['bad', 'bud', 'bed'], 'bed', 2),
  blend('c-u-p', ['cup', 'cap', 'cop'], 'cup', 3), blend('f-i-n', ['fan', 'fin', 'fun'], 'fin', 4),
]});

const sight = (options: string[], answer: string, i: number): SeedExercise =>
  ({ type: 'listen_choose', stem: 'Tap the word you hear.', audioText: `Tap the word: ${answer}`, options, answer, hint: 'Look at the first and last letters.', ...fb(i) });
sets.push({ id: 'seed-L3-1', skillId: 'L3', difficulty: 1, items: [
  sight(['to', 'the', 'then'], 'the', 0), sight(['we', 'me', 'be'], 'we', 1), sight(['go', 'no', 'so'], 'go', 2),
  sight(['you', 'yes', 'your'], 'you', 3), sight(['are', 'all', 'and'], 'are', 4),
]});

const missing = (stem: string, options: string[], answer: string, i: number): SeedExercise =>
  ({ type: 'mcq', stem, audioText: stem.replace('___', 'blank'), options, answer, hint: 'Read the sentence with each word. Which one makes sense?', ...fb(i) });
sets.push({ id: 'seed-L4-1', skillId: 'L4', difficulty: 1, items: [
  missing('The goat ate the ___.', ['grass', 'glass', 'gas'], 'grass', 0),
  missing('I can see the ___ in the sky.', ['sun', 'sit', 'sum'], 'sun', 1),
  missing('Ada has a red ___.', ['ball', 'bell', 'bill'], 'ball', 2),
  missing('We go to ___ every day.', ['school', 'skull', 'scale'], 'school', 3),
  missing('The cat is on the ___.', ['mat', 'met', 'mud'], 'mat', 4),
]});

const passage = 'Tolu has a small farm. She grows yams and maize. Every morning she waters the plants.';
const comp = (q: string, options: string[], answer: string, i: number): SeedExercise =>
  ({ type: 'mcq', stem: `${passage} ${q}`.slice(0, 160), audioText: `${passage} ${q}`.slice(0, 160), options, answer, hint: 'Read the story again and find the answer.', ...fb(i) });
sets.push({ id: 'seed-L5-1', skillId: 'L5', difficulty: 1, items: [
  comp('What does Tolu have?', ['a small farm', 'a big car', 'a shop'], 'a small farm', 0),
  comp('What does she grow?', ['rice and beans', 'yams and maize', 'oranges'], 'yams and maize', 1),
  comp('When does she water?', ['every night', 'every morning', 'on Sunday'], 'every morning', 2),
  comp('What does she water?', ['the plants', 'the goats', 'the road'], 'the plants', 3),
  comp('Is the farm big or small?', ['big', 'small'], 'small', 4),
]});

const infer = (stem: string, options: string[], answer: string, i: number): SeedExercise =>
  ({ type: 'mcq', stem, audioText: stem, options, answer, hint: 'What clue in the sentence helps you?', ...fb(i) });
sets.push({ id: 'seed-L6-1', skillId: 'L6', difficulty: 1, items: [
  infer('Musa laughed and jumped up and down. He felt…', ['happy', 'sad', 'sleepy'], 'happy', 0),
  infer('Ngozi drank three cups of water. She was…', ['thirsty', 'cold', 'late'], 'thirsty', 1),
  infer('The baby cried for her mother. She was…', ['upset', 'proud', 'fast'], 'upset', 2),
  infer('The huge tree was taller than the house. "Huge" means…', ['very big', 'very small', 'very old'], 'very big', 3),
  infer('Ada rushed to catch the bus. "Rushed" means…', ['moved fast', 'sat down', 'sang'], 'moved fast', 4),
]});

// ---- Numeracy (generated, answers computed) ----
sets.push({ id: 'seed-N1-1', skillId: 'N1', difficulty: 1, items: [4, 9, 6, 13, 15].map((n, i) => ({
  type: 'listen_choose' as const, stem: 'Tap the number you hear.', audioText: `Which number is ${n}?`,
  options: [n, n + 1, n > 10 ? n - 10 : n + 10].map(String).sort(), answer: String(n), hint: 'Listen again. Does it start with "ten"?', ...fb(i) })) });

const things = ['🥭', '⭐', '🍊', '⚽', '🥭'];
sets.push({ id: 'seed-N2-1', skillId: 'N2', difficulty: 1, items: [3, 5, 6, 4, 8].map((n, i) => ({
  type: 'numeric' as const, stem: `How many? ${things[i].repeat(n)}`, audioText: 'How many can you count?', answer: n,
  hint: 'Touch each one as you count.', ...fb(i) })) });

sets.push({ id: 'seed-N3-1', skillId: 'N3', difficulty: 1, items: [[2, 2], [3, 4], [5, 1], [6, 2], [4, 4]].map(([a, b], i) => ({
  type: 'numeric' as const, stem: `${a} + ${b} = ?`, audioText: `${a} plus ${b}`, answer: a + b, hint: `Start at ${a} and count on ${b}.`, ...fb(i) })) });
sets.push({ id: 'seed-N3-2', skillId: 'N3', difficulty: 2, items: [[8, 3], [7, 5], [9, 4], [6, 6], [8, 7]].map(([a, b], i) => ({
  type: 'numeric' as const, stem: `${a} + ${b} = ?`, audioText: `${a} plus ${b}`, answer: a + b, hint: `Make 10 first: ${a} + ${10 - a} = 10.`, ...fb(i) })) });

sets.push({ id: 'seed-N4-1', skillId: 'N4', difficulty: 1, items: [[5, 1], [7, 3], [6, 2], [9, 5], [8, 4]].map(([a, b], i) => ({
  type: 'numeric' as const, stem: `${a} − ${b} = ?`, audioText: `${a} take away ${b}`, answer: a - b, hint: `Start at ${a} and count back ${b}.`, ...fb(i) })) });
sets.push({ id: 'seed-N4-2', skillId: 'N4', difficulty: 2, items: [[12, 4], [14, 6], [11, 3], [15, 8], [13, 5]].map(([a, b], i) => ({
  type: 'numeric' as const, stem: `${a} − ${b} = ?`, audioText: `${a} take away ${b}`, answer: a - b, hint: `Take away ${a - 10} to get to 10 first.`, ...fb(i) })) });

sets.push({ id: 'seed-N5-1', skillId: 'N5', difficulty: 1, items: [26, 41, 58, 73, 69].map((n, i) => ({
  type: 'mcq' as const, stem: `What is the value of ${Math.floor(n / 10)} in ${n}?`, audioText: `What is the value of ${Math.floor(n / 10)} in ${n}?`,
  options: [String(Math.floor(n / 10)), String(Math.floor(n / 10) * 10), String(n)], answer: String(Math.floor(n / 10) * 10),
  hint: 'The first digit tells you how many tens.', ...fb(i) })) });

const wp: [string, number][] = [
  ['Ada has 4 mangoes. She gets 3 more. How many mangoes now?', 7],
  ['Musa has 9 marbles. He gives 4 away. How many are left?', 5],
  ['There are 5 hens. 5 more hens come. How many hens now?', 10],
  ['Ngozi has 8 sweets. She eats 2. How many are left?', 6],
  ['Tolu has 6 pencils. She buys 6 more. How many pencils now?', 12],
];
sets.push({ id: 'seed-N6-1', skillId: 'N6', difficulty: 1, items: wp.map(([stem, answer], i) => ({
  type: 'numeric' as const, stem, audioText: stem, answer, hint: 'Is the number getting bigger or smaller?', ...fb(i) })) });

export const SEED_EXERCISE_SETS: SeedExerciseSet[] = sets.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it, source: 'seed' as const })) }));
export const seedSetFor = (skillId: string, difficulty: number) =>
  SEED_EXERCISE_SETS.find((s) => s.skillId === skillId && s.difficulty === difficulty) ??
  SEED_EXERCISE_SETS.find((s) => s.skillId === skillId)!;
