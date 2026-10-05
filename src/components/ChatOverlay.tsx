import React, { useState } from 'react';
import { Send, X, Smile } from 'lucide-react';
import { ChatMessage } from '../types/rummy.js';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  currentUserId: string;
}

const PRESET_MESSAGES = [
  'Good game everyone! 🃏',
  'Nice discard! Thanks 🙏',
  'Almost ready to declare! 🔥',
  'Need just one Joker! 🤞',
  'Well played! 👏',
  'Watch out for this round! ⚔️',
];

const QUICK_EMOJIS = ['🃏', '🔥', '👑', '🎉', '😱', '👏', '😎', '💀'];

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onSendReaction,
  currentUserId,
}) => {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="fixed bottom-16 right-4 z-40 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">Live Table Chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Emoji Reactions Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/40 border-b border-white/5 overflow-x-auto gap-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="text-lg p-1 hover:scale-125 transition-transform active:scale-95"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 space-y-2.5 max-h-56 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-6">
            No messages yet. Send a greeting or quick reaction!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] text-amber-400 font-semibold mb-0.5">
                    {m.senderName}
                  </span>
                )}
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 border border-white/10 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Presets */}
      <div className="px-2.5 py-1.5 bg-slate-950/40 border-t border-white/5 flex gap-1.5 overflow-x-auto text-[10px]">
        {PRESET_MESSAGES.map((msg, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(msg)}
            className="whitespace-nowrap px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-white/5 hover:text-white transition-colors"
          >
            {msg}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-950 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          maxLength={120}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 rounded-xl transition-all font-bold"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
