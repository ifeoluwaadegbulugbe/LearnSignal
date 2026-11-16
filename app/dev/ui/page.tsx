'use client';
import { useState } from 'react';
import { BookOpen, Users, ClipboardCheck, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconTile, type Hue } from '@/components/ui/icon-tile';
import { Badge, Card, Field, Input, Kbd, LinearProgress, PageHeader, SampleDataBadge, SectionHeader, Select, StatChip, Textarea, Stat } from '@/components/ui/primitives';
import { StatusPill, ConfidenceDots } from '@/components/ui/status';
import { ProgressRing, SegmentedRing, MiniBars } from '@/components/ui/viz';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { FilterTabs, UnderlineTabs, Segmented, Switch } from '@/components/ui/tabs';
import { AnnouncementBanner, HeroCard, PastelStatCard, ListCard, ListRow, AiBadge, ValidatedBadge } from '@/components/ui/cards';
import { EmptyState, ErrorPanel, PageSkeleton, RowsSkeleton, CardSkeleton } from '@/components/ui/states';
import { Illustration, type IllustrationName } from '@/components/ui/illustration';
import { Dialog } from '@/components/ui/dialog';
import { CodeChip } from '@/components/ui/code-chip';
import { useToast } from '@/components/ui/toast';
import { SkillLadder } from '@/components/learner/skill-ladder';
import { DistributionChart } from '@/components/charts/distribution-chart';
import { BeforeAfterChart } from '@/components/charts/before-after-chart';
import { useTheme } from '@/components/layout/theme-toggle';
import { cn } from '@/lib/utils';

// Component gallery. All values below are static UI fixtures for visual review only (no learner data).
const people = [{ name: 'Sample A' }, { name: 'Sample B' }, { name: 'Sample C' }, { name: 'Sample D' }, { name: 'Sample E' }, { name: 'Sample F' }];
const ladder = [
  { skill_id: 'N1', state: 'consistent' as const, p: 0.9, n_eff: 7, sessions: 2, confidence: 'medium' as const, provisional: false, retest_suggested: false },
  { skill_id: 'N2', state: 'consistent' as const, p: 0.88, n_eff: 7, sessions: 2, confidence: 'medium' as const, provisional: false, retest_suggested: false },
  { skill_id: 'N3', state: 'developing' as const, p: 0.83, n_eff: 4, sessions: 1, confidence: 'low' as const, provisional: true, retest_suggested: false },
  { skill_id: 'N4', state: 'not_yet' as const, p: 0.17, n_eff: 4, sessions: 1, confidence: 'low' as const, provisional: true, retest_suggested: false },
  { skill_id: 'N5', state: 'insufficient' as const, p: 0.5, n_eff: 2, sessions: 1, confidence: 'low' as const, provisional: true, retest_suggested: false },
];

