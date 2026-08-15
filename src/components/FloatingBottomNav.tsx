import React from 'react';
import { Home, Users, MessageSquare, Settings } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';
import { t, SupportedLanguage } from '../utils/i18n';

interface FloatingBottomNavProps {
  activeTab: 'home' | 'characters' | 'chats' | 'settings';
  onChangeTab?: (tab: 'home' | 'characters' | 'chats' | 'settings') => void;
  onSelectTab?: (tab: 'home' | 'characters' | 'chats' | 'settings') => void;
  isVisible?: boolean;
  isBurmese?: boolean;
  language?: SupportedLanguage;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onSelectTab,
  isVisible = true,
  language = 'auto'
}) => {
  const handleTabChange = (tab: 'home' | 'characters' | 'chats' | 'settings') => {
    if (typeof onChangeTab === 'function') {
      onChangeTab(tab);
    } else if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
  };

  const tabs = [
    {
      id: 'home' as const,
      label: t('nav_home', language),
      icon: Home
    },
    {
      id: 'characters' as const,
      label: t('nav_characters', language),
      icon: Users
    },
    {
      id: 'chats' as const,
      label: t('nav_chats', language),
      icon: MessageSquare
    },
    {
      id: 'settings' as const,
      label: t('nav_settings', language),
      icon: Settings
    }
  ];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-28 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-[#13081e]/90 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-1.5 shadow-2xl shadow-rose-950/80 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                handleTabChange(tab.id);
              }}
              className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-b from-rose-500/20 to-purple-600/30 text-rose-300 shadow-sm border border-rose-500/40 scale-105'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-rose-400 fill-rose-500/20' : ''}`} />
              <span className={`text-[10px] font-bold mt-1 tracking-tight ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute bottom-0.5 shadow-[0_0_6px_#f43f5e]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
