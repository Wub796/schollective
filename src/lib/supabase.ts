import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase Client Initialization
 * Used for handling client-side authentication and real-time messaging.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
