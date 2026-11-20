'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun as TodayIcon, Users, ClipboardCheck, Boxes, BookOpen, Sparkles, BarChart3, Settings, School, ChevronDown,
  Search, Bell, LogOut, Shield, MoreHorizontal, Plus, X, CornerDownLeft, RotateCcw, FileCheck2, ChevronRight, HelpCircle, CircleCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoMark, Wordmark } from './logo';
import { NightButton } from './theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/primitives';
import { AssistantChat } from '@/components/assistant/chat';
import { SKILLS } from '@/lib/content/skills';

export interface ShellData {
  fullName: string; email: string; isAdmin: boolean; isDemo: boolean; aiReady: boolean;
  classrooms: { id: string; name: string; school_id: string; is_demo: boolean }[];
  schools: { id: string; name: string }[];
  learners: { id: string; code: string; display_name: string; classroom_id: string }[];
  notifications: { id: string; title: string; body: string; href: string; kind: 'retest' | 'approve' }[];
}

type NavItem = { href: string; label: string; icon: typeof Users; exact?: boolean; match?: RegExp };
function navItems(cid: string | undefined, isAdmin: boolean): NavItem[] {
  const c = (p: string) => (cid ? `/classrooms/${cid}${p}` : '/dashboard');
  return [
    { href: c(''), label: 'Today', icon: TodayIcon, exact: true, match: /^\/(classrooms\/[^/]+|dashboard)$/ },
    { href: c('/learners'), label: 'Learners', icon: Users, match: /^\/(classrooms\/[^/]+\/learners|learners\/[^/]+$)/ },
    { href: c('/learners?tab=na'), label: 'Checks', icon: ClipboardCheck, match: /^\/learners\/[^/]+\/assess/ },
    { href: c('/groups'), label: 'Groups', icon: Boxes, match: /^\/classrooms\/[^/]+\/groups/ },
    { href: '/exercises', label: 'Practice', icon: BookOpen, match: /^\/exercises/ },
    { href: '/assistant', label: 'Ask', icon: Sparkles, match: /^\/assistant/ },
    { href: c('/progress'), label: 'Insights', icon: BarChart3, match: /^\/classrooms\/[^/]+\/progress/ },
    ...(isAdmin ? [{ href: '/school', label: 'School', icon: School, match: /^\/school/ }] : []),
    { href: '/settings', label: 'Settings', icon: Settings, match: /^\/settings/ },
  ];
}

