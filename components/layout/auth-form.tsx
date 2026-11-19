'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { Illustration } from '@/components/ui/illustration';
import { cn } from '@/lib/utils';

const Login = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });
const Signup = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
  consent: z.literal(true, { message: 'Please confirm before creating your account' }),
});

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d|[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 3) as 0 | 1 | 2 | 3;
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [values, setValues] = useState({ fullName: '', email: '', password: '', consent: false });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(params.get('demo') === 'unavailable' ? 'The public demo account is not set up on this deployment. Create a free account instead.' : null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState<{ open: boolean; email: string; done: boolean; error?: string }>({ open: false, email: '', done: false });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = (mode === 'login' ? Login : Signup).safeParse(values);
    if (!parsed.success) { const f: Record<string, string> = {}; parsed.error.issues.forEach((i) => { f[String(i.path[0])] ??= i.message; }); setErrors(f); return; }
    setErrors({}); setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
        if (error) { setFormError(error.message === 'Invalid login credentials' ? 'That email and password don’t match.' : error.message); return; }
        router.replace(params.get('next')?.startsWith('/') ? params.get('next')! : '/dashboard'); router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email: values.email.trim(), password: values.password, options: { data: { full_name: values.fullName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` } });
        if (error) { setFormError(error.message); return; }
        if (!data.session) { setSent(true); return; }
        router.replace('/onboarding'); router.refresh();
      }
    } catch { setFormError('Could not reach the server. Check your connection and try again.'); }
    finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div className="text-center fade-up">
        <div className="mx-auto w-44"><Illustration name="empty-practice" /></div>
        <h1 className="mt-4 font-heading text-[30px] font-bold">Check your email</h1>
        <p className="mt-2 text-ink-2">We sent a link to <b className="text-ink">{values.email}</b>. Open it to confirm your account, then come back to sign in.</p>
        <Link href="/login" className="mt-6 inline-block font-semibold text-teal underline">Back to sign in</Link>
      </div>
    );
  }

  const st = strength(values.password);
  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <h1 className="font-heading text-[30px] font-bold leading-9">{mode === 'login' ? 'Welcome back' : 'Create your teacher account'}</h1>
        {formError && <p role="alert" className="rounded-[12px] border border-st-notyet/30 bg-st-notyet-soft px-3 py-2.5 text-[14px] font-medium text-st-notyet">{formError}</p>}
        {mode === 'signup' && (
          <Field label="Your name" htmlFor="fullName" error={errors.fullName}><Input id="fullName" autoComplete="name" value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} invalid={!!errors.fullName} /></Field>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}><Input id="email" type="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} invalid={!!errors.email} /></Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} invalid={!!errors.password} className="pr-11" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-ink-2 hover:bg-paper-2">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
        </Field>
        {mode === 'signup' && values.password && (
          <div aria-live="polite">
            <div className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < st ? (st === 3 ? 'bg-teal' : 'bg-sun') : 'bg-line')} />)}</div>
            <p className="mt-1 text-[12px] text-ink-2">Password strength: {['too short', 'fair', 'good', 'strong'][st]}</p>
          </div>
        )}
        {mode === 'signup' && (
          <div>
            <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-[14px]">
              <input id="consent" type="checkbox" className="mt-0.5 size-5 accent-[var(--teal)]" checked={values.consent} onChange={(e) => setValues({ ...values, consent: e.target.checked })} aria-invalid={!!errors.consent || undefined} />
              I will only enter children&apos;s details with school or guardian consent.
            </label>
            {errors.consent && <p className="mt-1 text-[12px] font-medium text-st-notyet" role="alert">{errors.consent}</p>}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
        {mode === 'login' && <button type="button" onClick={() => setForgot({ open: true, email: values.email, done: false })} className="text-[14px] font-medium text-teal underline">Forgot password?</button>}
      </form>
      <div className="mt-8 space-y-3 border-t border-dashed border-line-strong pt-6 text-[14px]">
        <p className="text-ink-2">{mode === 'login' ? <>New here? <Link className="font-semibold text-teal underline" href="/signup">Create an account</Link></> : <>Already have an account? <Link className="font-semibold text-teal underline" href="/login">Sign in</Link></>}</p>
        <form action="/api/demo" method="post"><button type="submit" className="font-semibold text-teal underline">Try the demo</button> <span className="text-ink-2">· sample data only, no sign-up</span></form>
      </div>

      <Dialog open={forgot.open} onClose={() => setForgot({ ...forgot, open: false })} title="Reset your password">
        {forgot.done ? <p className="text-[15px]">If an account exists for that email, we&apos;ve sent a sign-in link. After signing in, set a new password in Settings.</p> : (
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (!z.string().email().safeParse(forgot.email.trim()).success) { setForgot({ ...forgot, error: 'Enter a valid email' }); return; }
            await createClient().auth.resetPasswordForEmail(forgot.email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/settings` });
            setForgot({ ...forgot, done: true, error: undefined });
          }}>
            <Field label="Email" htmlFor="fg-email" error={forgot.error}><Input id="fg-email" type="email" value={forgot.email} onChange={(e) => setForgot({ ...forgot, email: e.target.value })} invalid={!!forgot.error} /></Field>
            <Button type="submit">Send reset link</Button>
          </form>
        )}
      </Dialog>
    </>
  );
}
