import React, { useState } from 'react';
import { X, HelpCircle, Shield, FileText, Lock, Send, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';

export type PolicyType = 'support' | 'terms' | 'privacy' | '18plus';

interface LegalSupportModalProps {
  isOpen: boolean;
  type: PolicyType | null;
  onClose: () => void;
  isBurmese: boolean;
}

export const LegalSupportModal: React.FC<LegalSupportModalProps> = ({
  isOpen,
  type,
  onClose,
  isBurmese
}) => {
  const [supportCategory, setSupportCategory] = useState<'Account' | 'Bugs' | 'Premium' | 'Energy/Gems' | 'Payment'>('Energy/Gems');
  const [messageText, setMessageText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !type) return null;

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    triggerHaptic('heavy');
    try {
      await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: supportCategory,
          subject: `${supportCategory} Support Inquiry`,
          message: messageText.trim()
        })
      });
      setSubmitted(true);
      setTimeout(() => {
        setMessageText('');
      }, 500);
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setSubmitted(true);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'support':
        return 'Support & Feedback';
      case 'terms':
        return 'Terms & Conditions';
      case 'privacy':
        return 'Privacy Policy';
      case '18plus':
        return '18+ Policy & Safety Rules';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#0e0e17] border border-purple-900/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#12121e] px-4 py-3.5 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
              {type === 'support' && <HelpCircle className="w-4 h-4" />}
              {type === 'terms' && <FileText className="w-4 h-4" />}
              {type === 'privacy' && <Lock className="w-4 h-4" />}
              {type === '18plus' && <Shield className="w-4 h-4" />}
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">{getTitle()}</h2>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setSubmitted(false);
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-100 leading-relaxed">
          {type === 'support' && (
            <div className="space-y-4">
              <p className="text-slate-200 text-xs sm:text-sm">
                Need help with your account, bugs, Premium features, Energy/Gems, or payments? Fill out the inquiry below or reach out to our team.
              </p>

              {submitted ? (
                <div className="bg-emerald-950/60 border border-emerald-500/60 p-5 rounded-2xl text-center space-y-2.5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-extrabold text-white text-base">Ticket Submitted!</h3>
                  <p className="text-xs text-emerald-200">
                    Thank you for your feedback. Our support team will process your request shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold mt-2"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitSupport} className="space-y-4">
                  <div>
                    <label className="font-extrabold text-slate-100 block mb-1 text-xs">Issue Category</label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value as any)}
                      className="w-full bg-[#141422] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 font-semibold text-xs"
                    >
                      <option value="Energy/Gems">Energy & Gems Balance</option>
                      <option value="Payment">Telegram Stars Payment Help</option>
                      <option value="Premium">VIP & Premium Membership</option>
                      <option value="Bugs">Bug Report & App Glitch</option>
                      <option value="Account">Account & Persona Data</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-100 block mb-1 text-xs">Inquiry Details</label>
                    <textarea
                      rows={4}
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Describe your issue or feedback in detail..."
                      className="w-full bg-[#141422] border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 resize-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Support Ticket</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">1. Acceptance of Terms</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  By accessing Ruby Chan AI, you agree to comply with these Terms & Conditions. You confirm that you are at least 18 years old or the legal age of majority in your jurisdiction.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">2. AI Character Content & Roleplay</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  Ruby Chan AI provides interactive AI companions and virtual roleplay chat experiences powered by generative artificial intelligence. All character responses, background lore, and dialogue are generated dynamically for entertainment purposes.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">3. Virtual Energy & Gems Currency</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  Energy and Gems acquired within the app are non-transferable virtual items. Purchases made via Telegram Stars or associated payment channels are subject to Telegram platform store terms.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">4. Prohibited Content & Safety</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  Users are strictly prohibited from generating illegal, abusive, harmful, or unauthorized non-consensual content. Accounts violating these guidelines may be subject to termination.
                </p>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">1. Information We Handle</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  We store user-selected preferences, custom character profiles, memory ledger notes, and interaction history to deliver personalized AI responses.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">2. AI Processing & Memory Ledger</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  Conversation inputs are sent securely to server-side Gemini AI models solely to generate real-time character responses and maintain long-term memory continuity.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">3. Data Control & Deletion</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  You retain complete control over your chat history and memory bank. You can erase memory logs or clear chat histories at any time directly through the app interface.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">4. Security Standards</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  All data transfers between the client and server operate over encrypted HTTPS channels. We do not sell or trade user data to third-party advertisers.
                </p>
              </div>
            </div>
          )}

          {type === '18plus' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">1. Adults-Only Requirement</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  Ruby Chan AI is strictly restricted to adults aged 18 and older. Minors are not permitted to access or interact with any features of this applet.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">2. Content & Roleplay Boundary Rules</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  While creative and romantic roleplay dialogues are supported, users must maintain consensual, lawful boundaries. Explicit real-world harm, non-consensual exploitation, and illegal material are forbidden.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">3. Safety & Self-Regulation</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  AI companions are virtual entities and do not replace real human relationships or professional counsel. Enjoy your creative roleplay responsibly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a0a12] border-t border-purple-900/20 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            Ruby Chan AI &bull; Legal & Support Hub
          </p>
        </div>
      </div>
    </div>
  );
};
