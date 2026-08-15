import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceSupabaseClient: SupabaseClient | null = null;
let lastUsedUrl: string | undefined = undefined;
let lastUsedKey: string | undefined = undefined;

export function getServerSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  // If credentials haven't changed and client exists, reuse
  if (serviceSupabaseClient && lastUsedUrl === supabaseUrl && lastUsedKey === supabaseKey) {
    return serviceSupabaseClient;
  }

  try {
    serviceSupabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    lastUsedUrl = supabaseUrl;
    lastUsedKey = supabaseKey;
    console.log(`[ServerSupabase] Initialized Supabase client for project: ${supabaseUrl}`);
    return serviceSupabaseClient;
  } catch (err) {
    console.warn('[ServerSupabase] Could not initialize Supabase client:', err);
    return null;
  }
}
