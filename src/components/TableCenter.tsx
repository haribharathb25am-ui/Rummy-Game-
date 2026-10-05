import React from 'react';
import { Card, TurnPhase } from '../types/rummy.js';
import { CardView } from './CardView.js';
import { getRankLabel, getSuitSymbol } from '../utils/rummyRules.js';
import { ArrowDownToLine, Flame, Sparkles } from 'lucide-react';

interface TableCenterProps {
  closedDeckCount: number;
  discardPile: Card[];
  wildJokerCard: Card | null;
  turnPhase: TurnPhase;
  isMyTurn: boolean;
  onDrawClosed: () => void;
  onDrawDiscard: () => void;
  selectedCardId: string | null;
  onDiscardSelected: () => void;
  onDeclareSelected: () => void;
  turnTimeRemaining: number;
  currentTurnPlayerName: string;
}

export const TableCenter: React.FC<TableCenterProps> = ({
  closedDeckCount,
  discardPile,
  wildJokerCard,
  turnPhase,
  isMyTurn,
  onDrawClosed,
  onDrawDiscard,
  selectedCardId,
  onDiscardSelected,
  onDeclareSelected,
  turnTimeRemaining,
  currentTurnPlayerName,
}) => {
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const canDraw = isMyTurn && turnPhase === 'draw';
  const canDiscard = isMyTurn && turnPhase === 'discard';

  return (
    <div className="flex flex-col items-center justify-center my-3 relative">
      {/* Central Turn Status Indicator */}
      <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 px-4 py-1.5 rounded-full mb-3 shadow-lg backdrop-blur-md">
        <div className="relative flex items-center justify-center w-7 h-7">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="14"
              cy="14"
              r="11"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-slate-700"
            />
            <circle
              cx="14"
              cy="14"
              r="11"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={69}
              strokeDashoffset={69 - (69 * turnTimeRemaining) / 30}
              className={`transition-all duration-1000 ${
                turnTimeRemaining <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-400'
              }`}
            />
          </svg>
          <span className="absolute text-[11px] font-mono font-bold text-white">
            {turnTimeRemaining}
          </span>
        </div>

        <div className="text-xs">
          {isMyTurn ? (
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              {turnPhase === 'draw' ? 'Your Turn: Draw a card' : 'Your Turn: Select card to discard or declare'}
            </span>
          ) : (
            <span className="text-slate-300">
              Turn: <span className="font-semibold text-white">{currentTurnPlayerName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Decks & Joker Layout */}
      <div className="flex items-center justify-center gap-4 sm:gap-7 relative">
        {/* Closed Deck Stack */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <span>Closed Deck</span>
            <span className="text-amber-400 font-mono">({closedDeckCount})</span>
          </div>

          <div className="relative group">
            {/* Wild Joker Card Peeking under Closed Deck */}
            {wildJokerCard && (
              <div
                className="absolute -left-6 top-3 rotate-[-30deg] z-0 pointer-events-none transition-transform group-hover:rotate-[-35deg]"
                title="Wild Joker for this game"
              >
                <CardView
                  card={wildJokerCard}
                  wildJokerCard={null}
                  isInteractable={false}
                  size="sm"
                  className="ring-2 ring-amber-400 shadow-xl"
                />
              </div>
            )}

            {/* Closed Deck Card Back */}
            <button
              onClick={canDraw ? onDrawClosed : undefined}
              disabled={!canDraw}
              className={`relative z-10 w-16 h-22 sm:w-20 sm:h-28 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center select-none ${
                canDraw
                  ? 'border-amber-400 bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 cursor-pointer shadow-lg shadow-amber-500/20 hover:-translate-y-1 hover:scale-102 ring-4 ring-amber-400/40 animate-pulse'
                  : 'border-slate-700 bg-gradient-to-br from-slate-900 to-indigo-950 cursor-default opacity-90'
              }`}
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)`,
              }}
            >
              <div className="w-12 h-18 sm:w-16 sm:h-24 border border-amber-400/40 rounded-lg flex flex-col items-center justify-center p-1">
                <span className="text-xl sm:text-2xl text-amber-400">♠</span>
                <span className="text-[9px] font-mono font-bold text-amber-300 tracking-wider">ROYAL</span>
              </div>

              {canDraw && (
                <div className="absolute -bottom-2 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                  DRAW
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Discard Pile (Open Deck) */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <span>Discard Pile</span>
            {topDiscard && <span className="text-slate-400 font-mono">(Open)</span>}
          </div>

          <div className="relative">
            {topDiscard ? (
              <div className="relative">
                <CardView
                  card={topDiscard}
                  wildJokerCard={wildJokerCard}
                  onClick={canDraw ? onDrawDiscard : undefined}
                  isInteractable={canDraw}
                  size="md"
                  className={canDraw ? 'ring-4 ring-emerald-400 shadow-xl cursor-pointer hover:scale-105' : ''}
                />
                {canDraw && (
                  <div
                    onClick={onDrawDiscard}
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    PICK
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-22 sm:w-18 sm:h-26 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 flex items-center justify-center text-slate-500 text-xs">
                Empty
              </div>
            )}
          </div>
        </div>

        {/* Finish / Declare Slot */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-amber-300 mb-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Finish Slot</span>
          </div>

          <button
            onClick={selectedCardId && canDiscard ? onDeclareSelected : undefined}
            disabled={!selectedCardId || !canDiscard}
            title="Place selected card here to Declare / Show"
            className={`w-16 h-22 sm:w-18 sm:h-26 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-2 text-center select-none ${
              selectedCardId && canDiscard
                ? 'border-amber-400 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 cursor-pointer shadow-lg shadow-amber-500/20 scale-102 ring-2 ring-amber-400/50'
                : 'border-amber-500/30 bg-slate-900/30 text-amber-200/50 cursor-not-allowed'
            }`}
          >
            <ArrowDownToLine className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
              Finish & Show
            </span>
          </button>
        </div>
      </div>

      {/* Wild Joker Info Banner */}
      {wildJokerCard && (
        <div className="mt-3 text-[11px] text-amber-200/90 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
          <span className="font-bold text-amber-400">Joker:</span>
          <span>
            {getRankLabel(wildJokerCard.rank)} {getSuitSymbol(wildJokerCard.suit)}
          </span>
          <span className="text-amber-400/70">· All {getRankLabel(wildJokerCard.rank)}s are Wild Jokers</span>
        </div>
      )}

      {/* Discard Action Prompt when card selected */}
      {selectedCardId && canDiscard && (
        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={onDiscardSelected}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Discard Selected Card</span>
          </button>
          <button
            onClick={onDeclareSelected}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Declare Hand (Show)</span>
          </button>
        </div>
      )}
    </div>
  );
};
