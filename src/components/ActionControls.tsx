import React from 'react';
import { Sparkles, Layers, LogOut, Volume2, VolumeX, HelpCircle, MessageSquare } from 'lucide-react';
import { TurnPhase } from '../types/rummy.js';

interface ActionControlsProps {
  onAutoSort: () => void;
  onGroupSelected: () => void;
  onDrop: () => void;
  onDeclare: () => void;
  selectedCardCount: number;
  isMyTurn: boolean;
  turnPhase: TurnPhase;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onToggleChat: () => void;
  hasUnreadChat?: boolean;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  onAutoSort,
  onGroupSelected,
  onDrop,
  onDeclare,
  selectedCardCount,
  isMyTurn,
  turnPhase,
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onToggleChat,
  hasUnreadChat = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 backdrop-blur-md border-t border-white/10 w-full max-w-5xl mx-auto rounded-t-2xl shadow-2xl">
      {/* Utility Buttons: Sound, Rules, Chat */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        <button
          onClick={onOpenRules}
          title="Rummy Rules & Guide"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Rules</span>
        </button>

        <button
          onClick={onToggleChat}
          title="Open Chat"
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Chat</span>
          {hasUnreadChat && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* Primary Card Operations */}
      <div className="flex items-center gap-2">
        {/* Auto-Sort */}
        <button
          onClick={onAutoSort}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>Auto-Sort</span>
        </button>

        {/* Group Selected Cards */}
        <button
          onClick={onGroupSelected}
          disabled={selectedCardCount < 2}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            selectedCardCount >= 2
              ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white ring-2 ring-emerald-400/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Group ({selectedCardCount})</span>
        </button>

        {/* Declare Show Button */}
        <button
          onClick={onDeclare}
          disabled={!isMyTurn || turnPhase !== 'discard'}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
            isMyTurn && turnPhase === 'discard'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-300/40 active:scale-95 animate-pulse'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Show / Declare</span>
        </button>

        {/* Drop Round */}
        <button
          onClick={onDrop}
          disabled={!isMyTurn}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isMyTurn
              ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-600/40 active:scale-95'
              : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
          }`}
          title="Drop this hand (20 pts first drop, 40 pts middle drop)"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Drop</span>
        </button>
      </div>
    </div>
  );
};
