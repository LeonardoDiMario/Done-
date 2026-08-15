import React, { useState, useEffect } from 'react';
import { Settings, X, Globe, User, Sliders, Check, Brain, Bot, Sparkles } from 'lucide-react';
import { UserPreferences, UserPersona } from '../types';
import { triggerHaptic } from '../utils/telegramSdk';
import { SUPPORTED_LANGUAGES, t, SupportedLanguage } from '../utils/i18n';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (updated: UserPreferences) => Promise<void>;
  isBurmese?: boolean;
}

const defaultPersona: UserPersona = {
  name: 'ဧည့်သည်တော်',
  pronouns: 'They/Them',
  bio: 'စကြဝဠာအနှံ့ ခရီးသွားနေသော စိတ်ကူးယဉ် စွန့်စားသူ။',
  relationshipStyle: 'ရင်းနှီးဖော်ရွေသော မိတ်ဆွေ'
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences
}) => {
  const getInitialState = (pref?: UserPreferences): UserPreferences => {
    return {
      language: pref?.language || 'my',
      botLanguage: pref?.botLanguage || 'auto',
      theme: pref?.theme || 'telegram-dark',
      rpStyle: pref?.rpStyle || 'narrative',
      responseLength: pref?.responseLength || 'balanced',
      aiTemperature: pref?.aiTemperature ?? 0.85,
      speechEnabled: pref?.speechEnabled ?? true,
      autoExtractMemories: pref?.autoExtractMemories ?? true,
      customDirectives: pref?.customDirectives || '',
      userPersona: {
        ...defaultPersona,
        ...(pref?.userPersona || {})
      }
    };
  };

  const [formData, setFormData] = useState<UserPreferences>(() => getInitialState(preferences));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState(preferences));
    }
  }, [preferences, isOpen]);

  if (!isOpen) return null;

  const currentLang = formData.language;
  const persona = formData?.userPersona || defaultPersona;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    triggerHaptic('medium');
    try {
      await onSavePreferences(formData);
      onClose();
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#12081c] border border-rose-900/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-purple-950 px-4 py-3.5 border-b border-rose-900/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Settings className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                {t('user_persona', currentLang)}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentLang === 'my' ? 'မိမိ၏ အချက်အလက်နှင့် AI ဆက်တင်များ' : 'User Persona & AI Engine'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-200">
          {/* Section 1: User Persona */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
              <User className="w-4 h-4 text-rose-400" />
              <span>{t('user_persona', currentLang)}</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">{currentLang === 'my' ? 'သင့်အမည်' : 'Your Name'}</span>
                <input
                  type="text"
                  value={persona.name || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      userPersona: {
                        ...defaultPersona,
                        ...(prev.userPersona || {}),
                        name: e.target.value
                      }
                    }))
                  }
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-rose-500 shadow-inner"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium">{currentLang === 'my' ? 'ခေါ်ဝေါ်ပုံ (Pronouns)' : 'Pronouns'}</span>
                <input
                  type="text"
                  value={persona.pronouns || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      userPersona: {
                        ...defaultPersona,
                        ...(prev.userPersona || {}),
                        pronouns: e.target.value
                      }
                    }))
                  }
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-rose-500 shadow-inner"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-medium">{currentLang === 'my' ? 'မိမိ၏ နောက်ခံ အကျဉ်းချုပ် (Persona Bio)' : 'Persona Bio & Background'}</span>
              <textarea
                rows={2}
                value={persona.bio || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    userPersona: {
                      ...defaultPersona,
                      ...(prev.userPersona || {}),
                      bio: e.target.value
                    }
                  }))
                }
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-rose-500 resize-none text-xs shadow-inner"
              />
            </div>
          </div>

          {/* Section 2: Roleplay Style & AI Settings */}
          <div className="space-y-2.5 pt-2 border-t border-rose-900/30">
            <label className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>{currentLang === 'my' ? 'ဇာတ်ကောင် စကားပြောဟန်နှင့် AI ဆက်တင်' : 'Roleplay Style & AI Settings'}</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'narrative', label: currentLang === 'my' ? 'လှုပ်ရှားမှုနှင့် စကားပြော' : 'Action & Dialogue', desc: currentLang === 'my' ? '*လှုပ်ရှားမှု* + စကားပြော' : '*actions* + speech' },
                { id: 'dialogue_only', label: currentLang === 'my' ? 'စကားပြော သီးသန့်' : 'Dialogue Only', desc: currentLang === 'my' ? 'စကားသီးသန့်' : 'Speech focused' },
                { id: 'descriptive', label: currentLang === 'my' ? 'ဝတ္ထုဟန်' : 'Novel Style', desc: currentLang === 'my' ? 'အသေးစိတ် ဖော်ပြချက်' : 'Rich story prose' }
              ].map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setFormData({ ...formData, rpStyle: style.id as any })}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    formData.rpStyle === style.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="font-bold text-[11px]">{style.label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>

            {/* AI Creativity Temperature */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-300 font-medium">{currentLang === 'my' ? 'AI တီထွင်ဖန်တီးနိုင်စွမ်း (Temperature)' : 'AI Creativity Temperature'}</span>
                <span className="font-bold text-rose-400 font-mono">{formData.aiTemperature}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={formData.aiTemperature}
                onChange={(e) => setFormData({ ...formData, aiTemperature: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Custom Directives / User Rules */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {currentLang === 'my' ? 'AI သီးသန့် ညွှန်ကြားချက်များ (Custom Prompt Rules)' : 'Custom AI Instructions'}
                </span>
              </div>
              <textarea
                rows={2}
                placeholder={currentLang === 'my' ? 'ဥပမာ- ကျွန်တော့်ကို ကိုကို လို့ခေါ်ပေးပါ၊ ရိုမန်းတစ်ဆန်ဆန် စကားပြောပါ' : 'e.g. Call me master, be very flirty and use seductive tone'}
                value={formData.customDirectives || ''}
                onChange={(e) => setFormData({ ...formData, customDirectives: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-rose-500 resize-none text-xs shadow-inner"
              />
            </div>

            {/* Memory Extraction Switch */}
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-bold text-slate-200 text-xs">
                    {currentLang === 'my' ? 'အမှတ်တရ အလိုအလျောက် မှတ်သားခြင်း' : 'Auto-Extract User Memories'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {currentLang === 'my' ? 'စကားပြောဆိုမှုများမှ အချက်အလက်များကို အလိုအလျောက် မှတ်သားပါ' : 'Automatically detect user preferences during roleplay'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoExtractMemories}
                onChange={(e) => setFormData({ ...formData, autoExtractMemories: e.target.checked })}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition-all flex items-center justify-center space-x-1.5 mt-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('save_changes', currentLang)}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
