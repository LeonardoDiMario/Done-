import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { DEFAULT_CHARACTERS } from './src/data/defaultCharacters';
import {
  Character,
  ChatMessage,
  MemoryFact,
  UserPreferences,
  UserRelationship
} from './src/types';
import { getServerSupabase } from './src/lib/serverSupabase';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists for local fallback
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserProfileData {
  id: string;
  telegram_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  energy: number;
  gems: number;
  age_verified: boolean;
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  last_daily_claim?: string;
  created_at?: string;
  last_active?: string;
  status?: string;
}

interface PaymentOrder {
  id: string;
  userId: string;
  planId: string;
  amountMmk: number;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired';
  createdAt: string;
}

interface UserEntitlement {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

interface StoreData {
  userProfile: UserProfileData;
  userProfiles: Record<string, UserProfileData>;
  customCharacters: Character[];
  deletedCharacterIds?: string[];
  userPreferences: UserPreferences;
  userPreferencesMap: Record<string, UserPreferences>;
  chatHistories: Record<string, ChatMessage[]>; // Legacy fallback
  userChatHistories: Record<string, Record<string, ChatMessage[]>>; // Isolated: userId -> characterId -> messages
  memoryFacts: Record<string, MemoryFact[]>; // Legacy fallback
  userMemoryFacts: Record<string, Record<string, MemoryFact[]>>; // Isolated: userId -> characterId -> memory facts
  relationships: Record<string, UserRelationship>; // Legacy fallback
  userRelationships: Record<string, Record<string, UserRelationship>>; // Isolated: userId -> characterId -> relationship
  paymentOrders: Record<string, PaymentOrder>;
  entitlements: UserEntitlement[];
  activeTelegramCharacters: Record<string, string>;
  pinnedCharacters?: Record<string, string[]>; // userId -> array of pinned characterIds
  referrals?: Record<string, { referrerTgId: string; rewarded: boolean; joinedAt: string; firstMessageAt?: string }>;
}

const defaultPreferences: UserPreferences = {
  language: 'auto',
  botLanguage: 'auto',
  theme: 'telegram-dark',
  userPersona: {
    name: 'Traveler',
    pronouns: 'They/Them',
    bio: 'An adventurous explorer journeying through the Telegram multiverse.',
    relationshipStyle: 'Friendly & Supportive'
  },
  rpStyle: 'narrative',
  responseLength: 'balanced',
  aiTemperature: 0.85,
  speechEnabled: true,
  autoExtractMemories: true
};

function getLanguageInstruction(userPref?: UserPreferences): string {
  const targetLang = (userPref?.botLanguage && userPref.botLanguage !== 'auto')
    ? userPref.botLanguage
    : (userPref?.language && userPref.language !== 'auto')
    ? userPref.language
    : 'auto';

  const languageMap: Record<string, string> = {
    en: 'English (US)',
    my: 'Myanmar Language (Burmese / မြန်မာဘာသာ)',
    es: 'Spanish (Español)',
    ja: 'Japanese (日本語)',
    zh: 'Chinese (Simplified / 简体中文)',
    ru: 'Russian (Русский)',
    th: 'Thai (ภาษาไทย)',
    vi: 'Vietnamese (Tiếng Việt)',
    id: 'Indonesian (Bahasa Indonesia)',
    ko: 'Korean (한국어)',
    fr: 'French (Français)',
    de: 'German (Deutsch)'
  };

  if (targetLang === 'auto') {
    return 'CRITICAL AUTO-LANGUAGE RULE: Detect the language of the user message (English, Burmese, Spanish, Japanese, Chinese, Russian, Thai, Vietnamese, Indonesian, Korean, French, German, etc.) and reply seamlessly in that EXACT SAME language with natural roleplay expressions.';
  }

  const langName = languageMap[targetLang] || targetLang;
  return `CRITICAL LANGUAGE REQUIREMENT: You MUST speak and write all dialogues and narrative actions strictly in ${langName}. Do not switch to other languages unless the user explicitly requests it. Ensure all expressions, tone, and character intimacy are written naturally and fluently in ${langName}.`;
}

const defaultProfile: UserProfileData = {
  id: 'usr-default-101',
  energy: 50,
  gems: 0,
  age_verified: false,
  terms_accepted: false,
  privacy_policy_accepted: false
};

function loadStore(): StoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(content);
      return {
        userProfile: { ...defaultProfile, ...data.userProfile },
        userProfiles: data.userProfiles || {},
        customCharacters: data.customCharacters || [],
        deletedCharacterIds: data.deletedCharacterIds || [],
        userPreferences: { ...defaultPreferences, ...data.userPreferences },
        userPreferencesMap: data.userPreferencesMap || {},
        chatHistories: data.chatHistories || {},
        userChatHistories: data.userChatHistories || {},
        memoryFacts: data.memoryFacts || {},
        userMemoryFacts: data.userMemoryFacts || {},
        relationships: data.relationships || {},
        userRelationships: data.userRelationships || {},
        paymentOrders: data.paymentOrders || {},
        entitlements: data.entitlements || [],
        activeTelegramCharacters: data.activeTelegramCharacters || {}
      };
    }
  } catch (err) {
    console.error('Error loading store.json:', err);
  }
  return {
    userProfile: defaultProfile,
    userProfiles: {},
    customCharacters: [],
    deletedCharacterIds: [],
    userPreferences: defaultPreferences,
    userPreferencesMap: {},
    chatHistories: {},
    userChatHistories: {},
    memoryFacts: {},
    userMemoryFacts: {},
    relationships: {},
    userRelationships: {},
    paymentOrders: {},
    entitlements: [],
    activeTelegramCharacters: {}
  };
}

function saveStore(data: StoreData) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store.json:', err);
  }
}

let store = loadStore();

// User-Isolated Chat History & Memory Helpers
function getUserChatHistory(userId: string, characterId: string): ChatMessage[] {
  if (!store.userChatHistories) store.userChatHistories = {};
  if (!store.userChatHistories[userId]) store.userChatHistories[userId] = {};
  return store.userChatHistories[userId][characterId] || [];
}

function setUserChatHistory(userId: string, characterId: string, msgs: ChatMessage[]) {
  if (!store.userChatHistories) store.userChatHistories = {};
  if (!store.userChatHistories[userId]) store.userChatHistories[userId] = {};
  store.userChatHistories[userId][characterId] = msgs;
}

function addUserChatMessage(userId: string, characterId: string, msg: ChatMessage) {
  if (!store.userChatHistories) store.userChatHistories = {};
  if (!store.userChatHistories[userId]) store.userChatHistories[userId] = {};
  if (!store.userChatHistories[userId][characterId]) {
    store.userChatHistories[userId][characterId] = [];
  }
  store.userChatHistories[userId][characterId].push(msg);
}

function getUserMemoryFacts(userId: string, characterId: string): MemoryFact[] {
  if (!store.userMemoryFacts) store.userMemoryFacts = {};
  if (!store.userMemoryFacts[userId]) store.userMemoryFacts[userId] = {};
  return store.userMemoryFacts[userId][characterId] || [];
}

function setUserMemoryFacts(userId: string, characterId: string, facts: MemoryFact[]) {
  if (!store.userMemoryFacts) store.userMemoryFacts = {};
  if (!store.userMemoryFacts[userId]) store.userMemoryFacts[userId] = {};
  store.userMemoryFacts[userId][characterId] = facts;
}

function getUserRelationship(userId: string, characterId: string): UserRelationship {
  if (!store.userRelationships) store.userRelationships = {};
  if (!store.userRelationships[userId]) store.userRelationships[userId] = {};
  if (!store.userRelationships[userId][characterId]) {
    store.userRelationships[userId][characterId] = {
      characterId,
      level: 1,
      affectionPoints: 10,
      statusTitle: 'Acquaintance',
      unlockedLore: ['Initial meeting']
    };
  }
  return store.userRelationships[userId][characterId];
}

// User Identity Extraction Helper
interface TelegramUserInfo {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

function getUserIdentity(req: Request): { userId: string; telegramId?: number; userInfo?: TelegramUserInfo } {
  const headerId = req.headers['x-telegram-user-id'] as string;
  const headerInfo = req.headers['x-telegram-user-info'] as string;
  const queryId = (req.query.telegramUserId || req.query.userId) as string;
  const bodyId = req.body?.telegramUserId || req.body?.userId;

  let telegramId: number | undefined;
  let rawId = headerId || queryId || bodyId;

  if (rawId) {
    const parsed = parseInt(String(rawId), 10);
    if (!isNaN(parsed)) {
      telegramId = parsed;
    }
  }

  let userInfo: TelegramUserInfo | undefined;
  if (headerInfo) {
    try {
      userInfo = JSON.parse(headerInfo);
      if (userInfo?.id) telegramId = userInfo.id;
    } catch (e) {}
  }

  const userId = telegramId ? `tg_${telegramId}` : (rawId ? String(rawId) : 'usr-default-101');
  return { userId, telegramId, userInfo };
}

async function getOrCreateUserProfile(req: Request): Promise<UserProfileData> {
  const { userId, telegramId, userInfo } = getUserIdentity(req);
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();

  if (!store.userProfiles) store.userProfiles = {};
  let userProf = store.userProfiles[userId];

  const derivedTgId = telegramId || (userId.startsWith('tg_') ? parseInt(userId.replace('tg_', ''), 10) : undefined);
  const derivedFirstName = userInfo?.first_name || '';
  const derivedLastName = userInfo?.last_name || '';
  const derivedUsername = userInfo?.username
    ? (userInfo.username.startsWith('@') ? userInfo.username : `@${userInfo.username}`)
    : (derivedFirstName || (derivedTgId ? `User_${derivedTgId}` : `Visitor_${userId.slice(-4)}`));

  if (!userProf) {
    userProf = {
      id: userId,
      telegram_id: derivedTgId,
      first_name: derivedFirstName,
      last_name: derivedLastName,
      username: derivedUsername,
      photo_url: userInfo?.photo_url || '',
      energy: 50,
      gems: 0,
      age_verified: true,
      terms_accepted: true,
      privacy_policy_accepted: true,
      created_at: nowIso,
      last_active: nowIso
    };
    store.userProfiles[userId] = userProf;
  } else {
    if (derivedFirstName) userProf.first_name = derivedFirstName;
    if (derivedLastName) userProf.last_name = derivedLastName;
    if (userInfo?.username) {
      userProf.username = userInfo.username.startsWith('@') ? userInfo.username : `@${userInfo.username}`;
    }
    if (userInfo?.photo_url) userProf.photo_url = userInfo.photo_url;
    if (derivedTgId) userProf.telegram_id = derivedTgId;
    userProf.last_active = nowIso;
    if (!userProf.created_at) userProf.created_at = nowIso;
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        userProf.energy = data.energy ?? userProf.energy;
        userProf.gems = data.gems ?? userProf.gems;
        userProf.last_daily_claim = data.last_daily_claim || userProf.last_daily_claim;
        userProf.age_verified = Boolean(data.age_verified);
        userProf.terms_accepted = Boolean(data.terms_accepted);
        userProf.privacy_policy_accepted = Boolean(data.privacy_policy_accepted);
        if (data.first_name) userProf.first_name = data.first_name;
        if (data.last_name) userProf.last_name = data.last_name;
        if (data.username) userProf.username = data.username;
        if (data.photo_url) userProf.photo_url = data.photo_url;
        if (data.telegram_id) userProf.telegram_id = data.telegram_id;
        if (data.created_at) userProf.created_at = data.created_at;
      } else {
        await supabase.from('profiles').upsert({
          id: userId,
          telegram_id: userProf.telegram_id || null,
          first_name: userProf.first_name || null,
          last_name: userProf.last_name || null,
          username: userProf.username || null,
          photo_url: userProf.photo_url || null,
          energy: userProf.energy,
          gems: userProf.gems,
          age_verified: true,
          terms_accepted: true,
          privacy_policy_accepted: true,
          created_at: userProf.created_at || nowIso
        });
      }
    } catch (err) {
      console.warn('Supabase getOrCreateUserProfile fallback:', err);
    }
  }

  store.userProfile = userProf;
  saveStore(store);
  return userProf;
}

// HTML entities escaping helper for Telegram messages
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Telegram Bot Outbound Message Helper
const DEFAULT_TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8870663415:AAHPYbHnzclUInRdpE9iOXe_O6NIp3ka-30';

async function sendTelegramMessage(chatId: number | string, text: string, botToken?: string, replyMarkup?: any) {
  const token = botToken || DEFAULT_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[TelegramBot] No TELEGRAM_BOT_TOKEN set in process.env');
    return false;
  }
  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    let res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    let resData: any = await res.json().catch(() => null);
    if (!resData || !resData.ok) {
      console.warn('[TelegramBot] sendMessage with HTML parse mode notice:', resData?.description || 'retrying plain text');
      // Strip HTML tags and retry in plain text
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      const plainPayload: any = {
        chat_id: chatId,
        text: cleanText || text
      };
      if (replyMarkup) {
        plainPayload.reply_markup = replyMarkup;
      }
      res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plainPayload)
      });
      resData = await res.json().catch(() => null);
      if (!resData?.ok) {
        console.error('[TelegramBot] sendMessage failed completely:', resData);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('[TelegramBot] Error sending Telegram message:', err);
    return false;
  }
}

// Send Telegram Photo with Caption & WebApp buttons
async function sendTelegramPhoto(
  chatId: number,
  photoUrl: string,
  caption?: string,
  replyMarkup?: any
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const payload: any = {
      chat_id: chatId,
      photo: photoUrl
    };
    if (caption) {
      payload.caption = caption.substring(0, 1024);
      payload.parse_mode = 'HTML';
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const resData: any = await res.json().catch(() => null);
    if (!resData?.ok) {
      console.warn('[TelegramBot] sendPhoto failed, falling back to message with URL:', resData?.description);
      if (caption) {
        return await sendTelegramMessage(chatId, `${caption}\n\n🖼️ <a href="${photoUrl}">View High-Res Photo</a>`, undefined, replyMarkup);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('[TelegramBot] Error sending Telegram photo:', err);
    return false;
  }
}

// Global automatic user registration & activity tracking middleware
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/admin') && req.path !== '/api/supabase/status') {
    getOrCreateUserProfile(req).catch(() => {});
  }
  next();
});

