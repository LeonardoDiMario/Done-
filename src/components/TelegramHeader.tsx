import React from 'react';
import { ChevronLeft, Zap, Plus, MoreVertical, Sparkles, Crown } from 'lucide-react';
import { Character } from '../types';
import { ActiveEntitlement } from './StoreModal';
import { triggerHaptic } from '../utils/telegramSdk';

interface TelegramHeaderProps {
  activeCharacter?: Character | null;
  onBackToCharacters?: () => void;
  onOpenStore: () => void;
  energy: number;
  gems: number;
  activeEntitlement?: ActiveEntitlement | null;
  isBurmese?: boolean;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  activeCharacter,
  onBackToCharacters,
  onOpenStore,
  energy,
  gems,
  activeEntitlement
}) => {
  const isVip = activeEntitlement?.status === 'active';

  return (
    <header className="sticky top-0 z-40 bg-[#0c0712]/95 backdrop-blur-xl border-b border-rose-900/30 text-slate-100 px-3.5 py-3 flex items-center justify-between transition-all shadow-lg">
      <div className="flex items-center space-x-2">
        {activeCharacter ? (
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onBackToCharacters) onBackToCharacters();
            }}
            className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-200 transition-all flex items-center"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/80 shrink-0 border border-rose-500/40">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-ruby-logo text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-500 to-purple-300 tracking-wider drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]">
                RUBY CHAN
              </span>
              <span className="text-[10px] font-black text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded-full border border-rose-700/60 leading-none inline-flex items-center shrink-0 shadow-sm">
                18+
              </span>
              {isVip && (
                <span className="text-[9px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50 leading-none inline-flex items-center gap-0.5 shrink-0 shadow-sm">
                  <Crown className="w-2.5 h-2.5 text-amber-400" /> VIP
                </span>
              )}
            </div>
          </div>
        )}

        {activeCharacter && (
          <div className="flex items-center space-x-2">
            <img
              src={activeCharacter.avatar}
              alt={activeCharacter.name || 'Character'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/60"
            />
            <div>
              <h2 className="font-extrabold text-xs sm:text-sm text-slate-100 leading-none">{activeCharacter.name || 'Character'}</h2>
              <p className="text-[10px] text-rose-400 mt-0.5 line-clamp-1 max-w-[120px]">
                {activeCharacter.title}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Side: Currency Pill & Menu */}
      <div className="flex items-center space-x-2">
        {/* Mana & Ruby Orbs Pill Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenStore();
          }}
          className="bg-[#180e22] border border-rose-800/50 hover:border-rose-500 rounded-full px-2.5 py-1 flex items-center space-x-2 text-xs font-bold text-slate-100 shadow-lg shadow-rose-950/40 transition-all active:scale-95 group shrink-0 whitespace-nowrap flex-nowrap"
          title="Open Ruby Orbs & Mana Store"
        >
          <span className="flex items-center text-amber-400 gap-1 text-[11px] shrink-0 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 fill-amber-400 shrink-0" /> {energy}
          </span>
          <span className="w-px h-3.5 bg-rose-800/60 shrink-0" />
          <span className="flex items-center text-rose-300 gap-1 text-[11px] shrink-0 whitespace-nowrap">
            🔮 {gems}
          </span>
          <span className="w-4 h-4 rounded-full bg-gradient-to-r from-rose-600 to-purple-600 group-hover:from-rose-500 group-hover:to-purple-500 text-white flex items-center justify-center text-[10px] ml-0.5 shadow shrink-0">
            <Plus className="w-3 h-3 text-white" />
          </span>
        </button>

        {/* Top Menu Options */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenStore();
          }}
          className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-rose-950 text-slate-400 hover:text-white transition-all border border-slate-800"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
