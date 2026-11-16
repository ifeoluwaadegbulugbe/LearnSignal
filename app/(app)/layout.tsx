import { AppNav } from '@/components/layout/app-nav';
import { getTeacherContext } from '@/lib/server/context';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getTeacherContext();
  return (
    <div className="min-h-dvh">
      <AppNav classrooms={ctx.classrooms} isAdmin={ctx.schools.some((s) => s.role === 'admin')} fullName={ctx.fullName} isDemo={ctx.isDemo} />
      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
