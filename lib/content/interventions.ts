// Rule-based intervention templates (master prompt §8). Deterministic; no AI.

export interface InterventionTemplate {
  skillId: string;
  activity: string;
  materials: string;
  exerciseTypes: string;
  successCheck: string;
}

export const INTERVENTIONS: Record<string, InterventionTemplate> = {
  L1: { skillId: 'L1', activity: 'Letter-sound cards: say a sound, the child points to the letter. 8 letters per round.', materials: 'Letter cards (chalk on card is fine)', exerciseTypes: 'listen_choose', successCheck: '4 of 5 correct on two separate days' },
  L2: { skillId: 'L2', activity: 'Sound-by-sound blending with finger tapping on 6 CVC words, then say the whole word.', materials: 'Word list of 6 CVC words', exerciseTypes: 'mcq', successCheck: '4 of 5 words blended correctly' },
  L3: { skillId: 'L3', activity: 'Word-wall flash of 5 high-frequency words; each child uses each word in a spoken sentence.', materials: 'Word wall or flash cards', exerciseTypes: 'listen_choose', successCheck: '4 of 5 recognised instantly' },
  L4: { skillId: 'L4', activity: 'Echo reading then solo reading of a 5–8 word sentence. Praise self-corrections.', materials: 'Sentence strips', exerciseTypes: 'oral reading', successCheck: '≥90% words read correctly' },
  L5: { skillId: 'L5', activity: 'Read a 3-sentence passage together, then ask who / what / where questions and find the answer in the text.', materials: 'Short passage on the board', exerciseTypes: 'mcq', successCheck: '3 of 4 questions correct' },
  L6: { skillId: 'L6', activity: 'Talk about feelings and words in context using a picture or short story; ask "how do you know?"', materials: 'Picture card or short story', exerciseTypes: 'mcq', successCheck: '3 of 4 correct' },
  N1: { skillId: 'N1', activity: 'Number cards 0–20: teacher says a number, children hold up the matching card.', materials: 'Number cards 0–20', exerciseTypes: 'listen_choose', successCheck: '4 of 5 correct' },
  N2: { skillId: 'N2', activity: 'Count real objects (stones, bottle tops), touching each one, then count pictures.', materials: '20 bottle tops or stones per pair', exerciseTypes: 'numeric', successCheck: '4 of 5 counted correctly' },
  N3: { skillId: 'N3', activity: 'Number-line jumps and bottle-top addition within 20; make 10 first for totals above 10.', materials: 'Number line 0–20, bottle tops', exerciseTypes: 'numeric', successCheck: '4 of 5 correct' },
  N4: { skillId: 'N4', activity: 'Take-away with bottle tops, then count backwards on the number line.', materials: 'Bottle tops, number line 0–20', exerciseTypes: 'numeric', successCheck: '4 of 5 correct' },
  N5: { skillId: 'N5', activity: 'Bundles of ten sticks and loose ones: build 2-digit numbers and say tens and ones.', materials: 'Sticks and rubber bands', exerciseTypes: 'mcq', successCheck: '4 of 5 correct' },
  N6: { skillId: 'N6', activity: 'Act out a story problem with objects, then write the number sentence together.', materials: 'Objects to act out the story', exerciseTypes: 'numeric', successCheck: '3 of 4 correct' },
};
