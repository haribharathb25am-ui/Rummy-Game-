import React from 'react';
import { PlayerPublic } from '../types/rummy.js';
import { Bot, Crown } from 'lucide-react';

interface OpponentSeatProps {
  player: PlayerPublic;
  position: 'top' | 'left' | 'right';
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({ player, position }) => {
  return (
    <div
      className={`flex flex-col items-center select-none transition-all duration-200 ${
        player.isTurn ? 'scale-105' : 'opacity-90'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-all shadow-lg ${
            player.isTurn
              ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-amber-500/30 animate-pulse'
              : 'border-slate-600 bg-slate-800'
          }`}
        >
          <img
            src={player.avatar}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Host Crown */}
        {player.isHost && (
          <div className="absolute -top-2 -left-1 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow-xs">
            <Crown className="w-3 h-3 fill-current" />
          </div>
        )}

        {/* Bot Icon */}
        {player.isBot && (
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full shadow-xs">
            <Bot className="w-3 h-3" />
          </div>
        )}

        {/* Turn Ring Banner */}
        {player.isTurn && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md whitespace-nowrap">
            PLAYING
          </div>
        )}

        {/* Dropped Badge */}
        {player.hasDropped && (
          <div className="absolute inset-0 bg-slate-950/70 rounded-full flex items-center justify-center backdrop-blur-2xs">
            <span className="text-rose-400 font-bold text-[10px] uppercase">DROPPED</span>
          </div>
        )}
      </div>

      {/* Name & Score Info */}
      <div className="mt-1.5 flex flex-col items-center text-center">
        <span className="text-xs font-semibold text-white max-w-[100px] truncate leading-tight">
          {player.name}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span>Score: <span className="text-amber-400 font-bold">{player.totalScore}</span></span>
        </div>
      </div>

      {/* Card Count / Mini Card Backs Fan */}
      {!player.hasDropped && (
        <div className="mt-1 flex items-center justify-center -space-x-2">
          {Array.from({ length: Math.min(6, player.cardCount) }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-5 bg-gradient-to-br from-indigo-900 to-slate-900 border border-slate-600 rounded-xs shadow-xs"
              style={{ transform: `rotate(${(i - 2.5) * 4}deg)` }}
            />
          ))}
          <span className="text-[10px] font-mono font-bold text-amber-300 ml-1">
            {player.cardCount}
          </span>
        </div>
      )}

      {/* Last Action Bubble */}
      {player.lastAction && (
        <div className="mt-1 bg-slate-900/90 border border-white/10 px-2 py-0.5 rounded-md text-[9px] text-amber-200/90 shadow-sm max-w-[120px] text-center truncate">
          {player.lastAction}
        </div>
      )}
    </div>
  );
};
