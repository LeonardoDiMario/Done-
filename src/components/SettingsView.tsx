import React from 'react';
import { Brain, User, Gift, ChevronRight, Zap, Crown, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';
import { UserPreferences } from '../types';
import { PolicyType } from './LegalSupportModal';
import { ActiveEntitlement } from './StoreModal';

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
  onOpenStore,
  onOpenSettingsModal,
  onOpenMemoryLedger,
  onOpenPolicyModal
}) => {
  const isVip = activeEntitlement?.status === 'active';

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-28">
      {/* Header Title */}
      <h1 className="text-2xl font-black text-white tracking-tight">
        Settings & Account
      </h1>

      {/* Your Plan Card */}
      <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl p-4 space-y-3 shadow-xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Membership</p>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-1.5">
            {isVip ? (
              <>
                <Crown className="w-5 h-5 text-amber-400" />
                <span>{activeEntitlement?.planName || 'VIP Membership'}</span>
              </>
            ) : (
              <span>Free Plan</span>
            )}
          </h2>
          {isVip ? (
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              Active ({activeEntitlement?.daysRemaining} days left)
            </span>
          ) : (
            <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800/50 px-2.5 py-1 rounded-full font-bold">Standard Mana</span>
          )}
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenStore();
          }}
          className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{isVip ? 'Manage VIP & Extend Plan' : 'Upgrade to Empress VIP'}</span>
        </button>
      </div>

      {/* USER PERSONA & PREFERENCES SECTION */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1">
          PROFILE & AI PREFERENCES
        </p>
        <div className="bg-[#140a1f] border border-rose-900/60 rounded-2xl divide-y divide-rose-900/40 shadow-xl overflow-hidden">
          <div
            onClick={() => {
              triggerHaptic('light');
              if (onOpenSettingsModal) onOpenSettingsModal();
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                <User className="w-4 h-4 text-rose-400" />
                <span>User Persona & AI Preferences</span>
              </p>
              <p className="text-xs text-slate-300">
                Name ({userPreferences?.userPersona?.name || 'Traveler'}), AI temperature, auto memories.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>

          {onOpenMemoryLedger && (
            <div
              onClick={() => {
                triggerHaptic('light');
                onOpenMemoryLedger();
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>AI Long-Term Memory Ledger</span>
                </p>
                <p className="text-xs text-slate-300">
                  Inspect and manage saved character memories.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* SUPPORT & FEEDBACK SECTION */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1">
          SUPPORT & FEEDBACK
        </p>
        <div className="bg-[#140a1f] border border-rose-900/60 rounded-2xl shadow-xl overflow-hidden">
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('support');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                Support & Feedback
              </p>
              <p className="text-xs text-slate-300">
                Account, bugs, Premium, Energy/Gems and payment help.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* LEGAL & POLICIES SECTION */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-extrabold text-rose-300 tracking-wider uppercase px-1">
          LEGAL & POLICIES
        </p>
        <div className="bg-[#140a1f] border border-rose-900/60 rounded-2xl divide-y divide-rose-900/40 shadow-xl overflow-hidden">
          {/* Terms & Conditions */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('terms');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                Terms & Conditions
              </p>
              <p className="text-xs text-slate-300">
                Read the service terms.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>

          {/* Privacy Policy */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('privacy');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                Privacy Policy
              </p>
              <p className="text-xs text-slate-300">
                Learn how platform data is handled.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>

          {/* 18+ Policy */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenPolicyModal('18plus');
            }}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/40 transition-all group"
          >
            <div className="space-y-1 min-w-0 pr-2">
              <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                18+ Policy
              </p>
              <p className="text-xs text-slate-300">
                Adults-only access and safety rules.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
