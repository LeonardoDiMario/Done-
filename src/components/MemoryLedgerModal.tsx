import React, { useState } from 'react';
import { Brain, Plus, Trash2, X, Sparkles, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { Character, MemoryFact } from '../types';
import { triggerHaptic } from '../utils/telegramSdk';

interface MemoryLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  memories: MemoryFact[];
  onAddMemory: (category: string, content: string) => Promise<void>;
  onDeleteMemory: (factId: string) => Promise<void>;
  onClearMemories: () => Promise<void>;
  isBurmese?: boolean;
}

export const MemoryLedgerModal: React.FC<MemoryLedgerModalProps> = ({
  isOpen,
  onClose,
  character,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories
}) => {
  const [newContent, setNewContent] = useState('');
  const [category, setCategory] = useState<string>('user_preference');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !character) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    triggerHaptic('medium');
    try {
      await onAddMemory(category, newContent.trim());
      setNewContent('');
    } catch (err) {
      console.error('Error adding memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#12081c] border border-rose-900/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-purple-950 px-4 py-3.5 border-b border-rose-900/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Brain className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                {character?.name || 'Companion'}'s Memory Ledger
              </h2>
              <p className="text-[11px] text-slate-400">
                Long-Term AI Memory stored in backend database
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

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Add New Memory Form */}
          <form onSubmit={handleAdd} className="bg-slate-900/90 border border-rose-900/30 rounded-xl p-3 space-y-2.5">
            <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              Add Custom User Memory Fact
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-1 bg-[#12081c] border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-rose-500"
              >
                <option value="user_preference">Preference</option>
                <option value="story_milestone">Milestone</option>
                <option value="secret_revealed">Secret</option>
                <option value="character_impression">Impression</option>
              </select>

              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder='e.g., "User loves sci-fi stories & dark fantasy"'
                className="col-span-2 bg-[#12081c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={!newContent.trim() || isSubmitting}
              className="w-full py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save to Memory Bank</span>
            </button>
          </form>

          {/* Memory List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">
                Saved Memory Facts ({memories.length})
              </span>
              {memories.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all memory facts for this character?')) {
                      onClearMemories();
                    }
                  }}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>

            {memories.length > 0 ? (
              <div className="space-y-2">
                {memories.map((fact) => (
                  <div
                    key={fact.id}
                    className="bg-[#140a1f] border border-rose-900/30 rounded-xl p-3 flex items-start justify-between gap-2 shadow-sm hover:border-rose-800/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {fact.category.replace('_', ' ')}
                        </span>
                        {fact.isAutoExtracted && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> AI Extracted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {fact.content}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {new Date(fact.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onDeleteMemory(fact.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                <Brain className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  No memory facts saved yet. Chat with the character or add manual facts above!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-3 border-t border-rose-900/30 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Persistent DB Memory Bank
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-bold border border-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

