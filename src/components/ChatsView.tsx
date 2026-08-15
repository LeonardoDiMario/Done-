import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Heart,
  Eye,
  Send,
  RotateCcw,
  X,
  Clock,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ListChecks,
  Pin,
  PinOff,
  Bookmark
} from 'lucide-react';
import { triggerHaptic, triggerHapticNotification } from '../utils/telegramSdk';
import { Character, ChatMessage, UserRelationship } from '../types';
import { t, SupportedLanguage } from '../utils/i18n';
import { apiFetch } from '../utils/api';

interface ChatsViewProps {
  characters?: Character[];
  activeMessages?: Record<string, ChatMessage[]>;
  messagesMap?: Record<string, ChatMessage[]>;
  relationships?: Record<string, UserRelationship>;
  onSelectCharacter: (char: Character) => void;
  onStartChatting?: () => void;
  onCreateCharacter?: () => void;
  onClearHistoryForCharacter?: (charId: string) => void;
  onDeleteMessagesForCharacter?: (charId: string, messageIds: string[]) => void;
  isBurmese?: boolean;
  language?: SupportedLanguage;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  characters = [],
  activeMessages,
  messagesMap,
  relationships = {},
  onSelectCharacter,
  onStartChatting,
  onCreateCharacter,
  onClearHistoryForCharacter,
  onDeleteMessagesForCharacter,
  language = 'my'
}) => {
  const [historyModalChar, setHistoryModalChar] = useState<Character | null>(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [pinnedCharIds, setPinnedCharIds] = useState<string[]>([]);
  const [isTogglingPin, setIsTogglingPin] = useState<string | null>(null);

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef<boolean>(false);

  // Fetch active conversations & pinned list on mount
  useEffect(() => {
    const fetchActiveConvs = async () => {
      try {
        const res = await apiFetch('/api/conversations/active');
        const data = await res.json();
        if (data && Array.isArray(data.pinnedCharacterIds)) {
          setPinnedCharIds(data.pinnedCharacterIds);
        }
      } catch (err) {
        console.warn('Active conversations fetch fallback:', err);
      }
    };
    fetchActiveConvs();
  }, []);

  const handlePressStart = (charId: string) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      triggerHaptic('heavy');
      setIsSelectMode(true);
      setSelectedCharIds((prev) => (prev.includes(charId) ? prev : [...prev, charId]));
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = (char: Character, e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }

    if (isSelectMode) {
      handleToggleSelectChar(char.id, e);
    } else {
      triggerHaptic('medium');
      onSelectCharacter(char);
    }
  };

  const effectiveMessagesMap = activeMessages || messagesMap || {};

  // Characters that have messages where user actually engaged or msgs exist
  const activeChatCharacters = characters.filter((c) => {
    if (!c || !c.id) return false;
    const msgs = effectiveMessagesMap[c.id];
    return Array.isArray(msgs) && msgs.length > 0 && msgs.some((m) => m.sender === 'user' || msgs.length > 1);
  });

  // Sort characters: Pinned first, then by last message timestamp descending
  const sortedCharacters = [...activeChatCharacters].sort((a, b) => {
    const isAPinned = pinnedCharIds.includes(a.id);
    const isBPinned = pinnedCharIds.includes(b.id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;

    const msgsA = effectiveMessagesMap[a.id] || [];
    const msgsB = effectiveMessagesMap[b.id] || [];
    const timeA = msgsA[msgsA.length - 1]?.timestamp || '1970-01-01';
    const timeB = msgsB[msgsB.length - 1]?.timestamp || '1970-01-01';
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  const pinnedCount = sortedCharacters.filter((c) => pinnedCharIds.includes(c.id)).length;
  const unpinnedCount = sortedCharacters.filter((c) => !pinnedCharIds.includes(c.id)).length;

  const handleTogglePin = async (charId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    const isCurrentlyPinned = pinnedCharIds.includes(charId);
    const updated = isCurrentlyPinned
      ? pinnedCharIds.filter((id) => id !== charId)
      : [...pinnedCharIds, charId];

    setPinnedCharIds(updated);
    setIsTogglingPin(charId);

    try {
      await apiFetch('/api/conversations/pin', {
        method: 'POST',
        body: JSON.stringify({ characterId: charId, pinned: !isCurrentlyPinned })
      });
      triggerHapticNotification('success');
    } catch (err) {
      console.error('Failed to update pin status:', err);
    } finally {
      setIsTogglingPin(null);
    }
  };

  const handleToggleSelectChar = (charId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    setSelectedCharIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const handleSelectAllChars = () => {
    triggerHaptic('medium');
    if (selectedCharIds.length === activeChatCharacters.length) {
      setSelectedCharIds([]);
    } else {
      setSelectedCharIds(activeChatCharacters.map((c) => c.id));
    }
  };

  const handleBulkDeleteConversations = async () => {
    if (selectedCharIds.length === 0) return;
    const confirmMsg = language === 'my'
      ? `စကားဝိုင်း ${selectedCharIds.length} ခုကို အပြီးတိုင် ဖျက်ရန် သေချာပါသလား?`
      : `Are you sure you want to delete ${selectedCharIds.length} active conversation(s)?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }
    setIsBulkDeleting(true);
    triggerHapticNotification('success');
    try {
      await apiFetch('/api/conversations/delete', {
        method: 'POST',
        body: JSON.stringify({ characterIds: selectedCharIds })
      });
      if (onClearHistoryForCharacter) {
        selectedCharIds.forEach((id) => onClearHistoryForCharacter(id));
      }
      setSelectedCharIds([]);
      setIsSelectMode(false);
    } catch (err) {
      console.error('Failed to bulk delete conversations:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleOpenTelegramBot = (charId?: string, isResume = false) => {
    triggerHaptic('medium');
    let telegramUrl = 'https://t.me/Rubby_Chan_Bot';
    if (charId) {
      const prefix = isResume ? 'resume_' : 'char_';
      telegramUrl += `?start=${prefix}${charId}`;
    }

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
      window.location.href = telegramUrl;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-3 space-y-4 pb-28">
      {/* Title Header with Selection Mode Trigger */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {t('active_conversations', language)}
            <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800/40 px-2.5 py-0.5 rounded-full font-bold">
              {activeChatCharacters.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            {t('chats_on_telegram_desc', language)}
          </p>
        </div>

        {activeChatCharacters.length > 0 && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedCharIds([]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              isSelectMode
                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                : 'bg-[#140a1f] text-slate-300 border-rose-900/40 hover:text-white'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>{isSelectMode ? (language === 'my' ? 'ပြီးပြီ' : 'Done') : (language === 'my' ? 'ရွေးချယ်မည်' : 'Select')}</span>
          </button>
        )}
      </div>

      {/* 5-Chat Limit & Pin Policy Information Notice */}
      <div className="bg-gradient-to-r from-[#170926] via-[#1e0a30] to-[#12071f] border border-rose-800/40 rounded-2xl p-3 shadow-lg flex items-start gap-2.5 text-xs text-rose-200/90">
        <div className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg shrink-0 mt-0.5">
          <Pin className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="font-extrabold text-white text-[11px] uppercase tracking-wider">
              {language === 'my' ? 'စကားဝိုင်း သတ်မှတ်ချက် & Pin စနစ်' : 'Active Chats & Pin Policy'}
            </span>
            <span className="text-[10px] font-bold bg-rose-900/60 px-2 py-0.5 rounded-full text-rose-300 border border-rose-700/50">
              📌 {pinnedCount} Pinned • {unpinnedCount}/5 Unpinned
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {t('chat_limit_notice', language)}
          </p>
        </div>
      </div>

      {/* Select Mode Action Bar */}
      {isSelectMode && (
        <div className="bg-[#190c27] border border-rose-700/60 rounded-2xl p-3 flex items-center justify-between animate-fade-in shadow-xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAllChars}
              className="text-xs text-rose-300 font-bold hover:text-white flex items-center gap-1.5"
            >
              {selectedCharIds.length === activeChatCharacters.length ? (
                <CheckSquare className="w-4 h-4 text-rose-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{t('select_all', language)}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              ({selectedCharIds.length}/{activeChatCharacters.length})
            </span>
          </div>

          <button
            onClick={handleBulkDeleteConversations}
            disabled={selectedCharIds.length === 0 || isBulkDeleting}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('delete_selected', language)}</span>
          </button>
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-2.5">
        {sortedCharacters.map((char) => {
          const msgs = effectiveMessagesMap[char.id] || [];
          const lastMsg = msgs[msgs.length - 1];
          const isSelected = selectedCharIds.includes(char.id);
          const isPinned = pinnedCharIds.includes(char.id);

          return (
            <div
              key={char.id}
              onMouseDown={() => handlePressStart(char.id)}
              onMouseUp={handlePressEnd}
              onTouchStart={() => handlePressStart(char.id)}
              onTouchEnd={handlePressEnd}
              onClick={(e) => handleCardClick(char, e)}
              className={`bg-[#140a1f] border p-3.5 rounded-3xl transition-all shadow-md group cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden ${
                isSelected
                  ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/40'
                  : isPinned
                  ? 'border-amber-500/60 bg-gradient-to-r from-[#1c0926] via-[#170921] to-[#12071f] shadow-amber-950/30 shadow-lg ring-1 ring-amber-500/30'
                  : 'border-rose-900/40 hover:border-rose-500/60'
              }`}
            >
              {/* Pinned Glowing Top Strip Indicator */}
              {isPinned && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500" />
              )}

              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {isSelectMode && (
                  <div
                    onClick={(e) => handleToggleSelectChar(char.id, e)}
                    className="p-1 text-slate-400 hover:text-white shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                )}

                <div className="relative shrink-0">
                  <img
                    src={char.avatar}
                    alt={char.name}
                    className={`w-12 h-12 rounded-2xl object-cover ring-2 shrink-0 ${
                      isPinned ? 'ring-amber-400 shadow-md shadow-amber-900/50' : 'ring-rose-500/40'
                    }`}
                  />
                  {isPinned && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-full flex items-center justify-center text-white shadow-md border border-slate-900">
                      <Pin className="w-3 h-3 fill-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-extrabold text-sm text-white group-hover:text-rose-300 truncate">
                        {char.name}
                      </h3>
                      {isPinned && (
                        <span className="text-[9px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded-md shrink-0">
                          {t('pinned_tag', language)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-rose-400/80 font-mono shrink-0 pl-1">
                      {msgs.length} {language === 'my' ? 'စကားဝိုင်း' : 'msgs'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate font-sans">
                    {lastMsg ? lastMsg.text : char.greeting}
                  </p>
                </div>
              </div>

              {!isSelectMode && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Pin / Unpin Button */}
                  <button
                    onClick={(e) => handleTogglePin(char.id, e)}
                    disabled={isTogglingPin === char.id}
                    className={`p-2 rounded-xl transition-all border ${
                      isPinned
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border-slate-800'
                    }`}
                    title={isPinned ? t('unpin_chat', language) : t('pin_chat', language)}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTelegramBot(char.id, true);
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-sky-950 text-slate-400 hover:text-sky-300 transition-all border border-slate-800"
                    title="Chat in Telegram Bot"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistoryModalChar(char);
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-purple-950 text-slate-400 hover:text-purple-300 transition-all border border-slate-800"
                    title="View History"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      onSelectCharacter(char);
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1 active:scale-95 transition-all"
                  >
                    <span>{msgs.length > 0 ? t('resume_chat', language) : t('start_chat', language)}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {activeChatCharacters.length === 0 && (
        <div className="bg-[#140a1f] border border-rose-900/40 rounded-3xl p-8 text-center space-y-3.5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-700/50 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">
              {t('no_conversations_yet', language)}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {t('choose_char_to_chat', language)}
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('medium');
              if (onStartChatting) onStartChatting();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-950/60 transition-all inline-flex items-center space-x-1.5 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('start_first_chat', language)}</span>
          </button>
        </div>
      )}

      {/* History Inspection Modal */}
      {historyModalChar && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#12081c] border border-rose-900/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-purple-950 px-4 py-3.5 border-b border-rose-900/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={historyModalChar.avatar}
                  alt={historyModalChar.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/60"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {historyModalChar.name}
                  </h3>
                  <p className="text-[10px] text-rose-400">
                    {language === 'my' ? 'ချက်တင် မှတ်တမ်း' : 'Conversation History'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHistoryModalChar(null)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {(effectiveMessagesMap[historyModalChar.id] || []).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {language === 'my' ? 'မှတ်တမ်း မရှိသေးပါ' : 'No recorded messages'}
                </div>
              ) : (
                (effectiveMessagesMap[historyModalChar.id] || []).map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-rose-950/40 border border-rose-800/40 ml-6 text-rose-100'
                        : 'bg-slate-900/80 border border-slate-800 mr-6 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                      <span className="font-bold">
                        {msg.sender === 'user' ? (language === 'my' ? 'သင်' : 'You') : historyModalChar.name}
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Together AI Generated"
                        className="mt-2 rounded-xl max-h-48 object-cover w-full border border-rose-500/30"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#160a22] border-t border-rose-900/30 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const target = historyModalChar;
                  setHistoryModalChar(null);
                  triggerHaptic('medium');
                  onSelectCharacter(target);
                }}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Resume in Web App</span>
              </button>

              <button
                onClick={() => {
                  const target = historyModalChar;
                  setHistoryModalChar(null);
                  handleOpenTelegramBot(target.id, true);
                }}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resume in Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
