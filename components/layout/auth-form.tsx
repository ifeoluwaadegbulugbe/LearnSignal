'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';

const Login = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });
const Signup = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
});

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(params.get('demo') === 'unavailable' ? 'The public demo account is not configured on this deployment. Please sign up instead.' : null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null); setInfo(null);
    const parsed = (mode === 'login' ? Login : Signup).safeParse(values);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { f[String(i.path[0])] ??= i.message; });
      setErrors(f); return;
    }
    setErrors({});
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
        if (error) { setFormError(error.message === 'Invalid login credentials' ? 'That email and password do not match.' : error.message); return; }
        router.replace(params.get('next')?.startsWith('/') ? params.get('next')! : '/dashboard');
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(), password: values.password,
          options: { data: { full_name: values.fullName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
        });
        if (error) { setFormError(error.message); return; }
        if (!data.session) { setInfo('Check your email to confirm your account, then sign in.'); return; }
        router.replace('/onboarding');
        router.refresh();
      }
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h1 className="text-[28px] font-bold">{mode === 'login' ? 'Welcome back' : 'Create your teacher account'}</h1>
      {formError && <ErrorPanel message={formError} />}
      {info && <p role="status" className="rounded-xl bg-primary-soft px-3 py-2 text-[15px] text-primary-dark">{info}</p>}
      {mode === 'signup' && (
        <Field label="Your name" htmlFor="fullName" error={errors.fullName}>
          <Input id="fullName" autoComplete="name" value={values.fullName} onChange={set('fullName')} invalid={!!errors.fullName} />
        </Field>
      )}
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} invalid={!!errors.email} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password} hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
        <Input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={set('password')} invalid={!!errors.password} />
      </Field>
      <Button type="submit" className="w-full" loading={loading}>{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      <p className="text-center text-[14px] text-muted">
        {mode === 'login' ? <>New here? <Link className="font-semibold text-primary underline" href="/signup">Create an account</Link></> : <>Already have an account? <Link className="font-semibold text-primary underline" href="/login">Sign in</Link></>}
      </p>
    </form>
  );
}
