import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

export function createClient() {
  // Use the same Supabase project for both domains
  // This ensures data consistency across bouncer-app.dev and bouncer-silk.vercel.app
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
