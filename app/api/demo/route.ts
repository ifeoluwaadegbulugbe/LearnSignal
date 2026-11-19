// "Try the demo": signs into the shared sandbox teacher account configured by DEMO_EMAIL / DEMO_PASSWORD
// and opens its sample class. The account holds synthetic data only. The password stays server-side.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const email = process.env.DEMO_EMAIL, password = process.env.DEMO_PASSWORD;
  const origin = new URL(req.url).origin;
  if (!email || !password) return NextResponse.redirect(`${origin}/login?demo=unavailable`, 303);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.redirect(`${origin}/login?demo=unavailable`, 303);
  // Go straight to the sample class if there is one.
  const { data: cls } = await supabase.from('classrooms').select('id').order('created_at').limit(1).maybeSingle();
  return NextResponse.redirect(cls ? `${origin}/classrooms/${cls.id}` : `${origin}/dashboard`, 303);
}
