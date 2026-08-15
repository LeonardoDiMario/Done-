import React, { useState } from 'react';
import { Globe, Bot, Check, X, Sparkles, Smartphone } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage, t, getLanguageName } from '../utils/i18n';
import { triggerHaptic } from '../utils/telegramSdk';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAppLanguage: SupportedLanguage;
  currentBotLanguage: SupportedLanguage;
  onSave: (appLang: SupportedLanguage, botLang: SupportedLanguage) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentAppLanguage,
  currentBotLanguage,
  onSave
}) => {
  const [selectedAppLang, setSelectedAppLang] = useState<SupportedLanguage>(currentAppLanguage || 'my');
  const [selectedBotLang, setSelectedBotLang] = useState<SupportedLanguage>(currentBotLanguage || 'auto');
  const [activeTab, setActiveTab] = useState<'app' | 'bot'>('app');

  if (!isOpen) return null;

  const currentLang = selectedAppLang;

  const handleApply = () => {
    triggerHaptic('medium');
    onSave(selectedAppLang, selectedBotLang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#12081c] border border-rose-800/60 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-purple-950 px-4 py-3.5 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <Globe className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                {t('lang_settings_title', currentLang)}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('lang_settings_desc', currentLang)}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white transition-all border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-[#170c24]/90 border-b border-rose-900/30 flex gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('app');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'app'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-950/60'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('app_language_title', currentLang)}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('bot');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bot'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{t('bot_language_title', currentLang)}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'app' ? (
            <div className="space-y-2">
              <div className="bg-rose-950/30 border border-rose-900/40 p-2.5 rounded-2xl">
                <p className="text-xs text-rose-200 font-medium leading-relaxed">
                  {t('app_language_desc', currentLang)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => {
                  const isSelected = selectedAppLang === lang.code;
                  return (
                    <button
                      key={`app-${lang.code}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedAppLang(lang.code);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-black shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-white truncate">{lang.nativeName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{lang.name}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-purple-950/30 border border-purple-900/40 p-2.5 rounded-2xl">
                <p className="text-xs text-purple-200 font-medium leading-relaxed">
                  {t('bot_language_desc', currentLang)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedBotLang === lang.code;
                  return (
                    <button
                      key={`bot-${lang.code}`}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedBotLang(lang.code);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500 text-purple-200 font-black shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-white truncate">{lang.nativeName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{lang.name}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-3.5 bg-[#170c24] border-t border-rose-900/40 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 leading-tight">
            <span>{t('app_language_title', currentLang)}: </span>
            <span className="font-bold text-rose-300">{getLanguageName(selectedAppLang)}</span>
            <br />
            <span>{t('bot_language_title', currentLang)}: </span>
            <span className="font-bold text-purple-300">{getLanguageName(selectedBotLang)}</span>
          </div>

          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('save_changes', currentLang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
