'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun as TodayIcon, Users, ClipboardCheck, Boxes, BookOpen, Sparkles, BarChart3, Settings, School, ChevronDown,
  Search, Bell, LogOut, Shield, MoreHorizontal, Plus, X, CornerDownLeft, RotateCcw, FileCheck2, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoMark } from './logo';
import { NightButton } from './theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/primitives';
import { SignalMark } from '@/components/ui/signal';
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

  return (
    <div className="min-h-dvh bg-paper">
      {/* ---------- Rail (tablet: icons only; desktop: icon over label) ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center border-r border-line bg-paper-2 py-4 md:flex lg:w-[92px] no-print" aria-label="Main navigation">
        <Link href={cid ? `/classrooms/${cid}` : '/dashboard'} aria-label="LearnSignal, Today" className="mb-5 rounded-[10px]"><LogoMark size={36} /></Link>
        <nav className="no-scrollbar flex w-full flex-1 flex-col items-stretch gap-1 overflow-y-auto">
          {nav.map((n) => {
            const on = n.label === activeLabel;
            return (
              <Link key={n.label} href={n.href} aria-current={on ? 'page' : undefined} title={n.label}
                className={cn('group relative mx-2 flex flex-col items-center gap-1 rounded-[12px] py-2 text-[11px] font-semibold transition-colors', on ? 'text-teal' : 'text-ink-2 hover:bg-paper hover:text-ink')}>
                {on && <span aria-hidden className="absolute -right-2 top-2 bottom-2 w-[3px] rounded-l-full bg-teal" />}
                <span className={cn('flex size-10 items-center justify-center rounded-[12px] transition-colors', on && 'bg-teal-soft')}><n.icon className="size-5" strokeWidth={1.75} aria-hidden /></span>
                <span className="sr-only lg:not-sr-only">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2 pt-3">
          <NightButton />
          <UserMenu data={data} placement="rail" />
        </div>
      </aside>

      <div className="md:pl-[72px] lg:pl-[92px]">
        {/* ---------- Context bar ---------- */}
        <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-lg no-print">
          <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-4 sm:px-6 md:h-16 md:gap-3 xl:px-10">
            {current ? <ClassSwitcher current={current} count={learnerCount(cid)} classrooms={data.classrooms} countFor={learnerCount} /> : <span className="font-heading font-bold">LearnSignal</span>}
            <button onClick={() => setPalette('all')} className="mx-auto hidden h-11 w-full max-w-[460px] items-center gap-2 rounded-[12px] border border-line-strong bg-card px-3.5 text-left text-[14px] text-ink-3 hover:border-teal/50 md:flex">
              <Search className="size-4" aria-hidden /><span className="flex-1 truncate">Find a learner, skill or practice set</span><Kbd>⌘K</Kbd>
            </button>
            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <button onClick={() => setPalette('all')} className="flex size-10 items-center justify-center rounded-[12px] text-ink-2 hover:bg-paper-2 md:hidden" aria-label="Search"><Search className="size-5" /></button>
              <button onClick={() => setAskAi(true)} className="flex h-10 items-center gap-1.5 rounded-[12px] px-2.5 text-[14px] font-semibold text-teal hover:bg-teal-soft sm:px-3" aria-label="Ask about your class">
                <Sparkles className="size-4" aria-hidden /><span className="hidden sm:inline">Ask</span>
              </button>
              <Notifications items={data.notifications} />
              <span className="md:hidden"><UserMenu data={data} placement="top" /></span>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1240px] px-4 pb-32 pt-6 sm:px-6 md:pb-14 xl:px-10 xl:pt-8">{children}</main>
      </div>

      {/* ---------- Mobile bottom bar with raised Check button ---------- */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 items-end border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden no-print">
        {[nav[0], nav[1]].map((n) => <BottomItem key={n.label} item={n} on={n.label === activeLabel} />)}
        <div className="flex justify-center">
          <button onClick={startCheck} aria-label="Start a check" className="-mt-7 mb-2 flex size-16 flex-col items-center justify-center rounded-full bg-teal text-white shadow-pop ring-4 ring-paper active:scale-95">
            <SignalMark level={3} size={26} color="#FBF8F2" /><span className="-mt-0.5 text-[10px] font-bold">Check</span>
          </button>
        </div>
        <BottomItem item={nav[3]} on={nav[3].label === activeLabel} />
        <button onClick={() => setMore(true)} className="flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink-2"><MoreHorizontal className="size-5" aria-hidden />More</button>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More">
        <ul className="grid grid-cols-2 gap-2">
          {nav.filter((n) => !['Today', 'Learners', 'Groups'].includes(n.label)).map((n) => (
            <li key={n.label}><Link href={n.href} onClick={() => setMore(false)} className="flex min-h-14 items-center gap-3 rounded-[14px] border border-line px-3 text-[14px] font-semibold hover:bg-paper-2"><n.icon className="size-5 text-teal" aria-hidden />{n.label}</Link></li>
          ))}
        </ul>
      </Dialog>

      <CommandPalette mode={palette} onClose={() => setPalette(false)} data={data} cid={cid} />
      <Dialog open={askAi} onClose={() => setAskAi(false)} side title="Ask about your class" description="Answers come only from your class data.">
        {askAi && <AssistantChat compact classrooms={data.classrooms} learners={data.learners} aiReady={data.aiReady} initialClassroomId={cid} />}
      </Dialog>
    </div>
  );
}

