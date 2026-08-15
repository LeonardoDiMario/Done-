import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceSupabaseClient: SupabaseClient | null = null;
let lastUsedUrl: string | undefined;
let lastUsedKey: string | undefined;

// Standalone RubyChan Supabase project.
// Environment variables take priority; the publishable key is safe for the
// serverless runtime because database permissions/RLS remain the authority.
const RUBYCHAN_SUPABASE_URL = 'https://hcbajvladlvhklelbxdr.supabase.co';
const RUBYCHAN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eKKXyB0rc7QUwTbbydi8Xw_t0n27eIj';

/**
 * Server-only RubyChan database client.
 * The app always targets the dedicated RubyChan schema and never Google AI
 * Studio storage. Vercel environment variables can override the defaults.
 */
export function getServerSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || RUBYCHAN_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || RUBYCHAN_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  if (serviceSupabaseClient && lastUsedUrl === supabaseUrl && lastUsedKey === serviceRoleKey) {
    return serviceSupabaseClient;
  }

  try {
    serviceSupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: 'rubychan' },
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
    console.log(`[ServerSupabase] Connected to RubyChan Supabase runtime schema: ${supabaseUrl}`);
    return serviceSupabaseClient;
  } catch (err) {
    console.warn('[ServerSupabase] Could not initialize Supabase client:', err);
    return null;
  }
}
