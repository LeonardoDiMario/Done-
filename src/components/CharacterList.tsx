import React, { useState } from 'react';
import { Search, Plus, Sparkles, Users, Flame } from 'lucide-react';
import { Character, UserRelationship } from '../types';
import { CharacterCard } from './CharacterCard';
import { triggerHaptic } from '../utils/telegramSdk';
import { t, SupportedLanguage } from '../utils/i18n';

interface CharacterListProps {
  characters: Character[];
  relationships: Record<string, UserRelationship>;
  onSelectCharacter: (character: Character) => void;
  onOpenMemory: (character: Character) => void;
  onCreateCharacter: () => void;
  onDeleteCharacter: (characterId: string) => void;
  isBurmese?: boolean;
  language?: SupportedLanguage;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  relationships,
  onSelectCharacter,
  onOpenMemory,
  onCreateCharacter,
  onDeleteCharacter,
  language = 'my'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: { id: string; key: string }[] = [
    { id: 'All', key: 'cat_All' },
    { id: 'Anime', key: 'cat_Anime' },
    { id: 'Realistic', key: 'cat_Realistic' },
    { id: 'Sci-Fi', key: 'cat_SciFi' },
    { id: 'Fantasy', key: 'cat_Fantasy' },
    { id: 'Custom', key: 'cat_Custom' }
  ];

  const filteredCharacters = characters.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.personality || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-3 space-y-4 pb-28">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {t('ai_companions_title', language)}
            <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" /> {language === 'my' ? 'လူကြိုက်များ' : 'Hot'}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            {t('ai_companions_desc', language)}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_characters', language)}
          className="w-full bg-[#130b1b] border border-rose-900/40 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              triggerHaptic('light');
              setSelectedCategory(cat.id);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#2a122e] text-white border border-rose-500/60 shadow-lg shadow-rose-950/60'
                : 'bg-[#130b1b] text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {t(cat.key, language)}
          </button>
        ))}
      </div>

      {/* 2-Column Vertical Character Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card 1: Custom Character Creation Portal */}
        <div
          onClick={() => {
            triggerHaptic('heavy');
            onCreateCharacter();
          }}
          className="group relative bg-[#180d24] border border-rose-700/60 rounded-3xl overflow-hidden cursor-pointer hover:border-rose-400 transition-all duration-300 shadow-xl flex flex-col justify-between aspect-[3/4] p-3"
        >
          {/* Portal Background Art */}
          <img
            src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80"
            alt="Create character portal"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0714] via-rose-950/40 to-transparent" />

          {/* Top Diamond Gem Badge */}
          <div className="relative z-10 flex justify-center mt-6">
            <div className="bg-[#241233]/90 border border-rose-500/60 backdrop-blur-md rounded-full px-3 py-1 flex items-center space-x-1 shadow-lg group-hover:scale-105 transition-transform">
              <span className="font-black text-xs text-white">99</span>
              <span className="text-xs">🔮</span>
            </div>
          </div>

          {/* Bottom Card Title & Description */}
          <div className="relative z-10 space-y-0.5">
            <h3 className="font-black text-sm sm:text-base text-white group-hover:text-rose-300 transition-colors">
              {t('create_custom_character', language)}
            </h3>
            <p className="text-[11px] text-slate-300 opacity-90 leading-tight">
              {t('design_custom_ai', language)}
            </p>
          </div>
        </div>

        {/* Existing & Custom Characters */}
        {filteredCharacters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            relationship={relationships[char.id]}
            onSelectCharacter={onSelectCharacter}
            onOpenMemory={onOpenMemory}
            onDeleteCharacter={onDeleteCharacter}
          />
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="bg-[#130b1b] border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">
            {language === 'my' ? 'ရှာဖွေတွေ့ရှိသည့် ဇာတ်ကောင် မရှိပါ' : 'No Characters Found'}
          </h3>
          <button
            onClick={onCreateCharacter}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-950/60 transition-all inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('create_custom_character', language)}</span>
          </button>
        </div>
      )}
    </div>
  );
};
