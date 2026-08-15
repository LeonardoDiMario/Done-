import React from 'react';
import { X, Send, Heart, Lock, Crown, Sparkles, Brain, MessageSquare, ShieldCheck } from 'lucide-react';
import { Character, UserRelationship } from '../types';
import { triggerHaptic } from '../utils/telegramSdk';

interface CharacterDetailModalProps {
  character: Character | null;
  relationship?: UserRelationship;
  isPremiumUser: boolean;
  onClose: () => void;
  onStartNewChat: (character: Character, launchTelegram?: boolean) => void;
  onOpenStore: () => void;
  onOpenMemory?: (character: Character) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  relationship,
  isPremiumUser,
  onClose,
  onStartNewChat,
  onOpenStore,
  onOpenMemory
}) => {
  if (!character) return null;

  const bondLevel = relationship?.level || 1;
  const isLocked = character.category === 'Custom' ? false : (character as any).isPremium && !isPremiumUser;

  const handleNewChatClick = (launchTelegram = false) => {
    if (isLocked) {
      triggerHaptic('heavy');
      onOpenStore();
      return;
    }
    triggerHaptic('medium');
    onStartNewChat(character, launchTelegram);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#12081f] border border-rose-800/60 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] relative">
        {/* Top Image Banner */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12081f] via-[#12081f]/40 to-black/30" />

          {/* Close Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-rose-950 text-white backdrop-blur-md transition-all border border-white/20 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category & Status Badges */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-rose-300 border border-rose-500/40 shadow">
              {character.category}
            </span>
            {(character as any).isPremium ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> VIP Character
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Free Access
              </span>
            )}
          </div>

          {/* Character Title Header on Image Bottom */}
          <div className="absolute bottom-3 left-4 right-4 space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {character.name}
              </h2>
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Heart className="w-3 h-3 fill-amber-400 text-amber-400" /> Bond Lv.{bondLevel}
              </span>
            </div>
            <p className="text-xs text-rose-200/90 font-medium">{character.title}</p>
          </div>
        </div>

        {/* Details Content Scroll Area */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#12081f] text-slate-200">
          {/* Personality Block */}
          <div className="bg-[#180b28] border border-rose-900/40 p-3.5 rounded-2xl space-y-1.5">
            <h3 className="text-xs font-extrabold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Personality Traits
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {character.personality}
            </p>
          </div>

          {/* About / Description Block */}
          <div className="bg-[#180b28] border border-rose-900/40 p-3.5 rounded-2xl space-y-1.5">
            <h3 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> About & Background
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {character.background}
            </p>
          </div>

          {/* Character Initial Greeting Teaser */}
          <div className="bg-[#0a0412] border border-rose-950/80 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">First Words</span>
            <p className="text-xs text-rose-200/90 italic leading-snug">
              "{character.greeting}"
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3.5 bg-[#180b28] border-t border-rose-900/40 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            {/* Chat in WebApp Button */}
            <button
              onClick={() => handleNewChatClick(false)}
              className="py-3 px-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/80 ring-1 ring-rose-400/40"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>CHAT IN WEB APP</span>
            </button>

            {/* Chat in Telegram Bot Button */}
            {isLocked ? (
              <button
                onClick={() => handleNewChatClick(true)}
                className="py-3 px-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-amber-950/80"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>UNLOCK VIP</span>
              </button>
            ) : (
              <button
                onClick={() => handleNewChatClick(true)}
                className="py-3 px-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-950/80 ring-1 ring-sky-400/40"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>TELEGRAM BOT</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            {onOpenMemory && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenMemory(character);
                }}
                className="w-full py-2 px-3 bg-slate-900/90 hover:bg-rose-950 text-rose-300 border border-slate-700/60 hover:border-rose-600/60 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                title="View Memories"
              >
                <Brain className="w-3.5 h-3.5 text-rose-400" />
                <span>Memory Ledger & Facts</span>
              </button>
            )}
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              ✨ Switch characters anytime to start fresh stories with persistent memory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
