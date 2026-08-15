import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Volume2,
  VolumeX,
  Brain,
  Sparkles,
  Trash2,
  Heart,
  ChevronDown,
  Compass,
  Zap,
  MessageSquare,
  AlertCircle,
  Image as ImageIcon,
  X,
  Check
} from 'lucide-react';
import { Character, ChatMessage, UserPreferences, UserRelationship } from '../types';
import { triggerHaptic, triggerHapticNotification } from '../utils/telegramSdk';

interface ChatScreenProps {
  character: Character;
  messages: ChatMessage[];
  relationship?: UserRelationship;
  userPreferences: UserPreferences;
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  onOpenMemory: () => void;
  initialScenario?: string | null;
  onScenarioUsed?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  character,
  messages,
  relationship,
  userPreferences,
  onSendMessage,
  onClearHistory,
  onOpenMemory,
  initialScenario,
  onScenarioUsed
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Custom Wallpaper State
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState<boolean>(false);
  const [wallpaperTheme, setWallpaperTheme] = useState<string>(() => {
    return localStorage.getItem('ruby_chan_wallpaper_theme') || 'obsidian';
  });
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>(() => {
    return localStorage.getItem('ruby_chan_custom_wallpaper_url') || '';
  });
  const [tempCustomUrlInput, setTempCustomUrlInput] = useState<string>(customWallpaperUrl);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSelectWallpaper = (theme: string) => {
    setWallpaperTheme(theme);
    localStorage.setItem('ruby_chan_wallpaper_theme', theme);
    triggerHaptic('light');
  };

  const handleSaveCustomWallpaper = () => {
    setCustomWallpaperUrl(tempCustomUrlInput.trim());
    localStorage.setItem('ruby_chan_custom_wallpaper_url', tempCustomUrlInput.trim());
    setWallpaperTheme('custom');
    localStorage.setItem('ruby_chan_wallpaper_theme', 'custom');
    setIsWallpaperModalOpen(false);
    triggerHaptic('medium');
  };

  // Handle auto send of scenario if passed from card
  useEffect(() => {
    if (initialScenario) {
      onSendMessage(initialScenario);
      if (onScenarioUsed) onScenarioUsed();
    }
  }, [initialScenario]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText('');
    setIsSending(true);
    triggerHaptic('medium');

    try {
      await onSendMessage(textToSend);
    } catch (err) {
      console.error('Send error:', err);
      triggerHapticNotification('error');
    } finally {
      setIsSending(false);
    }
  };

