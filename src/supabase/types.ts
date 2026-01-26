export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          locale: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          locale?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          locale?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