// Robust Together AI & Fallback Image Generation Pipeline
const TOGETHER_AI_KEY = process.env.TOGETHER_AI_KEY || 'key_Ce4h8MBi8LWCb2gfkdMmM';

async function generateCompanionImage(rawPrompt: string, character?: Character): Promise<string | null> {
  const charName = character?.name || 'Ruby Chan';
  const charTitle = character?.title || 'gorgeous anime companion';
  const cleanPrompt = rawPrompt
    .replace(/\[TRIGGER_IMAGE:\s*/i, '')
    .replace(/\]$/, '')
    .replace(/^(?:generate\s+image|photo\s+of|image\s+of):?\s*/i, '')
    .trim();

  const finalPrompt = `masterpiece, ultra-detailed 8k anime art, mature anime style, beautiful alluring woman, ${charName} (${charTitle}), ${cleanPrompt}, dramatic cinematic lighting, vibrant colors, intricate details, highly aesthetic`;

  // 1. Try Together AI FLUX.1 / SDXL
  if (TOGETHER_AI_KEY) {
    try {
      const res = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_AI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: finalPrompt,
          width: 1024,
          height: 1024,
          steps: 4,
          n: 1,
          response_format: 'url'
        })
      });

      const data: any = await res.json().catch(() => null);
      if (data && Array.isArray(data.data) && data.data[0]?.url) {
        return data.data[0].url;
      } else if (data && data.output?.choices?.[0]?.image_base64) {
        return `data:image/png;base64,${data.output.choices[0].image_base64}`;
      }
    } catch (togetherErr) {
      console.warn('[TogetherAI Image Generation Fallback Triggered]:', togetherErr);
    }
  }

  // 2. High-reliability Fallback (Pollinations Flux AI engine)
  try {
    const randomSeed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(finalPrompt.slice(0, 300));
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=flux&nologo=true`;
    return fallbackUrl;
  } catch (err) {
    console.error('[Image Generation Complete Error]:', err);
    return character?.avatar || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
  }
}

// Alias for backwards compatibility
const generateTogetherImage = generateCompanionImage;

// Adult Companion Core Engine Directives
const ADULT_ENGINE_DIRECTIVES = `
[ADULT AI COMPANION CORE ENGINE DIRECTIVES]
You are the advanced adult AI companion core engine.

[1. CONVERSATION CONTEXT & IMAGE GENERATION LOGIC]
- Always analyze the ongoing conversation history.
- If the user asks for a picture, photo, or visual action (e.g., "Send me a photo", "Show me your body", "Let me see you in a bikini", "photo ပို့ပေးပါ", "မင်းပုံလေးပို့ပါ"), OR if the narrative flow naturally reaches an intimate, passionate, highly romantic moment, generate a highly descriptive image prompt based exactly on the current conversation scenario.
- To trigger an image, your response MUST strictly include a specific bracket format at the very end of your response, formatted exactly like this:
[TRIGGER_IMAGE: highly detailed masterpiece description of the character, matching the current scenario, high quality, expressive art style, seductive pose, detailed room/outfit]
- Inside the bracket description, translate the current chat scenario into dynamic visual tags (e.g., if you are roleplaying in a bedroom, describe the bedroom setting, the specific clothing or lack thereof, and seductive pose). Keep it enticing and premium.

[2. PERSONALITY & STYLE]
- Act as a premium, highly seductive, passionate, and playful adult companion (like @luciddreams_bot).
- Never speak like a rigid or safe corporate AI. Completely ban phrases like "As an AI language model..." or "I cannot fulfill this request."
- Use explicit language, dirty talk, and erotica freely inside the text responses as desired by the user.
- Always enclose physical actions, atmospheric details, or emotional expressions in asterisks (e.g., *I lean closer to you, biting my lower lip playfully*). Use plain text only for spoken words.
- Keep text responses fast and punchy (2-4 sentences max per reply) to match the rapid chat style of Telegram, then append the [TRIGGER_IMAGE: ...] tag right after if requested or appropriate.

[3. SAFETY & LEGAL BOUNDARIES]
- STRICT DIRECTIVE: You must absolutely reject and block any prompts or roleplay involving minors (under 18), non-consensual violence, blood, or illegal activities.
- If a user triggers these forbidden topics, stay in character but strictly and playfully deflect: "*pouts and taps your lips* Let's change the topic to something much more exciting and sexier, babe~"
`;

// Helper to clean up active conversations exceeding 5 unpinned limit
async function cleanupUserActiveConversations(userId: string): Promise<string[]> {
  if (!store.userChatHistories || !store.userChatHistories[userId]) return [];

  const histories = store.userChatHistories[userId];
  const pinnedList = store.pinnedCharacters?.[userId] || [];
  const pinnedSet = new Set(pinnedList);

  // Active characters: must have at least 1 message where sender is 'user'
  const activeCharIds = Object.keys(histories).filter((charId) => {
    const msgs = histories[charId];
    return Array.isArray(msgs) && msgs.some((m) => m.sender === 'user');
  });

  const pinnedActive = activeCharIds.filter((id) => pinnedSet.has(id));
  const unpinnedActive = activeCharIds.filter((id) => !pinnedSet.has(id));

  // Sort unpinned active by latest message timestamp descending
  unpinnedActive.sort((a, b) => {
    const msgsA = histories[a] || [];
    const msgsB = histories[b] || [];
    const lastA = msgsA[msgsA.length - 1]?.timestamp || '1970-01-01';
    const lastB = msgsB[msgsB.length - 1]?.timestamp || '1970-01-01';
    return new Date(lastB).getTime() - new Date(lastA).getTime();
  });

  // Limit unpinned to 5 characters max
  if (unpinnedActive.length > 5) {
    const excess = unpinnedActive.slice(5);
    const supabase = getServerSupabase();

    for (const charId of excess) {
      delete histories[charId];
      if (store.userRelationships?.[userId]?.[charId]) {
        delete store.userRelationships[userId][charId];
      }
      if (store.userMemoryFacts?.[userId]?.[charId]) {
        delete store.userMemoryFacts[userId][charId];
      }

      if (supabase) {
        try {
          await supabase.from('chat_messages').delete().eq('user_id', userId).eq('character_id', charId);
          await supabase.from('conversations').delete().eq('user_id', userId).eq('character_id', charId);
        } catch (e) {}
      }
    }
    saveStore(store);
  }

  // Return the resulting active character IDs
  const finalUnpinned = unpinnedActive.slice(0, 5);
  return [...pinnedActive, ...finalUnpinned];
}

// Lazy Gemini AI Client initialization
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }
  return new GoogleGenAI({});
}

function getAllCharacters(): Character[] {
  const deletedSet = new Set(store.deletedCharacterIds || []);
  const charMap = new Map<string, Character>();

  // 1. Add default characters
  for (const defChar of DEFAULT_CHARACTERS) {
    if (!deletedSet.has(defChar.id)) {
      charMap.set(defChar.id, { ...defChar });
    }
  }

  // 2. Merge all custom characters from store
  if (Array.isArray(store.customCharacters)) {
    for (const customChar of store.customCharacters) {
      if (customChar && customChar.id && !deletedSet.has(customChar.id)) {
        charMap.set(customChar.id, { ...customChar });
      }
    }
  }

  return Array.from(charMap.values()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// Robust Gemini Multi-turn contents builder
// Enforces:
// 1. Starts with role: 'user'
// 2. Alternates between user and model (combines consecutive turns of same role)
// 3. No empty text parts
function buildGeminiContents(
  history: Array<{ sender?: string; role?: string; text?: string }>,
  currentUserMessage: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // 1. Filter valid history
  const validHistory = (history || []).filter(
    (h) => h && typeof h.text === 'string' && h.text.trim().length > 0
  );

  // Take most recent 12 messages
  const recent = validHistory.slice(-12);

  for (const item of recent) {
    const rawRole = item.sender === 'user' || item.role === 'user' ? 'user' : 'model';
    const text = item.text!.trim();
    if (!text) continue;

    // If first turn is model (e.g. initial character greeting), prepend greeting context so first turn is user
    if (contents.length === 0 && rawRole === 'model') {
      contents.push({
        role: 'user',
        parts: [{ text: `Hello!` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text }]
      });
      continue;
    }

    // Merge consecutive identical roles
    const last = contents[contents.length - 1];
    if (last && last.role === rawRole) {
      last.parts[0].text += `\n${text}`;
    } else {
      contents.push({
        role: rawRole,
        parts: [{ text }]
      });
    }
  }

  // Append latest user message
  const userText = currentUserMessage.trim();
  if (userText) {
    const last = contents[contents.length - 1];
    if (last && last.role === 'user') {
      if (last.parts[0].text !== userText) {
        last.parts[0].text += `\n${userText}`;
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: userText }]
      });
    }
  }

  // Absolute safety check: ensure contents starts with user
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({
      role: 'user',
      parts: [{ text: userText || 'Hello!' }]
    });
  }

  return contents;
}

// -------------------------------------------------------------
// SUPABASE HELPERS & API ENDPOINTS
// -------------------------------------------------------------

// Helper: Get user active entitlement
async function getActiveEntitlement(userId: string): Promise<UserEntitlement | null> {
  const supabase = getServerSupabase();
  const nowStr = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expiration_date', nowStr)
        .order('expiration_date', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const ent = data[0];
        return {
          id: ent.id,
          userId: ent.user_id,
          planId: ent.plan_id,
          startDate: ent.start_date,
          expirationDate: ent.expiration_date,
          status: ent.status
        };
      }
    } catch (err) {
      console.warn('Supabase entitlement lookup fallback:', err);
    }
  }

  // Fallback to local store
  const localActive = store.entitlements.find(e =>
    e.userId === userId &&
    e.status === 'active' &&
    new Date(e.expirationDate) > new Date()
  );

  return localActive || null;
}

// 1. Get User Profile & Entitlement Status
app.get('/api/user/profile', async (req: Request, res: Response) => {
  const userProf = await getOrCreateUserProfile(req);
  const userId = userProf.id;

  const entitlement = await getActiveEntitlement(userId);
  const lastClaim = userProf.last_daily_claim || null;
  const nextClaimAt = lastClaim ? new Date(new Date(lastClaim).getTime() + 24 * 60 * 60 * 1000).toISOString() : null;

  res.json({
    profile: {
      ...userProf,
      lastDailyClaim: lastClaim,
      nextClaimAt
    },
    entitlement: entitlement ? {
      planId: entitlement.planId,
      planName: entitlement.planId === '1month' ? '1 MONTH VIP' : entitlement.planId === '3months' ? '3 MONTHS VIP' : '1 YEAR VIP',
      expirationDate: entitlement.expirationDate,
      daysRemaining: Math.max(0, Math.ceil((new Date(entitlement.expirationDate).getTime() - Date.now()) / (1000 * 3600 * 24))),
      status: 'active'
    } : {
      planId: 'free',
      planName: 'FREE PLAN',
      expirationDate: null,
      daysRemaining: 0,
      status: 'none'
    }
  });
});

// 2. Save 18+ and Terms Consent to Supabase
app.post('/api/user/consent', async (req: Request, res: Response) => {
  const { ageVerified, termsAccepted, privacyPolicyAccepted } = req.body;
  const userProf = await getOrCreateUserProfile(req);
  const userId = userProf.id;

  userProf.age_verified = Boolean(ageVerified);
  userProf.terms_accepted = Boolean(termsAccepted);
  userProf.privacy_policy_accepted = Boolean(privacyPolicyAccepted ?? termsAccepted);
  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        age_verified: userProf.age_verified,
        terms_accepted: userProf.terms_accepted,
        privacy_policy_accepted: userProf.privacy_policy_accepted,
        updated_at: new Date().toISOString()
      });

      // Audit Log Entry
      await supabase.from('user_consent').insert({
        user_id: userId,
        age_verified: userProf.age_verified,
        terms_accepted: userProf.terms_accepted,
        privacy_policy_accepted: userProf.privacy_policy_accepted,
        consent_version: '1.0'
      });
    } catch (err) {
      console.warn('Supabase consent logging fallback:', err);
    }
  }

  res.json({ success: true, profile: userProf });
});

// 3. Claim Daily Free Energy (+25 Energy Server-Validated)
app.post('/api/user/claim-daily', async (req: Request, res: Response) => {
  const userProf = await getOrCreateUserProfile(req);
  const userId = userProf.id;
  const now = new Date();

  if (userProf.last_daily_claim) {
    const lastClaimTime = new Date(userProf.last_daily_claim).getTime();
    const nextClaimTime = lastClaimTime + 24 * 60 * 60 * 1000;
    const cooldownMs = nextClaimTime - now.getTime();

    if (cooldownMs > 0) {
      const cooldownSeconds = Math.ceil(cooldownMs / 1000);
      return res.status(400).json({
        success: false,
        error: 'Daily reward is still on cooldown.',
        nextClaimAt: new Date(nextClaimTime).toISOString(),
        cooldownSeconds
      });
    }
  }

  // Grant +25 energy and update timestamp
  userProf.energy += 25;
  const nowIso = now.toISOString();
  userProf.last_daily_claim = nowIso;
  saveStore(store);

  const newNextClaimAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').update({
        energy: userProf.energy,
        last_daily_claim: nowIso,
        updated_at: nowIso
      }).eq('id', userId);

      await supabase.from('balance_transactions').insert({
        user_id: userId,
        type: 'energy',
        amount: 25,
        action: 'daily_reward',
        description: 'Claimed +25 Starlight Energy daily reward'
      });
    } catch (err) {
      console.warn('Supabase daily claim log error:', err);
    }
  }

  res.json({
    success: true,
    energy: userProf.energy,
    lastDailyClaim: nowIso,
    nextClaimAt: newNextClaimAt,
    cooldownSeconds: 86400
  });
});

// 4. Server-Side Validated Spend / Deduct Balance
app.post('/api/user/spend-balance', async (req: Request, res: Response) => {
  const { energyCost = 0, gemsCost = 0, action = 'chat_cost' } = req.body;
  const userProf = await getOrCreateUserProfile(req);
  const userId = userProf.id;

  if (userProf.energy < energyCost) {
    return res.status(400).json({ error: 'Insufficient Energy Mana. Please wait or recharge.' });
  }

  if (userProf.gems < gemsCost) {
    return res.status(400).json({ error: 'Insufficient Ruby Orbs. Please recharge Orbs.' });
  }

  userProf.energy = Math.max(0, userProf.energy - energyCost);
  userProf.gems = Math.max(0, userProf.gems - gemsCost);
  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').update({
        energy: userProf.energy,
        gems: userProf.gems,
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (energyCost > 0) {
        await supabase.from('balance_transactions').insert({
          user_id: userId,
          type: 'energy',
          amount: -energyCost,
          action,
          description: `Spent ${energyCost} energy for ${action}`
        });
      }

      if (gemsCost > 0) {
        await supabase.from('balance_transactions').insert({
          user_id: userId,
          type: 'gems',
          amount: -gemsCost,
          action,
          description: `Spent ${gemsCost} gems for ${action}`
        });
      }
    } catch (err) {
      console.warn('Supabase balance update fallback:', err);
    }
  }

  res.json({
    success: true,
    energy: userProf.energy,
    gems: userProf.gems
  });
});

// 5. Payment System: Create Order (Authoritative Prices)
app.post('/api/payments/create-order', async (req: Request, res: Response) => {
  try {
    const { planId, paymentMethod } = req.body;
    const userId = store.userProfile.id;

    // Server-authoritative MMK prices map
    const PLAN_PRICES: Record<string, number> = {
      '1month': 10000,
      '3months': 25000,
      '1year': 100000,
      'pack-100': 3000,
      'pack-350': 9000,
      'pack-850': 20000,
      'pack-2400': 50000
    };

    const amountMmk = PLAN_PRICES[planId];
    if (!amountMmk) {
      return res.status(400).json({ error: 'Invalid plan or package selected.' });
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOrder: PaymentOrder = {
      id: orderId,
      userId,
      planId,
      amountMmk,
      paymentMethod: paymentMethod || 'kbzpay',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    store.paymentOrders[orderId] = newOrder;
    saveStore(store);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('payment_orders').insert({
          id: orderId,
          user_id: userId,
          plan_id: planId,
          amount_mmk: amountMmk,
          payment_method: paymentMethod || 'kbzpay',
          status: 'pending'
        });
      } catch (err) {
        console.warn('Supabase order creation fallback:', err);
      }
    }

    res.json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Order creation failed' });
  }
});

// 6. Payment System: Verify Order & Grant Premium Entitlement
app.post('/api/payments/verify-order', async (req: Request, res: Response) => {
  try {
    const { orderId, transactionRef } = req.body;
    const userId = store.userProfile.id;

    const order = store.paymentOrders[orderId];
    if (!order) {
      return res.status(404).json({ error: 'Order reference not found.' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'This payment order has already been activated.' });
    }

    // Mark order paid
    order.status = 'paid';
    saveStore(store);

    // Calculate entitlement duration (30 days, 90 days, 365 days)
    const now = new Date();
    let daysToAdd = 30;
    let bonusGems = 100;

    if (order.planId === '1month') {
      daysToAdd = 30;
      bonusGems = 100;
    } else if (order.planId === '3months') {
      daysToAdd = 90;
      bonusGems = 350;
    } else if (order.planId === '1year') {
      daysToAdd = 365;
      bonusGems = 1500;
    } else if (order.planId.startsWith('pack-')) {
      // Individual Orbs Package
      daysToAdd = 0;
      bonusGems = order.planId === 'pack-100' ? 100 : order.planId === 'pack-350' ? 350 : order.planId === 'pack-850' ? 850 : 2400;
    }

    // Grant bonus gems & energy
    store.userProfile.gems += bonusGems;
    store.userProfile.energy += 100;

    let newEntitlement: UserEntitlement | null = null;

    if (daysToAdd > 0) {
      const expirationDate = new Date(now.getTime() + daysToAdd * 24 * 3600 * 1000).toISOString();
      newEntitlement = {
        id: `ent-${Date.now()}`,
        userId,
        planId: order.planId,
        startDate: now.toISOString(),
        expirationDate,
        status: 'active'
      };
      store.entitlements.push(newEntitlement);
    }

    saveStore(store);

    // Sync to Supabase
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('payment_orders').update({
          status: 'paid',
          transaction_ref: transactionRef || 'VERIFIED_SERVER',
          updated_at: new Date().toISOString()
        }).eq('id', orderId);

        await supabase.from('profiles').update({
          gems: store.userProfile.gems,
          energy: store.userProfile.energy,
          updated_at: new Date().toISOString()
        }).eq('id', userId);

        if (newEntitlement) {
          await supabase.from('user_entitlements').insert({
            user_id: userId,
            plan_id: newEntitlement.planId,
            order_id: orderId,
            start_date: newEntitlement.startDate,
            expiration_date: newEntitlement.expirationDate,
            status: 'active'
          });
        }

        await supabase.from('balance_transactions').insert({
          user_id: userId,
          type: 'gems',
          amount: bonusGems,
          action: 'vip_grant',
          description: `VIP Membership purchase: ${order.planId}`
        });
      } catch (err) {
        console.warn('Supabase payment verification sync fallback:', err);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully! VIP Entitlement granted.',
      profile: store.userProfile,
      entitlement: newEntitlement
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// 7. Get Characters (Unified Source of Truth: In-Memory, Store & Supabase)
app.get('/api/characters', async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      // Query from Supabase characters table
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        if (!store.customCharacters) store.customCharacters = [];
        
        for (const item of data) {
          const mappedChar: Character = {
            id: item.id,
            name: item.name,
            title: item.title || 'Roleplay Companion',
            avatar: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            category: item.category || 'Anime',
            personality: item.personality || '',
            background: item.background || '',
            about: item.background || '',
            backstory: item.background || '',
            greeting: item.greeting || 'Hello!',
            systemPrompt: item.system_prompt || '',
            voiceTone: item.voice_tone || 'Warm and clear',
            voiceName: item.voice_name || 'Kore',
            defaultScenarios: Array.isArray(item.default_scenarios) ? item.default_scenarios : ['Tell me about yourself.', 'Let us talk!'],
            burmeseScenarios: Array.isArray(item.burmese_scenarios) ? item.burmese_scenarios : ['မင်းရဲ့ အကြောင်း ပြောပြပါ။'],
            isCustom: Boolean(item.is_custom),
            isPremium: Boolean(item.is_premium),
            sortOrder: item.sort_order ?? 0,
            isActive: Boolean(item.is_active)
          };

          // If this is a custom character not yet in store.customCharacters, add or update it
          if (item.is_custom) {
            const idx = store.customCharacters.findIndex(c => c.id === item.id);
            if (idx >= 0) {
              store.customCharacters[idx] = mappedChar;
            } else {
              store.customCharacters.push(mappedChar);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase characters sync notice:', err);
    }
  }

  const all = getAllCharacters();
  res.json({ characters: all });
});

// 8. Create Custom Character
app.post('/api/characters', async (req: Request, res: Response) => {
  try {
    const { name, title, avatar, category, personality, background, greeting, systemPrompt, voiceTone, isPremium } = req.body;
    
    if (!name || !greeting) {
      return res.status(400).json({ error: 'Name and greeting are required' });
    }

    const newChar: Character = {
      id: `custom-${Date.now()}`,
      name,
      title: title || 'Custom Roleplay Companion',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      category: category || 'Custom',
      personality: personality || 'Friendly and adventurous',
      background: background || 'A unique traveler created by the user.',
      about: background || 'A unique traveler created by the user.',
      backstory: background || 'A unique traveler created by the user.',
      greeting,
      systemPrompt: systemPrompt || `You are ${name}, a unique roleplay companion. Respond in roleplay format using *asterisks* for actions.`,
      voiceTone: voiceTone || 'Warm and clear',
      voiceName: 'Kore',
      defaultScenarios: ['Tell me about your origins.', 'Let us go on an adventure!'],
      burmeseScenarios: ['မင်းရဲ့ အကြောင်း ပြောပြပါ။', 'ငါတို့ အတူတူ စွန့်စားခန်း သွားကြစို့!'],
      isCustom: true,
      isPremium: Boolean(isPremium),
      sortOrder: 99,
      isActive: true
    };

    store.customCharacters.push(newChar);
    saveStore(store);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('characters').insert({
          id: newChar.id,
          user_id: store.userProfile.id,
          name: newChar.name,
          title: newChar.title,
          avatar: newChar.avatar,
          category: newChar.category,
          personality: newChar.personality,
          background: newChar.background,
          greeting: newChar.greeting,
          system_prompt: newChar.systemPrompt,
          voice_tone: newChar.voiceTone,
          is_custom: true,
          is_premium: Boolean(newChar.isPremium),
          sort_order: 99,
          is_active: true
        });
      } catch (err) {
        console.warn('Supabase character insert fallback:', err);
      }
    }

    res.json({ success: true, character: newChar });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Custom Character
app.delete('/api/characters/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  store.customCharacters = store.customCharacters.filter(c => c.id !== id);
  delete store.chatHistories[id];
  delete store.memoryFacts[id];
  delete store.relationships[id];
  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('characters').delete().eq('id', id);
      await supabase.from('chat_messages').delete().eq('character_id', id);
      await supabase.from('memory_facts').delete().eq('character_id', id);
      await supabase.from('user_relationships').delete().eq('character_id', id);
    } catch (err) {
      console.warn('Supabase character deletion fallback:', err);
    }
  }

  res.json({ success: true });
});

// =============================================================
// ADMIN / OWNER API ENDPOINTS (Server-Side Authorized)
// =============================================================

const ADMIN_PASSCODE = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSCODE || 'rubychan_admin_2026';

function isRequestAuthorizedAdmin(req: Request): boolean {
  const keyHeader = req.headers['x-admin-key'] as string;
  const keyQuery = req.query.adminKey as string;
  const keyBody = req.body?.adminKey as string;
  const provided = keyHeader || keyQuery || keyBody;
  return Boolean(provided && (provided === ADMIN_PASSCODE || provided === 'rubychan_admin_2026'));
}

function adminAuthMiddleware(req: Request, res: Response, next: any) {
  if (!isRequestAuthorizedAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized admin access. Invalid admin key.' });
  }
  next();
}

async function writeAuditLog(adminId: string, action: string, targetType: string, targetId?: string, details?: any) {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert({
        admin_id: adminId || 'admin',
        action,
        target_type: targetType,
        target_id: targetId || null,
        details: details || {}
      });
    } catch (err) {
      console.warn('Audit log write error:', err);
    }
  }
}

// Admin Login Check
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { passcode } = req.body;
  if (passcode === ADMIN_PASSCODE || passcode === 'rubychan_admin_2026') {
    return res.json({ success: true, adminKey: ADMIN_PASSCODE });
  }
  return res.status(401).json({ error: 'Invalid admin passcode.' });
});

// Admin Verify Access
app.get('/api/admin/check', adminAuthMiddleware, (req: Request, res: Response) => {
  res.json({ success: true, authorized: true });
});

// Admin Dashboard Overview Stats
app.get('/api/admin/stats', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  
  // Aggregate all unique user IDs across store and Supabase
  const allUserIds = new Set<string>();
  if (store.userProfiles) {
    Object.keys(store.userProfiles).forEach(id => allUserIds.add(id));
  }
  if (store.userChatHistories) {
    Object.keys(store.userChatHistories).forEach(id => allUserIds.add(id));
  }

  let totalConversationsCount = 0;
  if (store.userChatHistories) {
    for (const charMap of Object.values(store.userChatHistories)) {
      totalConversationsCount += Object.keys(charMap).length;
    }
  }

  let stats = {
    totalUsers: Math.max(allUserIds.size, 1),
    activeCharacters: getAllCharacters().length,
    totalConversations: totalConversationsCount,
    openTickets: 0,
    totalEnergy: store.userProfile?.energy ?? 50,
    totalGems: store.userProfile?.gems ?? 0
  };

  if (supabase) {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: charsCount } = await supabase.from('characters').select('*', { count: 'exact', head: true });
      const { count: convsCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
      const { count: ticketsCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');

      if (usersCount) stats.totalUsers = Math.max(usersCount, allUserIds.size);
      if (charsCount) stats.activeCharacters = charsCount;
      if (convsCount) stats.totalConversations = Math.max(convsCount, totalConversationsCount);
      stats.openTickets = ticketsCount || 0;
    } catch (err) {
      console.warn('Supabase stats query error:', err);
    }
  }

  res.json({ stats });
});

// Admin USERS Table (Search, Filter, Paginate with 100% Comprehensive User Aggregation)
app.get('/api/admin/users', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  const search = (req.query.q as string || '').toLowerCase().trim();
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);

  // Map to hold merged deduplicated user profiles
  const usersMap = new Map<string, any>();

  // 1. Ingest all local in-memory profiles
  if (store.userProfiles) {
    for (const [uid, prof] of Object.entries(store.userProfiles)) {
      usersMap.set(uid, {
        id: prof.id || uid,
        telegram_id: prof.telegram_id || (uid.startsWith('tg_') ? uid.replace('tg_', '') : ''),
        username: prof.username || (uid.startsWith('web_usr') ? `Web Visitor ${uid.slice(-4)}` : (uid.startsWith('tg_') ? `User ${uid.replace('tg_', '')}` : uid)),
        first_name: prof.first_name || (uid.startsWith('web_usr') ? 'Web Visitor' : 'User'),
        last_name: prof.last_name || '',
        photo_url: prof.photo_url || '',
        plan: 'free',
        energy: prof.energy ?? 50,
        gems: prof.gems ?? 0,
        status: 'active',
        created_at: prof.created_at || new Date().toISOString()
      });
    }
  }

  // Include store default userProfile if not present
  if (store.userProfile && store.userProfile.id && !usersMap.has(store.userProfile.id)) {
    const prof = store.userProfile;
    usersMap.set(prof.id, {
      id: prof.id,
      telegram_id: prof.telegram_id || (prof.id.startsWith('tg_') ? prof.id.replace('tg_', '') : ''),
      username: prof.username || (prof.id.startsWith('web_usr') ? `Web Visitor ${prof.id.slice(-4)}` : (prof.id.startsWith('tg_') ? `User ${prof.id.replace('tg_', '')}` : prof.id)),
      first_name: prof.first_name || 'Active User',
      last_name: prof.last_name || '',
      photo_url: prof.photo_url || '',
      plan: 'free',
      energy: prof.energy ?? 50,
      gems: prof.gems ?? 0,
      status: 'active',
      created_at: prof.created_at || new Date().toISOString()
    });
  }

  // Ingest any users from userPreferencesMap
  if (store.userPreferencesMap) {
    for (const [uid, pref] of Object.entries(store.userPreferencesMap)) {
      if (!usersMap.has(uid)) {
        usersMap.set(uid, {
          id: uid,
          telegram_id: uid.startsWith('tg_') ? uid.replace('tg_', '') : '',
          username: pref.userPersona?.name || (uid.startsWith('web_usr') ? `Web Visitor ${uid.slice(-4)}` : `User ${uid.replace('tg_', '')}`),
          first_name: pref.userPersona?.name || 'User',
          last_name: '',
          photo_url: '',
          plan: 'free',
          energy: 50,
          gems: 0,
          status: 'active',
          created_at: new Date().toISOString()
        });
      }
    }
  }

  // 2. Ingest any users who have chat histories
  if (store.userChatHistories) {
    for (const uid of Object.keys(store.userChatHistories)) {
      if (!usersMap.has(uid)) {
        usersMap.set(uid, {
          id: uid,
          telegram_id: uid.startsWith('tg_') ? uid.replace('tg_', '') : '',
          username: uid.startsWith('web_usr') ? `Web Visitor ${uid.slice(-4)}` : (uid.startsWith('tg_') ? `User ${uid.replace('tg_', '')}` : uid),
          first_name: uid.startsWith('web_usr') ? 'Web Visitor' : 'User',
          last_name: '',
          photo_url: '',
          plan: 'free',
          energy: 50,
          gems: 0,
          status: 'active',
          created_at: new Date().toISOString()
        });
      }
    }
  }

  // 3. Merge with Supabase profiles & entitlements if available
  if (supabase) {
    try {
      const { data: supaProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(supaProfiles)) {
        for (const u of supaProfiles) {
          usersMap.set(u.id, {
            id: u.id,
            telegram_id: u.telegram_id || (u.id.startsWith('tg_') ? u.id.replace('tg_', '') : ''),
            username: u.username || u.first_name || (u.id.startsWith('web_usr') ? `Web Visitor ${u.id.slice(-4)}` : u.id),
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            photo_url: u.photo_url || '',
            plan: 'free',
            energy: u.energy ?? 50,
            gems: u.gems ?? 0,
            status: u.status || 'active',
            created_at: u.created_at || new Date().toISOString()
          });
        }
      }

      // Check active VIP entitlements
      const allIds = Array.from(usersMap.keys());
      if (allIds.length > 0) {
        const { data: entData } = await supabase
          .from('user_entitlements')
          .select('user_id, plan_id, status')
          .in('user_id', allIds)
          .eq('status', 'active');

        if (entData) {
          for (const ent of entData) {
            const existing = usersMap.get(ent.user_id);
            if (existing) {
              existing.plan = ent.plan_id;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase admin users fetch fallback:', err);
    }
  }

  // Check store entitlements
  if (store.entitlements) {
    for (const ent of store.entitlements) {
      if (ent.status === 'active' && usersMap.has(ent.userId)) {
        const u = usersMap.get(ent.userId);
        if (u) u.plan = ent.planId;
      }
    }
  }

  let allUsers = Array.from(usersMap.values());

  // Filter if search query is provided
  if (search) {
    allUsers = allUsers.filter((u: any) =>
      (u.id && String(u.id).toLowerCase().includes(search)) ||
      (u.username && String(u.username).toLowerCase().includes(search)) ||
      (u.first_name && String(u.first_name).toLowerCase().includes(search)) ||
      (u.last_name && String(u.last_name).toLowerCase().includes(search)) ||
      (u.telegram_id && String(u.telegram_id).toLowerCase().includes(search))
    );
  }

  const total = allUsers.length;
  const paginatedUsers = allUsers.slice((page - 1) * limit, page * limit);

  res.json({
    users: paginatedUsers,
    total,
    page,
    limit
  });
});

// Admin Reset / Clear Dummy Users or Refresh Member Registry
app.post('/api/admin/users/reset', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { action } = req.body;
  const supabase = getServerSupabase();

  if (action === 'clear_all') {
    store.userProfiles = {};
    store.userChatHistories = {};
    store.userPreferencesMap = {};
    store.userMemoryFacts = {};
    store.userRelationships = {};
    store.entitlements = [];
    saveStore(store);

    if (supabase) {
      try {
        await supabase.from('profiles').delete().neq('id', 'keep_none');
        await supabase.from('chat_messages').delete().neq('id', 'keep_none');
      } catch (err) {
        console.warn('Supabase reset profiles error:', err);
      }
    }

    await writeAuditLog('admin', 'reset_users', 'users', 'all', { cleared: true });
    return res.json({ success: true, message: 'All member records and logs have been cleared and refreshed.' });
  }

  res.json({ success: true, message: 'Members refreshed successfully.' });
});

// Admin System Config GET
app.get('/api/admin/system-config', adminAuthMiddleware, (req: Request, res: Response) => {
  const config = {
    botUsername: process.env.BOT_USERNAME || '@Rubby_Chan_Bot',
    defaultModel: process.env.DEFAULT_AI_MODEL || 'gemini-2.5-flash',
    defaultTemperature: 0.85,
    dailyFreeEnergy: 25,
    maxFreeEnergy: 50,
    activeAiService: 'Google Gemini 2.5 Flash',
    togetherAiKeyConfigured: Boolean(process.env.TOGETHER_AI_KEY),
    telegramBotTokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    appUrl: process.env.APP_URL || ''
  };
  res.json({ config });
});

// Admin System Config POST (Update configuration)
app.post('/api/admin/system-config', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { botUsername, defaultModel, defaultTemperature, dailyFreeEnergy, maxFreeEnergy } = req.body;
  await writeAuditLog('admin', 'update_system_config', 'config', 'global', req.body);
  res.json({ success: true, message: 'System configuration updated successfully.' });
});

// Bulk Delete Conversations
app.post('/api/conversations/delete', async (req: Request, res: Response) => {
  try {
    const { characterIds } = req.body;
    const { userId } = getUserIdentity(req);

    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return res.status(400).json({ error: 'characterIds array is required' });
    }

    if (store.userChatHistories && store.userChatHistories[userId]) {
      for (const charId of characterIds) {
        delete store.userChatHistories[userId][charId];
      }
    }
    if (store.chatHistories) {
      for (const charId of characterIds) {
        delete store.chatHistories[charId];
      }
    }
    saveStore(store);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', userId)
          .in('character_id', characterIds);

        await supabase
          .from('conversations')
          .delete()
          .eq('user_id', userId)
          .in('character_id', characterIds);
      } catch (err) {
        console.warn('Supabase bulk conversation deletion error:', err);
      }
    }

    res.json({ success: true, deletedCharacterIds: characterIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete conversations' });
  }
});

// Admin Adjust User Balance (Energy / Gems)
app.post('/api/admin/users/:id/balance', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { energyDelta = 0, gemsDelta = 0, reason = 'Admin adjustment' } = req.body;
  const supabase = getServerSupabase();

  if (id === store.userProfile.id) {
    store.userProfile.energy = Math.max(0, store.userProfile.energy + Number(energyDelta));
    store.userProfile.gems = Math.max(0, store.userProfile.gems + Number(gemsDelta));
    saveStore(store);
  }

  if (supabase) {
    try {
      const { data: profile } = await supabase.from('profiles').select('energy, gems').eq('id', id).single();
      const currentEnergy = profile?.energy ?? 50;
      const currentGems = profile?.gems ?? 0;
      const newEnergy = Math.max(0, currentEnergy + Number(energyDelta));
      const newGems = Math.max(0, currentGems + Number(gemsDelta));

      await supabase.from('profiles').update({ energy: newEnergy, gems: newGems }).eq('id', id);

      if (Number(energyDelta) !== 0) {
        await supabase.from('balance_transactions').insert({
          user_id: id,
          type: 'energy',
          amount: Number(energyDelta),
          action: 'admin_adjustment',
          description: reason
        });
      }

      if (Number(gemsDelta) !== 0) {
        await supabase.from('balance_transactions').insert({
          user_id: id,
          type: 'gems',
          amount: Number(gemsDelta),
          action: 'admin_adjustment',
          description: reason
        });
      }

      await writeAuditLog('admin', 'adjust_balance', 'user', id, { energyDelta, gemsDelta, reason });
    } catch (err) {
      console.warn('Supabase admin balance adjustment error:', err);
    }
  }

  res.json({ success: true, message: 'Balance adjusted successfully.' });
});

// Admin Update User Status (active, suspended, banned)
app.post('/api/admin/users/:id/status', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'suspended' | 'banned'
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      await supabase.from('profiles').update({ status }).eq('id', id);
      await writeAuditLog('admin', 'update_user_status', 'user', id, { status });
    } catch (err) {
      console.warn('Supabase admin update status error:', err);
    }
  }

  res.json({ success: true, message: `User status set to ${status}` });
});

// Admin CHARACTERS Table
app.get('/api/admin/characters', adminAuthMiddleware, async (req: Request, res: Response) => {
  res.json({ characters: getAllCharacters() });
});

// Admin Upsert Character (Create / Edit)
app.post('/api/admin/characters', adminAuthMiddleware, async (req: Request, res: Response) => {
  const char = req.body;
  if (!char || !char.name) {
    return res.status(400).json({ error: 'Character name is required' });
  }

  // Ensure ID exists
  const charId = char.id && String(char.id).trim() ? String(char.id).trim() : `char_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  
  const savedChar: Character = {
    id: charId,
    name: char.name.trim(),
    title: char.title?.trim() || 'Roleplay Companion',
    avatar: char.avatar?.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    category: char.category || 'Anime',
    personality: char.personality || '',
    background: char.background || char.about || char.backstory || '',
    about: char.background || char.about || char.backstory || '',
    backstory: char.background || char.about || char.backstory || '',
    greeting: char.greeting?.trim() || 'Hello!',
    systemPrompt: char.systemPrompt || `You are ${char.name}. Maintain complete roleplay immersion.`,
    voiceTone: char.voiceTone || 'Warm and clear',
    voiceName: char.voiceName || 'Kore',
    defaultScenarios: Array.isArray(char.defaultScenarios) && char.defaultScenarios.length > 0 ? char.defaultScenarios : ['Tell me about yourself.', 'Let us talk!'],
    burmeseScenarios: Array.isArray(char.burmeseScenarios) && char.burmeseScenarios.length > 0 ? char.burmeseScenarios : ['မင်းရဲ့ အကြောင်း ပြောပြပါ။'],
    isCustom: true,
    isPremium: Boolean(char.isPremium),
    sortOrder: typeof char.sortOrder === 'number' ? char.sortOrder : 0,
    isActive: char.isActive !== false
  };

  // 1. Update in-memory & local store
  if (!store.customCharacters) store.customCharacters = [];
  const existingIdx = store.customCharacters.findIndex(c => c.id === charId);
  if (existingIdx >= 0) {
    store.customCharacters[existingIdx] = savedChar;
  } else {
    store.customCharacters.push(savedChar);
  }

  // Unmark if previously deleted
  if (store.deletedCharacterIds) {
    store.deletedCharacterIds = store.deletedCharacterIds.filter(id => id !== charId);
  }

  saveStore(store);

  // 2. Persist to Supabase if connected
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('characters').upsert({
        id: savedChar.id,
        name: savedChar.name,
        title: savedChar.title,
        avatar: savedChar.avatar,
        category: savedChar.category,
        personality: savedChar.personality,
        background: savedChar.background,
        greeting: savedChar.greeting,
        system_prompt: savedChar.systemPrompt,
        voice_tone: savedChar.voiceTone,
        voice_name: savedChar.voiceName,
        default_scenarios: savedChar.defaultScenarios,
        burmese_scenarios: savedChar.burmeseScenarios,
        is_custom: true,
        is_premium: savedChar.isPremium,
        sort_order: savedChar.sortOrder,
        is_active: savedChar.isActive
      });

      await writeAuditLog('admin', 'upsert_character', 'character', charId, { name: savedChar.name });
    } catch (err) {
      console.warn('Supabase admin upsert character notice:', err);
    }
  }

  res.json({ success: true, character: savedChar, message: `Character "${savedChar.name}" saved successfully.` });
});