  // Play Speech via /api/tts
  const handlePlayTTS = async (msg: ChatMessage) => {
    try {
      if (playingAudioId === msg.id) {
        if (audioRef.current) {
          audioRef.current.pause();
          setPlayingAudioId(null);
        }
        return;
      }

      setPlayingAudioId(msg.id);
      setAudioError(null);
      triggerHaptic('light');

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.text,
          voiceName: character.voiceName || 'Zephyr'
        })
      });

      const data = await res.json();
      if (data.success && data.audioBase64) {
        // Convert Base64 Audio to Data URL
        const audioUrl = `data:audio/mp3;base64,${data.audioBase64}`;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const newAudio = new Audio(audioUrl);
        audioRef.current = newAudio;
        newAudio.play();
        newAudio.onended = () => setPlayingAudioId(null);
        newAudio.onerror = () => {
          setPlayingAudioId(null);
          setAudioError('Audio playback error');
        };
      } else {
        setPlayingAudioId(null);
        setAudioError('TTS service busy');
      }
    } catch (err) {
      console.error('TTS error:', err);
      setPlayingAudioId(null);
      setAudioError('Could not play speech audio');
    }
  };

  // Format message text: separate *action narrations* from spoken "dialogues"
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const actionStr = part.slice(1, -1);
        return (
          <span
            key={index}
            className="block my-1 text-rose-300/90 italic font-medium bg-rose-950/40 px-2 py-1 rounded-md border border-rose-800/30 text-[11px]"
          >
            ✦ {actionStr}
          </span>
        );
      }
      return <span key={index} className="leading-relaxed">{part}</span>;
    });
  };

  const emotionBadge = (emotion?: string) => {
    switch (emotion) {
      case 'surprised':
        return '😲 Surprised';
      case 'flustered':
        return '😳 Flustered';
      case 'thoughtful':
        return '🤔 Thinking';
      case 'dramatic':
        return '✨ Intense';
      case 'happy':
      default:
        return '😊 Happy';
    }
  };

  const quickPhrases = [
    'Hello my love! How is your day?',
    'Tell me a secret about yourself...',
    'Let us go on a romantic adventure together!',
    'Can you whisper something intimate to me?'
  ];

  if (!character) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] max-w-4xl mx-auto bg-[#0a0412] relative overflow-hidden">
      {/* Sub-Header: Relationship Bond & AI Status */}
      <div className="bg-[#140a1f]/90 backdrop-blur-sm border-b border-rose-900/30 px-3 py-2 flex items-center justify-between text-xs z-20">
        <div className="flex items-center space-x-2">
          <span className="bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30 text-[10px] flex items-center gap-1">
            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
            Lv.{relationship?.level || 1} {relationship?.statusTitle || 'Devoted Companion'}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {emotionBadge(messages[messages.length - 1]?.emotion)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              triggerHaptic('medium');
              const botUrl = `https://t.me/Rubby_Chan_Bot?start=char_${encodeURIComponent(character.id)}`;
              if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openTelegramLink(botUrl);
              } else {
                window.open(botUrl, '_blank');
              }
            }}
            className="text-[11px] text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40 px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all"
            title="Chat in Telegram Bot (@Rubby_Chan_Bot)"
          >
            <Send className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Bot</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setIsWallpaperModalOpen(true);
            }}
            className="text-[11px] text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all"
            title="Change Background Wallpaper"
          >
            <ImageIcon className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Wallpaper</span>
          </button>

          <button
            onClick={onOpenMemory}
            className="text-[11px] text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all"
          >
            <Brain className="w-3 h-3 text-rose-400" />
            <span>Memory</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all conversation history with this character?')) {
                onClearHistory();
              }
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
            title="Reset Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Area with Custom Wallpaper */}
      <div
        style={wallpaperTheme === 'custom' && customWallpaperUrl ? {
          backgroundImage: `linear-gradient(rgba(10, 4, 18, 0.82), rgba(10, 4, 18, 0.88)), url(${customWallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
        className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 transition-all ${
          wallpaperTheme === 'cosmic' ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-[#07020d] to-black' :
          wallpaperTheme === 'crimson' ? 'bg-gradient-to-b from-[#1c0813] via-[#0c0309] to-[#050104]' :
          wallpaperTheme === 'cyber' ? 'bg-gradient-to-tr from-[#05021a] via-[#100326] to-[#030d1a]' :
          wallpaperTheme === 'midnight' ? 'bg-gradient-to-b from-[#0b0817] via-[#0e0720] to-[#06040d]' :
          'bg-gradient-to-b from-[#0a0412] via-[#0e0716] to-[#0a0412]'
        }`}
      >
        {/* Character Intro Card in Chat */}
        <div className="bg-[#140a1f]/90 border border-rose-900/40 rounded-2xl p-3.5 text-center max-w-md mx-auto space-y-2 shadow-xl my-2">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-14 h-14 rounded-full mx-auto object-cover ring-2 ring-rose-500/50 shadow-md"
          />
          <h3 className="font-bold text-sm text-slate-100">{character.name}</h3>
          <p className="text-xs text-rose-300 font-medium">{character.title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            "{character.personality}"
          </p>
          <div className="pt-1 border-t border-rose-900/30 text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            RubyChan 2.0 AI Cloud Memory synced
          </div>
        </div>

        {/* Message Stream */}
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}
            >
              <div className="flex items-end space-x-2 max-w-[88%] sm:max-w-[78%]">
                {isBot && (
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-rose-500/40 mb-1"
                  />
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2.5 shadow-md relative group text-xs sm:text-sm ${
                    isBot
                      ? 'bg-[#180d26] text-slate-100 rounded-bl-xs border border-rose-900/40'
                      : 'bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-br-xs shadow-rose-950/40'
                  }`}
                >
                  {/* Formatted Text */}
                  <div className="space-y-1">{renderFormattedText(msg.text)}</div>

                  {/* Generated Together AI Image Rendering */}
                  {msg.imageUrl && (
                    <div className="mt-2.5 rounded-2xl overflow-hidden border border-rose-500/50 shadow-xl relative bg-black/40 group">
                      <img
                        src={msg.imageUrl}
                        alt="Character Portrait"
                        className="w-full max-h-80 object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[10px] text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Together AI Art</span>
                      </div>
                    </div>
                  )}

                  {/* Audio Speech Button for Bot Messages */}
                  {isBot && (
                    <div className="mt-2 pt-1.5 border-t border-rose-900/30 flex items-center justify-between text-[10px] text-slate-400">
                      <button
                        onClick={() => handlePlayTTS(msg)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md font-medium transition-all ${
                          playingAudioId === msg.id
                            ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                            : 'bg-slate-900 text-rose-300 hover:bg-slate-800'
                        }`}
                      >
                        {playingAudioId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen Voice</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {!isBot && (
                    <div className="text-[9px] text-rose-200/80 text-right mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Memory Update Indicator Banner */}
              {msg.memoriesUpdated && msg.memoriesUpdated.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl px-3 py-1.5 text-[11px] max-w-xs flex items-center space-x-1.5 ml-9 animate-fade-in">
                  <Brain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>New Memory Saved:</strong> {msg.memoriesUpdated.join(', ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex items-center space-x-2 ml-2">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-7 h-7 rounded-full object-cover animate-pulse"
            />
            <div className="bg-[#180d26] text-slate-300 text-xs px-3 py-2 rounded-2xl rounded-bl-xs border border-rose-900/40 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] text-rose-300 italic">
                {character.name} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="bg-[#140a1f] border-t border-rose-900/30 p-2 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center space-x-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase px-1 flex items-center gap-0.5">
          <Zap className="w-3 h-3 text-amber-400" /> Quick:
        </span>
        {quickPhrases.map((phrase, idx) => (
          <button
            key={idx}
            onClick={() => {
              triggerHaptic('light');
              setInputText(phrase);
            }}
            className="text-[11px] text-slate-300 bg-slate-900/80 hover:bg-rose-950 hover:text-rose-300 border border-slate-800 hover:border-rose-700/50 rounded-lg px-2.5 py-1 transition-all shrink-0"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSend}
        className="bg-[#140a1f] p-2.5 sm:p-3 border-t border-rose-900/30 flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${character.name}...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md active:scale-95 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Custom Chat Wallpaper Picker Modal */}
      {isWallpaperModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12081f] border border-rose-800/50 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                Chat Wallpaper Theme
              </h3>
              <button
                onClick={() => setIsWallpaperModalOpen(false)}
                className="p-1 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Preset Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'obsidian', name: 'Dark Velvet', bg: 'bg-gradient-to-b from-[#0a0412] to-[#0e0716]' },
                  { id: 'cosmic', name: 'Starry Multiverse', bg: 'bg-indigo-950' },
                  { id: 'crimson', name: 'Crimson Romance', bg: 'bg-gradient-to-b from-[#1c0813] to-[#050104]' },
                  { id: 'cyber', name: 'Cyber Neon', bg: 'bg-gradient-to-tr from-[#05021a] to-[#100326]' },
                  { id: 'midnight', name: 'Midnight Anime', bg: 'bg-gradient-to-b from-[#0b0817] to-[#0e0720]' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectWallpaper(preset.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${preset.bg} ${
                      wallpaperTheme === preset.id
                        ? 'border-rose-500 text-white ring-1 ring-rose-500 shadow-md'
                        : 'border-slate-800/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{preset.name}</span>
                    {wallpaperTheme === preset.id && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image URL Option */}
            <div className="space-y-2 pt-2 border-t border-rose-900/30">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Custom Image URL</p>
              <div className="space-y-2">
                <input
                  type="url"
                  value={tempCustomUrlInput}
                  onChange={(e) => setTempCustomUrlInput(e.target.value)}
                  placeholder="https://example.com/wallpaper.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleSaveCustomWallpaper}
                  className="w-full py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Apply Custom Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

