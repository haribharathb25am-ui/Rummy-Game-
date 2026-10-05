import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Home, Flame } from 'lucide-react';
import { Card, PlayerPublic } from '../types/rummy.js';
import { CardView } from './CardView.js';

interface RoundOverModalProps {
  isOpen: boolean;
  winnerName: string;
  isLocalPlayerWinner: boolean;
  winMessage?: string;
  players: PlayerPublic[];
  wildJokerCard: Card | null;
  onNextRound: () => void;
  onLeaveToLobby: () => void;
  isHost: boolean;
}

export const RoundOverModal: React.FC<RoundOverModalProps> = ({
  isOpen,
  winnerName,
  isLocalPlayerWinner,
  winMessage,
  players,
  wildJokerCard,
  onNextRound,
  onLeaveToLobby,
  isHost,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 flex flex-col items-center">
        {/* Winner Banner */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
          <Trophy className="w-8 h-8 text-slate-950" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-center tracking-tight">
          {isLocalPlayerWinner ? 'Victory is Yours!' : `${winnerName} Won!`}
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mt-1 text-center max-w-md">
          {winMessage || 'Valid declaration with required sequences and melds!'}
        </p>

        {/* Scoreboard Table */}
        <div className="w-full mt-6 bg-slate-950/70 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-800/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="col-span-5 sm:col-span-6">Player</span>
            <span className="col-span-3 sm:col-span-3 text-center">Round Score</span>
            <span className="col-span-4 sm:col-span-3 text-right">Total Score</span>
          </div>

          <div className="divide-y divide-white/5">
            {players.map((p) => {
              const isWinner = p.score === 0 && !p.hasDropped;
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3 transition-colors ${
                    isWinner ? 'bg-amber-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="col-span-5 sm:col-span-6 flex items-center gap-2.5">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate max-w-[120px] sm:max-w-[180px]">
                          {p.name}
                        </span>
                        {isWinner && (
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                            WINNER
                          </span>
                        )}
                        {p.hasDropped && (
                          <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            DROPPED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-3 text-center">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isWinner ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isWinner ? '0 pts' : `+${p.score} pts`}
                    </span>
                  </div>

                  <div className="col-span-4 sm:col-span-3 text-right">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {p.totalScore} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revealed Winning Melds */}
        <div className="w-full mt-5">
          <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Hand Show Breakdown
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {players.map((p) => {
              if (!p.declaredGroups || p.declaredGroups.length === 0) return null;
              return (
                <div key={p.id} className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  <div className="text-[11px] font-semibold text-slate-300 mb-1">
                    {p.name}'s Hand:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.declaredGroups.map((grp: Card[], gIdx: number) => (
                      <div
                        key={gIdx}
                        className="flex items-center -space-x-3 bg-slate-900/80 p-1 rounded-lg border border-white/10"
                      >
                        {grp.map((c: Card) => (
                          <CardView
                            key={c.id}
                            card={c}
                            wildJokerCard={wildJokerCard}
                            size="sm"
                            isInteractable={false}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={onLeaveToLobby}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Leave to Lobby</span>
          </button>

          <button
            onClick={onNextRound}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all ring-2 ring-amber-300/40"
          >
            <span>Deal Next Round</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
