-- Ruby Chan 18+ Database Schema for Supabase
-- Run this in the Supabase SQL Editor if setting up tables from scratch

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  energy INTEGER DEFAULT 50,
  gems INTEGER DEFAULT 0,
  age_verified BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  privacy_policy_accepted BOOLEAN DEFAULT FALSE,
  consent_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'auto',
  theme TEXT DEFAULT 'telegram-dark',
  persona_name TEXT DEFAULT 'Traveler',
  persona_pronouns TEXT DEFAULT 'They/Them',
  persona_bio TEXT DEFAULT 'An adventurous explorer journeying through the multiverse.',
  persona_rel_style TEXT DEFAULT 'Friendly & Supportive',
  rp_style TEXT DEFAULT 'narrative',
  response_length TEXT DEFAULT 'balanced',
  ai_temperature NUMERIC DEFAULT 0.85,
  speech_enabled BOOLEAN DEFAULT TRUE,
  auto_extract_memories BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Characters Table
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  avatar TEXT,
  category TEXT DEFAULT 'Custom',
  personality TEXT,
  background TEXT,
  greeting TEXT NOT NULL,
  system_prompt TEXT,
  voice_tone TEXT,
  voice_name TEXT,
  default_scenarios JSONB,
  burmese_scenarios JSONB,
  is_custom BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Premium Entitlements Table
CREATE TABLE IF NOT EXISTS user_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- '1month' | '3months' | '1year'
  order_id TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payment Orders Table
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  amount_mmk INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- 'kbzpay' | 'wavepay' | 'telegram_stars'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired'
  transaction_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Balance Transactions Log Table
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'energy' | 'gems'
  amount INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'daily_reward' | 'chat_cost' | 'gem_purchase' | 'vip_grant' | 'admin_adjustment'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' | 'bot' | 'system'
  text TEXT NOT NULL,
  emotion TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Memories Table
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'user_preference',
  content TEXT NOT NULL,
  is_auto_extracted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. User Relationships Table
CREATE TABLE IF NOT EXISTS user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  affection_points INTEGER DEFAULT 10,
  status_title TEXT DEFAULT 'Acquaintance',
  unlocked_lore JSONB DEFAULT '["Initial meeting"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

-- 10. Consent Audit Table
CREATE TABLE IF NOT EXISTS user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  telegram_id BIGINT,
  age_verified BOOLEAN DEFAULT TRUE,
  terms_accepted BOOLEAN DEFAULT TRUE,
  privacy_policy_accepted BOOLEAN DEFAULT TRUE,
  consent_version TEXT DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'Account',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved' | 'closed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  telegram_user_id BIGINT,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT DEFAULT 'admin',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user' | 'character' | 'energy' | 'gems' | 'premium' | 'support'
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for Speed & High Performance Queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_char ON chat_messages(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_char ON memories(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_status ON user_entitlements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user_char ON user_relationships(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
