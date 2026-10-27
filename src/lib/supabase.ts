import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase (projet hébergé dans l'UE).
 * Seules l'URL du projet et la clé publique « anon » sont dans l'app :
 * elles sont publiques par conception, la sécurité repose sur les règles RLS
 * de supabase/migrations. Aucune clé secrète n'est jamais embarquée.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;

export const isBackendConfigured = supabase !== null;
