export const reportSupabaseError = (error: unknown, context: string) => {
  if (process.env.NODE_ENV === 'production') return;
  console.error(`[supabase] ${context}`, error);
};