export function AppShell({ data, children }: { data: ShellData; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [palette, setPalette] = useState<false | 'all' | 'check'>(false);
  const [askAi, setAskAi] = useState(false);
  const [more, setMore] = useState(false);
  const [storedClass, setStoredClass] = useState<string | null>(null);

  useEffect(() => { try { setStoredClass(localStorage.getItem('ls-class')); } catch {} }, []);
  const fromPath = path.match(/^\/classrooms\/([0-9a-f-]{36})/)?.[1];
  const learnerFromPath = path.match(/^\/learners\/([0-9a-f-]{36})/)?.[1];
  useEffect(() => { if (fromPath) { try { localStorage.setItem('ls-class', fromPath); } catch {} setStoredClass(fromPath); } }, [fromPath]);
  useEffect(() => { if (learnerFromPath) { try { localStorage.setItem('ls-last-learner', learnerFromPath); } catch {} } }, [learnerFromPath]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette('all'); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const current = data.classrooms.find((c) => c.id === (fromPath ?? storedClass)) ?? data.classrooms[0];
  const cid = current?.id;
  const nav = navItems(cid, data.isAdmin);
  const activeLabel = nav.find((n) => n.match?.test(path))?.label;
  const learnerCount = (id?: string) => data.learners.filter((l) => l.classroom_id === id).length;

  const startCheck = () => {
    let last: string | null = null;
    try { last = localStorage.getItem('ls-last-learner'); } catch {}
    if (last && data.learners.some((l) => l.id === last)) router.push(`/learners/${last}/assess`);
    else setPalette('check');
  };

  const main = nav.filter((n) => n.label !== 'Settings');
  const help: NavItem = { href: '/how-scoring-works', label: 'Help', icon: HelpCircle };
  const homeHref = cid ? `/classrooms/${cid}` : '/dashboard';

  return (
    <div className="@container min-h-dvh bg-ground">
      {/* ---------- Sidebar (desktop 232px) / icon rail (tablet 72px) ---------- */}
      <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-surface @tab:flex @desk:w-[232px] no-print">
        <Link href={homeHref} aria-label="LearnSignal, Today" className="mx-auto mt-6 flex h-10 items-center gap-2.5 rounded-[10px] @desk:mx-5">
          <LogoMark size={30} /><span className="hidden @desk:inline"><Wordmark /></span>
        </Link>
        {current && (
          <div className="mx-4 mt-6 hidden @desk:block">
            <ClassSwitcher current={current} count={learnerCount(cid)} classrooms={data.classrooms} countFor={learnerCount} variant="box" />
          </div>
        )}
        <nav aria-label="Main navigation" className="mt-6 flex-1 overflow-y-auto px-3 @desk:px-4">
          <ul className="space-y-1">
            {main.map((n) => <SideItem key={n.label} item={n} on={n.label === activeLabel} />)}
          </ul>
        </nav>
        <div className="border-t border-line p-3 @desk:p-4">
          <UserMenu data={data} placement="side" />
        </div>
      </aside>

      <div className="@tab:pl-[72px] @desk:pl-[232px]">
        {/* ---------- Phone top bar ---------- */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-surface px-4 @tab:hidden no-print">
          <Link href={homeHref} aria-label="LearnSignal, Today" className="shrink-0 rounded-[10px]"><LogoMark size={28} /></Link>
          {current ? <ClassSwitcher current={current} count={learnerCount(cid)} classrooms={data.classrooms} countFor={learnerCount} variant="chip" /> : <Wordmark />}
          <div className="ml-auto flex items-center gap-1.5">
            <IconButton label="Find a learner or skill" onClick={() => setPalette('all')}><Search className="size-5" aria-hidden /></IconButton>
            <IconButton label="Ask about your class" onClick={() => setAskAi(true)}><Sparkles className="size-5" aria-hidden /></IconButton>
            <Notifications items={data.notifications} />
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1240px] px-4 pb-[calc(104px+env(safe-area-inset-bottom))] pt-6 @tab:px-6 @tab:pb-14 @tab:pt-8 @desk:px-10 @desk:pt-10">
          {/* Utility cluster: own row on tablet, top-right beside the page title on desktop */}
          <div className="no-print mb-6 hidden items-center gap-2 @tab:flex @desk:pointer-events-none @desk:relative @desk:z-10 @desk:-mb-12 @desk:h-12 @desk:justify-end">
            <div className="flex items-center gap-2 @desk:pointer-events-auto">
              <button onClick={() => setPalette('all')} className="flex h-12 w-[280px] items-center gap-3 rounded-full border border-line bg-surface pl-5 pr-1.5 text-left text-[15px] text-muted hover:border-line-strong">
                <span className="flex-1 truncate">Find a learner or skill</span>
                <span className="flex size-9 items-center justify-center rounded-full bg-violet-500 text-on-primary"><Search className="size-4" aria-hidden /></span>
              </button>
              <button onClick={() => setAskAi(true)} className="flex h-12 items-center gap-2 rounded-[12px] border border-line-strong bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-violet-50">
                <Sparkles className="size-4" aria-hidden /> Ask
              </button>
              <Notifications items={data.notifications} large />
            </div>
          </div>
          {current?.is_demo && (
            <div role="note" className="mb-6 flex items-center gap-2 rounded-[12px] border border-line bg-violet-50 px-4 py-2 text-[14px] text-muted @desk:max-w-[calc(100%-480px)]">
              <LogoMark size={16} className="shrink-0" /> Sample class: names and results are illustrative.
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ---------- Phone bottom bar with the raised Check button ---------- */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] @tab:hidden no-print" style={{ height: 'calc(72px + env(safe-area-inset-bottom))' }}>
        <BottomItem item={nav[0]} on={nav[0].label === activeLabel} />
        <BottomItem item={nav[1]} on={nav[1].label === activeLabel} />
        <div className="flex justify-center">
          <button onClick={startCheck} aria-label="Start a check" className="-mt-8 flex size-16 items-center justify-center rounded-full bg-violet-500 text-on-primary shadow-[0_8px_20px_rgba(91,63,224,.30)] ring-[6px] ring-surface active:scale-95">
            <CircleCheck className="size-7" strokeWidth={2.2} aria-hidden />
          </button>
        </div>
        <BottomItem item={nav[3]} on={nav[3].label === activeLabel} />
        <button onClick={() => setMore(true)} className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-[12px] text-[13px] font-medium text-muted"><MoreHorizontal className="size-5" aria-hidden />More</button>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More">
        <ul className="grid grid-cols-2 gap-2">
          {[...nav.filter((n) => !['Today', 'Learners', 'Groups'].includes(n.label)), help].map((n) => (
            <li key={n.label}><Link href={n.href} onClick={() => setMore(false)} className="flex min-h-14 items-center gap-3 rounded-[12px] border border-line px-3 text-[15px] font-semibold hover:bg-violet-50"><n.icon className="size-5 text-violet-700" aria-hidden />{n.label}</Link></li>
          ))}
        </ul>
        <div className="mt-3 flex min-h-12 items-center justify-between rounded-[12px] border border-line px-3 text-[15px] font-semibold">Appearance <NightButton /></div>
        <form action="/auth/signout" method="post" className="mt-2"><button className="flex min-h-12 w-full items-center gap-3 rounded-[12px] border border-line px-3 text-[15px] font-semibold hover:bg-violet-50"><LogOut className="size-5 text-muted" aria-hidden />Sign out</button></form>
      </Dialog>

      <CommandPalette mode={palette} onClose={() => setPalette(false)} data={data} cid={cid} />
      <Dialog open={askAi} onClose={() => setAskAi(false)} side title="Ask about your class" description="Answers come only from your class data.">
        {askAi && <AssistantChat compact classrooms={data.classrooms} learners={data.learners} aiReady={data.aiReady} initialClassroomId={cid} />}
      </Dialog>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-label={label} className="flex size-11 items-center justify-center rounded-[12px] border border-line-strong bg-surface text-ink hover:bg-violet-50">{children}</button>;
}

function SideItem({ item, on }: { item: NavItem; on: boolean }) {
  return (
    <li className="group/side relative">
      <Link href={item.href} aria-current={on ? 'page' : undefined} aria-label={item.label}
        className={cn('flex h-11 items-center justify-center gap-3 rounded-[12px] text-[15px] font-medium transition-colors duration-150 @desk:justify-start @desk:px-3',
          on ? 'bg-violet-100 font-semibold text-violet-700' : 'text-ink hover:bg-violet-50')}>
        <item.icon className="size-5 shrink-0" strokeWidth={on ? 2.1 : 1.8} aria-hidden />
        <span className="hidden @desk:inline">{item.label}</span>
      </Link>
      {/* tablet tooltip */}
      <span aria-hidden className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[8px] bg-ink px-2 py-1 text-[13px] font-medium text-surface opacity-0 transition-opacity group-hover/side:opacity-100 group-focus-within/side:opacity-100 @tab:block @desk:hidden">{item.label}</span>
    </li>
  );
}

function BottomItem({ item, on }: { item: NavItem; on: boolean }) {
  return (
    <Link href={item.href} aria-current={on ? 'page' : undefined}
      className={cn('mx-auto flex h-14 w-full max-w-[84px] flex-col items-center justify-center gap-0.5 rounded-[12px] text-[13px] font-medium', on ? 'bg-violet-100 text-violet-700' : 'text-muted')}>
      <item.icon className="size-5" strokeWidth={on ? 2.1 : 1.8} aria-hidden />{item.label}
    </Link>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return { open, setOpen, ref };
}

function ClassSwitcher({ current, count, classrooms, countFor, variant }: { current: ShellData['classrooms'][number]; count: number; classrooms: ShellData['classrooms']; countFor: (id?: string) => number; variant: 'box' | 'chip' }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative min-w-0">
      {variant === 'box' ? (
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
          className="flex w-full items-center gap-2 rounded-[12px] border border-line bg-ground px-3.5 py-3 text-left hover:border-line-strong">
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-muted">Class</span>
            <span className="block truncate text-[15px] font-semibold">{current.name}</span>
            <span className="block text-[13px] text-muted tabular">{count} learners</span>
          </span>
          <span className="sr-only">. Switch class</span><ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
      ) : (
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
          className="flex h-11 min-w-0 max-w-[48vw] items-center gap-2 rounded-full border border-line-strong bg-surface pl-4 pr-2 text-[15px] font-semibold">
          <span className="truncate">{current.name}</span>
          <span className="shrink-0 rounded-full bg-violet-100 px-2 text-[13px] font-semibold tabular text-violet-700">{count}</span>
        </button>
      )}
      {open && (
        <div role="menu" className={cn('absolute z-50 w-72 rounded-[16px] border border-line bg-surface p-1.5 shadow-pop', variant === 'box' ? 'left-0 top-full mt-2' : 'left-0 top-12')}>
          <div className="px-3 pb-1 pt-2 text-[13px] font-medium text-muted">Your classes</div>
          {classrooms.map((c) => (
            <Link key={c.id} role="menuitem" href={`/classrooms/${c.id}`} onClick={() => setOpen(false)} className={cn('flex min-h-11 items-center justify-between gap-2 rounded-[12px] px-3 text-[15px] hover:bg-violet-50', c.id === current.id && 'bg-violet-100 font-semibold text-violet-700')}>
              <span className="truncate">{c.name}</span><span className="shrink-0 text-[13px] text-muted tabular">{c.is_demo ? 'sample · ' : ''}{countFor(c.id)}</span>
            </Link>
          ))}
          <div className="my-1 border-t border-line" />
          <Link role="menuitem" href="/dashboard" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-[12px] px-3 text-[15px] hover:bg-violet-50">All classes</Link>
          <Link role="menuitem" href="/onboarding" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] font-semibold text-violet-700 hover:bg-violet-50"><Plus className="size-4" aria-hidden /> New class</Link>
        </div>
      )}
    </div>
  );
}

function Notifications({ items, large }: { items: ShellData['notifications']; large?: boolean }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn('relative flex items-center justify-center rounded-[12px] border border-line-strong bg-surface text-ink hover:bg-violet-50', large ? 'size-12' : 'size-11')}
        aria-label={`Notifications${items.length ? `, ${items.length} need action` : ''}`}>
        <Bell className="size-5" strokeWidth={1.8} />
        {items.length > 0 && <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-tangerine ring-2 ring-surface" aria-hidden />}
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] rounded-[16px] border border-line bg-surface p-2 shadow-pop">
          <div className="px-3 py-2 font-heading text-[16px] font-semibold">Needs your attention</div>
          {items.length === 0 ? <p className="px-3 pb-3 text-[15px] text-muted">You&apos;re all caught up.</p> : (
            <ul>{items.map((n) => (
              <li key={n.id}><Link href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-[12px] p-3 hover:bg-violet-50">
                <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px]', n.kind === 'retest' ? 'bg-tangerine-tint text-tangerine-ink' : 'bg-violet-100 text-violet-700')}>{n.kind === 'retest' ? <RotateCcw className="size-4" /> : <FileCheck2 className="size-4" />}</span>
                <span><span className="block text-[15px] font-semibold">{n.title}</span><span className="block text-[14px] text-muted">{n.body}</span></span>
              </Link></li>
            ))}</ul>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu({ data, placement }: { data: ShellData; placement: 'side' | 'top' }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex w-full items-center justify-center gap-3 rounded-[12px] p-1.5 text-left hover:bg-violet-50 @desk:justify-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[14px] font-semibold text-violet-700" aria-hidden>{data.fullName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
        <span className="sr-only @desk:not-sr-only @desk:min-w-0 @desk:flex-1">
          <span className="block truncate text-[15px] font-semibold">{data.fullName}</span>
          <span className="block truncate text-[13px] text-muted">{data.isAdmin ? 'Administrator' : 'Teacher'}</span>
        </span>
        <span className="sr-only">, account menu</span>
      </button>
      {open && (
        <div role="menu" className={cn('absolute z-50 w-64 rounded-[16px] border border-line bg-surface p-1.5 shadow-pop', placement === 'side' ? 'bottom-full left-0 mb-2' : 'right-0 top-12')}>
          <div className="px-3 py-2"><div className="truncate text-[15px] font-semibold">{data.fullName}</div><div className="truncate text-[13px] text-muted">{data.email}</div></div>
          {data.isDemo && <div className="mx-2 mb-1 rounded-[10px] bg-violet-50 px-2 py-1 text-[13px] font-medium text-violet-700">Shared demo account · sample data</div>}
          <div className="flex min-h-11 items-center justify-between rounded-[12px] px-3 text-[15px]">Appearance <NightButton className="flex size-9 items-center justify-center rounded-[10px] text-muted hover:bg-violet-50" /></div>
          <Link role="menuitem" href="/settings" className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] hover:bg-violet-50"><Settings className="size-4" aria-hidden /> Settings</Link>
          <Link role="menuitem" href="/how-scoring-works" className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] hover:bg-violet-50"><HelpCircle className="size-4" aria-hidden /> Help: how scoring works</Link>
          <Link role="menuitem" href="/privacy" className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] hover:bg-violet-50"><Shield className="size-4" aria-hidden /> Privacy</Link>
          <form action="/auth/signout" method="post"><button role="menuitem" className="flex min-h-11 w-full items-center gap-2 rounded-[12px] px-3 text-[15px] hover:bg-violet-50"><LogOut className="size-4" aria-hidden /> Sign out</button></form>
        </div>
      )}
    </div>
  );
}

