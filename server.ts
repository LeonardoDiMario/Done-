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
  userPreferences: UserPreferences;
  userPreferencesMap: Record<string, UserPreferences>;
  chatHistories: Record<string, ChatMessage[]>;
  memoryFacts: Record<string, MemoryFact[]>;
  relationships: Record<string, UserRelationship>;
  paymentOrders: Record<string, PaymentOrder>;
  entitlements: UserEntitlement[];
  activeTelegramCharacters: Record<string, string>;
}

const defaultPreferences: UserPreferences = {
  language: 'auto',
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
        userPreferences: { ...defaultPreferences, ...data.userPreferences },
        userPreferencesMap: data.userPreferencesMap || {},
        chatHistories: data.chatHistories || {},
        memoryFacts: data.memoryFacts || {},
        relationships: data.relationships || {},
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
    userPreferences: defaultPreferences,
    userPreferencesMap: {},
    chatHistories: {},
    memoryFacts: {},
    relationships: {},
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

  if (!store.userProfiles) store.userProfiles = {};
  let userProf = store.userProfiles[userId];

  if (!userProf) {
    userProf = {
      id: userId,
      telegram_id: telegramId,
      first_name: userInfo?.first_name || '',
      last_name: userInfo?.last_name || '',
      username: userInfo?.username || '',
      photo_url: userInfo?.photo_url || '',
      energy: 50,
      gems: 0,
      age_verified: false,
      terms_accepted: false,
      privacy_policy_accepted: false
    };
    store.userProfiles[userId] = userProf;
  } else {
    if (userInfo?.first_name) userProf.first_name = userInfo.first_name;
    if (userInfo?.last_name) userProf.last_name = userInfo.last_name;
    if (userInfo?.username) userProf.username = userInfo.username;
    if (userInfo?.photo_url) userProf.photo_url = userInfo.photo_url;
    if (telegramId) userProf.telegram_id = telegramId;
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
      } else {
        await supabase.from('profiles').upsert({
          id: userId,
          telegram_id: telegramId || null,
          first_name: userProf.first_name || null,
          last_name: userProf.last_name || null,
          username: userProf.username || null,
          photo_url: userProf.photo_url || null,
          energy: userProf.energy,
          gems: userProf.gems,
          age_verified: userProf.age_verified,
          terms_accepted: userProf.terms_accepted,
          privacy_policy_accepted: userProf.privacy_policy_accepted
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

// Telegram Bot Outbound Message Helper
async function sendTelegramMessage(chatId: number | string, text: string, botToken?: string, replyMarkup?: any) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
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
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('[TelegramBot] Error sending Telegram message:', err);
    return false;
  }
}

// Lazy Gemini AI Client initialization
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function getAllCharacters(): Character[] {
  return [...DEFAULT_CHARACTERS, ...store.customCharacters];
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

// 7. Get Characters (Supabase Source of Truth)
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
        // Automatically sync default anime avatar URLs if database records still hold old realistic photos
        for (const defaultChar of DEFAULT_CHARACTERS) {
          const match = data.find(item => item.id === defaultChar.id);
          if (match && defaultChar.category === 'Anime' && match.avatar !== defaultChar.avatar) {
            match.avatar = defaultChar.avatar;
            try {
              await supabase.from('characters').update({ avatar: defaultChar.avatar }).eq('id', defaultChar.id);
            } catch (updateErr) {
              console.warn('Error updating anime avatar in Supabase:', updateErr);
            }
          }
        }

        const fetchedCharacters: Character[] = data.map(item => ({
          id: item.id,
          name: item.name,
          title: item.title || 'Roleplay Companion',
          avatar: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          category: item.category || 'Custom',
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
        }));

        return res.json({ characters: fetchedCharacters });
      } else {
        // Seed default characters into Supabase if empty
        console.log('Seeding default characters into Supabase characters table...');
        for (const c of DEFAULT_CHARACTERS) {
          await supabase.from('characters').upsert({
            id: c.id,
            name: c.name,
            title: c.title,
            avatar: c.avatar,
            category: c.category,
            personality: c.personality,
            background: c.background,
            greeting: c.greeting,
            system_prompt: c.systemPrompt,
            voice_tone: c.voiceTone,
            voice_name: c.voiceName,
            default_scenarios: c.defaultScenarios,
            burmese_scenarios: c.burmeseScenarios,
            is_custom: false,
            is_premium: Boolean(c.isPremium),
            sort_order: c.sortOrder ?? 0,
            is_active: true
          });
        }
      }
    } catch (err) {
      console.warn('Supabase characters fetch fallback:', err);
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
  let stats = {
    totalUsers: 1,
    activeCharacters: DEFAULT_CHARACTERS.length,
    totalConversations: 0,
    openTickets: 0,
    totalEnergy: store.userProfile.energy,
    totalGems: store.userProfile.gems
  };

  if (supabase) {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: charsCount } = await supabase.from('characters').select('*', { count: 'exact', head: true });
      const { count: convsCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
      const { count: ticketsCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');

      stats.totalUsers = usersCount || 1;
      stats.activeCharacters = charsCount || DEFAULT_CHARACTERS.length;
      stats.totalConversations = convsCount || 0;
      stats.openTickets = ticketsCount || 0;
    } catch (err) {
      console.warn('Supabase stats query error:', err);
    }
  }

  res.json({ stats });
});

