import { Logo } from '@/components/layout/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-6"><Logo /></div>
      <div className="w-full max-w-md rounded-[14px] border border-line bg-surface p-6 sm:p-8">{children}</div>
    </main>
  );
}
