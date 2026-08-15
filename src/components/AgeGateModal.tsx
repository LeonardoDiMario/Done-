import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, FileText, CheckSquare, Square } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';

interface AgeGateModalProps {
  isOpen: boolean;
  onConfirmAge: (dontShowAgain: boolean) => void;
  onOpenPolicyModal?: (type: 'terms' | 'privacy') => void;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({ isOpen, onConfirmAge, onOpenPolicyModal }) => {
  const [denied, setDenied] = useState(false);
  const [is18Checked, setIs18Checked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const canConfirm = is18Checked && termsChecked;

  const handleConfirm = () => {
    if (!canConfirm) return;
    triggerHaptic('heavy');
    onConfirmAge(dontShowAgain);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#10101b] border border-purple-900/60 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center space-y-4 relative">
        <div className="w-16 h-16 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300 shadow-xl shadow-purple-950/50">
          <ShieldAlert className="w-8 h-8 text-purple-400" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">
            Adult Access Verification (18+)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome to <span className="font-extrabold text-purple-300">RubyChan 2.0 AI</span>. This app contains uncensored mature themes and roleplay content for adults only.
          </p>
        </div>

        {denied ? (
          <div className="bg-rose-950/50 border border-rose-500/40 p-4 rounded-2xl text-rose-200 text-xs space-y-2">
            <p className="font-bold">Access Denied</p>
            <p className="text-[11px] text-rose-300">
              You must be 18 years or older and agree to the Terms & Conditions to enter this platform.
            </p>
            <button
              onClick={() => setDenied(false)}
              className="text-[11px] underline text-rose-400 font-bold mt-1"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2 text-left bg-[#161026] p-3.5 rounded-2xl border border-purple-900/40">
            {/* Checkbox 1: 18+ Age */}
            <div
              onClick={() => {
                triggerHaptic('light');
                setIs18Checked(!is18Checked);
              }}
              className="flex items-start space-x-2.5 cursor-pointer select-none"
            >
              <button className="mt-0.5 text-purple-400 shrink-0">
                {is18Checked ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
              </button>
              <span className="text-xs font-extrabold text-slate-200 leading-tight">
                Yes, I am 18 years or older
              </span>
            </div>

            {/* Checkbox 2: Terms & Conditions */}
            <div
              onClick={() => {
                triggerHaptic('light');
                setTermsChecked(!termsChecked);
              }}
              className="flex items-start space-x-2.5 cursor-pointer select-none"
            >
              <button className="mt-0.5 text-purple-400 shrink-0">
                {termsChecked ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
              </button>
              <span className="text-xs font-bold text-slate-300 leading-tight">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenPolicyModal) onOpenPolicyModal('terms');
                  }}
                  className="text-purple-300 underline font-extrabold"
                >
                  Terms & Conditions
                </button>{' '}
                &{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenPolicyModal) onOpenPolicyModal('privacy');
                  }}
                  className="text-purple-300 underline font-extrabold"
                >
                  Privacy Policy
                </button>
              </span>
            </div>

            {/* Checkbox 3: Don't show again on this device */}
            <div
              onClick={() => {
                triggerHaptic('light');
                setDontShowAgain(!dontShowAgain);
              }}
              className="flex items-center space-x-2.5 cursor-pointer select-none pt-1 border-t border-purple-900/30"
            >
              <button className="text-purple-400 shrink-0">
                {dontShowAgain ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <span className="text-[10px] text-slate-400 font-medium">
                Don't show this prompt again on this device
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center space-x-2 ${
                  canConfirm
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/80 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>CONFIRM & ENTER PLATFORM</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setDenied(true);
                }}
                className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-2xl font-bold text-xs transition-all border border-slate-800"
              >
                I am under 18 / I decline
              </button>
            </div>
          </div>
        )}

        <div className="pt-1 text-[10px] text-slate-500 flex items-center justify-center gap-1 font-mono">
          <Lock className="w-3 h-3 text-slate-600" />
          <span>Supabase Verified Adult Access &bull; @rubychan</span>
        </div>
      </div>
    </div>
  );
};
