export const handleSupabaseWebhook = async (payload: unknown) => {
  return { received: true, payload } as const;
};
