import { Card, CardGroup, MeldEvaluation, MeldType } from '../types/rummy.js';

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

export function getSuitSymbol(suit: Card['suit']): string {
  switch (suit) {
    case 'spades': return '♠';
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
  }
}

export function getRankLabel(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return rank.toString();
}

export function isWildJoker(card: Card, wildJokerCard: Card | null): boolean {
  if (card.isPrintedJoker) return true;
  if (!wildJokerCard) return false;
  
  // If wild joker card itself is printed joker, Ace is the wild joker
  if (wildJokerCard.isPrintedJoker) {
    return card.rank === 1;
  }
  
  return card.rank === wildJokerCard.rank;
}

export function getCardPoints(card: Card, wildJokerCard: Card | null): number {
  if (isWildJoker(card, wildJokerCard)) return 0;
  if (card.rank === 1 || card.rank >= 10) return 10;
  return card.rank;
}

/**
 * Checks if a group of cards is a Pure Sequence
 * - >= 3 cards
 * - Same suit
 * - Consecutive ranks
 * - No Printed Jokers
 * - Wild joker cards can only be present as their natural suit & rank
 */
export function isPureSequence(cards: Card[], wildJokerCard: Card | null): boolean {
  if (cards.length < 3) return false;

  // Cannot have printed jokers
  if (cards.some(c => c.isPrintedJoker)) return false;

  const suit = cards[0].suit;
  if (!cards.every(c => c.suit === suit)) return false;

  // Extract ranks and check for uniqueness
  const ranks = cards.map(c => c.rank);
  const uniqueRanks = Array.from(new Set(ranks));
  if (uniqueRanks.length !== cards.length) return false;

  uniqueRanks.sort((a, b) => a - b);

  // Check normal consecutive: e.g., 4, 5, 6
  let isNormalRun = true;
  for (let i = 1; i < uniqueRanks.length; i++) {
    if (uniqueRanks[i] !== uniqueRanks[i - 1] + 1) {
      isNormalRun = false;
      break;
    }
  }
  if (isNormalRun) return true;

  // Check Ace high: A, 10, J, Q, K
  // If Ace is present (rank 1), try treating it as 14
  if (ranks.includes(1)) {
    const highRanks = ranks.map(r => (r === 1 ? 14 : r)).sort((a, b) => a - b);
    let isHighRun = true;
    for (let i = 1; i < highRanks.length; i++) {
      if (highRanks[i] !== highRanks[i - 1] + 1) {
        isHighRun = false;
        break;
      }
    }
    if (isHighRun) return true;
  }

  return false;
}

/**
 * Checks if a group of cards is an Impure Sequence
 * - >= 3 cards
 * - At least one joker (printed or wild)
 * - The non-joker cards must be of the same suit and able to form a run when jokers fill the gaps
 */
export function isImpureSequence(cards: Card[], wildJokerCard: Card | null): boolean {
  if (cards.length < 3) return false;

  const jokers = cards.filter(c => isWildJoker(c, wildJokerCard));
  const naturals = cards.filter(c => !isWildJoker(c, wildJokerCard));

  if (jokers.length === 0) {
    // If no jokers, it should be checked for pure sequence instead
    return false;
  }

  // If all cards are jokers, in rummy rules 3 or 4 jokers can form an impure run
  if (naturals.length === 0) return true;

  // All natural cards must be of the same suit
  const suit = naturals[0].suit;
  if (!naturals.every(c => c.suit === suit)) return false;

  const ranks = naturals.map(c => c.rank);
  const uniqueRanks = Array.from(new Set(ranks));
  if (uniqueRanks.length !== naturals.length) return false; // duplicate ranks cannot be in a run

  // Try checking with Ace = 1
  if (canFormRunWithJokers(uniqueRanks, jokers.length)) return true;

  // If Ace is present, try with Ace = 14
  if (ranks.includes(1)) {
    const highRanks = ranks.map(r => (r === 1 ? 14 : r));
    if (canFormRunWithJokers(highRanks, jokers.length)) return true;
  }

  return false;
}

function canFormRunWithJokers(ranks: number[], jokerCount: number): boolean {
  ranks.sort((a, b) => a - b);
  const span = ranks[ranks.length - 1] - ranks[0] + 1;
  const missingInSpan = span - ranks.length;
  
  if (missingInSpan > jokerCount) return false;

  const extraJokers = jokerCount - missingInSpan;
  // Extra jokers can extend the run either before min rank or after max rank
  // As long as span + extraJokers <= 14 (total possible ranks 1..14)
  return span + extraJokers <= 14;
}

