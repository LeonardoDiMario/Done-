import React, { useState } from 'react';
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
  ListChecks
} from 'lucide-react';
import { triggerHaptic, triggerHapticNotification } from '../utils/telegramSdk';
import { Character, ChatMessage, UserRelationship } from '../types';

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
  onDeleteMessagesForCharacter
}) => {
  const [historyModalChar, setHistoryModalChar] = useState<Character | null>(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef<boolean>(false);

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
      handleOpenTelegramBot(char.id, true);
    }
  };

  const effectiveMessagesMap = activeMessages || messagesMap || {};

  // Characters that have messages
  const activeChatCharacters = characters.filter(
    (c) => c && c.id && effectiveMessagesMap[c.id] && effectiveMessagesMap[c.id].length > 0
  );

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
    if (!confirm(`Are you sure you want to delete ${selectedCharIds.length} active conversation(s)?`)) {
      return;
    }
    setIsBulkDeleting(true);
    triggerHapticNotification('success');
    try {
      const { apiFetch } = await import('../utils/api');
      await apiFetch('/api/conversations/delete', {
        method: 'POST',
        body: JSON.stringify({ characterIds: selectedCharIds })
      });
      if (onClearHistoryForCharacter) {
        selectedCharIds.forEach((id) => onClearHistoryForCharacter(id));
      }
      setSelectedCharIds([]);
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
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  const handleOpenHistory = (char: Character, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    setHistoryModalChar(char);
    setIsSelectMode(false);
    setSelectedMsgIds([]);
  };

  const handleToggleSelectMsg = (msgId: string) => {
    triggerHaptic('light');
    setSelectedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSelectAllMsgs = () => {
    if (!historyModalChar) return;
    triggerHaptic('medium');
    const allMsgs = effectiveMessagesMap[historyModalChar.id] || [];
    if (selectedMsgIds.length === allMsgs.length) {
      setSelectedMsgIds([]);
    } else {
      setSelectedMsgIds(allMsgs.map((m) => m.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!historyModalChar || selectedMsgIds.length === 0) return;
    if (confirm(`Delete ${selectedMsgIds.length} selected message(s) from history?`)) {
      triggerHapticNotification('success');
      if (onDeleteMessagesForCharacter) {
        await onDeleteMessagesForCharacter(historyModalChar.id, selectedMsgIds);
      }
      setSelectedMsgIds([]);
    }
  };

  const handleDeleteSingleMsg = async (msgId: string) => {
    if (!historyModalChar) return;
    triggerHaptic('heavy');
    if (onDeleteMessagesForCharacter) {
      await onDeleteMessagesForCharacter(historyModalChar.id, [msgId]);
    }
    setSelectedMsgIds((prev) => prev.filter((id) => id !== msgId));
  };

  const handleClearWholeHistory = async (charId: string) => {
    if (confirm('Are you sure you want to delete the entire chat history transcript for this character?')) {
      triggerHapticNotification('warning');
      if (onClearHistoryForCharacter) {
        await onClearHistoryForCharacter(charId);
      }
      setHistoryModalChar(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 flex flex-col justify-between min-h-[75vh] pb-24">
      <div className="space-y-4">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Active Conversations</span>
              <span className="text-xs bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                {activeChatCharacters.length}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {isSelectMode ? 'Select conversations to delete' : 'Press & hold any chat to select & delete'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedCharIds([]);
              }}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-full border transition-all active:scale-95 shrink-0 ${
                isSelectMode
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-rose-500'
              }`}
            >
              {isSelectMode ? 'Done' : 'Select'}
            </button>

            <button
              onClick={() => handleOpenTelegramBot()}
              className="text-xs font-black text-rose-300 bg-rose-950/90 hover:bg-rose-900 border border-rose-700/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-rose-400" />
              <span>Telegram</span>
            </button>
          </div>
        </div>

        {activeChatCharacters.length === 0 ? (
          /* Empty State Graphic */
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-[#140a1f]/60 border border-rose-900/30 rounded-3xl p-6">
            <div className="relative w-36 h-28 flex items-center justify-center">
              <div className="absolute top-0 right-2 w-24 h-16 bg-rose-950/50 border border-rose-800/40 rounded-2xl flex items-center justify-center space-x-1 shadow-lg backdrop-blur-md">
                <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              </div>

              <div className="absolute bottom-0 left-2 w-24 h-16 bg-gradient-to-r from-rose-600 to-purple-600 border border-rose-400 rounded-2xl shadow-xl shadow-rose-950/60 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <h2 className="text-base font-extrabold text-white">No active chats yet</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pick a companion to start a new chat. Chat history will be saved automatically with AI memory.
              </p>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                if (onStartChatting) {
                  onStartChatting();
                } else if (onCreateCharacter) {
                  onCreateCharacter();
                }
              }}
              className="py-3 px-8 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-extrabold text-xs shadow-xl shadow-rose-950/60 active:scale-95 transition-all mt-2 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Explore Companions
            </button>
          </div>
        ) : (
          /* Active Chat List with Actions */
          <div className="space-y-3">
            {/* Bulk Selection Toolbar (Only visible when selecting) */}
            {isSelectMode && (
              <div className="flex items-center justify-between bg-[#180b28] p-2.5 rounded-2xl border border-rose-900/40 animate-fade-in">
                <button
                  onClick={handleSelectAllChars}
                  className="text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/60 border border-rose-800/40"
                >
                  {selectedCharIds.length === activeChatCharacters.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-rose-400" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-slate-400" />
                      <span>Select All</span>
                    </>
                  )}
                </button>

                {selectedCharIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteConversations}
                    disabled={isBulkDeleting}
                    className="text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 border border-rose-400 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-950/80 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedCharIds.length})</span>
                  </button>
                )}
              </div>
            )}

            {activeChatCharacters.map((char) => {
              const msgs = effectiveMessagesMap[char.id] || [];
              const lastMsg = msgs[msgs.length - 1];
              const isSelected = selectedCharIds.includes(char.id);

              return (
                <div
                  key={char.id}
                  onMouseDown={() => handlePressStart(char.id)}
                  onMouseUp={handlePressEnd}
                  onTouchStart={() => handlePressStart(char.id)}
                  onTouchEnd={handlePressEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handlePressStart(char.id);
                  }}
                  onClick={(e) => handleCardClick(char, e)}
                  className={`bg-[#140a1f] border p-3.5 rounded-2xl space-y-3 shadow-lg transition-all group cursor-pointer select-none ${
                    isSelected ? 'border-rose-500 bg-rose-950/30' : 'border-rose-900/40 hover:border-rose-500/60'
                  }`}
                >
                  {/* Top Character Info */}
                  <div className="flex items-center space-x-3">
                    {isSelectMode && (
                      <button
                        onClick={(e) => handleToggleSelectChar(char.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                    )}

                    <div className="relative shrink-0">
                      <img
                        src={char.avatar}
                        alt={char.name || ''}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-500/30"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#140a1f] rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-white group-hover:text-rose-300 transition-colors truncate">
                          {char.name || 'Companion'}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {lastMsg?.timestamp
                            ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Active'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-normal">
                        {lastMsg?.text || char.greeting}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar for Row */}
                  <div className="pt-2 border-t border-rose-900/30 grid grid-cols-2 gap-2 text-center">
                    {/* View History Button */}
                    <button
                      onClick={(e) => handleOpenHistory(char, e)}
                      className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl py-2 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>View History ({msgs.length})</span>
                    </button>

                    {/* Resume on Telegram Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTelegramBot(char.id, true);
                      }}
                      className="bg-gradient-to-r from-rose-700 to-purple-700 hover:from-rose-600 hover:to-purple-600 text-white border border-rose-500/40 rounded-xl py-2 px-3 text-[11px] font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Resume on Telegram</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Chat History Transcript Modal */}
      {historyModalChar && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#12081f] border border-rose-800/60 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Header */}
            <div className="bg-[#180b28] px-4 py-3 border-b border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={historyModalChar.avatar}
                  alt={historyModalChar?.name || ''}
                  className="w-9 h-9 rounded-2xl object-cover ring-2 ring-rose-500/50"
                />
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-white">
                    {historyModalChar?.name || 'Companion'}
                  </h3>
                  <p className="text-[10px] text-rose-300 font-medium">Chat History Transcript</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {/* Select Mode Toggle */}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsSelectMode(!isSelectMode);
                    setSelectedMsgIds([]);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 border transition-all ${
                    isSelectMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  <ListChecks className="w-3 h-3" />
                  <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
                </button>

                <button
                  onClick={() => setHistoryModalChar(null)}
                  className="p-1.5 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resume on Telegram Primary Action Ribbon */}
            <div className="bg-gradient-to-r from-rose-950/90 via-purple-950/90 to-indigo-950/90 p-3 border-b border-rose-800/40 flex items-center justify-between gap-2">
              <div className="text-[11px] text-rose-200 leading-tight">
                <span className="font-bold text-white block">Continue Roleplay on Telegram</span>
                <span className="text-[10px] text-rose-300/80">
                  Bot will sync with this character's AI memory
                </span>
              </div>
              <button
                onClick={() => handleOpenTelegramBot(historyModalChar.id, true)}
                className="py-2 px-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/80 flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Resume</span>
              </button>
            </div>

            {/* Select Actions Bar (When Select Mode is Active) */}
            {isSelectMode && (
              <div className="bg-[#160a26] px-4 py-2 border-b border-rose-900/30 flex items-center justify-between text-xs">
                <button
                  onClick={handleSelectAllMsgs}
                  className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {selectedMsgIds.length ===
                    (effectiveMessagesMap[historyModalChar.id] || []).length
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>

                {selectedMsgIds.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="text-[11px] font-extrabold text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete ({selectedMsgIds.length})</span>
                  </button>
                )}
              </div>
            )}

            {/* Messages Transcript Scroll Area */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#0a0412]">
              {(effectiveMessagesMap[historyModalChar.id] || []).length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-xs text-slate-500">No messages recorded in chat history.</p>
                </div>
              ) : (
                (effectiveMessagesMap[historyModalChar.id] || []).map((msg) => {
                  const isSelected = selectedMsgIds.includes(msg.id);

                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        if (isSelectMode) handleToggleSelectMsg(msg.id);
                      }}
                      className={`relative p-3 rounded-2xl text-xs space-y-1 transition-all ${
                        isSelectMode ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-rose-950/60 border-2 border-rose-500 shadow-md'
                          : msg.sender === 'user'
                          ? 'bg-gradient-to-r from-rose-900/40 to-purple-900/40 border border-rose-800/30 text-white ml-6'
                          : 'bg-[#140a1f] border border-rose-900/40 text-slate-200 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-rose-900/20 pb-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          {isSelectMode && (
                            <span className="text-rose-400">
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                          <span className={msg.sender === 'user' ? 'text-rose-300' : 'text-purple-300'}>
                            {msg.sender === 'user' ? 'You' : (historyModalChar?.name || 'Bot')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[9px] text-slate-500">
                            <Clock className="w-2.5 h-2.5" />
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Saved'}
                          </span>

                          {!isSelectMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingleMsg(msg.id);
                              }}
                              className="text-slate-600 hover:text-rose-400 p-0.5"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-3 bg-[#180b28] border-t border-rose-900/40 flex items-center justify-between gap-2">
              <button
                onClick={() => handleClearWholeHistory(historyModalChar.id)}
                className="py-2 px-3 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-800 hover:border-rose-700/60 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete History</span>
              </button>

              <button
                onClick={() => handleOpenTelegramBot(historyModalChar.id, true)}
                className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Telegram to Resume</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
