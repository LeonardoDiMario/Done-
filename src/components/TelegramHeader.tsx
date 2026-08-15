import React from 'react';
import { ChevronLeft, Zap, Plus, Crown } from 'lucide-react';
import { Character } from '../types';
import { ActiveEntitlement } from './StoreModal';
import { triggerHaptic } from '../utils/telegramSdk';
import { SupportedLanguage } from '../utils/i18n';

interface TelegramHeaderProps {
  activeCharacter?: Character | null;
  onBackToCharacters?: () => void;
  onOpenStore: () => void;
  onOpenLanguage?: () => void;
  energy: number;
  gems: number;
  activeEntitlement?: ActiveEntitlement | null;
  isBurmese?: boolean;
  language?: SupportedLanguage;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  activeCharacter,
  onBackToCharacters,
  onOpenStore,
  energy,
  gems,
  activeEntitlement,
}) => {
  const isVip = activeEntitlement?.status === 'active';

  return (
    <header className="sticky top-0 z-40 bg-[#0c0712]/95 backdrop-blur-xl border-b border-rose-900/30 text-slate-100 shadow-lg">
      <div className="w-full max-w-md mx-auto h-12 px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {activeCharacter ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (onBackToCharacters) onBackToCharacters();
                }}
                className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-rose-200 transition-all flex items-center shrink-0 active:scale-95 shadow-sm"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <img
                src={activeCharacter.avatar}
                alt={activeCharacter.name || 'Character'}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-rose-500/70 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs text-slate-100 leading-tight truncate">
                  {activeCharacter.name || 'Character'}
                </h2>
                <p className="text-[9px] text-rose-400 leading-tight truncate">
                  {activeCharacter.title}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                <div className="absolute inset-[3px] rotate-45 rounded-[5px] bg-gradient-to-br from-rose-300 via-rose-500 to-red-800 shadow-[0_0_12px_rgba(244,63,94,0.55)] border border-rose-200/70" />
                <div className="relative w-2.5 h-2.5 rotate-45 rounded-[2px] bg-rose-100/70 shadow-sm" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-ruby-logo text-[13px] font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-300 to-purple-200 tracking-tight whitespace-nowrap">
                  RUBY CHAN
                </span>
                <span className="text-[8px] font-extrabold text-rose-100 bg-rose-900/90 px-1 py-0.5 rounded border border-rose-500/60 leading-none inline-flex items-center shrink-0 shadow-sm uppercase">
                  18+
                </span>
                {isVip && (
                  <span className="text-[7.5px] font-black text-amber-300 bg-amber-950/90 px-1 py-0.5 rounded-full border border-amber-500/50 leading-none inline-flex items-center gap-0.5 shrink-0 shadow-sm">
                    <Crown className="w-2 h-2 text-amber-400" /> VIP
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenStore();
            }}
            className="h-7.5 bg-[#170c22]/95 border border-rose-700/60 hover:border-rose-400/80 rounded-full px-2.5 flex items-center gap-2 text-xs font-bold text-slate-100 shadow-md shadow-rose-950/50 transition-all active:scale-95 group shrink-0 whitespace-nowrap"
            title="Open Store"
          >
            <span className="flex items-center text-amber-400 gap-1 text-[11px] font-extrabold shrink-0">
              <Zap className="w-3 h-3 fill-amber-400 shrink-0" />
              <span>{energy}</span>
            </span>
            <span className="w-px h-3 bg-rose-800/60 shrink-0" />
            <span className="flex items-center text-rose-300 gap-1 text-[11px] font-extrabold shrink-0">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-gradient-to-br from-rose-300 to-red-700 shadow-sm" />
              <span>{gems}</span>
            </span>
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-rose-600 to-red-700 group-hover:from-rose-500 group-hover:to-red-600 text-white flex items-center justify-center text-[9px] shadow-sm shrink-0">
              <Plus className="w-2.5 h-2.5 text-white stroke-[3]" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
