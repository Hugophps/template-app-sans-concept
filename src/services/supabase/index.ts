import { createServerSupabaseClient } from '@/supabase/server';
import { SupabaseQueryError } from '@/supabase/errors';
import { reportSupabaseError } from '@/supabase/monitoring';
import type { Database } from '@/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    reportSupabaseError(error, 'fetchProfile');
    throw new SupabaseQueryError('Failed to fetch profile', error);
  }

  return data;
};
