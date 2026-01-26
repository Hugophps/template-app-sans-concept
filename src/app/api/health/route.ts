import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.getSession();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
