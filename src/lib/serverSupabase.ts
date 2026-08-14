import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hcbajvladlvhklelbxdr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let serviceSupabaseClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (serviceSupabaseClient) return serviceSupabaseClient;

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      serviceSupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false
        }
      });
      return serviceSupabaseClient;
    } catch (err) {
      console.warn('[ServerSupabase] Could not initialize Supabase service client:', err);
    }
  }
  return null;
}
