import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Gift, Crown, MessageSquare, Plus, Flame, ChevronRight, User, ShieldCheck, Share2, Check } from 'lucide-react';
import { triggerHaptic, triggerHapticNotification, getTelegramUser } from '../utils/telegramSdk';
import { apiFetch } from '../utils/api';
import { Character, UserPreferences } from '../types';
import { t } from '../utils/i18n';

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
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  const lang = userPreferences.language || 'my';
  const tgUser = getTelegramUser();
  const userName = tgUser?.first_name || (tgUser?.username ? `@${tgUser.username}` : '') || userPreferences?.userPersona?.name || (lang === 'my' ? 'ဧည့်သည်တော်' : 'Traveler');

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
      } else {
        if (data.nextClaimAt) {
          setNextClaimAt(data.nextClaimAt);
        }
      }
    } catch (err) {
      console.error('Daily claim request failed:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleInviteFriend = () => {
    triggerHaptic('medium');
    const myTgId = tgUser?.id || 'guest';
    const botUrl = `https://t.me/Rubby_Chan_Bot?start=ref_${myTgId}`;
    const shareText = `Come chat with 18+ adult AI companions on RubyChan 2.0! Join using my invite: ${botUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(botUrl);
      setCopiedInvite(true);
      triggerHapticNotification('success');
      setTimeout(() => setCopiedInvite(false), 2500);
    }

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openTelegramLink) {
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(shareText)}`;
      (window as any).Telegram.WebApp.openTelegramLink(tgShareUrl);
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
                {lang === 'my' ? `မင်္ဂလာပါ ${userName}!` : `${userName}! 👋`}
              </h1>
              <p className="text-[11px] text-rose-300/80 font-medium flex items-center gap-1">
                RubyChan <span className="text-[9px] font-black text-purple-200 bg-purple-950/90 px-1 py-0.5 rounded border border-purple-700 leading-none">2.0</span> <span className="text-[9px] font-black text-rose-200 bg-rose-950/90 px-1 py-0.5 rounded border border-rose-700 leading-none">18+</span>
              </p>
            </div>
          </div>

          <span className="bg-rose-950/80 border border-rose-700/60 text-emerald-300 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {t('verified_status', lang)}
          </span>
        </div>

        {/* Quick Balance Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-900/40 text-center">
          <div className="bg-[#12071d]/80 rounded-2xl p-2 border border-rose-900/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase">{t('energy', lang)}</p>
            <p className="text-xs font-black text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
              <Zap className="w-3 h-3 fill-amber-400" /> {energy}
            </p>
          </div>

          <div className="bg-[#12071d]/80 rounded-2xl p-2 border border-rose-900/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase">{t('gems', lang)}</p>
            <p className="text-xs font-black text-rose-300 flex items-center justify-center gap-0.5 mt-0.5">
              🔮 {gems}
            </p>
          </div>

          <div className="bg-[#12071d]/80 rounded-2xl p-2 border border-rose-900/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase">{t('nav_characters', lang)}</p>
            <p className="text-xs font-black text-purple-300 flex items-center justify-center gap-0.5 mt-0.5">
              💖 {characters.length}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Reward Claim Card */}
      <div className="bg-gradient-to-r from-rose-950/60 via-purple-950/60 to-slate-950 border border-rose-600/40 rounded-3xl p-3.5 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Gift className="w-2.5 h-2.5" /> {t('daily_blessing_title', lang)}
          </span>
          <h3 className="font-extrabold text-xs text-white">{t('daily_claim_title', lang)}</h3>
          <p className="text-[10px] text-slate-400">{t('daily_claim_desc', lang)}</p>
        </div>

        {cooldownSeconds > 0 ? (
          <button
            disabled
            className="px-3 py-2 rounded-2xl text-[11px] font-extrabold bg-slate-900 border border-rose-900/40 text-slate-400 cursor-not-allowed shrink-0 flex items-center gap-1 shadow-inner"
          >
            {t('claimed_next_in', lang)} {formatHHMMSS(cooldownSeconds)}
          </button>
        ) : (
          <button
            onClick={handleClaimReward}
            disabled={isClaiming}
            className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-95 shrink-0"
          >
            {isClaiming ? 'စောင့်ဆိုင်းပါ...' : t('daily_claim_title', lang)}
          </button>
        )}
      </div>

      {/* Task: Invite Friends (+25 Energy on first message) */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-950 border border-indigo-600/40 rounded-3xl p-3.5 flex items-center justify-between shadow-xl">
        <div className="space-y-1 max-w-[65%]">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Share2 className="w-2.5 h-2.5" /> Tasks
          </span>
          <h3 className="font-extrabold text-xs text-white">{t('task_invite_title', lang)}</h3>
          <p className="text-[10px] text-slate-400 leading-snug">{t('task_invite_desc', lang)}</p>
        </div>

        <button
          onClick={handleInviteFriend}
          className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/50 transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
        >
          {copiedInvite ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'my' ? 'ကူးပြီးပြီ' : 'Copied'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('invite_now_btn', lang)}</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Launch Featured Companions */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            {t('featured_characters', lang)}
          </h2>
          <button
            onClick={() => onNavigateTab('characters')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
          >
            {t('all_characters', lang)} ({characters.length}) <ChevronRight className="w-3.5 h-3.5" />
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
                  <MessageSquare className="w-2.5 h-2.5 text-rose-400" /> {t('start_chat', lang)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-2 pt-1">
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{t('quick_actions', lang)}</p>
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
              <p className="font-extrabold text-xs text-white group-hover:text-rose-300">
                {t('create_custom_character', lang)}
              </p>
              <p className="text-[10px] text-slate-400">{t('design_custom_ai', lang)}</p>
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
              <p className="font-extrabold text-xs text-white group-hover:text-amber-300">{t('gems_store', lang)}</p>
              <p className="text-[10px] text-slate-400">{t('recharge_orbs', lang)}</p>
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
              <p className="font-extrabold text-xs text-white group-hover:text-purple-300">{t('empress_vip', lang)}</p>
              <p className="text-[10px] text-slate-400">{t('unlimited_pass', lang)}</p>
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
              <p className="font-extrabold text-xs text-white group-hover:text-rose-300">
                {lang === 'my' ? 'User Settings' : t('nav_settings', lang)}
              </p>
              <p className="text-[10px] text-slate-400">
                {lang === 'my' ? 'Persona, Voice & Profile' : t('profile_language_desc', lang)}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