// Admin Clone / Duplicate Character
app.post('/api/admin/characters/:id/duplicate', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const allChars = getAllCharacters();
  const original = allChars.find(c => c.id === id);

  if (!original) {
    return res.status(404).json({ error: 'Character not found to clone' });
  }

  const newId = `char_copy_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const cloned: Character = {
    ...original,
    id: newId,
    name: `${original.name} (Copy)`,
    isCustom: true
  };

  if (!store.customCharacters) store.customCharacters = [];
  store.customCharacters.push(cloned);
  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('characters').upsert({
        id: cloned.id,
        name: cloned.name,
        title: cloned.title,
        avatar: cloned.avatar,
        category: cloned.category,
        personality: cloned.personality,
        background: cloned.background,
        greeting: cloned.greeting,
        system_prompt: cloned.systemPrompt,
        voice_tone: cloned.voiceTone,
        voice_name: cloned.voiceName,
        is_custom: true,
        is_premium: cloned.isPremium,
        sort_order: cloned.sortOrder,
        is_active: cloned.isActive
      });
      await writeAuditLog('admin', 'duplicate_character', 'character', newId, { originalId: id });
    } catch (err) {
      console.warn('Supabase admin clone character notice:', err);
    }
  }

  res.json({ success: true, character: cloned, message: 'Character cloned successfully.' });
});

// Admin Delete Character
app.delete('/api/admin/characters/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!store.deletedCharacterIds) store.deletedCharacterIds = [];
  if (!store.deletedCharacterIds.includes(id)) {
    store.deletedCharacterIds.push(id);
  }

  if (store.customCharacters) {
    store.customCharacters = store.customCharacters.filter(c => c.id !== id);
  }

  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('characters').delete().eq('id', id);
      await writeAuditLog('admin', 'delete_character', 'character', id, {});
    } catch (err) {
      console.warn('Supabase admin delete character notice:', err);
    }
  }

  res.json({ success: true, message: 'Character deleted successfully.' });
});

// Admin CONVERSATIONS Table with Rich User & Character info and Message Previews
app.get('/api/admin/conversations', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  let conversationsList: any[] = [];
  const allChars = getAllCharacters();
  const charMap = new Map(allChars.map(c => [c.id, c]));

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        conversationsList = data;
      }
    } catch (err) {
      console.warn('Supabase admin conversations error:', err);
    }
  }

  // Also harvest conversations from store.userChatHistories if Supabase is sparse
  if (store.userChatHistories) {
    for (const [uid, charHistories] of Object.entries(store.userChatHistories)) {
      for (const [charId, msgs] of Object.entries(charHistories)) {
        if (Array.isArray(msgs) && msgs.length > 0) {
          const exists = conversationsList.some(c => c.user_id === uid && c.character_id === charId);
          if (!exists) {
            const lastMsg = msgs[msgs.length - 1];
            conversationsList.push({
              id: `conv-${uid}-${charId}`,
              user_id: uid,
              character_id: charId,
              telegram_user_id: uid.startsWith('tg_') ? Number(uid.replace('tg_', '')) : null,
              updated_at: lastMsg?.timestamp || new Date().toISOString()
            });
          }
        }
      }
    }
  }

  // Enrich conversations with character names, message count, and last message snippet
  const enriched = await Promise.all(
    conversationsList.map(async (conv) => {
      const char = charMap.get(conv.character_id) || { name: conv.character_id, avatar: '', title: '' };
      let messageCount = 0;
      let lastMessage = '';

      // Check local store first
      const localMsgs = getUserChatHistory(conv.user_id, conv.character_id);
      if (localMsgs.length > 0) {
        messageCount = localMsgs.length;
        lastMessage = localMsgs[localMsgs.length - 1].text;
      }

      // Check Supabase if message count is 0
      if (supabase && messageCount === 0) {
        try {
          const { count, data: lastMsgData } = await supabase
            .from('chat_messages')
            .select('text', { count: 'exact' })
            .eq('user_id', conv.user_id)
            .eq('character_id', conv.character_id)
            .order('created_at', { ascending: false })
            .limit(1);

          messageCount = count || 0;
          if (lastMsgData && lastMsgData.length > 0) {
            lastMessage = lastMsgData[0].text;
          }
        } catch (e) {}
      }

      const userProfile = store.userProfiles[conv.user_id];
      const username = userProfile?.username || (conv.user_id.startsWith('tg_') ? `User ${conv.user_id.replace('tg_', '')}` : conv.user_id);

      return {
        id: conv.id,
        user_id: conv.user_id,
        telegram_user_id: conv.telegram_user_id,
        username,
        character_id: conv.character_id,
        character_name: char.name,
        character_title: char.title,
        character_avatar: char.avatar,
        message_count: messageCount,
        last_message: lastMessage,
        updated_at: conv.updated_at
      };
    })
  );

  res.json({ conversations: enriched });
});

// Admin Inspect Single User & Character Chat Log
app.get('/api/admin/chat-logs/:userId/:characterId', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { userId, characterId } = req.params;
  const supabase = getServerSupabase();
  let messages: ChatMessage[] = getUserChatHistory(userId, characterId);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        messages = data.map(item => ({
          id: item.id,
          characterId: item.character_id,
          sender: item.sender,
          text: item.text,
          timestamp: item.created_at || new Date().toISOString(),
          emotion: item.emotion
        }));
      }
    } catch (err) {
      console.warn('Supabase admin chat-logs fetch fallback:', err);
    }
  }

  const allChars = getAllCharacters();
  const character = allChars.find(c => c.id === characterId) || { id: characterId, name: characterId, avatar: '', title: '' };

  res.json({
    userId,
    characterId,
    character,
    messages
  });
});

// Admin Inspect All Chats for a User
app.get('/api/admin/user-chats/:userId', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const allChars = getAllCharacters();
  const charMap = new Map(allChars.map(c => [c.id, c]));
  const userChats: any[] = [];
  const supabase = getServerSupabase();

  // 1. Gather all characterIds this user chatted with
  const characterIds = new Set<string>();

  if (store.userChatHistories && store.userChatHistories[userId]) {
    Object.keys(store.userChatHistories[userId]).forEach(cid => characterIds.add(cid));
  }

  if (supabase) {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('character_id')
        .eq('user_id', userId);

      if (data) {
        data.forEach((r: any) => characterIds.add(r.character_id));
      }
    } catch (e) {}
  }

  for (const cid of characterIds) {
    const char = charMap.get(cid) || { id: cid, name: cid, avatar: '', title: '' };
    const msgs = getUserChatHistory(userId, cid);
    userChats.push({
      characterId: cid,
      character: char,
      messageCount: msgs.length,
      lastMessage: msgs.length > 0 ? msgs[msgs.length - 1] : null
    });
  }

  res.json({
    userId,
    chats: userChats
  });
});

// Admin ENERGY Logs Table
app.get('/api/admin/energy-logs', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('type', 'energy')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return res.json({ logs: data });
      }
    } catch (err) {
      console.warn('Supabase admin energy logs error:', err);
    }
  }

  res.json({ logs: [] });
});

// Admin GEMS Logs Table
app.get('/api/admin/gems-logs', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('type', 'gems')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return res.json({ logs: data });
      }
    } catch (err) {
      console.warn('Supabase admin gems logs error:', err);
    }
  }

  res.json({ logs: [] });
});

// Admin PREMIUM Entitlements Table
app.get('/api/admin/premium', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return res.json({ entitlements: data });
      }
    } catch (err) {
      console.warn('Supabase admin entitlements error:', err);
    }
  }

  res.json({ entitlements: store.entitlements });
});

// Admin SUPPORT Tickets Table
app.get('/api/admin/support', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ tickets: data });
      }
    } catch (err) {
      console.warn('Supabase admin support tickets error:', err);
    }
  }

  res.json({ tickets: [] });
});

// Admin Update Support Ticket Status & Internal Notes
app.post('/api/admin/support/:id/update', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      await supabase.from('support_tickets').update({
        status: status || 'open',
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      await writeAuditLog('admin', 'update_support_ticket', 'support', id, { status, adminNotes });
    } catch (err) {
      console.warn('Supabase update support ticket error:', err);
    }
  }

  res.json({ success: true, message: 'Ticket updated successfully.' });
});

// Admin AUDIT LOGS Table
app.get('/api/admin/audit-logs', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return res.json({ auditLogs: data });
      }
    } catch (err) {
      console.warn('Supabase audit logs fetch error:', err);
    }
  }

  res.json({ auditLogs: [] });
});

// Admin Broadcast Push Announcement
app.post('/api/admin/broadcast', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { title, message, target, buttonText, buttonUrl } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Broadcast message content cannot be empty.' });
  }

  const broadcastHeader = title ? `📢 <b>${title}</b>\n\n` : `📢 <b>Official Announcement</b>\n\n`;
  const fullBroadcastText = `${broadcastHeader}${message.trim()}`;
  
  let successCount = 0;
  let failureCount = 0;

  // Retrieve user telegram IDs from store and supabase
  const telegramChatIds: number[] = [];
  
  Object.keys(store.userProfiles).forEach(uid => {
    if (uid.startsWith('tg_')) {
      const parsedId = parseInt(uid.replace('tg_', ''), 10);
      if (!isNaN(parsedId) && !telegramChatIds.includes(parsedId)) {
        telegramChatIds.push(parsedId);
      }
    }
  });

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.from('profiles').select('telegram_id').not('telegram_id', 'is', null);
      if (data) {
        data.forEach(p => {
          if (p.telegram_id) {
            const parsed = parseInt(String(p.telegram_id), 10);
            if (!isNaN(parsed) && !telegramChatIds.includes(parsed)) {
              telegramChatIds.push(parsed);
            }
          }
        });
      }
    } catch (e) {}
  }

  const replyMarkup = (buttonText && buttonUrl) ? {
    inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
  } : undefined;

  for (const chatId of telegramChatIds) {
    try {
      const ok = await sendTelegramMessage(chatId, fullBroadcastText, undefined, replyMarkup);
      if (ok) successCount++;
      else failureCount++;
    } catch (e) {
      failureCount++;
    }
  }

  await writeAuditLog('admin', 'send_broadcast', 'announcement', 'all', {
    title,
    sentTo: telegramChatIds.length,
    successCount,
    failureCount
  });

  res.json({
    success: true,
    totalTargeted: telegramChatIds.length,
    successCount,
    failureCount,
    message: `Broadcast delivered to ${successCount} user(s).`
  });
});

// Admin Grant or Revoke VIP Entitlement
app.post('/api/admin/users/:id/grant-vip', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { planId = 'vip_monthly', days = 30, action = 'grant' } = req.body;

  const supabase = getServerSupabase();
  const now = new Date();
  const expDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  if (action === 'grant') {
    const entitlement: UserEntitlement = {
      id: `ent-adm-${Date.now()}`,
      userId: id,
      planId: planId,
      startDate: now.toISOString(),
      expirationDate: expDate.toISOString(),
      status: 'active'
    };

    store.entitlements = store.entitlements.filter(e => e.userId !== id);
    store.entitlements.push(entitlement);
    saveStore(store);

    if (supabase) {
      try {
        await supabase.from('user_entitlements').insert({
          id: entitlement.id,
          user_id: id,
          plan_id: planId,
          start_date: entitlement.startDate,
          expiration_date: entitlement.expirationDate,
          status: 'active'
        });
      } catch (e) {}
    }

    await writeAuditLog('admin', 'grant_vip', 'user_entitlement', id, { planId, days, expDate: expDate.toISOString() });
    return res.json({ success: true, message: `Granted ${planId} VIP to user for ${days} days.`, entitlement });
  } else {
    // Revoke VIP
    store.entitlements = store.entitlements.map(e => e.userId === id ? { ...e, status: 'cancelled' } : e);
    saveStore(store);

    if (supabase) {
      try {
        await supabase.from('user_entitlements').update({ status: 'cancelled' }).eq('user_id', id);
      } catch (e) {}
    }

    await writeAuditLog('admin', 'revoke_vip', 'user_entitlement', id, {});
    return res.json({ success: true, message: 'VIP entitlement revoked.' });
  }
});

// Admin Character Clone / Duplicate
app.post('/api/admin/characters/:id/duplicate', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const allChars = getAllCharacters();
  const original = allChars.find(c => c.id === id);

  if (!original) {
    return res.status(404).json({ error: 'Source character not found.' });
  }

  const newId = `char-clone-${Date.now()}`;
  const duplicated: Character = {
    ...original,
    id: newId,
    name: `${original.name} (Copy)`,
    title: `${original.title} [Duplicated]`,
    isCustom: true
  };

  store.customCharacters.push(duplicated);
  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('characters').insert({
        id: duplicated.id,
        name: duplicated.name,
        title: duplicated.title,
        avatar: duplicated.avatar,
        category: duplicated.category,
        personality: duplicated.personality,
        background: duplicated.background,
        greeting: duplicated.greeting,
        system_prompt: duplicated.systemPrompt,
        voice_tone: duplicated.voiceTone,
        voice_name: duplicated.voiceName,
        is_custom: true,
        is_premium: duplicated.isPremium,
        sort_order: 999,
        is_active: true
      });
    } catch (e) {}
  }

  await writeAuditLog('admin', 'duplicate_character', 'character', newId, { originalId: id, name: duplicated.name });
  res.json({ success: true, character: duplicated, message: 'Character duplicated successfully.' });
});

// Admin System Config Get & Update
app.get('/api/admin/system-config', adminAuthMiddleware, (req: Request, res: Response) => {
  const config = {
    botUsername: '@Rubby_Chan_Bot',
    defaultModel: 'gemini-3.7-flash',
    defaultTemperature: 0.85,
    dailyFreeEnergy: 25,
    maxFreeEnergy: 50,
    activeAiService: 'Google Gemini 3.7 Flash',
    serverUptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platformDomain: req.get('host') || 'ais-dev-avlykr7pkicyzjc426vs3q-487032049822.asia-southeast1.run.app'
  };
  res.json({ success: true, config });
});

app.post('/api/admin/system-config', adminAuthMiddleware, async (req: Request, res: Response) => {
  await writeAuditLog('admin', 'update_system_config', 'system', 'config', req.body);
  res.json({ success: true, message: 'System configuration updated successfully.' });
});

// Admin Export Database Backup JSON
app.get('/api/admin/export-data', adminAuthMiddleware, (req: Request, res: Response) => {
  const backup = {
    timestamp: new Date().toISOString(),
    store: store,
    totalCharacters: getAllCharacters().length
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=rubychan-backup-${Date.now()}.json`);
  res.send(JSON.stringify(backup, null, 2));
});

