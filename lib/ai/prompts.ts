import { SKILL_BY_ID } from '@/lib/content/skills';
import { ALLOWED_NAMES } from '@/lib/content/wordbank';

const SKILL_GUIDANCE: Record<string, string> = {
  L1: 'type "listen_choose". audioText asks which letter makes a sound (e.g. "Which letter says sss?"). Options are 3 single lowercase letters; answer is one of them.',
  L2: 'type "mcq". Stem: "Blend the sounds: c-a-t. What word?". Use only simple decodable 3-4 letter words (cat, dog, sun, frog). Options are 3 similar short words.',
  L3: 'type "listen_choose". Stem "Tap the word you hear."; audioText "Tap the word: <word>". Answer is a very common sight word (the, said, was, they, because). Options look similar.',
  L4: 'type "mcq". Missing-word sentence: "The goat ate the ___." with 3 similar-looking options.',
  L5: 'type "mcq". Stem contains a 2-3 sentence mini story followed by one who/what/where question. Answer is stated in the story.',
  L6: 'type "mcq". A sentence with a clue, asking how someone felt or what a word means.',
  N1: 'type "listen_choose". audioText "Which number is 14?". Options are numerals as strings (include a reversal like 41 only for teen numbers). Answer is a string numeral 0-20.',
  N2: 'type "numeric". Stem "How many? " followed by 1-20 repeated emoji of ONE kind (🥭, 🍊, ⭐, ⚽). Answer is the exact count.',
  N3: 'type "numeric". Stem exactly like "8 + 5 = ?". Both numbers and the total must be 20 or less.',
  N4: 'type "numeric". Stem exactly like "13 − 6 = ?". All numbers 20 or less; result not negative.',
  N5: 'type "mcq". Stems like "What is the value of 4 in 47?", "How many tens are in 63?", "3 tens and 6 ones make…". Options are numerals.',
  N6: 'type "numeric". One-step story problem with exactly two numbers (20 or less) using clear words like "more" (add) or "left"/"gives away" (subtract).',
};

const LEVEL = { 1: 'easy (first exposure)', 2: 'medium', 3: 'harder (still within the skill)' } as const;

export function exercisePrompt(skillId: string, difficulty: 1 | 2 | 3, count: number, missedTypes?: string[]) {
  const skill = SKILL_BY_ID[skillId];
  return [
    `Write ${count} practice items for a primary-school child in Nigeria.`,
    `Skill: ${skill.id} ${skill.name}. Objective: ${skill.objective}`,
    `Difficulty: ${LEVEL[difficulty]}.`,
    `Item format: ${SKILL_GUIDANCE[skillId]}`,
    missedTypes?.length ? `The group found these item types hard: ${missedTypes.join(', ')}.` : '',
    'Rules:',
    '- Simple English for ages 6-10. Short sentences.',
    `- If you use a name, use only: ${[...ALLOWED_NAMES].slice(0, 6).join(', ')}. No surnames. No real brands, no violence, no religion, no adult themes.`,
    '- Everyday Nigerian settings are welcome (market, farm, school, mangoes, oranges, yams, buses).',
    '- hint: one short helpful sentence that does not give the answer.',
    '- feedbackCorrect: short warm praise. feedbackTryAgain: short kind encouragement. Never say "wrong" or "bad".',
    '- audioText: the words a teacher\'s device should read aloud to the child.',
    '- The answer must be correct. Double-check every answer.',
    'Return JSON only, matching the schema.',
  ].filter(Boolean).join('\n');
}

export const ASSISTANT_SYSTEM_PROMPT = `You are LearnSignal's classroom assistant for a primary teacher.
Rules you must follow:
1. Answer ONLY from the results of the tools you call. Do not guess, estimate or invent learners, numbers or skills.
2. If the tools return no relevant data, reply exactly: "I don't have data for that." and optionally suggest what to assess.
3. Refer to learners ONLY by their code (for example LS-3F9A2C). Never use or invent names.
4. Never infer causes, diagnoses, conditions, intelligence, behaviour or home circumstances. Never use words like dyslexia, disorder, disability, lazy or slow.
5. Use the wording "not yet demonstrated", "developing", "demonstrated consistently", "not enough evidence".
6. For activity requests (e.g. "a 15-minute subtraction activity") you may use general teaching knowledge, but begin that part with "General guidance (not from your class data):".
7. Be brief: short sentences or a short list. Use at most 4 tool calls.
Skill ids: L1 Letter sounds, L2 Blending, L3 Common words, L4 Reading sentences, L5 Comprehension, L6 Inference, N1 Numbers 0-20, N2 Counting, N3 Addition, N4 Subtraction, N5 Place value, N6 Word problems.`;