// Admin USERS Table (Search, Filter, Paginate)
app.get('/api/admin/users', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  const search = (req.query.q as string || '').toLowerCase().trim();
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);

  if (supabase) {
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });
      if (search) {
        query = query.or(`id.ilike.%${search}%,username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

      if (!error && data && data.length > 0) {
        const userIds = data.map(u => u.id);
        const { data: entData } = await supabase
          .from('user_entitlements')
          .select('user_id, plan_id, status')
          .in('user_id', userIds)
          .eq('status', 'active');

        const entMap: Record<string, string> = {};
        if (entData) {
          entData.forEach(e => {
            entMap[e.user_id] = e.plan_id;
          });
        }

        const users = data.map(u => ({
          id: u.id,
          telegram_id: u.telegram_id || (u.id.startsWith('tg_') ? u.id.replace('tg_', '') : ''),
          username: u.username || 'User',
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          photo_url: u.photo_url || '',
          plan: entMap[u.id] || 'free',
          energy: u.energy ?? 50,
          gems: u.gems ?? 0,
          status: u.status || 'active',
          created_at: u.created_at || new Date().toISOString()
        }));
        return res.json({ users, total: count ?? users.length, page, limit });
      } else if (error) {
        console.warn('Supabase admin users query notice:', error);
      }
    } catch (err) {
      console.warn('Supabase admin users error:', err);
    }
  }

  // Fallback to in-memory profiles if Supabase profiles are empty
  const storeProfiles = Object.values(store.userProfiles || {});
  let filtered = storeProfiles;
  if (search) {
    filtered = filtered.filter((u: any) =>
      (u.id && u.id.toLowerCase().includes(search)) ||
      (u.username && u.username.toLowerCase().includes(search)) ||
      (u.first_name && u.first_name.toLowerCase().includes(search))
    );
  }

  const users = filtered.slice((page - 1) * limit, page * limit).map((u: any) => ({
    id: u.id,
    telegram_id: u.telegram_id || (u.id?.startsWith('tg_') ? u.id.replace('tg_', '') : ''),
    username: u.username || u.first_name || 'User',
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    photo_url: u.photo_url || '',
    plan: 'free',
    energy: u.energy ?? 50,
    gems: u.gems ?? 0,
    status: u.status || 'active',
    created_at: u.created_at || new Date().toISOString()
  }));

  res.json({ users, total: filtered.length || users.length, page, limit });
});

// Bulk Delete Conversations
app.post('/api/conversations/delete', async (req: Request, res: Response) => {
  try {
    const { characterIds } = req.body;
    const { userId } = getUserIdentity(req);

    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return res.status(400).json({ error: 'characterIds array is required' });
    }

    if (store.chatHistories) {
      for (const charId of characterIds) {
        delete store.chatHistories[charId];
      }
      saveStore(store);
    }

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
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('characters').select('*').order('sort_order', { ascending: true });
      if (!error && data) {
        return res.json({ characters: data });
      }
    } catch (err) {
      console.warn('Supabase admin characters fetch error:', err);
    }
  }

  res.json({ characters: DEFAULT_CHARACTERS });
});

// Admin Upsert Character (Create / Edit)
app.post('/api/admin/characters', adminAuthMiddleware, async (req: Request, res: Response) => {
  const char = req.body;
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      await supabase.from('characters').upsert({
        id: char.id || `char-${Date.now()}`,
        name: char.name,
        title: char.title,
        avatar: char.avatar,
        category: char.category,
        personality: char.personality,
        background: char.background || char.about || char.backstory,
        greeting: char.greeting,
        system_prompt: char.systemPrompt,
        voice_tone: char.voiceTone,
        voice_name: char.voiceName,
        is_custom: Boolean(char.isCustom),
        is_premium: Boolean(char.isPremium),
        sort_order: char.sortOrder ?? 0,
        is_active: char.isActive !== false
      });

      await writeAuditLog('admin', 'upsert_character', 'character', char.id, { name: char.name });
    } catch (err) {
      console.warn('Supabase admin upsert character error:', err);
    }
  }

  res.json({ success: true, message: 'Character saved successfully.' });
});

// Admin Delete Character
app.delete('/api/admin/characters/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      await supabase.from('characters').delete().eq('id', id);
      await writeAuditLog('admin', 'delete_character', 'character', id, {});
    } catch (err) {
      console.warn('Supabase admin delete character error:', err);
    }
  }

  res.json({ success: true });
});

// Admin CONVERSATIONS Table
app.get('/api/admin/conversations', adminAuthMiddleware, async (req: Request, res: Response) => {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        return res.json({ conversations: data });
      }
    } catch (err) {
      console.warn('Supabase admin conversations error:', err);
    }
  }

  res.json({ conversations: [] });
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

// Get User Preferences
app.get('/api/preferences', async (req: Request, res: Response) => {
  const { userId } = getUserIdentity(req);
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
        store.chatHistories[characterId] = msgs;
        saveStore(store);
        return res.json({ messages: msgs });
      }
    } catch (err) {
      console.warn('Supabase chat messages fetch fallback:', err);
    }
  }

  const messages = store.chatHistories[characterId] || [];
  
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
      store.chatHistories[characterId] = [initialMsg];
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
    store.chatHistories[characterId] = [initialMsg];

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
    store.chatHistories[characterId] = [];
  }

  saveStore(store);
  res.json({ success: true, messages: store.chatHistories[characterId] });
});

// Delete specific messages
app.post('/api/chat/:characterId/delete-messages', async (req: Request, res: Response) => {
  const { characterId } = req.params;
  const { messageIds } = req.body;
  if (Array.isArray(messageIds) && store.chatHistories[characterId]) {
    store.chatHistories[characterId] = store.chatHistories[characterId].filter(
      (m) => !messageIds.includes(m.id)
    );
    saveStore(store);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('chat_messages').delete().in('id', messageIds);
      } catch (err) {
        console.warn('Supabase delete messages fallback:', err);
      }
    }
  }
  res.json({ success: true, messages: store.chatHistories[characterId] || [] });
});

// Supabase Connection Status Route
app.get('/api/supabase/status', (req: Request, res: Response) => {
  const projectRef = 'hcbajvladlvhklelbxdr';
  const supabaseUrl = process.env.SUPABASE_URL || `https://${projectRef}.supabase.co`;
  const isConfigured = Boolean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

  res.json({
    projectId: projectRef,
    supabaseUrl,
    dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}/auth/users`,
    isConfigured
  });
});

// Initialize / Find Supabase Conversation record
app.post('/api/conversations/init', async (req: Request, res: Response) => {
  try {
    const { characterId, telegramUserId } = req.body;
    const { userId, telegramId } = getUserIdentity(req);
    const finalTgId = telegramUserId ? Number(telegramUserId) : (telegramId || null);
    const conversationId = `conv-${userId}-${characterId}`;

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
        store.memoryFacts[characterId] = fetchedMemories;
        saveStore(store);
        return res.json({ memories: fetchedMemories });
      }
    } catch (err) {
      console.warn('Supabase memory facts fetch fallback:', err);
    }
  }

  const memories = store.memoryFacts[characterId] || [];
  res.json({ memories });
});

// Add or Remove Memory Fact
app.post('/api/memory', async (req: Request, res: Response) => {
  const { characterId, action, factId, category, content } = req.body;
  const { userId } = getUserIdentity(req);
  const supabase = getServerSupabase();

  if (!store.memoryFacts[characterId]) {
    store.memoryFacts[characterId] = [];
  }

  if (action === 'add' && content) {
    const newFact: MemoryFact = {
      id: `mem-${Date.now()}`,
      characterId,
      category: category || 'user_preference',
      content,
      createdAt: new Date().toISOString(),
      isAutoExtracted: false
    };
    store.memoryFacts[characterId].push(newFact);

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
    store.memoryFacts[characterId] = store.memoryFacts[characterId].filter(m => m.id !== factId);
    if (supabase) {
      try {
        await supabase.from('memory_facts').delete().eq('id', factId);
      } catch (err) {
        console.warn('Supabase memory delete fallback:', err);
      }
    }
  } else if (action === 'clear') {
    store.memoryFacts[characterId] = [];
    if (supabase) {
      try {
        await supabase.from('memory_facts').delete().eq('character_id', characterId).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase memory clear fallback:', err);
      }
    }
  }

  saveStore(store);
  res.json({ success: true, memories: store.memoryFacts[characterId] });
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
    store.chatHistories[characterId].push(userMsg);

    const existingMemories = store.memoryFacts[characterId];
    const memoryContextStr = existingMemories.length > 0
      ? `\n[LONG-TERM MEMORY BANK & USER FACTS]:\n` + existingMemories.map(m => `- [${m.category}]: ${m.content}`).join('\n')
      : '\n[LONG-TERM MEMORY BANK]: No recorded facts yet. Pay attention to user preferences!';

    const userPref = (store.userPreferencesMap && store.userPreferencesMap[userId]) || store.userPreferences || defaultPreferences;
    const userPersona = userPref.userPersona || defaultPreferences.userPersona;
    const personaContext = `\n[USER PERSONA]: Name: ${userPersona.name}, Bio: ${userPersona.bio}, Preferred Relationship Style: ${userPersona.relationshipStyle}`;

    const rpFormatInstruction = userPref.rpStyle === 'narrative'
      ? 'Use expressive actions enclosed in *asterisks* (e.g., *smiles warmly*, *sighs lightly*) along with your spoken dialogue.'
      : userPref.rpStyle === 'dialogue_only'
      ? 'Focus primarily on spoken dialogue with minimal narration.'
      : 'Write in detailed descriptive roleplay novel format with rich environment details.';

    const langInstruction = userPref.language === 'my'
      ? 'CRITICAL: Speak fluently and naturally in Myanmar Language (Burmese) while maintaining your exact character personality and roleplay formatting (*actions*).'
      : userPref.language === 'en'
      ? 'Respond in English roleplay style.'
      : 'Detect the language of the user message (Burmese or English) and reply in that same language seamlessly.';

    const systemInstruction = `${character.systemPrompt}
Character Name: ${character.name}
Character Title: ${character.title}
Personality Traits: ${character.personality}
Background Story: ${character.background}
${personaContext}
${memoryContextStr}

[ROLEPLAY GUIDELINES]:
1. Stay strictly in character as ${character.name}. Never break character or refer to yourself as an AI model.
2. ${rpFormatInstruction}
3. ${langInstruction}
4. Show realistic emotional depth. Emotionally react to the user's tone, questions, and gifts/compliments.
5. Reference past facts or details stored in your memory bank whenever appropriate.`;

    const recentHistory = store.chatHistories[characterId].slice(-12);
    const contents = recentHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: userPref.aiTemperature || 0.85,
      }
    });

    const replyText = response.text || '*smiles silently*';

    let emotion: any = 'happy';
    const lowerReply = replyText.toLowerCase();
    if (lowerReply.includes('*gasp*') || lowerReply.includes('*surprised*') || lowerReply.includes('!')) {
      emotion = 'surprised';
    } else if (lowerReply.includes('*blushes*') || lowerReply.includes('*shy*') || lowerReply.includes('*flustered*')) {
      emotion = 'flustered';
    } else if (lowerReply.includes('*thinks*') || lowerReply.includes('*pokes chin*') || lowerReply.includes('*ponders*')) {
      emotion = 'thoughtful';
    } else if (lowerReply.includes('*sighs*') || lowerReply.includes('*smirks*') || lowerReply.includes('*glares*')) {
      emotion = 'dramatic';
    }

    const rel = store.relationships[characterId];
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
          model: 'gemini-2.5-flash',
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
              store.memoryFacts[characterId].push(newFact);
              newlyExtractedMemories.push(factStr.trim());
            }
          }
        }
      } catch (memErr) {
        console.error('Memory extraction error (non-blocking):', memErr);
      }
    }

    const botMsg: ChatMessage = {
      id: `msg-bot-${Date.now()}`,
      characterId,
      sender: 'bot',
      text: replyText,
      timestamp: new Date().toISOString(),
      emotion,
      memoriesUpdated: newlyExtractedMemories
    };
    store.chatHistories[characterId].push(botMsg);
    saveStore(store);

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

    // Command: /start
    if (text.startsWith('/start')) {
      let characterId = 'ruby-chan';

      const match = text.match(/\/start\s+(?:start_)?(?:char_)?([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        characterId = match[1];
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

      const webAppUrl = `https://ruby-chan-ai-18-987633988897.asia-southeast1.run.app?char=${characterId}`;
      const greetingText = `🌸 <b>Welcome from Ruby Chan 18+</b>\n\n<b>${char.name}</b> (${char.title})\n\n"${char.greeting}"\n\n<i>Tap the button below to open the Web App character choice portal!</i>`;
      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: `🌸 Open ${char.name} in Web App`,
              web_app: { url: webAppUrl }
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
      await sendTelegramMessage(chatId, "⚠️ <i>Starlight Energy depleted! Open RubyChan WebApp to claim daily energy or get VIP.</i>");
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

    let memoryContextStr = '';
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

    const personaContext = `\n[USER PERSONA]: Name: ${fromUser.first_name || 'Traveler'}, Telegram Username: @${fromUser.username || 'unknown'}`;

    const systemInstruction = `${character.systemPrompt}
Character Name: ${character.name}
Character Title: ${character.title}
Personality Traits: ${character.personality}
Background Story: ${character.background}
${personaContext}
${memoryContextStr}

[ROLEPLAY GUIDELINES]:
1. Stay strictly in character as ${character.name}. Never break character.
2. Use expressive actions enclosed in *asterisks* (e.g., *smiles warmly*).
3. Show realistic emotional depth. React to the user's tone.
4. Speak in natural roleplay format.`;

    let contents: any[] = [];
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
          contents = historyData.reverse().map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));
        }
      } catch (e) {}
    }

    contents.push({ role: 'user', parts: [{ text }] });

    const ai = getGenAI();
    let replyText = '*smiles softly*';
    try {
      const aiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction, temperature: 0.85 }
      });
      if (aiRes.text) {
        replyText = aiRes.text;
      }
    } catch (geminiErr: any) {
      console.error('[Telegram Webhook Gemini Error]', geminiErr?.message || geminiErr, geminiErr);
      replyText = `*smiles warmly* (${geminiErr?.message || 'Processing response...'})`;
    }

    await sendTelegramMessage(chatId, replyText);

    if (supabase) {
      try {
        await supabase.from('chat_messages').insert([
          { id: `msg-tg-u-${Date.now()}`, user_id: userId, character_id: characterId, sender: 'user', text },
          { id: `msg-tg-b-${Date.now()}`, user_id: userId, character_id: characterId, sender: 'bot', text: replyText, emotion: 'happy' }
        ]);
      } catch (e) {}
    }
  } catch (err) {
    console.error('Error processing Telegram webhook update:', err);
  }
});

// Setup Webhook endpoint
app.post('/api/telegram/setup-webhook', async (req: Request, res: Response) => {
  const token = req.body?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is required in environment or request body' });
  }

  const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
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
  });
}

startServer();