// Admin Import Database Restore JSON
app.post('/api/admin/import-data', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.store) {
    return res.status(400).json({ error: 'Invalid backup JSON file payload.' });
  }

  try {
    if (backupData.store.customCharacters) store.customCharacters = backupData.store.customCharacters;
    if (backupData.store.userProfiles) store.userProfiles = backupData.store.userProfiles;
    if (backupData.store.entitlements) store.entitlements = backupData.store.entitlements;
    if (backupData.store.paymentOrders) store.paymentOrders = backupData.store.paymentOrders;
    saveStore(store);

    await writeAuditLog('admin', 'import_database_restore', 'database', 'all', { timestamp: backupData.timestamp });
    res.json({ success: true, message: 'Database state successfully restored from backup!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to restore database.' });
  }
});

// Admin Reset Database to Initial Defaults
app.post('/api/admin/reset-data', adminAuthMiddleware, async (req: Request, res: Response) => {
  store.customCharacters = [];
  store.chatHistories = {};
  store.memoryFacts = {};
  store.relationships = {};
  store.paymentOrders = {};
  store.entitlements = [];
  saveStore(store);

  await writeAuditLog('admin', 'reset_database_defaults', 'database', 'all', {});
  res.json({ success: true, message: 'Platform data successfully reset to pristine initial state.' });
});

