import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config/app';
import { supabaseAnonKey, supabaseUrl } from '@/supabase/config';
import type { Database } from '@/supabase/types';

const getNextPath = (value: string | null) => {
  if (!value) return `/${appConfig.defaultLocale}/profile`;
  if (!value.startsWith('/')) return `/${appConfig.defaultLocale}/profile`;
  return value;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextPath = getNextPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/${appConfig.defaultLocale}/login?error=missing-code`);
  }

  const response = NextResponse.redirect(`${origin}${nextPath}`);

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/${appConfig.defaultLocale}/login?error=auth`);
  }

  return response;
}