/**
 * Checks if a group is a valid Set
 * - 3 or 4 cards
 * - Same rank for all natural cards
 * - All natural cards MUST have distinct suits (no two cards of the same suit in a set)
 */
export function isValidSet(cards: Card[], wildJokerCard: Card | null): boolean {
  if (cards.length < 3 || cards.length > 4) return false;

  const naturals = cards.filter(c => !isWildJoker(c, wildJokerCard));

  if (naturals.length === 0) {
    // 3 or 4 jokers can be considered a valid set/meld
    return true;
  }

  const targetRank = naturals[0].rank;
  if (!naturals.every(c => c.rank === targetRank)) return false;

  // Unique suits among natural cards
  const suits = naturals.map(c => c.suit);
  const uniqueSuits = new Set(suits);
  if (uniqueSuits.size !== naturals.length) return false;

  return true;
}

/**
 * Evaluates a single card group
 */
export function evaluateGroup(cards: Card[], wildJokerCard: Card | null): MeldEvaluation {
  if (cards.length === 0) {
    return { type: 'invalid', isValid: false, points: 0, name: 'Empty' };
  }

  const points = cards.reduce((acc, c) => acc + getCardPoints(c, wildJokerCard), 0);

  if (isPureSequence(cards, wildJokerCard)) {
    return { type: 'pure_sequence', isValid: true, points: 0, name: 'Pure Run' };
  }

  if (isImpureSequence(cards, wildJokerCard)) {
    return { type: 'impure_sequence', isValid: true, points: 0, name: 'Impure Run' };
  }

  if (isValidSet(cards, wildJokerCard)) {
    return { type: 'set', isValid: true, points: 0, name: 'Set' };
  }

  return { type: 'invalid', isValid: false, points, name: 'Invalid' };
}

export interface HandEvaluation {
  isValidDeclaration: boolean;
  hasPureSequence: boolean;
  hasSecondSequence: boolean;
  totalPoints: number;
  message: string;
  groupEvaluations: MeldEvaluation[];
}

/**
 * Evaluates full hand (all groups) of 13 cards for declaration or end-of-round scoring
 */
export function evaluateFullHand(groups: Card[][], wildJokerCard: Card | null): HandEvaluation {
  const evaluations = groups.map(g => evaluateGroup(g, wildJokerCard));

  const totalCards = groups.reduce((acc, g) => acc + g.length, 0);
  const pureSeqCount = evaluations.filter(e => e.type === 'pure_sequence').length;
  const impureSeqCount = evaluations.filter(e => e.type === 'impure_sequence').length;
  const totalSeqCount = pureSeqCount + impureSeqCount;

  const hasPureSequence = pureSeqCount >= 1;
  const hasSecondSequence = totalSeqCount >= 2;

  let totalPoints = 0;

  if (!hasPureSequence) {
    // Without even one pure sequence, all cards count points up to 80
    const allCards = groups.flat();
    totalPoints = allCards.reduce((acc, c) => acc + getCardPoints(c, wildJokerCard), 0);
    totalPoints = Math.min(80, totalPoints);
    return {
      isValidDeclaration: false,
      hasPureSequence: false,
      hasSecondSequence: false,
      totalPoints,
      message: 'Needs at least 1 Pure Sequence (no jokers)',
      groupEvaluations: evaluations,
    };
  }

  if (!hasSecondSequence) {
    // Has 1 pure sequence: that pure sequence is safe (0 pts), everything else counts up to 80
    let points = 0;
    let foundFirstPure = false;
    for (let i = 0; i < groups.length; i++) {
      if (!foundFirstPure && evaluations[i].type === 'pure_sequence') {
        foundFirstPure = true;
        continue;
      }
      points += groups[i].reduce((acc, c) => acc + getCardPoints(c, wildJokerCard), 0);
    }
    totalPoints = Math.min(80, points);
    return {
      isValidDeclaration: false,
      hasPureSequence: true,
      hasSecondSequence: false,
      totalPoints,
      message: 'Needs a 2nd Sequence (pure or impure)',
      groupEvaluations: evaluations,
    };
  }

  // Has both required sequences!
  // Any invalid group or remaining cards count points
  let hasInvalidGroup = false;
  let points = 0;

  for (let i = 0; i < groups.length; i++) {
    const evalResult = evaluations[i];
    if (!evalResult.isValid) {
      hasInvalidGroup = true;
      points += evalResult.points;
    }
  }

  totalPoints = Math.min(80, points);

  if (totalCards === 13 && !hasInvalidGroup) {
    return {
      isValidDeclaration: true,
      hasPureSequence: true,
      hasSecondSequence: true,
      totalPoints: 0,
      message: 'Valid Declaration! You Win!',
      groupEvaluations: evaluations,
    };
  }

  return {
    isValidDeclaration: false,
    hasPureSequence: true,
    hasSecondSequence: true,
    totalPoints,
    message: hasInvalidGroup ? 'Some groups are invalid' : 'Not all 13 cards are arranged',
    groupEvaluations: evaluations,
  };
}