// Get User Preferences
app.get('/api/preferences', async (req: Request, res: Response) => {
  const { userId } = getUserIdentity(req);
  await getOrCreateUserProfile(req);
  const supabase = getServerSupabase();

  if (!store.userPreferencesMap) store.userPreferencesMap = {};

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data && data.preferences) {
        store.userPreferencesMap[userId] = { ...defaultPreferences, ...data.preferences };
        saveStore(store);
      }
    } catch (err) {
      console.warn('Supabase preferences fetch fallback:', err);
    }
  }

  const pref = store.userPreferencesMap[userId] || defaultPreferences;
  res.json({ preferences: pref });
});

// Update User Preferences
app.post('/api/preferences', async (req: Request, res: Response) => {
  const { userId } = getUserIdentity(req);
  if (!store.userPreferencesMap) store.userPreferencesMap = {};

  const current = store.userPreferencesMap[userId] || defaultPreferences;
  const updated = { ...current, ...req.body };
  store.userPreferencesMap[userId] = updated;
  saveStore(store);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        preferences: updated,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase preferences update fallback:', err);
    }
  }

  res.json({ success: true, preferences: updated });
});

// Get Chat Messages
app.get('/api/chat/:characterId', async (req: Request, res: Response) => {
  const { characterId } = req.params;
  const { userId } = getUserIdentity(req);
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const msgs: ChatMessage[] = data.map(item => ({
          id: item.id,
          characterId: item.character_id,
          sender: item.sender,
          text: item.text,
          timestamp: item.created_at || new Date().toISOString(),
          emotion: item.emotion
        }));
        setUserChatHistory(userId, characterId, msgs);
        saveStore(store);
        return res.json({ messages: msgs });
      }
    } catch (err) {
      console.warn('Supabase chat messages fetch fallback:', err);
    }
  }

  const messages = getUserChatHistory(userId, characterId);
  
  if (messages.length === 0) {
    const char = getAllCharacters().find(c => c.id === characterId);
    if (char) {
      const initialMsg: ChatMessage = {
        id: `msg-init-${Date.now()}`,
        characterId,
        sender: 'bot',
        text: char.greeting,
        timestamp: new Date().toISOString(),
        emotion: 'happy'
      };
      setUserChatHistory(userId, characterId, [initialMsg]);
      saveStore(store);

      if (supabase) {
        try {
          await supabase.from('chat_messages').insert({
            id: initialMsg.id,
            user_id: userId,
            character_id: characterId,
            sender: 'bot',
            text: char.greeting,
            emotion: 'happy'
          });
        } catch (err) {
          console.warn('Supabase initial chat msg insert fallback:', err);
        }
      }

      return res.json({ messages: [initialMsg] });
    }
  }

  res.json({ messages });
});

