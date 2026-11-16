import { requireUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Distraction-free layout for checks: no rail, no tab bar. Still requires a signed-in teacher. */
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
