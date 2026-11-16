'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Boxes, MessageCircleQuestion, BookOpen, School, Settings, LogOut, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import type { ClassroomLite } from '@/lib/server/context';

export function AppNav({ classrooms, isAdmin, fullName, isDemo }: { classrooms: ClassroomLite[]; isAdmin: boolean; fullName: string; isDemo: boolean }) {
  const path = usePathname();
  const fromPath = path.match(/^\/classrooms\/([0-9a-f-]{36})/)?.[1];
  const current = classrooms.find((c) => c.id === fromPath) ?? classrooms[0];
  const cid = current?.id;
  const active = (href: string, exact = false) => (exact ? path === href : path === href || path.startsWith(href + '/'));

  const classLinks = cid ? [
    { href: `/classrooms/${cid}`, label: 'Class', icon: LayoutDashboard, exact: true },
    { href: `/classrooms/${cid}/learners`, label: 'Learners', icon: Users },
    { href: `/classrooms/${cid}/groups`, label: 'Groups', icon: Boxes },
    { href: `/classrooms/${cid}/progress`, label: 'Progress', icon: TrendingUp },
  ] : [];
  const general = [
    { href: '/exercises', label: 'Exercises', icon: BookOpen },
    { href: '/assistant', label: 'Assistant', icon: MessageCircleQuestion },
    ...(isAdmin ? [{ href: '/school', label: 'School insights', icon: School }] : []),
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex no-print">
        <div className="px-5 py-5"><Logo href="/dashboard" /></div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3" aria-label="App">
          <div>
            <Link href="/dashboard" className={navItem(active('/dashboard', true))}><LayoutDashboard className="size-5" aria-hidden /> All classes</Link>
          </div>
          {current && (
            <div>
              <div className="px-3 pb-1 text-[12px] font-semibold uppercase tracking-wide text-muted">{current.name}</div>
              {classLinks.map((l) => <Link key={l.href} href={l.href} aria-current={active(l.href, l.exact) ? 'page' : undefined} className={navItem(active(l.href, l.exact))}><l.icon className="size-5" aria-hidden /> {l.label}</Link>)}
            </div>
          )}
          <div>
            <div className="px-3 pb-1 text-[12px] font-semibold uppercase tracking-wide text-muted">Tools</div>
            {general.map((l) => <Link key={l.href} href={l.href} aria-current={active(l.href) ? 'page' : undefined} className={navItem(active(l.href))}><l.icon className="size-5" aria-hidden /> {l.label}</Link>)}
          </div>
        </nav>
        <div className="border-t border-line p-3">
          {isDemo && <p className="mb-2 rounded-lg bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-[#7A4E0C]">Shared demo account · sample data</p>}
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="truncate text-[14px] font-medium">{fullName}</span>
            <form action="/auth/signout" method="post"><button className="rounded-lg p-2 text-muted hover:bg-bg" aria-label="Sign out" title="Sign out"><LogOut className="size-5" /></button></form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden no-print">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-1">
          <Link href="/exercises" aria-label="Exercises" className="rounded-lg p-2 hover:bg-bg"><BookOpen className="size-5" /></Link>
          <Link href="/settings" aria-label="Settings" className="rounded-lg p-2 hover:bg-bg"><Settings className="size-5" /></Link>
        </div>
      </header>

      {/* Mobile bottom tabs: Class, Learners, Groups, Assistant */}
      <nav aria-label="Classroom" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface lg:hidden no-print">
        {[
          { href: cid ? `/classrooms/${cid}` : '/dashboard', label: 'Class', icon: LayoutDashboard, exact: true },
          { href: cid ? `/classrooms/${cid}/learners` : '/dashboard', label: 'Learners', icon: Users },
          { href: cid ? `/classrooms/${cid}/groups` : '/dashboard', label: 'Groups', icon: Boxes },
          { href: '/assistant', label: 'Assistant', icon: MessageCircleQuestion },
        ].map((l) => {
          const on = active(l.href, l.exact);
          return (
            <Link key={l.label} href={l.href} aria-current={on ? 'page' : undefined} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold', on ? 'text-primary' : 'text-muted')}>
              <l.icon className="size-5" aria-hidden />{l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

const navItem = (on: boolean) => cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium', on ? 'bg-primary-soft text-primary-dark' : 'text-ink hover:bg-bg');