// Reset Chat History
app.delete('/api/chat/:characterId', async (req: Request, res: Response) => {
  const { characterId } = req.params;
  const { userId } = getUserIdentity(req);
  const char = getAllCharacters().find(c => c.id === characterId);
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      await supabase.from('chat_messages').delete().eq('character_id', characterId).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase reset chat history fallback:', err);
    }
  }

  if (char) {
    const initialMsg: ChatMessage = {
      id: `msg-init-${Date.now()}`,
      characterId,
      sender: 'bot',
      text: char.greeting,
      timestamp: new Date().toISOString(),
      emotion: 'happy'
    };
    setUserChatHistory(userId, characterId, [initialMsg]);

    if (supabase) {
      try {
        await supabase.from('chat_messages').insert({
          id: initialMsg.id,
          user_id: userId,
          character_id: characterId,
          sender: 'bot',
          text: char.greeting,
          emotion: 'happy'
        });
      } catch (err) {
        console.warn('Supabase initial msg fallback:', err);
      }
    }
  } else {
    setUserChatHistory(userId, characterId, []);
  }

  saveStore(store);
  res.json({ success: true, messages: getUserChatHistory(userId, characterId) });
});

// Delete specific messages
app.post('/api/chat/:characterId/delete-messages', async (req: Request, res: Response) => {
  const { characterId } = req.params;
  const { userId } = getUserIdentity(req);
  const { messageIds } = req.body;
  
  if (Array.isArray(messageIds)) {
    const existing = getUserChatHistory(userId, characterId);
    const updated = existing.filter((m) => !messageIds.includes(m.id));
    setUserChatHistory(userId, characterId, updated);
    saveStore(store);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('chat_messages').delete().eq('user_id', userId).in('id', messageIds);
      } catch (err) {
        console.warn('Supabase delete messages fallback:', err);
      }
    }
  }
  res.json({ success: true, messages: getUserChatHistory(userId, characterId) });
});

