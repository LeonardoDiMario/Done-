import React from 'react';
import { Brain, Heart, Trash2 } from 'lucide-react';
import { Character, UserRelationship } from '../types';
import { triggerHaptic } from '../utils/telegramSdk';

interface CharacterCardProps {
  character: Character;
  relationship?: UserRelationship;
  onSelectCharacter: (character: Character) => void;
  onOpenMemory: (character: Character) => void;
  onDeleteCharacter?: (characterId: string) => void;
  isBurmese?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  relationship,
  onSelectCharacter,
  onOpenMemory,
  onDeleteCharacter
}) => {
  const bondLevel = relationship?.level || 1;

  return (
    <div
      onClick={() => {
        triggerHaptic('medium');
        onSelectCharacter(character);
      }}
      className="group relative bg-[#130b1b] border border-rose-900/40 rounded-2xl overflow-hidden cursor-pointer hover:border-rose-500/80 transition-all duration-300 shadow-xl flex flex-col justify-between aspect-[3/4]"
    >
      {/* Background Cover Image */}
      <img
        src={character.avatar}
        alt={character.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
      />

      {/* Top Overlay Badges */}
      <div className="relative z-10 p-2.5 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-rose-300 border border-rose-500/40 shadow">
          {character.category}
        </span>

        <div className="flex items-center space-x-1">
          {/* Memory Ledger Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onOpenMemory(character);
            }}
            className="p-1.5 rounded-full bg-black/70 hover:bg-rose-900/90 text-rose-300 backdrop-blur-md transition-all border border-rose-500/40"
            title="Memory Ledger"
          >
            <Brain className="w-3.5 h-3.5" />
          </button>

          {/* Custom character delete button */}
          {character.isCustom && onDeleteCharacter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('heavy');
                onDeleteCharacter(character.id);
              }}
              className="p-1.5 rounded-full bg-rose-950/80 hover:bg-rose-800 text-rose-300 backdrop-blur-md transition-all border border-rose-500/40"
              title="Delete Custom Character"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Gradient Card Info */}
      <div className="relative z-10 p-3 bg-gradient-to-t from-[#0a0510] via-[#0a0510]/80 to-transparent pt-10 mt-auto">
        <div className="flex items-center space-x-1 mb-0.5">
          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
            <Heart className="w-2.5 h-2.5 fill-amber-400" /> Lv.{bondLevel}
          </span>
        </div>

        <h3 className="font-black text-sm sm:text-base text-white group-hover:text-rose-300 transition-colors line-clamp-1 leading-snug">
          {character.name}
        </h3>

        <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 font-normal leading-tight opacity-90">
          {character.title || character.background}
        </p>
      </div>
    </div>
  );
};

