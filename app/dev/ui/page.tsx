'use client';
import { useState } from 'react';
import { BookOpen, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconTile, type Hue } from '@/components/ui/icon-tile';
import { Badge, ChalkUnderline, Field, IndexCard, Input, Kbd, LinearProgress, MetaRow, PageHeader, SampleDataBadge, SectionHeader, Select, SummaryTiles, Textarea, Breadcrumb } from '@/components/ui/primitives';
import { SkillArt } from '@/components/ui/skill-art';
import { StatusPill } from '@/components/ui/status';
import { SignalMark, ConfidenceSignal } from '@/components/ui/signal';
import { MeterRing, SegmentedRing, StateBar } from '@/components/ui/viz';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { SegmentedTabs, TextTabs, Segmented, Switch } from '@/components/ui/tabs';
import { NextStepCard, WorkList, WorkRow, Timeline, AiBadge, ValidatedBadge } from '@/components/ui/cards';
import { EmptyState, ErrorPanel, PageSkeleton, RowsSkeleton, LadderSkeleton } from '@/components/ui/states';
import { Illustration, type IllustrationName } from '@/components/ui/illustration';
import { Dialog } from '@/components/ui/dialog';
import { CodeChip } from '@/components/ui/code-chip';
import { useToast } from '@/components/ui/toast';
import { SkillLadder } from '@/components/learner/skill-ladder';
import { ClassLadderBoard, type LadderLearner } from '@/components/learner/class-ladder';
import { BeforeAfterChart } from '@/components/charts/before-after-chart';
import { useTheme } from '@/components/layout/theme-toggle';
import { LogoMark, LogoLoader, Wordmark } from '@/components/layout/logo';
import { cn } from '@/lib/utils';

