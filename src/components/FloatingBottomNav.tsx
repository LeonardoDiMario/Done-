import React from 'react';
import { Heart, Home, MessageSquare, Settings } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';

interface FloatingBottomNavProps {
  activeTab: 'home' | 'characters' | 'chats' | 'settings';
  onChangeTab?: (tab: 'home' | 'characters' | 'chats' | 'settings') => void;
  onSelectTab?: (tab: 'home' | 'characters' | 'chats' | 'settings') => void;
  isVisible?: boolean;
  isBurmese?: boolean;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onSelectTab,
  isVisible = true
}) => {
  const handleTabChange = (tab: 'home' | 'characters' | 'chats' | 'settings') => {
    if (typeof onChangeTab === 'function') {
      onChangeTab(tab);
    } else if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
  };

  return (
    <div
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[88%] max-w-xs transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-28 opacity-0 pointer-events-none'
      }`}
    >
      <nav className="bg-[#140a1f]/90 backdrop-blur-xl border border-rose-800/50 rounded-full px-5 py-2.5 flex items-center justify-around shadow-2xl shadow-rose-950/80 ring-1 ring-rose-900/30">
        {/* Tab 1: Home */}
        <button
          onClick={() => {
            triggerHaptic('light');
            handleTabChange('home');
          }}
          className={`p-2 rounded-full transition-all relative ${
            activeTab === 'home'
              ? 'text-white bg-rose-600/30 scale-110 ring-1 ring-rose-500/50 shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Home Portal"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Tab 2: Characters (Heart) */}
        <button
          onClick={() => {
            triggerHaptic('light');
            handleTabChange('characters');
          }}
          className={`p-2 rounded-full transition-all relative ${
            activeTab === 'characters'
              ? 'text-white bg-rose-600/30 scale-110 ring-1 ring-rose-500/50 shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Characters"
        >
          <Heart className={`w-5 h-5 ${activeTab === 'characters' ? 'fill-rose-400 text-rose-400' : ''}`} />
        </button>

        {/* Tab 3: Chats */}
        <button
          onClick={() => {
            triggerHaptic('light');
            handleTabChange('chats');
          }}
          className={`p-2 rounded-full transition-all relative ${
            activeTab === 'chats'
              ? 'text-white bg-rose-600/30 scale-110 ring-1 ring-rose-500/50 shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Recent Chats"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => {
            triggerHaptic('light');
            handleTabChange('settings');
          }}
          className={`p-2 rounded-full transition-all relative ${
            activeTab === 'settings'
              ? 'text-white bg-rose-600/30 scale-110 ring-1 ring-rose-500/50 shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};

