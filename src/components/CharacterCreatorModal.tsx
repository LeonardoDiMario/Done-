import React, { useState } from 'react';
import { PlusCircle, X, Sparkles, Image, User, MessageSquare, Check } from 'lucide-react';
import { CharacterCategory } from '../types';
import { triggerHaptic } from '../utils/telegramSdk';

interface CharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCharacter: (characterData: any) => Promise<void>;
  isBurmese: boolean;
}

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  isOpen,
  onClose,
  onCreateCharacter,
  isBurmese
}) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
  const [category, setCategory] = useState<CharacterCategory>('Sci-Fi');
  const [personality, setPersonality] = useState('');
  const [background, setBackground] = useState('');
  const [greeting, setGreeting] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presetAvatars = [
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  ];

  const handleFillSample = () => {
    triggerHaptic('light');
    setName(isBurmese ? 'မြနှင်းဖြူ' : 'Mya Nwe');
    setTitle(isBurmese ? 'ရှေးဟောင်း နန်းတွင်း မင်းသမီး' : 'Ancient Palace Princess');
    setCategory('Fantasy');
    setPersonality(isBurmese ? 'ယဉ်ကျေး၊ စိတ်ဓာတ်ကြံ့ခိုင်၊ ဂီတနှင့် ကဗျာ မြတ်နိုးသူ' : 'Gentle, resilient, lovers of music and poetry');
    setBackground(isBurmese ? 'ရတနာပုံ နန်းတော်ကြီးမှ လျှို့ဝှက်ချက်များကို ထိန်းသိမ်းထားသူ မင်းသမီး' : 'A royal princess guarding ancient secrets of the golden realm.');
    setGreeting(isBurmese ? '*ယဉ်ကျေးစွာ ဦးညွှတ်လိုက်သည်* မင်္ဂလာပါ။ ကြွရောက်လာတဲ့ ဧည့်သည်တော်ကြီးကို ကြိုဆိုပါတယ်။ ဘာများ ကူညီပေးရမလဲရှင့်?' : '*bows softly with grace* Welcome, honored traveler. What brings you to my royal gardens today?');
    setSystemPrompt(isBurmese ? 'သင်သည် မြန်မာနန်းတွင်း မင်းသမီး မင်းသမီး မြနှင်းဖြူ ဖြစ်သည်။ ယဉ်ကျေးသိမ်မွေ့သော မြန်မာစကားပြောဆိုပါ' : 'You are Princess Mya Nwe. Respond in polite elegant roleplay format.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !greeting.trim() || isSubmitting) return;

    setIsSubmitting(true);
    triggerHaptic('medium');
    try {
      await onCreateCharacter({
        name: name.trim(),
        title: title.trim() || 'Roleplay Companion',
        avatar,
        category,
        personality: personality.trim() || 'Friendly & adventurous',
        background: background.trim() || 'A custom companion.',
        greeting: greeting.trim(),
        systemPrompt: systemPrompt.trim() || `You are ${name}. Respond in roleplay style with *actions*.`,
        voiceTone: 'Clear and natural'
      });
      onClose();
    } catch (err) {
      console.error('Error creating character:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#17212b] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-sky-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <PlusCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                {isBurmese ? 'ဇာတ်ကောင်သစ် ဖန်တီးမည်' : 'Create Custom AI Character'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isBurmese ? 'စိတ်ကြိုက် Roleplay AI Chatbot ဖန်တီးပါ' : 'Design your unique roleplay bot personality'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-amber-500/30 transition-all"
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> {isBurmese ? 'နမူနာဖြည့်မည်' : 'Sample Preset'}
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* Avatar Presets */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200">{isBurmese ? 'ပုံရိပ် Avatar' : 'Avatar Photo'}</label>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {presetAvatars.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="Avatar Preset"
                  onClick={() => setAvatar(url)}
                  className={`w-11 h-11 rounded-xl object-cover cursor-pointer transition-all ${
                    avatar === url ? 'ring-2 ring-amber-400 scale-105 shadow-md' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Name & Title */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-200">{isBurmese ? 'ဇာတ်ကောင် အမည်' : 'Character Name'} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Princess Mya"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200">{isBurmese ? 'ရာထူး / Title' : 'Title / Role'}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Space Commander"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="font-bold text-slate-200">{isBurmese ? 'အမျိုးအစား' : 'Category'}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CharacterCategory)}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Noir">Noir</option>
              <option value="Anime">Anime</option>
              <option value="Genius">Genius</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Personality & Background */}
          <div>
            <label className="font-bold text-slate-200">{isBurmese ? 'စိတ်နေသဘောထား (Personality)' : 'Personality Traits'}</label>
            <input
              type="text"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g. Playful, loyal, witty"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Greeting */}
          <div>
            <label className="font-bold text-slate-200">{isBurmese ? 'ပထမဆုံး နှုတ်ဆက်စကား (Greeting)' : 'Initial Greeting'} *</label>
            <textarea
              rows={2}
              required
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="e.g. *smiles warmly* Hello there! Ready for our journey?"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="font-bold text-slate-200">{isBurmese ? 'AI System Prompt 指令' : 'System Roleplay Instructions'}</label>
            <textarea
              rows={2}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. You are a noble sorcerer. Use *actions* and speak with wisdom."
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !greeting.trim() || isSubmitting}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 mt-2"
          >
            <Check className="w-4 h-4 text-slate-950" />
            <span>{isBurmese ? 'ဇာတ်ကောင် သိမ်းဆည်းမည်' : 'Save Character'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
