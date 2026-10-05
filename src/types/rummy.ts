export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 = Ace, 2-10, 11 = Jack, 12 = Queen, 13 = King
  isPrintedJoker?: boolean;
}

export type MeldType = 'pure_sequence' | 'impure_sequence' | 'set' | 'invalid';

export interface MeldEvaluation {
  type: MeldType;
  isValid: boolean;
  points: number; // penalty points if unmelded
  name: string;
}

export interface CardGroup {
  id: string;
  cards: Card[];
  evaluation?: MeldEvaluation;
}

export interface PlayerPublic {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  isTurn: boolean;
  cardCount: number;
  score: number;
  totalScore: number;
  hasDropped: boolean;
  status: 'waiting' | 'ready' | 'playing' | 'dropped' | 'declared';
  lastAction?: string;
  declaredGroups?: Card[][];
}

export type TurnPhase = 'draw' | 'discard' | 'waiting';

export interface GameState {
  roomId: string;
  roomName: string;
  hostId: string;
  maxPlayers: number;
  status: 'lobby' | 'playing' | 'round_end' | 'game_over';
  players: PlayerPublic[];
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  turnTimeLimit: number;
  turnTimeRemaining: number;
  wildJokerCard: Card | null;
  discardPile: Card[];
  drawPileCount: number;
  roundNumber: number;
  winnerId: string | null;
  winMessage?: string;
  lastDiscarder?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ReactionEvent {
  id: string;
  senderId: string;
  senderName: string;
  emoji: string;
  timestamp: number;
}