// Component gallery with static UI fixtures for visual review only (no learner data from the database).
const fx = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Sample ${String.fromCharCode(65 + i)}`, seed: `LS-FX${i}` }));
const ladderFx: LadderLearner[] = fx(10).map((p, i) => ({
  id: `fx-${i}`, name: p.name, code: p.seed, assessed: true,
  working: { literacy: ['L1', 'L2', 'L2', 'L3', null, 'L5', 'L2', 'L4', 'L2', null][i], numeracy: ['N3', 'N4', 'N4', 'N4', null, 'N5', 'N2', 'N4', 'N6', 'N4'][i] },
  recheck: { literacy: false, numeracy: i === 3 },
  states: [{ skill_id: 'L1', state: 'developing', confidence: 'low', provisional: true }, { skill_id: 'N1', state: 'consistent', confidence: 'medium', provisional: false }],
}));
const skillFx = [
  { skill_id: 'N1', state: 'consistent' as const, p: 0.9, n_eff: 7, sessions: 2, confidence: 'medium' as const, provisional: false, retest_suggested: false },
  { skill_id: 'N2', state: 'consistent' as const, p: 0.88, n_eff: 7, sessions: 2, confidence: 'medium' as const, provisional: false, retest_suggested: false },
  { skill_id: 'N3', state: 'developing' as const, p: 0.83, n_eff: 4, sessions: 1, confidence: 'low' as const, provisional: true, retest_suggested: false },
  { skill_id: 'N4', state: 'not_yet' as const, p: 0.17, n_eff: 4, sessions: 1, confidence: 'low' as const, provisional: true, retest_suggested: false },
];

export default function DevUI() {
  const [theme, setTheme] = useTheme();
  const [width, setWidth] = useState<'390' | '768' | 'full'>('full');
  const [tab, setTab] = useState('all');
  const [ttab, setTtab] = useState('overview');
  const [seg, setSeg] = useState('7-8');
  const [sw, setSw] = useState(true);
  const [dlg, setDlg] = useState(false);
  const toast = useToast();

  return (
    <div className="min-h-dvh bg-paper p-4 sm:p-8">
      <div className="sticky top-0 z-40 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <b className="font-heading">/dev/ui</b>
        <Segmented name="w" label="Viewport" value={width} onChange={(v) => setWidth(v as typeof width)} options={[{ id: '390', label: '390' }, { id: '768', label: '768' }, { id: 'full', label: 'Full' }]} />
        <Segmented name="t" label="Theme" value={theme} onChange={(v) => setTheme(v as 'light' | 'night')} options={[{ id: 'light', label: 'Light' }, { id: 'night', label: 'Night' }]} />
        <span className="text-[12px] text-ink-2">Static fixtures for visual review only.</span>
      </div>
      <div className={cn('mx-auto space-y-12', width === '390' ? 'max-w-[390px]' : width === '768' ? 'max-w-[768px]' : 'max-w-[1240px]')}>
        <div>
          <Breadcrumb items={[{ label: 'Learners', href: '#' }, { label: 'Sample A' }]} />
          <PageHeader display title="Good morning, Teacher" subtitle="Class 3A · 12 learners · Monday 16 Nov"
             />
        </div>

        <S title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="sun">Sun (one per page)</Button>
            <Button variant="quiet-warn">Quiet warn</Button><Button variant="link">Link</Button><Button loading>Saving</Button><Button disabled>Disabled</Button>
            <Button size="sm">Small</Button><Button size="lg">Large</Button><Button size="child">Let&apos;s go</Button>
          </div>
        </S>

        <S title="Signal, status, badges">
          <div className="flex flex-wrap items-center gap-4">
            {[0, 1, 2, 3].map((l) => <SignalMark key={l} level={l as 0 | 1 | 2 | 3} size={32} animate />)}
            <ConfidenceSignal confidence="low" provisional /><ConfidenceSignal confidence="medium" /><ConfidenceSignal confidence="high" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusPill state="not_yet" /><StatusPill state="developing" /><StatusPill state="consistent" /><StatusPill state="insufficient" /><StatusPill state="developing" size="sm" short />
            <AiBadge /><ValidatedBadge /><SampleDataBadge /><Badge>Built-in</Badge><Badge tone="teal">Approved</Badge><Badge tone="sun">Pending</Badge><CodeChip code="LS-7K3Q2A" /><Kbd>⌘K</Kbd>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">{(['teal', 'sun', 'sky', 'clay', 'leaf', 'stone', 'amber'] as Hue[]).map((h) => <IconTile key={h} icon={BookOpen} hue={h} />)}</div>
        </S>

        <S title="Index cards and next step">
          <div className="grid gap-6 md:grid-cols-3">
            <IndexCard tab="Group"><h3 className="font-heading font-semibold">Plain with tab</h3><p className="text-[14px] text-ink-2">Folded tab top-left.</p></IndexCard>
            <IndexCard tab="Note" tabTone="clay" ruled margin><p className="text-[14px] leading-7">Ruled paper with a margin line for notes and activities.</p></IndexCard>
            <IndexCard tab="Answer" tabTone="sky" tint="sky"><p className="text-[14px]">Tinted variant.</p></IndexCard>
          </div>
          <div className="mt-6"><NextStepCard id="dev" sentence="Re-check 3 learners on L4" detail="Their latest session differs from earlier evidence." action={<Button variant="sun">Start re-check</Button>} /></div>
        </S>

        <S title="SkillArt (one per skill, strand and loop stage)">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'literacy', 'numeracy', 'both', 'assess', 'identify', 'group', 'intervene', 'reassess'].map((k) => (
              <figure key={k}><SkillArt skill={k} rounded="all" /><figcaption className="mt-1 text-center font-mono text-[11px] text-ink-2">{k}</figcaption></figure>
            ))}
          </div>
        </S>

        <S title="Brand: mark, mono mark, wordmark, loader, chalk underline">
          <div className="flex flex-wrap items-center gap-8">
            <span className="flex items-center gap-2.5"><LogoMark size={40} /><Wordmark /></span>
            <span className="flex items-center gap-3 rounded-[16px] bg-grad-violet px-4 py-3"><LogoMark size={32} mono className="text-white" /><Wordmark light /></span>
            <span className="flex items-end gap-3">{[16, 24, 32, 48].map((n) => <LogoMark key={n} size={n} />)}</span>
            <LogoLoader size={48} />
            <span className="font-heading text-[28px] font-bold">Good morning, <ChalkUnderline>Ada</ChalkUnderline>.</span>
          </div>
        </S>

        <S title="Summary tiles, meta row, art card">
          <div className="grid gap-6 lg:grid-cols-2">
            <SummaryTiles items={[{ label: 'Learners', value: 12, tone: 'violet', glyph: 'dots' }, { label: 'Checked', value: '92%', tone: 'aqua', glyph: 'check' }, { label: 'Need attention', value: 4, tone: 'tangerine', glyph: 'eye' }, { label: 'Skills shown', value: 38, tone: 'sky', glyph: 'star' }]} />
            <IndexCard interactive art={<SkillArt skill="N4" />}>
              <h3 className="text-[16px] font-semibold">Subtraction group</h3>
              <MetaRow className="mt-2" items={[{ label: 'Learners', value: 5 }, { label: 'Skill', value: 'N4' }, { label: 'Practice', value: '60%' }]} />
            </IndexCard>
          </div>
        </S>

        <S title="Class ladder (click a rung or dot)"><IndexCard><ClassLadderBoard learners={ladderFx} /></IndexCard></S>

        <S title="Skill ladder (individual)"><IndexCard><SkillLadder strand="numeracy" states={skillFx} /></IndexCard></S>

        <S title="Meters, state bar, avatars">
          <div className="flex flex-wrap items-center gap-6">
            <MeterRing value={60} size={44} label="Practice"><span className="text-[11px] font-bold">3/5</span></MeterRing>
            <SegmentedRing label="States" parts={[{ name: 'Not yet', value: 3, color: 'var(--st-not-yet)' }, { name: 'Developing', value: 5, color: 'var(--st-dev)' }, { name: 'Consistent', value: 4, color: 'var(--st-consistent)' }]}><b className="font-heading text-[22px]">12</b><span className="text-[11px] text-ink-2">learners</span></SegmentedRing>
            <div className="w-64"><StateBar label="Sample" counts={{ not_yet: 3, developing: 4, consistent: 4, insufficient: 1 }} /></div>
            <div className="w-40"><LinearProgress value={40} label="Progress" /></div>
            <AvatarStack people={fx(8)} /><Avatar name="Sample" seed="LS-AAAA" size={64} />
          </div>
        </S>

        <S title="Tabs and forms">
          <SegmentedTabs label="Filters" value={tab} onChange={setTab} items={[{ id: 'all', label: 'All', count: 12 }, { id: 'lit', label: 'Literacy not yet', count: 3 }, { id: 'num', label: 'Numeracy not yet', count: 5 }, { id: 'nc', label: 'Not checked', count: 1 }]} />
          <div className="mt-4"><TextTabs label="Sections" value={ttab} onChange={setTtab} items={[{ id: 'overview', label: 'Overview' }, { id: 'history', label: 'History', count: 3 }, { id: 'notes', label: 'Notes' }]} /></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Display name" htmlFor="f1" hint="First name or a nickname only."><Input id="f1" placeholder="Ada" /></Field>
            <Field label="With an error" htmlFor="f2" error="Enter a first name or nickname"><Input id="f2" invalid /></Field>
            <Field label="Grade" htmlFor="f3"><Select id="f3"><option>Primary 3</option></Select></Field>
            <Field label="Note" htmlFor="f4" counter="0/1000"><Textarea id="f4" /></Field>
            <div className="flex flex-wrap items-center gap-4"><Segmented name="age" label="Age band" value={seg} onChange={setSeg} options={['5-6', '7-8', '9-10', '11+'].map((a) => ({ id: a, label: a }))} /><Switch checked={sw} onChange={setSw} label="Example switch" /></div>
            <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setDlg(true)}>Dialog / sheet</Button><Button variant="secondary" onClick={() => toast('Saved. Learner added as LS-7K3Q2A.')}>Toast</Button><Button variant="secondary" onClick={() => toast('Built-in practice (AI unavailable).', 'ai-fallback')}>AI fallback toast</Button></div>
          </div>
        </S>

        <S title="Work rows and timeline">
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkList label="Sample rows">
              <WorkRow leading={<Avatar name="Sample A" seed="LS-FX0" />} title="Sample A" subline="N4 Subtraction" trailing={<StatusPill state="not_yet" size="sm" short />} href="#" />
              <WorkRow leading={<IconTile icon={Users} />} title="Subtraction group" subline="5 learners" trailing={<MeterRing value={40} size={32} label="Practice" />} href="#" />
            </WorkList>
            <IndexCard ruled><Timeline items={[{ id: '1', title: 'Sample C moved to developing on N4', meta: 'Subtraction · 12 Nov', tone: 'leaf' }, { id: '2', title: '3 re-checks suggested', meta: 'Sample E, Sample F', tone: 'sun' }]} /></IndexCard>
          </div>
        </S>

        <S title="Chart"><IndexCard><BeforeAfterChart title="Before and after" data={[{ label: 'First check', N4: 20, L2: 40 }, { label: 'Latest', N4: 65, L2: 70 }]} skills={[{ id: 'N4', name: 'Subtraction' }, { id: 'L2', name: 'Blending' }]} /></IndexCard></S>

        <S title="Illustrations">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {(['empty-learners', 'empty-groups', 'empty-practice', 'empty-results', 'error', 'offline', 'celebrate', 'landing'] as IllustrationName[]).map((n) => <IndexCard key={n}><Illustration name={n} /><p className="mt-1 text-center text-[11px] text-ink-2">{n}</p></IndexCard>)}
          </div>
        </S>

        <S title="States">
          <div className="grid gap-6 lg:grid-cols-2">
            <EmptyState illustration="empty-learners" title="Add your first learners" body="Add first names or nicknames, then run a short check for each child." action={<Button><Plus className="size-4" aria-hidden /> Add learners</Button>} secondary={<Button variant="secondary">Load demo class</Button>} />
            <div className="space-y-4"><ErrorPanel retry={() => {}} details="ref: dev-ui-example" /><RowsSkeleton rows={2} /><IndexCard><LadderSkeleton /></IndexCard></div>
          </div>
          <div className="mt-6"><PageSkeleton /></div>
        </S>
      </div>
      <Dialog open={dlg} onClose={() => setDlg(false)} title="Example dialog" description="Bottom sheet on mobile, centred on desktop.">
        <p className="text-[15px] text-ink-2">Dialog content.</p>
        <div className="mt-4 flex gap-2"><Button onClick={() => setDlg(false)}>Save</Button><Button variant="ghost" onClick={() => setDlg(false)}>Cancel</Button></div>
      </Dialog>
    </div>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><SectionHeader title={title} />{children}</section>;
}
