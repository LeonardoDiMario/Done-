import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl: string | undefined = undefined;
let lastUsedKey: string | undefined = undefined;

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = (typeof process !== 'undefined' ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : undefined)
    || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined);

  const supabaseKey = (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) : undefined)
    || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined);

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (supabaseInstance && lastUsedUrl === supabaseUrl && lastUsedKey === supabaseKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    lastUsedUrl = supabaseUrl;
    lastUsedKey = supabaseKey;
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}
