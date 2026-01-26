export const handleSupabaseEvent = async (event: unknown) => {
  return { received: true, event } as const;
};
