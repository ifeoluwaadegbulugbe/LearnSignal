// Skill ladder reference data. Order (sequence) = foundational order.
// No imports here: this file is also read by scripts/gen-seed.ts under Node type-stripping.

export type Strand = 'literacy' | 'numeracy';
export type SkillId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6';

export interface Skill {
  id: SkillId;
  strand: Strand;
  sequence: number;
  name: string;
  shortName: string;
  objective: string;
  masteryIndicators: string[];
  difficultyIndicators: string[];
}

export const SKILLS: Skill[] = [
  {
    id: 'L1', strand: 'literacy', sequence: 1, name: 'Letter names & sounds', shortName: 'Letter sounds',
    objective: 'Match a spoken letter sound to the written letter.',
    masteryIndicators: ['Picks the correct letter for a sound without hesitation', 'Knows the first sound of familiar words'],
    difficultyIndicators: ['Confuses b/d/p or m/n', 'Says letter names but not sounds'],
  },
  {
    id: 'L2', strand: 'literacy', sequence: 2, name: 'Blending sounds into simple words (CVC)', shortName: 'Blending',
    objective: 'Blend 3–4 separate sounds into a simple word such as c-a-t.',
    masteryIndicators: ['Blends three sounds into a word', 'Blends words with a consonant cluster (s-t-o-p)'],
    difficultyIndicators: ['Says the sounds but cannot join them', 'Guesses from the first letter'],
  },
  {
    id: 'L3', strand: 'literacy', sequence: 3, name: 'Common word recognition', shortName: 'Common words',
    objective: 'Recognise high-frequency words by sight.',
    masteryIndicators: ['Recognises common words instantly', 'Distinguishes similar-looking words'],
    difficultyIndicators: ['Sounds out every word slowly', 'Confuses words with the same first letter'],
  },
  {
    id: 'L4', strand: 'literacy', sequence: 4, name: 'Reading short sentences (accuracy & pace)', shortName: 'Sentences',
    objective: 'Read a short sentence aloud with at least 90% accuracy.',
    masteryIndicators: ['Reads 5–8 word sentences with ≥90% accuracy', 'Self-corrects mistakes'],
    difficultyIndicators: ['Omits or substitutes words', 'Reads word by word with long pauses'],
  },
  {
    id: 'L5', strand: 'literacy', sequence: 5, name: 'Literal comprehension of a short passage', shortName: 'Comprehension',
    objective: 'Answer who/what/where questions about a 3-sentence passage.',
    masteryIndicators: ['Answers literal questions correctly', 'Points to the sentence with the answer'],
    difficultyIndicators: ['Answers from guessing, not the text', 'Reads accurately but recalls little'],
  },
  {
    id: 'L6', strand: 'literacy', sequence: 6, name: 'Inference & vocabulary in context', shortName: 'Inference',
    objective: 'Work out feelings or word meanings from clues in a sentence.',
    masteryIndicators: ['Infers feelings from actions', 'Explains a new word using the sentence'],
    difficultyIndicators: ['Takes words only literally', 'Ignores clues in the sentence'],
  },
  {
    id: 'N1', strand: 'numeracy', sequence: 1, name: 'Number recognition 0–20', shortName: 'Numbers 0–20',
    objective: 'Match a spoken number from 0 to 20 to its written numeral.',
    masteryIndicators: ['Identifies numerals 0–20', 'Does not reverse teen numbers (17 vs 71)'],
    difficultyIndicators: ['Confuses teen numbers', 'Recognises only 0–10'],
  },
  {
    id: 'N2', strand: 'numeracy', sequence: 2, name: 'Counting & quantity to 20', shortName: 'Counting',
    objective: 'Count a set of up to 20 objects and say how many.',
    masteryIndicators: ['Counts with one-to-one correspondence', 'Knows the last number counted is the total'],
    difficultyIndicators: ['Skips or double-counts objects', 'Recounts from one every time'],
  },
  {
    id: 'N3', strand: 'numeracy', sequence: 3, name: 'Addition within 20', shortName: 'Addition',
    objective: 'Add two numbers with a total of 20 or less.',
    masteryIndicators: ['Adds within 10 fluently', 'Bridges through 10 (8 + 5)'],
    difficultyIndicators: ['Counts all from one', 'Errors when the total passes 10'],
  },
  {
    id: 'N4', strand: 'numeracy', sequence: 4, name: 'Subtraction within 20', shortName: 'Subtraction',
    objective: 'Subtract within 20.',
    masteryIndicators: ['Subtracts within 10 fluently', 'Subtracts across 10 (13 − 6)'],
    difficultyIndicators: ['Adds instead of subtracting', 'Off-by-one counting back'],
  },
  {
    id: 'N5', strand: 'numeracy', sequence: 5, name: 'Place value (tens and ones to 99)', shortName: 'Place value',
    objective: 'Explain the value of each digit in a 2-digit number.',
    masteryIndicators: ['Knows 4 in 47 means 40', 'Builds a number from tens and ones'],
    difficultyIndicators: ['Reads digits as separate numbers', 'Reverses digits'],
  },
  {
    id: 'N6', strand: 'numeracy', sequence: 6, name: 'Simple word problems (one step)', shortName: 'Word problems',
    objective: 'Solve a one-step add or subtract story problem within 20.',
    masteryIndicators: ['Chooses the right operation', 'Explains the number sentence'],
    difficultyIndicators: ['Uses every number with +', 'Struggles to retell the story'],
  },
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const skillsForStrand = (strand: Strand) =>
  SKILLS.filter((s) => s.strand === strand).sort((a, b) => a.sequence - b.sequence);
export const isSkillId = (v: string): v is SkillId => v in SKILL_BY_ID;
