import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Email-confirmation link lands here; exchange the code for a session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const dest = next?.startsWith('/') ? next : '/dashboard';
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${url.origin}${dest}`);
  }
  return NextResponse.redirect(`${url.origin}/login`);
}
