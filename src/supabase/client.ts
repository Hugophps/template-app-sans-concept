import { createBrowserClient } from '@supabase/ssr';
import { supabaseAnonKey, supabaseUrl } from './config';
import type { Database } from './types';

export const createBrowserSupabaseClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