function BottomItem({ item, on }: { item: NavItem; on: boolean }) {
  return (
    <Link href={item.href} aria-current={on ? 'page' : undefined} className={cn('flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold', on ? 'text-teal' : 'text-ink-2')}>
      <span className={cn('flex h-7 w-12 items-center justify-center rounded-full', on && 'bg-teal-soft')}><item.icon className="size-5" strokeWidth={1.75} aria-hidden /></span>{item.label}
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

function ClassSwitcher({ current, count, classrooms, countFor }: { current: ShellData['classrooms'][number]; count: number; classrooms: ShellData['classrooms']; countFor: (id?: string) => number }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative min-w-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex h-10 min-w-0 max-w-[60vw] items-center gap-2 rounded-full border border-line-strong bg-card pl-3.5 pr-2.5 text-[14px] font-semibold hover:border-teal/50 md:max-w-[260px]">
        <span className="truncate">{current.name}</span>
        <span className="shrink-0 rounded-full bg-paper-2 px-2 text-[12px] font-medium tabular text-ink-2">{count}</span>
        <ChevronDown className="size-4 shrink-0 text-ink-2" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-12 z-50 w-72 rounded-[18px] border border-line bg-card p-1.5 shadow-pop">
          <div className="px-3 pb-1 pt-2 text-[12px] font-medium text-ink-2">Your classes</div>
          {classrooms.map((c) => (
            <Link key={c.id} role="menuitem" href={`/classrooms/${c.id}`} onClick={() => setOpen(false)} className={cn('flex min-h-11 items-center justify-between gap-2 rounded-[12px] px-3 text-[14px] hover:bg-paper-2', c.id === current.id && 'bg-teal-soft font-semibold')}>
              <span className="truncate">{c.name}</span><span className="shrink-0 text-[12px] text-ink-2">{c.is_demo ? 'sample · ' : ''}{countFor(c.id)}</span>
            </Link>
          ))}
          <div className="my-1 border-t border-line" />
          <Link role="menuitem" href="/dashboard" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-[12px] px-3 text-[14px] hover:bg-paper-2">All classes</Link>
          <Link role="menuitem" href="/onboarding" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[14px] font-semibold text-teal hover:bg-paper-2"><Plus className="size-4" aria-hidden /> New class</Link>
        </div>
      )}
    </div>
  );
}

function Notifications({ items }: { items: ShellData['notifications'] }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="relative flex size-10 items-center justify-center rounded-[12px] text-ink-2 hover:bg-paper-2"
        aria-label={`Notifications${items.length ? `, ${items.length} need action` : ''}`}>
        <Bell className="size-5" strokeWidth={1.75} />
        {items.length > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-sun ring-2 ring-paper" aria-hidden />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] rounded-[18px] border border-line bg-card p-2 shadow-pop">
          <div className="px-3 py-2 font-heading text-[16px] font-semibold">Needs your attention</div>
          {items.length === 0 ? <p className="px-3 pb-3 text-[14px] text-ink-2">You&apos;re all caught up.</p> : (
            <ul>{items.map((n) => (
              <li key={n.id}><Link href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-[12px] p-3 hover:bg-paper-2">
                <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px]', n.kind === 'retest' ? 'bg-st-notyet-soft text-st-notyet' : 'bg-teal-soft text-teal')}>{n.kind === 'retest' ? <RotateCcw className="size-4" /> : <FileCheck2 className="size-4" />}</span>
                <span><span className="block text-[14px] font-semibold">{n.title}</span><span className="block text-[13px] text-ink-2">{n.body}</span></span>
              </Link></li>
            ))}</ul>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu({ data, placement }: { data: ShellData; placement: 'rail' | 'top' }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="rounded-full p-0.5 hover:ring-2 hover:ring-line-strong">
        <Avatar name={data.fullName} size={placement === 'rail' ? 40 : 32} label={`${data.fullName}, account menu`} />
      </button>
      {open && (
        <div role="menu" className={cn('absolute z-50 w-60 rounded-[18px] border border-line bg-card p-1.5 shadow-pop', placement === 'rail' ? 'bottom-0 left-14' : 'right-0 top-11')}>
          <div className="px-3 py-2"><div className="truncate text-[14px] font-semibold">{data.fullName}</div><div className="truncate text-[12px] text-ink-2">{data.email}</div></div>
          {data.isDemo && <div className="mx-2 mb-1 rounded-[10px] bg-sun-soft px-2 py-1 text-[12px] font-semibold text-sun-ink dark:text-sun">Shared demo account · sample data</div>}
          <div className="flex min-h-11 items-center justify-between rounded-[12px] px-3 text-[14px]">Night theme <NightButton className="flex size-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-paper-2" /></div>
          <Link role="menuitem" href="/settings" className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[14px] hover:bg-paper-2"><Settings className="size-4" aria-hidden /> Settings</Link>
          <Link role="menuitem" href="/privacy" className="flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-[14px] hover:bg-paper-2"><Shield className="size-4" aria-hidden /> Privacy</Link>
          <form action="/auth/signout" method="post"><button role="menuitem" className="flex min-h-11 w-full items-center gap-2 rounded-[12px] px-3 text-[14px] hover:bg-paper-2"><LogOut className="size-4" aria-hidden /> Sign out</button></form>
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
              <button onMouseEnter={() => setIdx(i)} onClick={() => go(r)} className={cn('flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px]', i === idx ? 'bg-teal-soft text-teal-ink dark:text-teal' : 'hover:bg-paper-2')}>
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