export default function DevUI() {
  const [theme, setTheme] = useTheme();
  const [width, setWidth] = useState<'390' | '768' | 'full'>('full');
  const [tab, setTab] = useState('all');
  const [utab, setUtab] = useState('overview');
  const [seg, setSeg] = useState('7-8');
  const [sw, setSw] = useState(true);
  const [dlg, setDlg] = useState(false);
  const toast = useToast();

  return (
    <div className="min-h-dvh bg-bg p-4 sm:p-8">
      <div className="sticky top-0 z-40 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <b>/dev/ui</b>
        <Segmented name="w" label="Viewport" value={width} onChange={(v) => setWidth(v as typeof width)} options={[{ id: '390', label: '390' }, { id: '768', label: '768' }, { id: 'full', label: 'Full' }]} />
        <Segmented name="t" label="Theme" value={theme} onChange={(v) => setTheme(v as 'light' | 'dark')} options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} />
        <span className="text-[12px] text-ink-3">Static fixtures for visual review only.</span>
      </div>
      <div className={cn('mx-auto space-y-10', width === '390' ? 'max-w-[390px]' : width === '768' ? 'max-w-[768px]' : 'max-w-[1320px]')}>
        <PageHeader display title="Good morning, Teacher" subtitle="Class 3A · 12 learners · Monday 16 Nov" actions={<><StatChip icon={Users} value={12} label="Learners" /><StatChip icon={ClipboardCheck} hue="mint" value="92%" label="Assessed" /><StatChip icon={AlertCircle} hue="amber" value={3} label="Need attention" /></>} />

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger (amber)</Button><Button variant="link">Link</Button><Button loading>Loading</Button><Button disabled>Disabled</Button>
            <Button size="sm">Small</Button><Button size="lg">Large pill</Button>
            <span className="rounded-xl bg-sidebar p-2"><Button variant="lime" pill>Lime on dark</Button></span>
            <Button size="child" variant="primary">Child 64</Button>
          </div>
        </Section>

        <Section title="Icon tiles, badges, chips">
          <div className="flex flex-wrap items-center gap-3">
            {(['indigo', 'lime', 'sky', 'peach', 'lilac', 'mint', 'amber', 'grey'] as Hue[]).map((h) => <IconTile key={h} icon={BookOpen} hue={h} />)}
            <Badge>Neutral</Badge><Badge tone="primary">Primary</Badge><Badge tone="mint">Mint</Badge><Badge tone="accent">Amber</Badge><Badge tone="dark">Dark</Badge>
            <AiBadge /><ValidatedBadge /><SampleDataBadge /><CodeChip code="LS-7K3Q2A" /><Kbd>⌘K</Kbd>
          </div>
        </Section>

        <Section title="Status, confidence, rings, bars">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill state="not_yet" /><StatusPill state="developing" /><StatusPill state="consistent" /><StatusPill state="insufficient" /><StatusPill state="developing" size="sm" short />
            <ConfidenceDots confidence="low" provisional /><ConfidenceDots confidence="high" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <ProgressRing value={64} label="Completion"><span className="text-[11px] font-bold">64</span></ProgressRing>
            <ProgressRing value={92} size={72} stroke={8} color="var(--st-consistent)" label="Assessed"><span className="text-[16px] font-bold">92%</span></ProgressRing>
            <SegmentedRing label="States" parts={[{ name: 'Not yet', value: 3, color: 'var(--st-not-yet)' }, { name: 'Developing', value: 5, color: 'var(--st-dev)' }, { name: 'Consistent', value: 4, color: 'var(--st-consistent)' }]}><b className="text-[20px]">12</b><span className="text-[11px] text-ink-2">learners</span></SegmentedRing>
            <span className="rounded-xl bg-g-lime p-3"><MiniBars values={[2, 4, 3, 6, 5, 7, 4, 8]} label="Sample bars" /></span>
            <div className="w-48"><LinearProgress value={40} label="Progress" /></div>
            <AvatarStack people={people} /><Avatar name="Sample" size={56} />
          </div>
        </Section>

        <Section title="Tabs and form controls">
          <FilterTabs label="Filters" value={tab} onChange={setTab} items={[{ id: 'all', label: 'All', count: 12 }, { id: 'lit', label: 'Literacy: not yet', count: 3 }, { id: 'num', label: 'Numeracy: not yet', count: 5 }, { id: 'na', label: 'Not assessed', count: 1 }]} />
          <div className="mt-4"><UnderlineTabs label="Sections" value={utab} onChange={setUtab} items={[{ id: 'overview', label: 'Overview' }, { id: 'history', label: 'History', count: 3 }, { id: 'notes', label: 'Notes' }]} /></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Display name" htmlFor="f1" hint="First name or a nickname only."><Input id="f1" placeholder="Ada" /></Field>
            <Field label="With an error" htmlFor="f2" error="Enter a first name or nickname"><Input id="f2" invalid /></Field>
            <Field label="Select" htmlFor="f3"><Select id="f3"><option>Primary 3</option></Select></Field>
            <Field label="Notes" htmlFor="f4" counter="0/1000"><Textarea id="f4" /></Field>
            <div className="flex items-center gap-4"><Segmented name="age" label="Age band" value={seg} onChange={setSeg} options={['5-6', '7-8', '9-10', '11+'].map((a) => ({ id: a, label: a }))} /><Switch checked={sw} onChange={setSw} label="Example switch" /></div>
            <div className="flex gap-2"><Button variant="secondary" onClick={() => setDlg(true)}>Open dialog / sheet</Button><Button variant="secondary" onClick={() => toast('Saved. Learner added as LS-7K3Q2A.')}>Toast</Button><Button variant="secondary" onClick={() => toast('AI unavailable — showing built-in practice.', 'ai-fallback')}>AI fallback toast</Button></div>
          </div>
        </Section>

        <Section title="Banners and hero">
          <AnnouncementBanner id="dev-demo" tag="Next step" title="Review suggested groups" body="Five learners share the same working skill." href="#" linkLabel="Open planner" />
          <div className="mt-4"><HeroCard tag="Next best step" title="Assess 1 learner who hasn't been checked yet" body="A baseline takes about 8–10 minutes per strand." people={people.slice(0, 3)} peopleLabel="3 waiting" action={<Button variant="lime" pill>Start a check</Button>} /></div>
        </Section>

        <Section title="Pastel stat cards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(['lime', 'lilac', 'sky', 'peach'] as const).map((t, i) => <PastelStatCard key={t} tone={t} values={[3, 5, 2, 6, 4, 7, 5, 8].map((v) => v + i)} chip={`${20 + i * 10}%`} title={['Subtraction', 'Blending', 'Comprehension', 'Place value'][i]} caption="5 learners working here" people={people.slice(0, 5)} href="#" barsLabel="Sample distribution" />)}
          </div>
        </Section>

        <Section title="List card">
          <ListCard label="Groups">
            <ListRow leading={<IconTile icon={Users} hue="lilac" size={56} />} tag="Numeracy · N4" title="Subtraction within 20" meta={[{ label: 'Members', value: 5 }, { label: 'Practice', value: '3/5' }]} ring={<ProgressRing value={60} label="Practice completion" />} trailing={<Button variant="secondary" size="sm">Continue</Button>} />
            <ListRow leading={<IconTile icon={BookOpen} hue="lime" size={56} />} tag="Literacy · L2" title="Blending sounds into simple words" meta={[{ label: 'Members', value: 3 }, { label: 'Practice', value: '—' }]} ring={<ProgressRing value={0} label="Practice completion" />} trailing={<Button variant="secondary" size="sm">Start</Button>} />
          </ListCard>
        </Section>

        <Section title="Skill ladder (click a node)"><Card><SkillLadder strand="numeracy" states={ladder} /></Card></Section>

        <Section title="Charts">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><DistributionChart title="Numeracy" data={[{ skill: 'N1', name: 'Numbers 0–20', not_yet: 0, developing: 2, consistent: 9, insufficient: 1 }, { skill: 'N4', name: 'Subtraction', not_yet: 5, developing: 3, consistent: 3, insufficient: 1 }]} /></Card>
            <Card><BeforeAfterChart title="Before and after" data={[{ label: 'First', N4: 20, L2: 40 }, { label: 'Latest', N4: 65, L2: 70 }]} skills={[{ id: 'N4', name: 'Subtraction' }, { id: 'L2', name: 'Blending' }]} /></Card>
          </div>
        </Section>

        <Section title="Illustrations">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            {(['empty-learners', 'empty-groups', 'empty-exercises', 'empty-results', 'error', 'offline', 'celebrate', 'landing-hero'] as IllustrationName[]).map((n) => <Card key={n} className="p-3 sm:p-3"><Illustration name={n} /><p className="mt-1 text-center text-[11px] text-ink-3">{n}</p></Card>)}
          </div>
        </Section>

        <Section title="States">
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyState illustration="empty-learners" title="Add your first learners" body="Add first names or nicknames, then run a 10-minute check for each child." action={<Button><Plus className="size-4" aria-hidden /> Add learners</Button>} secondary={<Button variant="link">Load demo class</Button>} />
            <div className="space-y-4"><ErrorPanel retry={() => {}} details="ref: dev-ui-example" /><CardSkeleton /></div>
          </div>
          <div className="mt-4"><RowsSkeleton rows={2} /></div>
          <div className="mt-4"><PageSkeleton /></div>
        </Section>

        <Section title="Stat card"><div className="grid gap-4 sm:grid-cols-3"><Stat label="Learning sessions" value={24} icon={ClipboardCheck} /><Stat label="Practice completed" value="7/9" icon={Sparkles} hue="lilac" /></div></Section>
      </div>
      <Dialog open={dlg} onClose={() => setDlg(false)} title="Example dialog" description="Bottom sheet on mobile, centred card on desktop.">
        <p className="text-[14px] text-ink-2">Dialog content.</p>
        <div className="mt-4 flex gap-2"><Button onClick={() => setDlg(false)}>Save</Button><Button variant="ghost" onClick={() => setDlg(false)}>Cancel</Button></div>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><SectionHeader title={title} />{children}</section>;
}
