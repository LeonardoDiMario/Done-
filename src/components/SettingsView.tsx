import React, { useState } from 'react';
import { ChevronRight, Zap, Crown, Globe, Bot, ShieldCheck, Sparkles, Smartphone, User, Sliders, Brain } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';
import { UserPreferences } from '../types';
import { PolicyType } from './LegalSupportModal';
import { ActiveEntitlement } from './StoreModal';
import { LanguageModal } from './LanguageModal';
import { UserSettingsModal } from './UserSettingsModal';
import { t, SupportedLanguage, getLanguageName } from '../utils/i18n';

interface SettingsViewProps {
  userPreferences?: UserPreferences;
  activeEntitlement?: ActiveEntitlement | null;
  onSavePreferences?: (prefs: UserPreferences) => void;
  onOpenStore: () => void;
  onOpenSettingsModal?: () => void;
  onOpenMemoryLedger?: () => void;
  onOpenPolicyModal: (type: PolicyType) => void;
  isBurmese?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userPreferences,
  activeEntitlement,
  onSavePreferences,
  onOpenStore,
  onOpenSettingsModal,
  onOpenMemoryLedger,
  onOpenPolicyModal
}) => {
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  const isVip = activeEntitlement?.status === 'active';
  const currentLang = userPreferences?.language || 'my';
  const currentBotLang = userPreferences?.botLanguage || 'auto';
  const personaName = userPreferences?.userPersona?.name || (currentLang === 'my' ? 'ဧည့်သည်တော်' : 'Traveler');

  const handleSaveLanguageSettings = (appLang: SupportedLanguage, botLang: SupportedLanguage) => {
    if (onSavePreferences && userPreferences) {
      onSavePreferences({
        ...userPreferences,
        language: appLang,
        botLanguage: botLang
      });
    }
  };

  const handleSavePersonaPreferences = async (updated: UserPreferences) => {
    if (onSavePreferences) {
      onSavePreferences(updated);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-28">
      {/* Header Title */}
      <h1 className="text-2xl font-black text-white tracking-tight">
        {t('nav_settings', currentLang)}
      </h1>

      {/* TOP 1. PERSONA & AI SETTINGS CARD (မိမိ၏ အချက်အလက်နှင့် ဇာတ်ကောင်/AI ဆက်တင်များ) */}
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-rose-400" />
          <span>{currentLang === 'my' ? 'မိမိ၏ အချက်အလက်နှင့် ဇာတ်ကောင်ပုံစံ' : 'User Persona & Character Settings'}</span>
        </p>

        <div
          onClick={() => {
            triggerHaptic('medium');
            setIsPersonaModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#1d092b] via-[#2a0e3f] to-[#160624] border-2 border-rose-500/60 hover:border-rose-400 rounded-3xl p-4 shadow-2xl shadow-rose-950/60 cursor-pointer transition-all duration-300 group relative overflow-hidden active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/60 shrink-0 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6 text-white" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-sm text-white group-hover:text-rose-200 transition-colors">
                    {currentLang === 'my' ? 'မိမိ၏ အချက်အလက်နှင့် AI ဆက်တင်များ' : 'User Profile & AI Persona'}
                  </h3>
                  <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/50">
                    Active
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded-lg text-rose-200 font-bold">
                    <User className="w-3 h-3 text-rose-400" />
                    {personaName}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded-lg text-purple-200 font-bold">
                    <Sliders className="w-3 h-3 text-purple-400" />
                    {userPreferences?.rpStyle === 'dialogue_only' 
                      ? (currentLang === 'my' ? 'စကားသီးသန့်' : 'Dialogue Only') 
                      : userPreferences?.rpStyle === 'descriptive' 
                      ? (currentLang === 'my' ? 'ဝတ္ထုဟန်' : 'Novel Style') 
                      : (currentLang === 'my' ? 'လှုပ်ရှားမှု+စကား' : 'Action & Speech')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pl-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-rose-900/50 group-hover:bg-rose-600 flex items-center justify-center text-rose-300 group-hover:text-white transition-colors border border-rose-600/50 shadow-md">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-rose-300/90 font-medium mt-2.5 pt-2.5 border-t border-rose-900/40 flex items-center justify-between">
            <span>{currentLang === 'my' ? 'ဇာတ်ကောင် စကားပြောဟန်နှင့် AI စိတ်ကြိုက်ပြင်ရန် နှိပ်ပါ' : 'Configure speaking tone, style & AI creativity'}</span>
            <span className="text-[10px] text-rose-400 underline font-bold">{t('tap_to_open', currentLang)}</span>
          </p>
        </div>
      </div>

      {/* 2. Your Membership Card */}
      <div className="bg-[#140a1f] border border-rose-900/40 rounded-3xl p-4.5 space-y-3 shadow-xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {t('vip_status', currentLang)}
        </p>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-1.5">
            {isVip ? (
              <>
                <Crown className="w-5 h-5 text-amber-400" />
                <span>{activeEntitlement?.planName || t('empress_vip', currentLang)}</span>
              </>
            ) : (
              <span>{t('free_plan', currentLang)}</span>
            )}
          </h2>
          {isVip ? (
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              {activeEntitlement?.daysRemaining} {t('days_left', currentLang)}
            </span>
          ) : (
            <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800/50 px-2.5 py-1 rounded-full font-bold">
              {t('standard_mana', currentLang)}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenStore();
          }}
          className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{isVip ? t('manage_vip_btn', currentLang) : t('upgrade_vip_btn', currentLang)}</span>
        </button>
      </div>

      {/* 2. DEDICATED SINGLE BLOCK BOX: LANGUAGE SETTINGS */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('lang_settings_title', currentLang)}</span>
        </p>

        {/* The Clickable Single Block Box */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            setIsLanguageModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#170a25] via-[#210e35] to-[#140822] border-2 border-rose-600/50 hover:border-rose-400/90 rounded-3xl p-4 shadow-2xl shadow-rose-950/60 cursor-pointer transition-all duration-300 group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/50 shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5 text-white" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-black text-sm text-white group-hover:text-rose-200 transition-colors flex items-center gap-1.5">
                  {t('lang_settings_title', currentLang)}
                  <span className="text-[9px] font-black text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded-full border border-amber-500/50">
                    Dual Engine
                  </span>
                </h3>

                {/* Sub-details displaying currently selected languages */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded-lg text-rose-200 font-bold">
                    <Smartphone className="w-3 h-3 text-rose-400" />
                    UI: {getLanguageName(currentLang)}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded-lg text-purple-200 font-bold">
                    <Bot className="w-3 h-3 text-purple-400" />
                    Bot: {getLanguageName(currentBotLang)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pl-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-rose-900/40 group-hover:bg-rose-600 flex items-center justify-center text-rose-300 group-hover:text-white transition-colors border border-rose-700/50 shadow-sm">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-rose-300/80 font-medium mt-2 pt-2 border-t border-rose-900/40 flex items-center justify-between">
            <span>{t('click_to_change_lang', currentLang)}</span>
            <span className="text-[10px] text-slate-400 underline">{t('tap_to_open', currentLang)}</span>
          </p>
        </div>
      </div>

      {/* 3. SUPPORT & HELP */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1">
          {t('support_feedback', currentLang)}
        </p>
        <div className="bg-[#140a1f] border border-rose-900/60 rounded-3xl shadow-xl overflow-hidden">
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('support');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                {t('support_feedback', currentLang)}
              </p>
              <p className="text-xs text-slate-300">
                {t('support_feedback_desc', currentLang)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* 5. LEGAL & POLICIES */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1">
          {t('terms_conditions', currentLang)}
        </p>
        <div className="bg-[#140a1f] border border-rose-900/60 rounded-3xl divide-y divide-rose-900/40 shadow-xl overflow-hidden">
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('terms');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                {t('terms_conditions', currentLang)}
              </p>
              <p className="text-xs text-slate-300">
                {t('terms_conditions_desc', currentLang)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>

          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('privacy');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                {t('privacy_policy', currentLang)}
              </p>
              <p className="text-xs text-slate-300">
                {t('privacy_policy_desc', currentLang)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>

          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('18plus');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                {t('policy_18plus', currentLang)}
              </p>
              <p className="text-xs text-slate-300">
                {t('policy_18plus_desc', currentLang)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* Dedicated Language Settings Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentAppLanguage={currentLang}
        currentBotLanguage={currentBotLang}
        onSave={handleSaveLanguageSettings}
      />

      {/* Dedicated User Persona & AI Settings Modal */}
      {userPreferences && (
        <UserSettingsModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          preferences={userPreferences}
          onSavePreferences={handleSavePersonaPreferences}
        />
      )}
    </div>
  );
};
