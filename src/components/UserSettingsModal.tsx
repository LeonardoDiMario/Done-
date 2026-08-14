import React, { useState, useEffect } from 'react';
import { Settings, X, Globe, User, Sliders, Check, Brain } from 'lucide-react';
import { UserPreferences, UserPersona } from '../types';
import { triggerHaptic } from '../utils/telegramSdk';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (updated: UserPreferences) => Promise<void>;
  isBurmese?: boolean;
}

const defaultPersona: UserPersona = {
  name: 'Traveler',
  pronouns: 'They/Them',
  bio: 'An adventurous explorer journeying through the multiverse.',
  relationshipStyle: 'Friendly & Supportive'
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences
}) => {
  const getInitialState = (pref?: UserPreferences): UserPreferences => {
    return {
      language: pref?.language || 'auto',
      theme: pref?.theme || 'telegram-dark',
      rpStyle: pref?.rpStyle || 'narrative',
      responseLength: pref?.responseLength || 'balanced',
      aiTemperature: pref?.aiTemperature ?? 0.85,
      speechEnabled: pref?.speechEnabled ?? true,
      autoExtractMemories: pref?.autoExtractMemories ?? true,
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
      <div className="bg-[#12081c] border border-rose-900/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-purple-950 px-4 py-3.5 border-b border-rose-900/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Settings className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                User Preferences & Persona
              </h2>
              <p className="text-[11px] text-slate-400">
                Synchronized with backend server database
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white transition-all border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-200">
          {/* Section 1: Language */}
          <div className="space-y-2">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-rose-400" />
              Language Preference
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en', label: '🇬🇧 English', desc: 'English AI Responses' },
                { id: 'auto', label: '🌐 Auto-Detect', desc: 'Seamless Language Response' }
              ].map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => setFormData({ ...formData, language: lang.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    formData.language === lang.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">{lang.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lang.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: User Persona */}
          <div className="space-y-2.5 pt-2 border-t border-rose-900/30">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-rose-400" />
              Your Character Persona
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Your Name</span>
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
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium">Pronouns</span>
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
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-medium">Persona Bio & Background</span>
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
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500 resize-none text-xs"
              />
            </div>
          </div>

          {/* Section 3: Roleplay Style & AI Settings */}
          <div className="space-y-2.5 pt-2 border-t border-rose-900/30">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-rose-400" />
              Roleplay Style & AI Engine
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'narrative', label: 'Action & Dialogue', desc: '*actions* + speech' },
                { id: 'dialogue_only', label: 'Dialogue Only', desc: 'Speech focused' },
                { id: 'descriptive', label: 'Novel Style', desc: 'Rich story prose' }
              ].map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setFormData({ ...formData, rpStyle: style.id as any })}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    formData.rpStyle === style.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
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
                <span className="text-[11px] text-slate-300 font-medium">AI Creativity Temperature</span>
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

            {/* Memory Extraction Switch */}
            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-bold text-slate-200 text-xs">
                    Auto-Extract User Memories
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Automatically detect user preferences during roleplay
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
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition-all flex items-center justify-center space-x-1.5 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences to Database</span>
          </button>
        </form>
      </div>
    </div>
  );
};

