import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceSupabaseClient: SupabaseClient | null = null;
let lastUsedUrl: string | undefined;
let lastUsedKey: string | undefined;

/**
 * Server-only RubyChan database client.
 * The standalone app uses the dedicated `rubychan` schema inside the
 * RubyChan Supabase project so its runtime data model stays isolated from
 * older public tables while remaining in the same database.
 */
export function getServerSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
