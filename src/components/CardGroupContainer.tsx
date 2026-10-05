import React from 'react';
import { Card } from '../types/rummy.js';
import { evaluateGroup } from '../utils/rummyRules.js';
import { CardView } from './CardView.js';

interface CardGroupContainerProps {
  groupIndex: number;
  cards: Card[];
  wildJokerCard: Card | null;
  selectedCardIds: string[];
  onToggleCardSelect: (cardId: string) => void;
  onUngroup?: () => void;
  isInteractable?: boolean;
}

export const CardGroupContainer: React.FC<CardGroupContainerProps> = ({
  groupIndex,
  cards,
  wildJokerCard,
  selectedCardIds,
  onToggleCardSelect,
  onUngroup,
  isInteractable = true,
}) => {
  const evalResult = evaluateGroup(cards, wildJokerCard);

  const badgeConfig = {
    pure_sequence: {
      bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      label: 'Pure Run',
      points: '0 pts',
      icon: '✓',
    },
    impure_sequence: {
      bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      label: 'Impure Run',
      points: '0 pts',
      icon: '✓',
    },
    set: {
      bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      label: 'Set',
      points: '0 pts',
      icon: '✓',
    },
    invalid: {
      bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      label: 'Invalid',
      points: `+${evalResult.points} pts`,
      icon: '✗',
    },
  }[evalResult.type];

  return (
    <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-xs border border-white/10 rounded-xl p-2 sm:p-2.5 transition-all hover:border-white/20">
      {/* Group Header Badge */}
      <div className="flex items-center justify-between w-full mb-1.5 px-1 text-xs">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeConfig.bg}`}>
          <span className="font-bold">{badgeConfig.icon}</span>
          <span>{badgeConfig.label}</span>
          <span className="text-white/60 text-[10px]">({badgeConfig.points})</span>
        </div>

        {onUngroup && cards.length > 0 && isInteractable && (
          <button
            onClick={onUngroup}
            title="Ungroup cards"
            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            Ungroup
          </button>
        )}
      </div>

      {/* Cards Row */}
      <div className="flex items-center -space-x-4 sm:-space-x-5 py-2 px-1">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            style={{ zIndex: idx }}
            className="transition-transform duration-150"
          >
            <CardView
              card={card}
              wildJokerCard={wildJokerCard}
              isSelected={selectedCardIds.includes(card.id)}
              onClick={() => onToggleCardSelect(card.id)}
              isInteractable={isInteractable}
              size="md"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