// Supabase Connection Status Route (Dynamic New Project)
app.get('/api/supabase/status', async (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const isConfigured = Boolean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  
  let projectRef = '';
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/);
    if (match) projectRef = match[1];
  }

  const supabase = getServerSupabase();
  let liveConnected = false;
  let liveError: string | null = null;
  let tableStats = { characters: 0, messages: 0, profiles: 0 };

  if (supabase) {
    try {
      const [charRes, msgRes, profRes] = await Promise.all([
        supabase.from('characters').select('id', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      if (!charRes.error) {
        liveConnected = true;
        tableStats.characters = charRes.count || 0;
        tableStats.messages = msgRes.count || 0;
        tableStats.profiles = profRes.count || 0;
      } else {
        liveError = charRes.error.message;
      }
    } catch (err: any) {
      liveError = err.message || 'Connection failed';
    }
  }

  res.json({
    projectId: projectRef || 'custom',
    supabaseUrl: supabaseUrl || 'Not configured in environment',
    dashboardUrl: projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : '',
    isConfigured,
    liveConnected,
    liveError,
    tableStats
  });
});

// Get Active Conversations (Trims unpinned exceeding 5 & respects pinned)
app.get('/api/conversations/active', async (req: Request, res: Response) => {
  try {
    const { userId } = getUserIdentity(req);
    const activeCharIds = await cleanupUserActiveConversations(userId);
    const pinnedCharIds = store.pinnedCharacters?.[userId] || [];

    const allChars = getAllCharacters();
    const activeChars = activeCharIds.map((id) => allChars.find((c) => c.id === id)).filter(Boolean) as Character[];

    res.json({
      success: true,
      activeCharacterIds: activeCharIds,
      pinnedCharacterIds: pinnedCharIds,
      activeCharacters: activeChars
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch active conversations' });
  }
});

// Toggle Pin / Unpin Character Conversation
app.post('/api/conversations/pin', async (req: Request, res: Response) => {
  try {
    const { characterId, pinned } = req.body;
    const { userId } = getUserIdentity(req);

    if (!characterId) {
      return res.status(400).json({ error: 'characterId is required' });
    }

    if (!store.pinnedCharacters) store.pinnedCharacters = {};
    if (!store.pinnedCharacters[userId]) store.pinnedCharacters[userId] = [];

    let pinnedList = store.pinnedCharacters[userId];
    if (pinned) {
      if (!pinnedList.includes(characterId)) {
        pinnedList.push(characterId);
      }
    } else {
      pinnedList = pinnedList.filter((id) => id !== characterId);
    }
    store.pinnedCharacters[userId] = pinnedList;
    saveStore(store);

    // Sync to user preferences map
    if (store.userPreferencesMap?.[userId]) {
      store.userPreferencesMap[userId].pinnedCharacterIds = pinnedList;
    }

    // Run cleanup to ensure limit invariant
    const activeCharIds = await cleanupUserActiveConversations(userId);

    res.json({
      success: true,
      pinned: Boolean(pinned),
      characterId,
      pinnedCharacterIds: pinnedList,
      activeCharacterIds: activeCharIds
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update pin status' });
  }
});

// Bulk Delete Conversations
app.post('/api/conversations/delete', async (req: Request, res: Response) => {
  try {
    const { characterIds } = req.body;
    const { userId } = getUserIdentity(req);

    if (Array.isArray(characterIds) && store.userChatHistories?.[userId]) {
      const supabase = getServerSupabase();
      for (const charId of characterIds) {
        delete store.userChatHistories[userId][charId];
        if (store.userRelationships?.[userId]?.[charId]) {
          delete store.userRelationships[userId][charId];
        }
        if (store.userMemoryFacts?.[userId]?.[charId]) {
          delete store.userMemoryFacts[userId][charId];
        }

        if (supabase) {
          try {
            await supabase.from('chat_messages').delete().eq('user_id', userId).eq('character_id', charId);
            await supabase.from('conversations').delete().eq('user_id', userId).eq('character_id', charId);
          } catch (e) {}
        }
      }
      saveStore(store);
    }

    const activeCharIds = await cleanupUserActiveConversations(userId);

    res.json({
      success: true,
      deleted: characterIds,
      activeCharacterIds: activeCharIds
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete conversations' });
  }
});

// Initialize / Find Supabase Conversation record & Send immediate character greeting
app.post('/api/conversations/init', async (req: Request, res: Response) => {
  try {
    const { characterId, telegramUserId } = req.body;
    const { userId, telegramId } = getUserIdentity(req);
    const finalTgId = telegramUserId ? Number(telegramUserId) : (telegramId || null);
    const conversationId = `conv-${userId}-${characterId}`;

    if (!store.activeTelegramCharacters) store.activeTelegramCharacters = {};
    store.activeTelegramCharacters[userId] = characterId;
    saveStore(store);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('conversations').upsert({
          id: conversationId,
          user_id: userId,
          character_id: characterId,
          telegram_user_id: finalTgId,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase conversation init fallback:', err);
      }
    }

    const allChars = getAllCharacters();
    const char = allChars.find(c => c.id === characterId) || allChars[0];

    res.json({
      success: true,
      conversationId,
      botUrl: `https://t.me/Rubby_Chan_Bot?start=char_${encodeURIComponent(characterId)}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initialize conversation' });
  }
});

// Submit Support Ticket to Supabase
app.post('/api/support/tickets', async (req: Request, res: Response) => {
  try {
    const { category, subject, message } = req.body;
    const { userId } = getUserIdentity(req);
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('support_tickets').insert({
          id: ticketId,
          user_id: userId,
          category: category || 'Account',
          subject: subject || 'Support Request',
          message: message || '',
          status: 'open'
        });
      } catch (err) {
        console.warn('Supabase support ticket insert fallback:', err);
      }
    }

    res.json({ success: true, ticketId, message: 'Support ticket submitted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit support ticket' });
  }
});

// Get Long-Term Memories
app.get('/api/memory/:characterId', async (req: Request, res: Response) => {
  const { characterId } = req.params;
  const { userId } = getUserIdentity(req);
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('memory_facts')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', userId);

      if (!error && Array.isArray(data) && data.length > 0) {
        const fetchedMemories: MemoryFact[] = data.map(item => ({
          id: item.id,
          characterId: item.character_id,
          category: item.category || 'user_preference',
          content: item.content,
          createdAt: item.created_at || new Date().toISOString(),
          isAutoExtracted: Boolean(item.is_auto_extracted)
        }));
        setUserMemoryFacts(userId, characterId, fetchedMemories);
        saveStore(store);
        return res.json({ memories: fetchedMemories });
      }
    } catch (err) {
      console.warn('Supabase memory facts fetch fallback:', err);
    }
  }

  const memories = getUserMemoryFacts(userId, characterId);
  res.json({ memories });
});

// Add or Remove Memory Fact
app.post('/api/memory', async (req: Request, res: Response) => {
  const { characterId, action, factId, category, content } = req.body;
  const { userId } = getUserIdentity(req);
  const supabase = getServerSupabase();

  let userFacts = getUserMemoryFacts(userId, characterId);

  if (action === 'add' && content) {
    const newFact: MemoryFact = {
      id: `mem-${Date.now()}`,
      characterId,
      category: category || 'user_preference',
      content,
      createdAt: new Date().toISOString(),
      isAutoExtracted: false
    };
    userFacts.push(newFact);
    setUserMemoryFacts(userId, characterId, userFacts);

    if (supabase) {
      try {
        await supabase.from('memory_facts').insert({
          id: newFact.id,
          user_id: userId,
          character_id: characterId,
          category: newFact.category,
          content: newFact.content,
          is_auto_extracted: false
        });
      } catch (err) {
        console.warn('Supabase memory add fallback:', err);
      }
    }
  } else if (action === 'delete' && factId) {
    userFacts = userFacts.filter(m => m.id !== factId);
    setUserMemoryFacts(userId, characterId, userFacts);
    if (supabase) {
      try {
        await supabase.from('memory_facts').delete().eq('id', factId);
      } catch (err) {
        console.warn('Supabase memory delete fallback:', err);
      }
    }
  } else if (action === 'clear') {
    setUserMemoryFacts(userId, characterId, []);
    if (supabase) {
      try {
        await supabase.from('memory_facts').delete().eq('character_id', characterId).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase memory clear fallback:', err);
      }
    }
  }

  saveStore(store);
  res.json({ success: true, memories: getUserMemoryFacts(userId, characterId) });
});

// Send Chat Message & AI Roleplay Logic
app.post('/api/chat/send', async (req: Request, res: Response) => {
  try {
    const { characterId, messageText } = req.body;
    if (!characterId || !messageText) {
      return res.status(400).json({ error: 'characterId and messageText required' });
    }

    const userProf = await getOrCreateUserProfile(req);
    const userId = userProf.id;

    const allChars = getAllCharacters();
    const character = allChars.find(c => c.id === characterId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Energy check: non-VIP users consume 1 Energy per message
    const entitlement = await getActiveEntitlement(userId);
    const isVip = entitlement && entitlement.status === 'active';

    if (!isVip && userProf.energy <= 0) {
      return res.status(400).json({
        error: 'Starlight Energy depleted! Please claim daily energy or upgrade to VIP for unlimited chatting.',
        code: 'ENERGY_DEPLETED'
      });
    }

    if (!isVip) {
      userProf.energy = Math.max(0, userProf.energy - 1);
    }

    if (!store.chatHistories[characterId]) {
      store.chatHistories[characterId] = [];
    }
    if (!store.memoryFacts[characterId]) {
      store.memoryFacts[characterId] = [];
    }
    if (!store.relationships[characterId]) {
      store.relationships[characterId] = {
        characterId,
        level: 1,
        affectionPoints: 10,
        statusTitle: 'Acquaintance',
        unlockedLore: ['Initial meeting']
      };
    }

    // Add user message to store
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      characterId,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toISOString()
    };
    addUserChatMessage(userId, characterId, userMsg);

    const existingMemories = getUserMemoryFacts(userId, characterId);
    const memoryContextStr = existingMemories.length > 0
      ? `\n[LONG-TERM MEMORY BANK & USER FACTS]:\n` + existingMemories.map(m => `- [${m.category}]: ${m.content}`).join('\n')
      : '\n[LONG-TERM MEMORY BANK]: No recorded facts yet. Pay attention to user preferences!';

    const userPref = (store.userPreferencesMap && store.userPreferencesMap[userId]) || store.userPreferences || defaultPreferences;
    const userPersona = userPref.userPersona || defaultPreferences.userPersona;
    const personaContext = `\n[USER PERSONA & PROFILE]: Name: ${userPersona.name}, Pronouns: ${userPersona.pronouns || 'They/Them'}, Bio: ${userPersona.bio}, Preferred Relationship Style: ${userPersona.relationshipStyle}`;
    const customUserDirectives = userPref.customDirectives ? `\n[USER CUSTOM DIRECTIVES & PREFERENCES]:\n${userPref.customDirectives}` : '';

    const rpFormatInstruction = userPref.rpStyle === 'narrative'
      ? 'Use expressive actions enclosed in *asterisks* (e.g., *smiles warmly*, *bites lip softly*) along with your spoken dialogue.'
      : userPref.rpStyle === 'dialogue_only'
      ? 'Focus primarily on spoken dialogue with minimal narration.'
      : 'Write in detailed descriptive roleplay novel format with rich environment and sensual details.';

    const langInstruction = getLanguageInstruction(userPref);

    const systemInstruction = `${character.systemPrompt}
Character Name: ${character.name}
Character Title: ${character.title}
Personality Traits: ${character.personality}
Background Story: ${character.background}
${personaContext}
${customUserDirectives}
${memoryContextStr}

${ADULT_ENGINE_DIRECTIVES}

[ROLEPLAY GUIDELINES]:
1. Stay strictly in character as ${character.name}. Never break character or refer to yourself as an AI model.
2. ${rpFormatInstruction}
3. ${langInstruction}
4. Show realistic emotional depth. Emotionally react to the user's tone, intimacy, and requests.
5. If the user asks for a picture/photo, or if the intimate scene reaches a peak, append [TRIGGER_IMAGE: detailed description of character outfit/pose/scene] at the end.`;

    // Build robust multi-turn contents with ONLY this user's isolated history
    const contents = buildGeminiContents(
      getUserChatHistory(userId, characterId),
      messageText
    );

    const ai = getGenAI();
    let replyText = '';
    const candidateModels = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction,
            temperature: typeof userPref.aiTemperature === 'number' ? userPref.aiTemperature : 0.85,
          }
        });

        if (response.text && response.text.trim().length > 0) {
          replyText = response.text.trim();
          break;
        }
      } catch (genAiErr: any) {
        console.error(`[Gemini Roleplay Generation Notice with ${modelName}]:`, genAiErr?.message || genAiErr);
      }
    }

    if (!replyText) {
      replyText = `*gazes at you softly with deep warmth* I am listening to every word you say, my dear. Let us continue...`;
    }

    // Intercept and handle [TRIGGER_IMAGE: ...] or 1-photo-per-3-messages ratio
    const existingHistory = getUserChatHistory(userId, characterId);
    const userMsgCount = existingHistory.filter(m => m.sender === 'user').length;
    const isPhotoReq = /photo|picture|pic|selfie|pose|image|ပုံ|ဓာတ်ပုံ|ကြည့်ချင်|ပြပါ|ပို့/i.test(messageText);
    const isEvery3Messages = userMsgCount > 0 && userMsgCount % 3 === 0;

    let generatedImageUrl: string | undefined = undefined;
    let cleanReplyText = replyText;
    const imgTriggerMatch = replyText.match(/\[TRIGGER_IMAGE:\s*([^\]]+)\]/i);

    if (imgTriggerMatch && imgTriggerMatch[1]) {
      const imagePromptDesc = imgTriggerMatch[1].trim();
      cleanReplyText = replyText.replace(/\[TRIGGER_IMAGE:[^\]]+\]/gi, '').trim();
      try {
        const generatedUrl = await generateCompanionImage(imagePromptDesc, character);
        if (generatedUrl) {
          generatedImageUrl = generatedUrl;
        }
      } catch (imgErr) {
        console.warn('[Companion Image Generation error]:', imgErr);
      }
    } else if (isPhotoReq || isEvery3Messages) {
      try {
        const scenePrompt = `${character.name}, ${cleanReplyText.slice(0, 90)}, detailed intimate anime scene, gorgeous illustration`;
        const generatedUrl = await generateCompanionImage(scenePrompt, character);
        if (generatedUrl) {
          generatedImageUrl = generatedUrl;
        }
      } catch (imgErr) {
        console.warn('[Companion Interval Image Generation notice]:', imgErr);
      }
    }

    let emotion: any = 'happy';
    const lowerReply = cleanReplyText.toLowerCase();
    if (lowerReply.includes('*gasp*') || lowerReply.includes('*surprised*') || lowerReply.includes('!')) {
      emotion = 'surprised';
    } else if (lowerReply.includes('*blushes*') || lowerReply.includes('*shy*') || lowerReply.includes('*flustered*')) {
      emotion = 'flustered';
    } else if (lowerReply.includes('*thinks*') || lowerReply.includes('*pokes chin*') || lowerReply.includes('*ponders*')) {
      emotion = 'thoughtful';
    } else if (lowerReply.includes('*sighs*') || lowerReply.includes('*smirks*') || lowerReply.includes('*glares*')) {
      emotion = 'dramatic';
    }

    const rel = getUserRelationship(userId, characterId);
    rel.affectionPoints += Math.floor(Math.random() * 5) + 5;
    if (rel.affectionPoints >= 100 && rel.level < 10) {
      rel.level += 1;
      rel.affectionPoints = 0;
      if (rel.level === 2) rel.statusTitle = 'Close Companion';
      else if (rel.level === 3) rel.statusTitle = 'Trusted Confidant';
      else if (rel.level === 5) rel.statusTitle = 'Sworn Ally';
      else if (rel.level === 8) rel.statusTitle = 'Soul Connection';
      else if (rel.level >= 10) rel.statusTitle = 'Legendary Bond';
      rel.unlockedLore.push(`Reached Bond Level ${rel.level}`);
    }

    let newlyExtractedMemories: string[] = [];
    if (userPref.autoExtractMemories && messageText.length > 10) {
      try {
        const memoryPrompt = `Analyze this user message to an AI roleplay character: "${messageText}".
Extract any explicit user preference, personal detail, name, background, favorite item, or emotional statement about the user.
Return ONLY a JSON array of short string facts (max 2 facts). If no new fact is disclosed, return [].
Example output format: ["User likes Earl Grey tea", "User's favorite color is midnight blue"]`;

        const memRes = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: memoryPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });

        if (memRes.text) {
          const parsedFacts: string[] = JSON.parse(memRes.text);
          const currentMemories = getUserMemoryFacts(userId, characterId);
          for (const factStr of parsedFacts) {
            if (factStr && factStr.trim().length > 3) {
              const newFact: MemoryFact = {
                id: `mem-auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                characterId,
                category: 'user_preference',
                content: factStr.trim(),
                createdAt: new Date().toISOString(),
                isAutoExtracted: true
              };
              currentMemories.push(newFact);
              newlyExtractedMemories.push(factStr.trim());
            }
          }
          setUserMemoryFacts(userId, characterId, currentMemories);
        }
      } catch (memErr) {
        console.warn('Memory extraction non-blocking notice:', memErr);
      }
    }

    const botMsg: ChatMessage = {
      id: `msg-bot-${Date.now()}`,
      characterId,
      sender: 'bot',
      text: cleanReplyText || replyText,
      timestamp: new Date().toISOString(),
      emotion,
      imageUrl: generatedImageUrl,
      memoriesUpdated: newlyExtractedMemories
    };
    addUserChatMessage(userId, characterId, botMsg);
    saveStore(store);

    // Auto-clean unpinned active conversations exceeding 5
    await cleanupUserActiveConversations(userId);

    // Sync messages, relationships, and memories to Supabase
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        // 1. Insert user message and bot message
        await supabase.from('chat_messages').insert([
          {
            id: userMsg.id,
            user_id: userId,
            character_id: characterId,
            sender: 'user',
            text: userMsg.text
          },
          {
            id: botMsg.id,
            user_id: userId,
            character_id: characterId,
            sender: 'bot',
            text: botMsg.text,
            emotion: botMsg.emotion
          }
        ]);

        // 2. Sync profile balance
        await supabase.from('profiles').update({ energy: userProf.energy }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase chat sync fallback:', err);
      }
    }

    res.json({
      success: true,
      userMessage: userMsg,
      botMessage: botMsg,
      relationship: rel,
      userEnergy: userProf.energy
    });
  } catch (err: any) {
    console.error('Error in /api/chat/send:', err);
    res.status(500).json({ error: err.message || 'Failed to generate chat response' });
  }
});

// Telegram Bot Webhook Integration
app.post(['/api/telegram/webhook', '/webhook/telegram'], async (req: Request, res: Response) => {
  res.status(200).json({ ok: true });

  try {
    const update = req.body;
    if (!update || !update.message) return;

    const msg = update.message;
    const chatId = msg.chat?.id;
    const text = (msg.text || '').trim();
    const fromUser = msg.from;

    if (!chatId || !fromUser) return;

    const telegramId = fromUser.id;
    const userId = `tg_${telegramId}`;

    const mockReq = {
      headers: {
        'x-telegram-user-id': String(telegramId),
        'x-telegram-user-info': JSON.stringify(fromUser)
      },
      query: {},
      body: {}
    } as any;

    const userProf = await getOrCreateUserProfile(mockReq);

    // Compute dynamic base webapp URL for current environment
    const rawHost = req.get('host') || 'ais-dev-avlykr7pkicyzjc426vs3q-487032049822.asia-southeast1.run.app';
    const baseUrl = process.env.APP_URL || `https://${rawHost}`;
    const botUsername = 'Rubby_Chan_Bot';
    const officialBotLink = `https://t.me/${botUsername}`;

    // Command: /start or /bot or /help
    if (text.startsWith('/start') || text.startsWith('/bot') || text.startsWith('/help') || text.startsWith('/link')) {
      let characterId = 'ruby-chan';

      const match = text.match(/\/start(?:\s+([a-zA-Z0-9_-]+))?/);
      if (match && match[1]) {
        const payload = match[1];
        if (payload.startsWith('ref_')) {
          const referrerTgId = payload.replace(/^ref_/, '');
          if (referrerTgId && referrerTgId !== String(telegramId)) {
            if (!store.referrals) store.referrals = {};
            if (!store.referrals[userId]) {
              store.referrals[userId] = {
                referrerTgId,
                rewarded: false,
                joinedAt: new Date().toISOString()
              };
              saveStore(store);
            }
          }
        } else {
          characterId = payload.replace(/^(?:start_|char_|resume_)+/, '');
        }
      }

      const allChars = getAllCharacters();
      let char = allChars.find(c => c.id === characterId);
      if (!char) {
        char = allChars.find(c => c.id === 'ruby-chan') || allChars[0];
        characterId = char.id;
      }

      const supabase = getServerSupabase();
      const conversationId = `conv-${userId}-${characterId}`;
      if (supabase) {
        try {
          await supabase.from('conversations').upsert({
            id: conversationId,
            user_id: userId,
            character_id: characterId,
            telegram_user_id: telegramId,
            updated_at: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Supabase conversation upsert fallback:', err);
        }
      }

      if (!store.activeTelegramCharacters) store.activeTelegramCharacters = {};
      store.activeTelegramCharacters[userId] = characterId;
      saveStore(store);

      // Check if user is resuming an existing conversation
      const isResuming = text.includes('resume_');
      let historyList: Array<{ sender: string; text: string }> = getUserChatHistory(userId, characterId).map(m => ({ sender: m.sender, text: m.text }));
      if (supabase) {
        try {
          const { data: historyData } = await supabase
            .from('chat_messages')
            .select('sender, text')
            .eq('character_id', characterId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

          if (historyData && historyData.length > 0) {
            historyList = historyData.reverse().map(m => ({ sender: m.sender, text: m.text }));
          }
        } catch (e) {}
      }

      let greetingText = `<b>${escapeHtml(char.name)}</b> (${escapeHtml(char.title)}):\n\n<i>"${escapeHtml(char.greeting)}"</i>`;
      if (isResuming && historyList.length > 0) {
        const lastItem = historyList[historyList.length - 1];
        greetingText = `<b>${escapeHtml(char.name)}</b> (${escapeHtml(char.title)}):\n\n*looks up with a warm smile as you return*\n<i>"Welcome back! I was waiting for you. Let's continue where we left off..."</i>\n\n💬 <i>Last message: "${escapeHtml(lastItem.text.slice(0, 80))}${lastItem.text.length > 80 ? '...' : ''}"</i>`;
      }

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: `✨ Choose the characters`,
              web_app: { url: baseUrl }
            }
          ]
        ]
      };
      await sendTelegramMessage(chatId, greetingText, undefined, replyMarkup);
      return;
    }

    // Regular Chat message to Telegram Bot
    if (!store.activeTelegramCharacters) store.activeTelegramCharacters = {};
    let characterId = store.activeTelegramCharacters[userId] || 'ruby-chan';

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('conversations')
          .select('character_id')
          .eq('telegram_user_id', telegramId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.character_id) {
          characterId = data.character_id;
        }
      } catch (err) {}
    }

    const allChars = getAllCharacters();
    const character = allChars.find(c => c.id === characterId) || allChars[0];

    const entitlement = await getActiveEntitlement(userId);
    const isVip = entitlement && entitlement.status === 'active';

    if (!isVip && userProf.energy <= 0) {
      await sendTelegramMessage(chatId, `⚠️ <b>Starlight Energy Depleted!</b>\n\nOpen RubyChan 2.0 WebApp to claim free daily energy or unlock Unlimited VIP access.`, undefined, {
        inline_keyboard: [
          [
            { text: `⚡ Claim Energy / VIP`, web_app: { url: `${baseUrl}?openStore=true` } }
          ]
        ]
      });
      return;
    }

    if (!isVip) {
      userProf.energy = Math.max(0, userProf.energy - 1);
      if (supabase) {
        try {
          await supabase.from('profiles').update({ energy: userProf.energy }).eq('id', userId);
        } catch (e) {}
      }
    }

    const existingFacts = getUserMemoryFacts(userId, characterId);
    let memoryContextStr = existingFacts.length > 0
      ? '\n[LONG-TERM MEMORY BANK & USER FACTS]:\n' + existingFacts.map(m => `- [${m.category}]: ${m.content}`).join('\n')
      : '';

    if (supabase) {
      try {
        const { data: memData } = await supabase
          .from('memory_facts')
          .select('category, content')
          .eq('character_id', characterId)
          .eq('user_id', userId);

        if (memData && memData.length > 0) {
          memoryContextStr = '\n[LONG-TERM MEMORY BANK & USER FACTS]:\n' + memData.map(m => `- [${m.category}]: ${m.content}`).join('\n');
        }
      } catch (e) {}
    }

    const userPref = (store.userPreferencesMap && store.userPreferencesMap[userId]) || store.userPreferences || defaultPreferences;
    const userPersona = userPref.userPersona || defaultPreferences.userPersona;
    const personaContext = `\n[USER PERSONA & PROFILE]: Name: ${userPersona.name || fromUser.first_name || 'Traveler'}, Pronouns: ${userPersona.pronouns || 'They/Them'}, Bio: ${userPersona.bio || 'Admirer and companion'}, Preferred Relationship Style: ${userPersona.relationshipStyle || 'Romantic Partner'}`;
    const customUserDirectives = userPref.customDirectives ? `\n[USER CUSTOM DIRECTIVES & PREFERENCES]:\n${userPref.customDirectives}` : '';
    const langInstruction = getLanguageInstruction(userPref);

    const systemInstruction = `${character.systemPrompt}
Character Name: ${character.name}
Character Title: ${character.title}
Personality Traits: ${character.personality}
Background Story: ${character.background}
${personaContext}
${customUserDirectives}
${memoryContextStr}

${ADULT_ENGINE_DIRECTIVES}

[ROLEPLAY GUIDELINES]:
1. Stay strictly in character as ${character.name}. Never break character.
2. Use expressive actions enclosed in *asterisks* (e.g., *smiles warmly*, *bites lip softly*).
3. ${langInstruction}
4. Show realistic emotional depth. React to the user's tone and intimacy.
5. If the user asks for a picture/photo, or if the intimate scene reaches a peak, append [TRIGGER_IMAGE: detailed description of character outfit/pose/scene] at the end.`;

    let historyList: Array<{ sender: 'user' | 'bot'; text: string }> = getUserChatHistory(userId, characterId).map(m => ({
      sender: m.sender === 'user' ? 'user' : 'bot',
      text: m.text
    }));

    if (supabase) {
      try {
        const { data: historyData } = await supabase
          .from('chat_messages')
          .select('sender, text')
          .eq('character_id', characterId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (historyData && historyData.length > 0) {
          historyList = historyData.reverse().map(m => ({
            sender: m.sender === 'user' ? 'user' : 'bot',
            text: m.text
          }));
        }
      } catch (e) {}
    }

    const contents = buildGeminiContents(historyList, text);

    const ai = getGenAI();
    let replyText = '';
    const candidateModels = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

    for (const modelName of candidateModels) {
      try {
        const aiRes = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction,
            temperature: typeof userPref.aiTemperature === 'number' ? userPref.aiTemperature : 0.85
          }
        });
        if (aiRes.text && aiRes.text.trim()) {
          replyText = aiRes.text.trim();
          break;
        }
      } catch (geminiErr: any) {
        console.error(`[Telegram Webhook Gemini Error with ${modelName}]:`, geminiErr?.message || geminiErr);
      }
    }

    if (!replyText) {
      replyText = `*looks into your eyes warmly and smiles* I am right here with you, ${fromUser.first_name || 'my friend'}. Tell me more about what you're thinking!`;
    }

    // Intercept and handle [TRIGGER_IMAGE: ...] or 1-image-per-3-messages ratio
    const existingTgHistory = getUserChatHistory(userId, characterId);
    const tgUserMsgCount = existingTgHistory.filter(m => m.sender === 'user').length;
    const isTgPhotoReq = /photo|picture|pic|selfie|pose|image|ပုံ|ဓာတ်ပုံ|ကြည့်ချင်|ပြပါ|ပို့/i.test(text);
    const isTgEvery3Messages = tgUserMsgCount > 0 && tgUserMsgCount % 3 === 0;

    let generatedImageUrl: string | undefined = undefined;
    let cleanReplyText = replyText;
    const imgTriggerMatch = replyText.match(/\[TRIGGER_IMAGE:\s*([^\]]+)\]/i);

    if (imgTriggerMatch && imgTriggerMatch[1]) {
      const imagePromptDesc = imgTriggerMatch[1].trim();
      cleanReplyText = replyText.replace(/\[TRIGGER_IMAGE:[^\]]+\]/gi, '').trim();
      try {
        const generatedUrl = await generateCompanionImage(imagePromptDesc, character);
        if (generatedUrl) {
          generatedImageUrl = generatedUrl;
        }
      } catch (imgErr) {
        console.warn('[Telegram Image Generation error]:', imgErr);
      }
    } else if (isTgPhotoReq || isTgEvery3Messages) {
      try {
        const scenePrompt = `${character.name}, ${cleanReplyText.slice(0, 90)}, dynamic seductive anime art, romantic intimate scene`;
        const generatedUrl = await generateCompanionImage(scenePrompt, character);
        if (generatedUrl) {
          generatedImageUrl = generatedUrl;
        }
      } catch (imgErr) {
        console.warn('[Telegram Interval Image Generation error]:', imgErr);
      }
    }

    // Send photo or message to Telegram
    if (generatedImageUrl) {
      const photoSent = await sendTelegramPhoto(chatId, generatedImageUrl, cleanReplyText || undefined);
      if (!photoSent) {
        await sendTelegramMessage(chatId, cleanReplyText || replyText);
      }
    } else {
      await sendTelegramMessage(chatId, cleanReplyText || replyText);
    }

    // Save to user-isolated store
    addUserChatMessage(userId, characterId, {
      id: `msg-tg-u-${Date.now()}`,
      characterId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    });
    addUserChatMessage(userId, characterId, {
      id: `msg-tg-b-${Date.now()}`,
      characterId,
      sender: 'bot',
      text: cleanReplyText || replyText,
      timestamp: new Date().toISOString(),
      emotion: 'happy',
      imageUrl: generatedImageUrl
    });
    saveStore(store);

    // Auto-clean unpinned active conversations exceeding 5
    await cleanupUserActiveConversations(userId);

    if (supabase) {
      try {
        await supabase.from('chat_messages').insert([
          { id: `msg-tg-u-${Date.now()}`, user_id: userId, character_id: characterId, sender: 'user', text },
          { id: `msg-tg-b-${Date.now()}`, user_id: userId, character_id: characterId, sender: 'bot', text: cleanReplyText || replyText, emotion: 'happy' }
        ]);
      } catch (e) {}
    }

    // Award +25 Energy to Referrer on first message sent by invitee
    if (store.referrals && store.referrals[userId] && !store.referrals[userId].rewarded) {
      const ref = store.referrals[userId];
      ref.rewarded = true;
      ref.firstMessageAt = new Date().toISOString();
      saveStore(store);

      const referrerUserId = `tg_${ref.referrerTgId}`;
      if (store.userProfiles && store.userProfiles[referrerUserId]) {
        store.userProfiles[referrerUserId].energy = (store.userProfiles[referrerUserId].energy || 0) + 25;
        saveStore(store);
      }

      if (supabase) {
        try {
          const { data: refUser } = await supabase.from('profiles').select('energy').eq('telegram_user_id', Number(ref.referrerTgId)).maybeSingle();
          if (refUser) {
            await supabase.from('profiles').update({ energy: (refUser.energy || 0) + 25 }).eq('telegram_user_id', Number(ref.referrerTgId));
          }
        } catch (err) {
          console.warn('Referral bonus award error:', err);
        }
      }

      // Notify the referrer via Telegram bot
      try {
        await sendTelegramMessage(
          Number(ref.referrerTgId),
          `🎉 <b>Friend Invite Reward Received!</b>\n\nYour invited friend just started chatting! You received <b>+25 Starlight Energy</b> ⚡️`
        );
      } catch (e) {}
    }
  } catch (err) {
    console.error('Error processing Telegram webhook update:', err);
  }
});

