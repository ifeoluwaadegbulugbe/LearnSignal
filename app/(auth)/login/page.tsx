import { Suspense } from 'react';
import { AuthForm } from '@/components/layout/auth-form';
import { DemoButton } from '@/components/layout/demo-button';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <>
      <Suspense><AuthForm mode="login" /></Suspense>
      <div className="mt-6 border-t border-line pt-5 text-center">
        <p className="mb-2 text-[14px] text-muted">Judging or just looking? Use the shared demo class (sample data only).</p>
        <div className="flex justify-center"><DemoButton size="md" /></div>
      </div>
    </>
  );
}
