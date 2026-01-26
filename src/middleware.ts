import { NextRequest } from 'next/server';
import { updateSession } from '@/supabase/middleware';

export const middleware = async (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|brand).*)'
  ]
};
