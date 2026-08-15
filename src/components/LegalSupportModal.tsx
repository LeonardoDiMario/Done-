import React, { useState } from 'react';
import { X, HelpCircle, Shield, FileText, Lock, Send, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/telegramSdk';
import { t, SupportedLanguage } from '../utils/i18n';

export type PolicyType = 'support' | 'terms' | 'privacy' | '18plus';

interface LegalSupportModalProps {
  isOpen: boolean;
  type: PolicyType | null;
  onClose: () => void;
  isBurmese?: boolean;
  language?: SupportedLanguage;
}

export const LegalSupportModal: React.FC<LegalSupportModalProps> = ({
  isOpen,
  type,
  onClose,
  isBurmese = false,
  language
}) => {
  const [supportCategory, setSupportCategory] = useState<'Account' | 'Bugs' | 'Premium' | 'Energy/Gems' | 'Payment'>('Energy/Gems');
  const [messageText, setMessageText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const currentLang = language || (isBurmese ? 'my' : 'en');
  const isMy = currentLang === 'my';

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
        return t('support_feedback', currentLang);
      case 'terms':
        return t('terms_conditions', currentLang);
      case 'privacy':
        return t('privacy_policy', currentLang);
      case '18plus':
        return t('policy_18plus', currentLang);
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
                {isMy
                  ? 'အကောင့်၊ ချို့ယွင်းချက် (Bugs)၊ VIP သက်တမ်း၊ စွမ်းအင်/ပတ္တမြား သို့မဟုတ် ငွေပေးချေမှုဆိုင်ရာ အကူအညီများအတွက် အောက်ပါဖောင်ကို ဖြည့်စွက်ပေးပို့နိုင်ပါသည်။'
                  : 'Need help with your account, bugs, Premium features, Energy/Gems, or payments? Fill out the inquiry below or reach out to our team.'}
              </p>

              {submitted ? (
                <div className="bg-emerald-950/60 border border-emerald-500/60 p-5 rounded-2xl text-center space-y-2.5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-extrabold text-white text-base">
                    {isMy ? 'အချက်အလက် ပေးပို့ပြီးပါပြီ!' : 'Ticket Submitted!'}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {isMy
                      ? 'သင့်တုံ့ပြန်ချက်အတွက် ကျေးဇူးတင်ပါသည်။ ကျွန်ုပ်တို့အဖွဲ့မှ မကြာမီ စစ်ဆေးကူညီပေးပါမည်။'
                      : 'Thank you for your feedback. Our support team will process your request shortly.'}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold mt-2"
                  >
                    {isMy ? 'အခြား မေးခွန်းတစ်ခု ထပ်မံပေးပို့မည်' : 'Submit Another Inquiry'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitSupport} className="space-y-4">
                  <div>
                    <label className="font-extrabold text-slate-100 block mb-1 text-xs">
                      {isMy ? 'ပြဿနာ အမျိုးအစား' : 'Issue Category'}
                    </label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value as any)}
                      className="w-full bg-[#141422] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 font-semibold text-xs"
                    >
                      <option value="Energy/Gems">{isMy ? 'စွမ်းအင်နှင့် ပတ္တမြား လက်ကျန်' : 'Energy & Gems Balance'}</option>
                      <option value="Payment">{isMy ? 'Telegram Stars ငွေပေးချေမှု အကူအညီ' : 'Telegram Stars Payment Help'}</option>
                      <option value="Premium">{isMy ? 'VIP နှင့် Premium အသင်းဝင်ခြင်း' : 'VIP & Premium Membership'}</option>
                      <option value="Bugs">{isMy ? 'ချို့ယွင်းချက် (Bug) သတင်းပို့ခြင်း' : 'Bug Report & App Glitch'}</option>
                      <option value="Account">{isMy ? 'အကောင့်နှင့် ဇာတ်ကောင် အချက်အလက်' : 'Account & Persona Data'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-100 block mb-1 text-xs">
                      {isMy ? 'အသေးစိတ် ဖော်ပြချက်' : 'Inquiry Details'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={isMy ? 'သင်ကြုံတွေ့နေရသော အခက်အခဲကို အသေးစိတ် ရေးသားပေးပါ...' : 'Describe your issue or feedback in detail...'}
                      className="w-full bg-[#141422] border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 resize-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isMy ? 'အကူအညီ တောင်းဆိုလွှာ ပေးပို့မည်' : 'Send Support Ticket'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၁။ စည်းမျဉ်းများကို သဘောတူလက်ခံခြင်း' : '1. Acceptance of Terms'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'RubyChan 2.0 AI ကို အသုံးပြုခြင်းအားဖြင့် ဤဝန်ဆောင်မှု စည်းမျဉ်းများကို လိုက်နာရန် သဘောတူညီပါသည်။ သင်သည် အသက် ၁၈ နှစ် ပြည့်ပြီးသူ ဖြစ်ရပါမည်။'
                    : 'By accessing RubyChan 2.0 AI, you agree to comply with these Terms & Conditions. You confirm that you are at least 18 years old or the legal age of majority in your jurisdiction.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၂။ AI ဇာတ်ကောင်နှင့် စကားပြောဆိုမှု အကြောင်းအရာ' : '2. AI Character Content & Roleplay'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'RubyChan 2.0 AI ရှိ ဇာတ်ကောင်များ၏ စကားပြောဆိုမှုများနှင့် ဇာတ်လမ်းများသည် ဉာဏ်ရည်တု (AI) ဖြင့် အလိုအလျောက် ဖန်တီးထားသော စိတ်ကူးယဉ် ဖျော်ဖြေရေး သက်သက်သာ ဖြစ်ပါသည်။'
                    : 'RubyChan 2.0 AI provides interactive AI companions and virtual roleplay chat experiences powered by generative artificial intelligence. All character responses, background lore, and dialogue are generated dynamically for entertainment purposes.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၃။ စွမ်းအင်နှင့် ပတ္တမြား ငွေကြေးသုံးစွဲမှု' : '3. Virtual Energy & Gems Currency'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'အက်ပ်အတွင်းရှိ စွမ်းအင်နှင့် ပတ္တမြားများသည် အခြားသူထံ လွှဲပြောင်း၍မရသော ဒစ်ဂျစ်တယ် ပစ္စည်းများ ဖြစ်ကြပြီး Telegram Stars မူဝါဒများနှင့်အညီ ဆောင်ရွက်ပါသည်။'
                    : 'Energy and Gems acquired within the app are non-transferable virtual items. Purchases made via Telegram Stars or associated payment channels are subject to Telegram platform store terms.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၄။ တားမြစ်ထားသော အကြောင်းအရာများနှင့် လုံခြုံရေး' : '4. Prohibited Content & Safety'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'တရားမဝင်သော၊ ထိခိုက်နစ်နာစေသော သို့မဟုတ် ခွင့်ပြုချက်မရှိသော အန္တရာယ်ရှိ စာသားများကို ဖန်တီးခြင်းအား တင်းကြပ်စွာ တားမြစ်ထားပါသည်။'
                    : 'Users are strictly prohibited from generating illegal, abusive, harmful, or unauthorized non-consensual content. Accounts violating these guidelines may be subject to termination.'}
                </p>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၁။ သိမ်းဆည်းသော အချက်အလက်များ' : '1. Information We Handle'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'ပိုမိုကောင်းမွန်သော AI အတွေ့အကြုံ ရရှိစေရန်အတွက် အသုံးပြုသူ ရွေးချယ်ထားသော စိတ်ကြိုက်ဆက်တင်များ၊ ဖန်တီးထားသော ဇာတ်ကောင်များနှင့် အမှတ်တရ မှတ်ဉာဏ်များကိုသာ လုံခြုံစွာ သိမ်းဆည်းပါသည်။'
                    : 'We store user-selected preferences, custom character profiles, memory ledger notes, and interaction history to deliver personalized AI responses.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၂။ AI စနစ်နှင့် မှတ်ဉာဏ် ဘဏ်တိုက်' : '2. AI Processing & Memory Ledger'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'စကားဝိုင်း အချက်အလက်များကို Gemini AI ဆာဗာများသို့ လုံခြုံစွာ ပေးပို့ပြီး ဇာတ်ကောင်များ သဘာဝကျကျ အမှတ်ရနေစေရန်အတွက်သာ အသုံးပြုပါသည်။'
                    : 'Conversation inputs are sent securely to server-side Gemini AI models solely to generate real-time character responses and maintain long-term memory continuity.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၃။ ဒေတာ ထိန်းချုပ်မှုနှင့် ဖျက်ပစ်ခြင်း' : '3. Data Control & Deletion'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'မိမိ၏ စကားပြောမှတ်တမ်းများနှင့် အမှတ်တရများကို အက်ပ်အတွင်းမှ အချိန်မရွေး လွတ်လပ်စွာ ဖျက်ပစ်နိုင်ခွင့် အပြည့်အဝ ရှိပါသည်။'
                    : 'You retain complete control over your chat history and memory bank. You can erase memory logs or clear chat histories at any time directly through the app interface.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၄။ လုံခြုံရေး စံနှုန်းများ' : '4. Security Standards'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'အချက်အလက် အားလုံးကို HTTPS လျှို့ဝှက်စနစ်ဖြင့် ကာကွယ်ထားပြီး မည်သည့် ကြော်ငြာကုမ္ပဏီထံသို့မျှ ရောင်းချခြင်း မရှိပါ။'
                    : 'All data transfers between the client and server operate over encrypted HTTPS channels. We do not sell or trade user data to third-party advertisers.'}
                </p>
              </div>
            </div>
          )}

          {type === '18plus' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၁။ လူကြီးများ သီးသန့် အသုံးပြုခြင်း' : '1. Adults-Only Requirement'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'RubyChan 2.0 AI သည် အသက် ၁၈ နှစ်ပြည့်ပြီးသော လူကြီးများအတွက်သာ ရည်ရွယ်ပါသည်။ အသက်မပြည့်သေးသူများ အသုံးပြုခွင့် မရှိပါ။'
                    : 'RubyChan 2.0 AI is strictly restricted to adults aged 18 and older. Minors are not permitted to access or interact with any features of this applet.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၂။ စကားပြောဆိုမှု စည်းကမ်းချက်များ' : '2. Content & Roleplay Boundary Rules'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'စိတ်ကူးယဉ် အချစ်ဇာတ်လမ်းများနှင့် စကားပြောဆိုမှုများကို ခွင့်ပြုထားသော်လည်း အကြမ်းဖက်မှု၊ တရားမဝင်မှုနှင့် မလျော်ကန်သော အကြောင်းအရာများကို တင်းကြပ်စွာ တားမြစ်ပါသည်။'
                    : 'While creative and romantic roleplay dialogues are supported, users must maintain consensual, lawful boundaries. Explicit real-world harm, non-consensual exploitation, and illegal material are forbidden.'}
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-rose-300 text-sm mb-1">
                  {isMy ? '၃။ အသိစိတ်ဖြင့် စနစ်တကျ အသုံးပြုခြင်း' : '3. Safety & Self-Regulation'}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-normal">
                  {isMy
                    ? 'AI ဇာတ်ကောင်များသည် ဒစ်ဂျစ်တယ် စိတ်ကူးယဉ်မှုများသာဖြစ်ပြီး လက်တွေ့ဘဝ ဆက်ဆံရေးများကို အစားမထိုးနိုင်ပါ။ စိတ်ချမ်းမြေ့စွာနှင့် တာဝန်ယူမှုရှိစွာ အသုံးပြုပေးပါ။'
                    : 'AI companions are virtual entities and do not replace real human relationships or professional counsel. Enjoy your creative roleplay responsibly.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a0a12] border-t border-purple-900/20 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            RubyChan 2.0 AI &bull; Legal & Support Hub
          </p>
        </div>
      </div>
    </div>
  );
};
