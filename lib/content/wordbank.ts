// Curated word banks and content lists used by lib/ai/validate.ts.

// L2: decodable CVC / CCVC words children can blend.
export const CVC_WORDS = new Set(
  `cat bat hat mat rat sat pat map cap tap nap lap gap van can fan man pan ran tan bag rag tag wag jam ham yam dad pad sad
   bed red fed led wed hen pen ten men net pet wet jet set leg peg beg web yes
   pig big dig wig fig bin pin tin win fin sit hit bit fit kit lip hip dip zip six mix fix lid kid
   dog log fog hog jog pot hot dot cot not got top hop mop pop box fox ox rod nod
   bus cup pup sun run fun bun hut nut cut mud bug hug jug mug rug tub rub sub
   frog stop clap clip crab drum flag flat plan slip spot step swim trap trip snap spin skip grab grin plum`
    .split(/\s+/).filter(Boolean),
);

// L3: high-frequency sight words.
export const SIGHT_WORDS = new Set(
  `the a and is it in to of he she we me be you they was said are have has do does go no so my by
   see look come some one two here there where what when who why this that then them their with for from
   all can like play said because before people little could would should about after again over under
   going went came made make said into very your our out down little big one were been many any begin became
   then them they these those every there's said`.split(/\s+/).filter(Boolean),
);

export const LETTERS = new Set('abcdefghijklmnopqrstuvwxyz'.split(''));

// Friendly Nigerian first names allowed in generated content (no other personal names).
export const ALLOWED_NAMES = new Set(['Ada', 'Tolu', 'Musa', 'Ngozi', 'Emeka', 'Aisha', 'Bayo', 'Chika', 'Femi', 'Zainab']);

// Capitalised words allowed mid-sentence that are not names.
export const ALLOWED_CAPITALISED = new Set(['I', 'Mrs', 'Mr', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Nigeria', 'Lagos', 'Kano', 'Abuja']);

// Words that must never appear in child-facing content.
export const BANNED_WORDS = [
  'kill', 'killed', 'gun', 'guns', 'knife', 'blood', 'dead', 'death', 'die', 'died', 'war', 'fight', 'beat', 'beaten', 'stab',
  'beer', 'wine', 'alcohol', 'cigarette', 'smoke', 'drug', 'drugs', 'sex', 'sexy', 'kiss', 'naked', 'stupid', 'dumb', 'idiot', 'ugly', 'fat',
  'hate', 'devil', 'witch', 'god', 'allah', 'church', 'mosque', 'bet', 'betting', 'gamble', 'casino',
  'coca-cola', 'coke', 'pepsi', 'indomie', 'mcdonalds', "mcdonald's", 'kfc', 'nike', 'adidas', 'samsung', 'iphone', 'mtn', 'glo', 'airtel', 'dangote', 'milo', 'peak', 'dano',
  'dyslexia', 'dyslexic', 'disorder', 'disability', 'disabled', 'adhd', 'autism', 'autistic', 'retarded', 'slow learner',
];

// Max words per sentence by difficulty (reading-level guard).
export const MAX_WORDS_PER_SENTENCE: Record<number, number> = { 1: 8, 2: 11, 3: 14 };
