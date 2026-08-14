import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Zap, Gift, Crown, MessageSquare, Plus, Flame, ChevronRight, User, ShieldCheck } from 'lucide-react';
import { triggerHaptic, getTelegramUser } from '../utils/telegramSdk';
import { apiFetch } from '../utils/api';
import { Character, UserPreferences } from '../types';

interface HomeViewProps {
  characters: Character[];
  userPreferences: UserPreferences;
  energy: number;
  gems: number;
  onSelectCharacter: (char: Character) => void;
  onOpenStore: () => void;
  onCreateCharacter: () => void;
  onOpenSettingsModal: () => void;
  onNavigateTab: (tab: 'characters' | 'home' | 'chats' | 'settings') => void;
  onAddGems: (amount: number) => void;
  onAddEnergy: (amount: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  characters,
  userPreferences,
  energy,
  gems,
  onSelectCharacter,
  onOpenStore,
  onCreateCharacter,
  onOpenSettingsModal,
  onNavigateTab,
  onAddGems,
  onAddEnergy
}) => {
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const tgUser = getTelegramUser();
  const userName = tgUser?.first_name || (tgUser?.username ? `@${tgUser.username}` : '') || userPreferences?.userPersona?.name || 'Traveler';

  // Fetch claim status on mount
  useEffect(() => {
    fetchClaimStatus();
  }, []);

  const fetchClaimStatus = async () => {
    try {
      const res = await apiFetch('/api/user/profile');
      const data = await res.json();
      if (data.profile?.nextClaimAt) {
        setNextClaimAt(data.profile.nextClaimAt);
      }
    } catch (err) {
      console.error('Error fetching claim status:', err);
    }
  };

  // Live HH:MM:SS Countdown Timer
  useEffect(() => {
    if (!nextClaimAt) {
      setCooldownSeconds(0);
      return;
    }

    const updateTimer = () => {
      const targetTime = new Date(nextClaimAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((targetTime - now) / 1000));
      setCooldownSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextClaimAt]);

  const formatHHMMSS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleClaimReward = async () => {
    if (cooldownSeconds > 0 || isClaiming) return;
    setIsClaiming(true);
    triggerHaptic('heavy');

    try {
      const res = await apiFetch('/api/user/claim-daily', {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        if (data.nextClaimAt) {
          setNextClaimAt(data.nextClaimAt);
        }
        onAddEnergy(25);
        alert('🎁 Daily Blessing Claimed! +25 Starlight Energy added!');
      } else {
        if (data.nextClaimAt) {
          setNextClaimAt(data.nextClaimAt);
        }
        alert(`⌛ ${data.error || 'Daily claim is still on cooldown.'}`);
      }
    } catch (err) {
      console.error('Daily claim request failed:', err);
      alert('Failed to process claim. Please check network and try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#180b26] via-[#200d33] to-[#12081f] border border-rose-800/50 rounded-3xl p-4.5 shadow-2xl shadow-rose-950/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/50">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Welcome, {userName}! 👋
              </h1>
              <p className="text-[11px] text-rose-300/80 font-medium">
                RubyChan Uncensored Roleplay Portal
              </p>
            </div>
          </div>

          <span className="bg-rose-950/80 border border-rose-700/60 text-rose-300 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-rose-400" />
            18+ Active
          </span>
        </div>

        {/* Quick Balance Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-900/40 text-center">
          <div className="bg-[#12071d]/80 rounded-xl p-2 border border-rose-900/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Mana</p>
            <p className="text-xs font-black text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
              <Zap className="w-3 h-3 fill-amber-400" /> {energy}
            </p>
          </div>

          <div className="bg-[#12071d]/80 rounded-xl p-2 border border-rose-900/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Ruby Orbs</p>
            <p className="text-xs font-black text-rose-300 flex items-center justify-center gap-0.5 mt-0.5">
              🔮 {gems}
            </p>
          </div>

          <div className="bg-[#12071d]/80 rounded-xl p-2 border border-rose-900/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Companions</p>
            <p className="text-xs font-black text-purple-300 flex items-center justify-center gap-0.5 mt-0.5">
              💖 {characters.length}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Reward Claim Card */}
      <div className="bg-gradient-to-r from-rose-950/60 via-purple-950/60 to-slate-950 border border-rose-600/40 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Gift className="w-2.5 h-2.5" /> Daily Blessing
          </span>
          <h3 className="font-extrabold text-xs text-white">Claim Daily +25 Energy</h3>
          <p className="text-[10px] text-slate-400">Get +25 Starlight Energy free every 24h</p>
        </div>

        {cooldownSeconds > 0 ? (
          <button
            disabled
            className="px-3 py-2 rounded-xl text-[11px] font-extrabold bg-slate-900 border border-rose-900/40 text-slate-400 cursor-not-allowed shrink-0 flex items-center gap-1 shadow-inner"
          >
            Claimed ✓ Next in {formatHHMMSS(cooldownSeconds)}
          </button>
        ) : (
          <button
            onClick={handleClaimReward}
            disabled={isClaiming}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-95 shrink-0"
          >
            {isClaiming ? 'Claiming...' : 'Claim Daily +25 Energy'}
          </button>
        )}
      </div>

      {/* Quick Launch Featured Companions */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            Quick Roleplay Launch
          </h2>
          <button
            onClick={() => onNavigateTab('characters')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
          >
            See All ({characters.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {characters.slice(0, 4).map((char) => (
            <div
              key={char.id}
              onClick={() => {
                triggerHaptic('medium');
                onSelectCharacter(char);
              }}
              className="bg-[#140a1f] border border-rose-900/40 hover:border-rose-500/60 p-3 rounded-2xl cursor-pointer transition-all shadow-md group flex items-center space-x-2.5"
            >
              <img
                src={char.avatar}
                alt={char.name}
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-rose-500/40 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-xs text-white group-hover:text-rose-300 truncate">
                  {char.name}
                </h3>
                <p className="text-[10px] text-rose-400 truncate">{char.category}</p>
                <span className="text-[9px] text-slate-400 mt-1 inline-flex items-center gap-0.5">
                  <MessageSquare className="w-2.5 h-2.5 text-rose-400" /> Chat Now
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-2 pt-1">
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onCreateCharacter();
            }}
            className="bg-[#140a1f] border border-rose-700/50 hover:border-rose-400 p-3 rounded-2xl flex items-center space-x-2.5 text-left transition-all shadow-md group"
          >
            <div className="p-2 bg-rose-950 text-rose-400 rounded-xl shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-white group-hover:text-rose-300">Create AI Bot</p>
              <p className="text-[10px] text-slate-400">Design custom AI</p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenStore();
            }}
            className="bg-[#140a1f] border border-amber-700/50 hover:border-amber-400 p-3 rounded-2xl flex items-center space-x-2.5 text-left transition-all shadow-md group"
          >
            <div className="p-2 bg-amber-950 text-amber-400 rounded-xl shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-white group-hover:text-amber-300">Ruby Orbs Store</p>
              <p className="text-[10px] text-slate-400">Recharge Orbs</p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenStore();
            }}
            className="bg-[#140a1f] border border-purple-700/50 hover:border-purple-400 p-3 rounded-2xl flex items-center space-x-2.5 text-left transition-all shadow-md group"
          >
            <div className="p-2 bg-purple-950 text-purple-400 rounded-xl shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-white group-hover:text-purple-300">Empress VIP</p>
              <p className="text-[10px] text-slate-400">Unlimited Pass</p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenSettingsModal();
            }}
            className="bg-[#140a1f] border border-slate-800 hover:border-rose-500 p-3 rounded-2xl flex items-center space-x-2.5 text-left transition-all shadow-md group"
          >
            <div className="p-2 bg-slate-900 text-slate-300 rounded-xl shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-white group-hover:text-rose-300">Persona Profile</p>
              <p className="text-[10px] text-slate-400">User settings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
