import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceSupabaseClient: SupabaseClient | null = null;
let lastUsedUrl: string | undefined;
let lastUsedKey: string | undefined;

// Standalone RubyChan Supabase project.
// Environment variables take priority; the public key is only a fallback.
const RUBYCHAN_SUPABASE_URL = 'https://rmmanieytszkfzdyrjvt.supabase.co';
const RUBYCHAN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eKKXyB0rc7QUwTbbydi8Xw_t0n27eIj';

export function getServerSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || RUBYCHAN_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || RUBYCHAN_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  if (serviceSupabaseClient && lastUsedUrl === supabaseUrl && lastUsedKey === serviceRoleKey) {
    return serviceSupabaseClient;
  }

  try {
    serviceSupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: 'public' },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: { 'x-rubychan-runtime': 'standalone' }
      }
    });
    lastUsedUrl = supabaseUrl;
    lastUsedKey = serviceRoleKey;
    console.log(`[ServerSupabase] Connected to RubyChan Supabase project: ${supabaseUrl}`);
    return serviceSupabaseClient;
  } catch (err) {
    console.warn('[ServerSupabase] Could not initialize Supabase client:', err);
    return null;
  }
}