type Cmd = { id: string; group: 'Learners' | 'Skills' | 'Screens' | 'Actions' | 'Recent'; label: string; hint?: string; href: string };

function CommandPalette({ mode, onClose, data, cid }: { mode: false | 'all' | 'check'; onClose: () => void; data: ShellData; cid?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => { if (mode) { setQ(''); setIdx(0); try { setRecent(JSON.parse(localStorage.getItem('ls-recent') ?? '[]')); } catch {} } }, [mode]);

  const all = useMemo<Cmd[]>(() => {
    const c = (p: string) => (cid ? `/classrooms/${cid}${p}` : '/dashboard');
    const classLearners = data.learners.filter((l) => !cid || l.classroom_id === cid);
    return [
      ...data.learners.map((l) => ({ id: `l-${l.id}`, group: 'Learners' as const, label: l.display_name, hint: l.code, href: `/learners/${l.id}` })),
      ...classLearners.map((l) => ({ id: `a-${l.id}`, group: 'Actions' as const, label: `Start a check for ${l.display_name}`, hint: l.code, href: `/learners/${l.id}/assess` })),
      ...SKILLS.map((s) => ({ id: `s-${s.id}`, group: 'Skills' as const, label: `${s.id} ${s.name}`, hint: 'practice sets', href: `/exercises?skill=${s.id}` })),
      ...[['Today', c('')], ['Learners', c('/learners')], ['Groups', c('/groups')], ['Insights', c('/progress')], ['Practice', '/exercises'], ['Ask', '/assistant'], ['Settings', '/settings'], ['All classes', '/dashboard'], ...(data.isAdmin ? [['School insights', '/school']] : [])]
        .map(([label, href]) => ({ id: `p-${label}`, group: 'Screens' as const, label, href })),
      { id: 'act-gen', group: 'Actions', label: 'Generate practice', href: '/exercises?generate=1' },
      { id: 'act-add', group: 'Actions', label: 'Add learners', href: c('/learners?add=1') },
    ];
  }, [data, cid]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pool = mode === 'check' ? all.filter((c) => c.id.startsWith('a-')) : all;
    if (!t) {
      if (mode === 'check') return pool.slice(0, 12);
      const rec = recent.map((id) => all.find((c) => c.id === id)).filter(Boolean).map((r) => ({ ...(r as Cmd), group: 'Recent' as const }));
      return [...rec, ...all.filter((c) => c.group === 'Screens')].slice(0, 12);
    }
    return pool.filter((c) => c.label.toLowerCase().includes(t) || c.hint?.toLowerCase().includes(t)).slice(0, 14);
  }, [q, all, recent, mode]);

  const go = (c: Cmd) => {
    try { localStorage.setItem('ls-recent', JSON.stringify([c.id, ...recent.filter((r) => r !== c.id)].slice(0, 5))); } catch {}
    onClose(); router.push(c.href);
  };
  let lastGroup = '';
  return (
    <Dialog open={!!mode} onClose={onClose} title={mode === 'check' ? 'Start a check for…' : 'Find'}>
      <div className="flex items-center gap-2 rounded-[12px] border border-line-strong px-3">
        <Search className="size-4 text-ink-3" aria-hidden />
        <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder={mode === 'check' ? 'Learner name or code' : 'Learner, skill, practice set or screen'}
          aria-label="Search" role="combobox" aria-expanded aria-controls="cmd-list" aria-activedescendant={results[idx] ? `cmd-${idx}` : undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
            if (e.key === 'Enter' && results[idx]) { e.preventDefault(); go(results[idx]); }
          }}
          className="h-12 flex-1 bg-transparent text-[15px] outline-none" />
        {q && <button onClick={() => setQ('')} aria-label="Clear"><X className="size-4 text-ink-3" /></button>}
      </div>
      <ul id="cmd-list" role="listbox" className="mt-3 max-h-[50dvh] overflow-y-auto">
        {results.length === 0 && <li className="px-3 py-6 text-center text-[14px] text-ink-2">No matches for “{q}”.</li>}
        {results.map((r, i) => {
          const header = r.group !== lastGroup ? r.group : null; lastGroup = r.group;
          return (
            <li key={`${r.group}-${r.id}`} id={`cmd-${i}`} role="option" aria-selected={i === idx}>
              {header && <div className="px-3 pb-1 pt-3 text-[12px] font-medium text-ink-2">{header}</div>}
              <button onMouseEnter={() => setIdx(i)} onClick={() => go(r)} className={cn('flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px]', i === idx ? 'bg-violet-100 text-violet-700' : 'hover:bg-violet-50')}>
                {r.id.startsWith('l-') || r.id.startsWith('a-') ? <Avatar name={r.label.replace('Start a check for ', '')} seed={r.hint} size={24} label="" /> : <ChevronRight className="size-4 text-ink-3" aria-hidden />}
                <span className="flex-1 truncate">{r.label}</span>
                {r.hint && <span className="font-mono text-[12px] text-ink-3">{r.hint}</span>}
                {i === idx && <CornerDownLeft className="size-3.5" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-2"><Kbd>↑</Kbd><Kbd>↓</Kbd> move <Kbd>Enter</Kbd> open <Kbd>Esc</Kbd> close</p>
    </Dialog>
  );
}