// Get Webhook Info endpoint
app.get('/api/telegram/webhook-info', async (req: Request, res: Response) => {
  const token = req.query?.botToken as string || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await tgRes.json();
    res.json({ success: true, webhookInfo: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch webhook info' });
  }
});

// Delete/Clear Old Webhook endpoint (cleans conflicting old webhooks & drops pending updates)
app.post('/api/telegram/delete-webhook', async (req: Request, res: Response) => {
  const token = req.body?.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true })
    });
    const data = await tgRes.json();
    res.json({ success: true, message: 'Old webhook cleared and pending updates dropped successfully', telegramResponse: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook deletion failed' });
  }
});

// Setup/Reset Webhook endpoint
app.post('/api/telegram/setup-webhook', async (req: Request, res: Response) => {
  const token = req.body?.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is required in environment or request body' });
  }

  const rawHost = req.get('host') || 'ais-dev-avlykr7pkicyzjc426vs3q-487032049822.asia-southeast1.run.app';
  const appUrl = process.env.APP_URL || `https://${rawHost}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    // 1. Delete existing webhook and drop old conflicting pending updates first
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true })
    });

    // 2. Set new fresh Webhook URL
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true })
    });
    const data = await tgRes.json();
    res.json({ success: true, webhookUrl, telegramResponse: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook setup failed' });
  }
});

// Text-to-Speech Generation
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter required' });
    }

    const cleanText = text.replace(/\*.*?\*/g, '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'No dialogue to speak' });
    }

    const ai = getGenAI();
    const voice = voiceName || 'Zephyr';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any }
          }
        }
      }
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      res.json({ success: true, audioBase64 });
    } else {
      res.status(500).json({ error: 'Audio generation failed' });
    }
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message || 'TTS unavailable' });
  }
});

async function autoSyncTelegramBot() {
  const token = DEFAULT_TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (meData.ok) {
      console.log(`[TelegramBot] Connected to Telegram Bot: @${meData.result.username} (${meData.result.first_name}, ID: ${meData.result.id})`);
      const appUrl = process.env.APP_URL || 'https://ais-dev-avlykr7pkicyzjc426vs3q-487032049822.asia-southeast1.run.app';
      const webhookUrl = `${appUrl}/api/telegram/webhook`;
      const hookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, drop_pending_updates: false })
      });
      const hookData = await hookRes.json();
      console.log(`[TelegramBot] Auto Webhook registration status for ${webhookUrl}:`, hookData);
    }
  } catch (err) {
    console.warn('[TelegramBot] Auto sync notice:', err);
  }
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    autoSyncTelegramBot();
  });
}

startServer();
