import React from 'react';
import { Users, MessageSquare, Settings, Brain, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';

interface TelegramSimBarProps {
  activeTab: 'characters' | 'chat' | 'settings';
  onChangeTab: (tab: 'characters' | 'chat' | 'settings') => void;
  hasActiveCharacter: boolean;
  isBurmese: boolean;
}

export const TelegramSimBar: React.FC<TelegramSimBarProps> = ({
  activeTab,
  onChangeTab,
  hasActiveCharacter,
  isBurmese
}) => {
  return (
    <nav className="sticky bottom-0 z-40 bg-[#17212b]/95 backdrop-blur-md border-t border-slate-800 text-slate-300 px-4 py-2 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => {
          triggerHaptic('light');
          onChangeTab('characters');
        }}
        className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'characters'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">{isBurmese ? 'ဇာတ်ကောင်များ' : 'Characters'}</span>
      </button>

      {hasActiveCharacter && (
        <button
          onClick={() => {
            triggerHaptic('light');
            onChangeTab('chat');
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'text-sky-400 font-bold bg-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">{isBurmese ? 'စကားပြောမည်' : 'Roleplay Chat'}</span>
        </button>
      )}

      <button
        onClick={() => {
          triggerHaptic('light');
          onChangeTab('settings');
        }}
        className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'settings'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">{isBurmese ? 'ဆရာဆက်တင် DB' : 'Preferences'}</span>
      </button>
    </nav>
  );
};
