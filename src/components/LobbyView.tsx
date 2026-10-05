import React, { useState } from 'react';
import { Users, Play, Plus, Copy, Check, Bot, Trash2, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { GameState, PlayerPublic } from '../types/rummy.js';

interface LobbyViewProps {
  currentRoom: GameState | null;
  playerName: string;
  avatar: string;
  onUpdateProfile: (name: string, avatar: string) => void;
  onCreateRoom: (roomId?: string, maxPlayers?: number) => void;
  onJoinRoom: (roomId: string) => void;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onOpenRules: () => void;
  isConnecting: boolean;
  localPlayerId: string;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  currentRoom,
  playerName,
  avatar,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onAddBot,
  onRemoveBot,
  onOpenRules,
  isConnecting,
  localPlayerId,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [customRoomName, setCustomRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(playerName);

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = currentRoom?.hostId === localPlayerId;
  const canStart = isHost && currentRoom && currentRoom.players.length >= 2;

  // If already inside a room waiting in lobby
  if (currentRoom && currentRoom.status === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-slate-950 text-white">
        <div className="max-w-xl w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">♠</span>
                <h2 className="text-xl font-black text-amber-400">Game Table {currentRoom.roomId}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Waiting for players to assemble...</p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 rounded-xl border border-amber-500/30 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : `Code: ${currentRoom.roomId}`}</span>
            </button>
          </div>

          {/* Players Roster */}
          <div className="my-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Seated Players ({currentRoom.players.length} / {currentRoom.maxPlayers})</span>
              <span className="text-amber-400 font-medium">13-Card Classic Rummy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRoom.players.map((p: PlayerPublic) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-10 h-10 rounded-full border border-amber-400/40 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            HOST
                          </span>
                        )}
                        {p.isBot && (
                          <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Bot className="w-2.5 h-2.5" /> BOT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">● Ready</span>
                    </div>
                  </div>

                  {isHost && p.isBot && (
                    <button
                      onClick={() => onRemoveBot(p.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      title="Kick Bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Empty Seats */}
              {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 text-xs gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Seat</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lobby Actions */}
          <div className="space-y-3">
            {isHost ? (
              <div className="flex flex-col sm:flex-row gap-3">
                {currentRoom.players.length < currentRoom.maxPlayers && (
                  <button
                    onClick={onAddBot}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-98"
                  >
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>Add AI Bot</span>
                  </button>
                )}

                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all ${
                    canStart
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 ring-4 ring-amber-400/30 cursor-pointer active:scale-98'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{canStart ? 'Start Deal (Begin Game)' : 'Need 2+ Players to Start'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-3 rounded-2xl bg-slate-950/40 border border-white/5 text-xs text-amber-300 animate-pulse">
                Waiting for host to start the game...
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
              <button
                onClick={onOpenRules}
                className="text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>How to Play Rummy</span>
              </button>
              <span className="text-slate-500 text-[11px]">Invite friends with room code: <strong>{currentRoom.roomId}</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Welcome / Room Joiner Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-slate-950 text-white">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Multiplayer Card Room</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight font-serif drop-shadow-md">
          ROYAL RUMMY
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Authentic 13-Card Indian Rummy with pure sequences, wild jokers, real multiplayer tables, and smart bots.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-xl w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Profile Section */}
        <div>
          <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            Your Player Profile
          </label>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img
                src={avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-md"
              />
            </div>

            <input
              type="text"
              value={editingName}
              onChange={(e) => {
                setEditingName(e.target.value);
                onUpdateProfile(e.target.value, avatar);
              }}
              placeholder="Enter your name"
              maxLength={20}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Quick Avatar Row */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Avatars:</span>
            {AVATAR_OPTIONS.map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt={`Avatar ${i}`}
                onClick={() => onUpdateProfile(editingName, imgUrl)}
                className={`w-7 h-7 rounded-full object-cover cursor-pointer transition-transform hover:scale-110 ${
                  avatar === imgUrl ? 'ring-2 ring-amber-400 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Play & Create Room */}
        <div className="space-y-3 pt-2">
          {/* 1-Click Quick Play */}
          <button
            onClick={() => onCreateRoom(undefined, 4)}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-98 ring-2 ring-amber-300/40 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Quick Play (Instant Table)</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex-1 h-px bg-white/10" />
            <span>OR JOIN WITH CODE</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Join Code Box */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-char Room Code"
              maxLength={8}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm uppercase tracking-wider font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
            <button
              onClick={() => inputCode.trim() && onJoinRoom(inputCode.trim())}
              disabled={!inputCode.trim() || isConnecting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95 shadow-md"
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Bottom Bar: Rules & Info */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How to Play & Rummy Rules</span>
          </button>

          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server-Authoritative Anti-Cheat</span>
          </div>
        </div>
      </div>
    </div>
  );
};