/**
 * Creates 2 standard decks with 2 Printed Jokers (106 cards total)
 */
export function createRummyDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;

  for (let deckNum = 1; deckNum <= 2; deckNum++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          id: `c_${deckNum}_${suit}_${rank}_${id++}`,
          suit,
          rank,
        });
      }
    }
    // 1 printed joker per deck
    deck.push({
      id: `pj_${deckNum}_${id++}`,
      suit: 'spades',
      rank: 0,
      isPrintedJoker: true,
    });
  }

  // Shuffle Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Automatically groups a set of cards (e.g. 13 or 14 cards) into optimal melds
 */
export function autoGroupCards(cards: Card[], wildJokerCard: Card | null): Card[][] {
  const pool = [...cards];
  const groups: Card[][] = [];

  // Helper to extract cards from pool
  const takeCards = (toTake: Card[]) => {
    for (const c of toTake) {
      const idx = pool.findIndex(p => p.id === c.id);
      if (idx !== -1) pool.splice(idx, 1);
    }
  };

  // Step 1: Find Pure Sequences (by suit)
  for (const suit of SUITS) {
    const suitCards = pool.filter(c => !c.isPrintedJoker && c.suit === suit);
    // Sort by rank
    suitCards.sort((a, b) => a.rank - b.rank);

    // Look for consecutive runs of 3, 4, 5
    let currentRun: Card[] = [];
    for (let i = 0; i < suitCards.length; i++) {
      if (currentRun.length === 0) {
        currentRun.push(suitCards[i]);
      } else {
        const last = currentRun[currentRun.length - 1];
        if (suitCards[i].rank === last.rank + 1) {
          currentRun.push(suitCards[i]);
        } else if (suitCards[i].rank > last.rank + 1) {
          if (currentRun.length >= 3) {
            groups.push([...currentRun]);
            takeCards(currentRun);
          }
          currentRun = [suitCards[i]];
        }
      }
    }
    if (currentRun.length >= 3) {
      groups.push([...currentRun]);
      takeCards(currentRun);
    }
  }

  // Step 2: Separate jokers and naturals
  const jokers = pool.filter(c => isWildJoker(c, wildJokerCard));
  const naturals = pool.filter(c => !isWildJoker(c, wildJokerCard));

  // Step 3: Find Sets from naturals (3 or 4 of same rank, different suits)
  const rankBuckets: { [rank: number]: Card[] } = {};
  for (const card of naturals) {
    if (!rankBuckets[card.rank]) rankBuckets[card.rank] = [];
    // Ensure distinct suits in set
    if (!rankBuckets[card.rank].some(c => c.suit === card.suit)) {
      rankBuckets[card.rank].push(card);
    }
  }

  for (const rank in rankBuckets) {
    const list = rankBuckets[rank];
    if (list.length >= 3) {
      const setToTake = list.slice(0, 4);
      groups.push(setToTake);
      takeCards(setToTake);
    } else if (list.length === 2 && jokers.length > 0) {
      // Complete set with a joker if available
      const joker = jokers.pop()!;
      const setWithJoker = [...list, joker];
      groups.push(setWithJoker);
      takeCards(setWithJoker);
    }
  }

  // Step 4: With remaining jokers and naturals, try to complete impure runs
  if (jokers.length > 0) {
    for (const suit of SUITS) {
      const remSuitCards = pool.filter(c => !isWildJoker(c, wildJokerCard) && c.suit === suit);
      remSuitCards.sort((a, b) => a.rank - b.rank);
      if (remSuitCards.length >= 2 && jokers.length >= 1) {
        // Check if gap is 1 or consecutive
        const span = remSuitCards[remSuitCards.length - 1].rank - remSuitCards[0].rank;
        if (span <= 3) {
          const runCards = remSuitCards.slice(0, 3);
          const joker = jokers.pop()!;
          const meld = [...runCards, joker];
          groups.push(meld);
          takeCards(meld);
        }
      }
    }
  }

  // Step 5: Put remaining cards into suit-based or small groups
  if (pool.length > 0) {
    // Sort pool by suit and rank for neat display
    pool.sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.rank - b.rank;
    });

    // Chunk remaining cards into groups of at most 4
    while (pool.length > 0) {
      const chunk = pool.splice(0, Math.min(4, pool.length));
      groups.push(chunk);
    }
  }

  return groups.length > 0 ? groups : [cards];
}
