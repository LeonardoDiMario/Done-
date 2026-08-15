import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RUBYCHAN_SUPABASE_URL = 'https://rmmanieytszkfzdyrjvt.supabase.co';
const RUBYCHAN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rIAI7GT3HSlKA-9AId9HuQ_hI0-KVMa';

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl: string | undefined;
let lastUsedKey: string | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl =
    (typeof process !== 'undefined' ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : undefined) ||
    (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) ||
    RUBYCHAN_SUPABASE_URL;

  const supabaseKey =
    (typeof process !== 'undefined' ? (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) : undefined) ||
    (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
    RUBYCHAN_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  if (supabaseInstance && lastUsedUrl === supabaseUrl && lastUsedKey === supabaseKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    lastUsedUrl = supabaseUrl;
    lastUsedKey = supabaseKey;
    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize RubyChan client:', err);
    return null;
  }
}
