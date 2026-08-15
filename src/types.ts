export type CharacterCategory = 'Sci-Fi' | 'Fantasy' | 'Noir' | 'Anime' | 'Genius' | 'Realistic' | 'Romance' | 'Custom';

export type CharacterEmotion = 'happy' | 'thoughtful' | 'surprised' | 'dramatic' | 'neutral' | 'flustered' | 'mysterious';

export interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  category: CharacterCategory;
  personality: string;
  background: string; // Used as 'about' / 'backstory'
  about?: string;
  backstory?: string;
  greeting: string;
  systemPrompt: string;
  voiceTone: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  defaultScenarios: string[];
  burmeseScenarios?: string[];
  isCustom?: boolean;
  isPremium?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ChatMessage {
  id: string;
  characterId: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  emotion?: CharacterEmotion;
  actionNarration?: string;
  audioUrl?: string;
  imageUrl?: string;
  memoriesUpdated?: string[];
}

export interface MemoryFact {
  id: string;
  characterId: string;
  category: 'user_preference' | 'story_milestone' | 'secret_revealed' | 'character_impression';
  content: string;
  createdAt: string;
  isAutoExtracted?: boolean;
}

export interface UserPersona {
  name: string;
  pronouns: string;
  bio: string;
  relationshipStyle: string;
}

import { SupportedLanguage } from './utils/i18n';

export interface UserPreferences {
  language: SupportedLanguage;
  botLanguage?: SupportedLanguage;
  theme: 'telegram-dark' | 'telegram-light' | 'cyberpunk' | 'velvet';
  userPersona: UserPersona;
  rpStyle: 'narrative' | 'dialogue_only' | 'descriptive';
  responseLength: 'short' | 'balanced' | 'story';
  aiTemperature: number;
  speechEnabled: boolean;
  autoExtractMemories: boolean;
  customDirectives?: string;
  pinnedCharacterIds?: string[];
}

export interface UserRelationship {
  characterId: string;
  level: number; // 1 - 10
  affectionPoints: number; // 0 - 100 per level
  statusTitle: string;
  unlockedLore: string[];
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface AdminUserRecord {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  plan: string;
  energy: number;
  gems: number;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  updated_at?: string;
}

export interface AdminSupportTicket {
  id: string;
  user_id: string;
  username?: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  created_at: string;
}
