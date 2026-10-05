import React from 'react';
import { Card } from '../types/rummy.js';
import { getRankLabel, getSuitSymbol, isWildJoker } from '../utils/rummyRules.js';

interface CardViewProps {
  card: Card;
  wildJokerCard: Card | null;
  isSelected?: boolean;
  onClick?: () => void;
  isInteractable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  wildJokerCard,
  isSelected = false,
  onClick,
  isInteractable = true,
  size = 'md',
  className = '',
}) => {
  const isWild = isWildJoker(card, wildJokerCard);
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = getSuitSymbol(card.suit);
  const rankLabel = getRankLabel(card.rank);

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded-md shadow-xs',
    md: 'w-14 h-20 sm:w-16 sm:h-24 text-sm rounded-lg shadow-md',
    lg: 'w-18 h-26 sm:w-20 sm:h-28 text-base rounded-xl shadow-lg',
  }[size];

  if (card.isPrintedJoker) {
    return (
      <div
        onClick={isInteractable ? onClick : undefined}
        className={`relative select-none flex flex-col items-center justify-between p-1 bg-gradient-to-b from-amber-50 to-amber-100 border-2 transition-all duration-150 ${
          isSelected
            ? '-translate-y-3.5 border-amber-400 ring-4 ring-amber-300/40 shadow-xl'
            : 'border-amber-300 hover:-translate-y-1'
        } ${isInteractable ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${sizeClasses} ${className}`}
      >
        <div className="w-full flex items-center justify-between text-[10px] font-bold text-amber-700 leading-none">
          <span>JK</span>
          <span>★</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto">
          <span className="text-xl sm:text-2xl drop-shadow-xs">🃏</span>
          <span className="text-[9px] font-extrabold tracking-wider text-amber-800 uppercase">JOKER</span>
        </div>
        <div className="w-full flex items-center justify-between text-[10px] font-bold text-amber-700 leading-none rotate-180">
          <span>JK</span>
          <span>★</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={isInteractable ? onClick : undefined}
      className={`relative select-none flex flex-col justify-between p-1.5 bg-white border transition-all duration-150 ${
        isSelected
          ? '-translate-y-3.5 border-emerald-500 ring-3 ring-emerald-400/50 shadow-xl z-10'
          : 'border-slate-300/80 hover:-translate-y-1'
      } ${isInteractable ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${sizeClasses} ${className}`}
      style={{
        boxShadow: isSelected
          ? '0 12px 20px -3px rgba(16, 185, 129, 0.35)'
          : '0 3px 6px -1px rgba(0,0,0,0.18), 0 2px 4px -2px rgba(0,0,0,0.1)',
      }}
    >
      {/* Top Left Rank & Suit */}
      <div className={`flex flex-col items-start leading-none font-bold ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="text-xs sm:text-sm font-black tracking-tight">{rankLabel}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Center Suit Art / Joker Star */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-xl sm:text-2xl opacity-85 ${
            isRed ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {suitSymbol}
        </span>
      </div>

      {/* Wild Joker Badge */}
      {isWild && (
        <div className="absolute top-0.5 right-0.5 bg-amber-400 text-amber-950 font-black text-[8px] sm:text-[9px] px-1 py-0.2 rounded-sm shadow-xs border border-amber-300">
          WILD
        </div>
      )}

      {/* Bottom Right Inverted Rank & Suit */}
      <div
        className={`flex flex-col items-start leading-none font-bold rotate-180 self-end ${
          isRed ? 'text-rose-600' : 'text-slate-900'
        }`}
      >
        <span className="text-xs sm:text-sm font-black tracking-tight">{rankLabel}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{suitSymbol}</span>
      </div>
    </div>
  );
};
