import { handleSupabaseWebhook } from '@/supabase/handlers/webhooks';

export const processWebhook = async (payload: unknown) => handleSupabaseWebhook(payload);
