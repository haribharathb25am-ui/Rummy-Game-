import React from 'react';
import { X, CheckCircle, ShieldCheck, Flame, AlertCircle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl p-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🃏</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">13-Card Indian Rummy Rules</h2>
              <p className="text-xs text-amber-400">Master the classic multiplayer card game</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs sm:text-sm">
          {/* Mandatory Requirements */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Golden Requirements for a Valid Declaration (Show)
            </h3>
            <div className="mt-2 space-y-1.5 text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>1st Requirement: Pure Sequence</strong> — At least one run of 3 or more consecutive cards of the same suit without any joker (e.g. <span className="font-mono text-emerald-300 font-bold">4♥ · 5♥ · 6♥</span> or <span className="font-mono text-emerald-300 font-bold">10♠ · J♠ · Q♠ · K♠</span>).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>2nd Requirement: Second Sequence</strong> — At least one other sequence of 3 or more cards. Can be pure or impure with Jokers (e.g. <span className="font-mono text-cyan-300 font-bold">7♦ · 🃏(Joker) · 9♦</span>).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Remaining Cards: Valid Sets or Runs</strong> — Arranged into valid 3 or 4 card combinations with 0 deadwood cards left.
                </span>
              </div>
            </div>
          </div>

          {/* Valid Combinations Explained */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3">
              <h4 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pure Sequence
              </h4>
              <p className="text-xs text-slate-400 mb-1.5">Same suit, consecutive ranks, strictly no jokers.</p>
              <div className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-emerald-400">
                A♣ · 2♣ · 3♣ · 4♣
              </div>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3">
              <h4 className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Impure Sequence
              </h4>
              <p className="text-xs text-slate-400 mb-1.5">Same suit, jokers substitute for missing ranks.</p>
              <div className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-cyan-400">
                8♠ · 🃏(acts as 9♠) · 10♠
              </div>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3">
              <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Valid Set
              </h4>
              <p className="text-xs text-slate-400 mb-1.5">3 or 4 cards of same rank, different suits.</p>
              <div className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-amber-400">
                K♠ · K♥ · K♦ (or with Joker)
              </div>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3">
              <h4 className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Invalid Set (Suit Duplicate)
              </h4>
              <p className="text-xs text-slate-400 mb-1.5">Cannot have two cards of identical suit in a set!</p>
              <div className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-rose-400 line-through">
                5♠ · 5♠ · 5♥ (Invalid!)
              </div>
            </div>
          </div>

          {/* Gameplay Loop */}
          <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3.5">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" /> How a Turn Works
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
              <li><strong>Draw Step:</strong> Draw 1 card from either the face-down <em>Closed Deck</em> or top of the <em>Discard Pile</em>. You now hold 14 cards.</li>
              <li><strong>Sort / Group:</strong> Use <em>Auto-Sort</em> or select cards and tap <em>Group</em> to organize your melds.</li>
              <li><strong>Discard or Declare:</strong> Select 1 card and either tap <em>Discard</em> or place it into the <em>Finish Slot</em> to Declare (Show)!</li>
            </ol>
          </div>

          {/* Points & Penalties */}
          <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3.5">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400" /> Points & Penalties
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">A, K, Q, J, 10</span>
                <span className="text-amber-400 font-bold">10 pts each</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">Cards 2 to 9</span>
                <span className="text-amber-400 font-bold">Face Value</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">First Drop</span>
                <span className="text-rose-400 font-bold">20 points</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg">
                <span className="block text-slate-400 text-[10px]">Wrong Show</span>
                <span className="text-rose-400 font-bold">80 points</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              *The winner gets <strong>0 points</strong>. If a player has no pure sequence at all, all their cards count points (capped at 80).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
