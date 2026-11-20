'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, IndexCard, Input, Select, Textarea } from '@/components/ui/primitives';
import { Segmented } from '@/components/ui/tabs';
import { ErrorPanel } from '@/components/ui/states';
import { Illustration } from '@/components/ui/illustration';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { ClassLadder, type LadderLearner } from '@/components/learner/class-ladder';
import { createClassroom, createSchool } from '@/lib/actions/setup';
import { addLearnersBulk } from '@/lib/actions/learners';
import { loadDemoClass } from '@/lib/actions/demo';
import { cn } from '@/lib/utils';

const NG_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Outside Nigeria'];
const GRADES = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Mixed / remedial'];
const STEPS = ['School', 'Class', 'Learners'];

export function OnboardingFlow({ schools, firstName }: { schools: { id: string; name: string }[]; firstName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(schools.length ? 1 : 0);
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '');
  const [classroomId, setClassroomId] = useState('');
  const [school, setSchool] = useState({ name: '', state: '' });
  const [cls, setCls] = useState({ name: '', grade: 'Primary 3' });
  const [lr, setLr] = useState({ names: '', age: '7-8', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const names = lr.names.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
  const preview: LadderLearner[] = names.slice(0, 40).map((n, i) => ({ id: `p${i}`, name: n, code: `preview-${i}-${n}`, working: { literacy: null, numeracy: null }, recheck: { literacy: false, numeracy: false }, states: [], assessed: false }));
  const run = (fn: () => Promise<void>) => { setFormError(null); start(fn); };
  const fail = (r: { error: { fields?: Record<string, string>; message: string } }) => { setErrors(r.error.fields ?? {}); setFormError(r.error.fields ? null : r.error.message); };

  if (done) {
    return (
      <div className="mx-auto max-w-md py-10 text-center fade-up">
        <div className="mx-auto w-48"><Illustration name="celebrate" /></div>
        <h1 className="mt-4 font-heading text-[30px] font-bold">Your class is ready</h1>
        <p className="mt-2 text-ink-2">Next, run a short check for each child.</p>
        <Button className="mt-6" onClick={() => router.push(done)}>Go to Today</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-24 md:pb-0">
      <h1 className="font-heading text-[30px] font-bold leading-9 sm:text-[40px] sm:leading-[46px]">Welcome{firstName ? `, ${firstName}` : ''}</h1>
      <p className="mt-2 text-ink-2">Three short steps. You can change everything later.</p>

      {/* three stepping stones */}
      <ol className="my-8 flex items-center" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={i === step ? 'step' : undefined}>
            <span className={cn('flex items-center gap-2 text-[14px] font-semibold', i <= step ? 'text-ink' : 'text-ink-3')}>
              <span className={cn('flex h-9 w-12 items-center justify-center rounded-[50%] border-2 text-[13px]',
                i < step ? 'border-teal bg-teal text-white' : i === step ? 'border-violet-500 bg-violet-100 text-violet-700' : 'border-line-strong bg-card')}>
                {i < step ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>{s}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className={cn('mx-3 h-0.5 flex-1 rounded-full', i < step ? 'bg-teal' : 'bg-line')} />}
          </li>
        ))}
      </ol>

      {formError && <ErrorPanel message={formError} className="mb-5" />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <IndexCard tab={`Step ${step + 1} of 3`}>
          {step === 0 && (
            <form id="ob" className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
              const r = await createSchool(school);
              if (!r.ok) return fail(r);
              setErrors({}); setSchoolId(r.data.id); setStep(1);
            }); }}>
              <h2 className="font-heading text-[20px] font-semibold">Your school</h2>
              <Field label="School name" htmlFor="sname" error={errors.name}><Input id="sname" value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} invalid={!!errors.name} placeholder="e.g. Ikeja Primary School" /></Field>
              <Field label="State" htmlFor="sstate"><Select id="sstate" value={school.state} onChange={(e) => setSchool({ ...school, state: e.target.value })}><option value="">Choose (optional)</option>{NG_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <p className="text-[13px] text-ink-2">You become this school&apos;s admin. Admins see totals only, never children&apos;s names.</p>
            </form>
          )}
          {step === 1 && (
            <form id="ob" className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
              const r = await createClassroom({ schoolId, name: cls.name, grade: cls.grade, language: 'en' });
              if (!r.ok) return fail(r);
              setErrors({}); setClassroomId(r.data.id); setStep(2);
            }); }}>
              <h2 className="font-heading text-[20px] font-semibold">Your class</h2>
              {schools.length > 1 && <Field label="School" htmlFor="school"><Select id="school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>}
              <Field label="Class name" htmlFor="cname" error={errors.name}><Input id="cname" value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} invalid={!!errors.name} placeholder="e.g. Primary 3A" /></Field>
              <Field label="Grade" htmlFor="grade" error={errors.grade}><Select id="grade" value={cls.grade} onChange={(e) => setCls({ ...cls, grade: e.target.value })}>{GRADES.map((g) => <option key={g}>{g}</option>)}</Select></Field>
              <Field label="Language" htmlFor="lang" hint="Yoruba, Hausa and Igbo: coming soon."><Select id="lang" disabled><option>English</option></Select></Field>
              <div className="rounded-[12px] border border-dashed border-line-strong p-3">
                <p className="text-[14px]">Just looking around?</p>
                <Button type="button" variant="secondary" size="sm" className="mt-2" disabled={pending} onClick={() => run(async () => {
                  const r = await loadDemoClass(schoolId);
                  if (!r.ok) { setFormError(r.error.message); return; }
                  toast('Demo class loaded (sample data).'); router.push(`/classrooms/${r.data.classroomId}`);
                })}><FlaskConical className="size-4" aria-hidden /> Load the demo class (sample data)</Button>
              </div>
            </form>
          )}
          {step === 2 && (
            <form id="ob" className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); run(async () => {
              const r = await addLearnersBulk({ classroomId, names: lr.names, ageBand: lr.age, consent: lr.consent || undefined });
              if (!r.ok) return fail(r);
              setDone(`/classrooms/${classroomId}`);
            }); }}>
              <h2 className="font-heading text-[20px] font-semibold">Your learners</h2>
              <Field label="First names or nicknames, one per line" htmlFor="names" error={errors.names} hint="No surnames, please. Each child gets a random code.">
                <Textarea id="names" rows={7} value={lr.names} onChange={(e) => setLr({ ...lr, names: e.target.value })} invalid={!!errors.names} placeholder={'Ada\nTolu\nMusa'} className="ruled leading-7" />
              </Field>
              <div><span className="mb-1.5 block text-[14px] font-semibold">Usual age band</span><Segmented name="ob-age" label="Age band" value={lr.age} onChange={(v) => setLr({ ...lr, age: v })} options={['5-6', '7-8', '9-10', '11+'].map((a) => ({ id: a, label: a }))} /></div>
              <label htmlFor="ob-consent" className={cn('flex cursor-pointer items-start gap-3 rounded-[12px] border p-3', errors.consent ? 'border-st-notyet' : 'border-line')}>
                <input id="ob-consent" type="checkbox" className="mt-0.5 size-5 accent-[var(--teal)]" checked={lr.consent} onChange={(e) => setLr({ ...lr, consent: e.target.checked })} />
                <span className="text-[14px]">The school or each child&apos;s guardian has agreed to their first name, age band and answers being recorded here.</span>
              </label>
              {errors.consent && <p className="text-[12px] font-medium text-st-notyet" role="alert">{errors.consent}</p>}
            </form>
          )}
          <div className="mt-6 hidden gap-2 md:flex">
            <Button type="submit" form="ob" loading={pending}>{step === 2 ? `Add ${names.length || ''} learner${names.length === 1 ? '' : 's'}` : 'Continue'}</Button>
            {step === 2 && <Button type="button" variant="ghost" onClick={() => setDone(`/classrooms/${classroomId}`)}>Skip for now</Button>}
          </div>
        </IndexCard>

        <aside className="hidden lg:block" aria-label="Preview">
          <IndexCard tab="Preview" tabTone="stone" tint="plain">
            <p className="font-heading text-[16px] font-semibold">{cls.name || 'Your class'}</p>
            <p className="mb-4 text-[13px] text-ink-2">This is how your class ladder will look. Each dot is a learner.</p>
            {names.length ? (
              <>
                <div className="mb-3 flex flex-wrap gap-1">{names.slice(0, 24).map((n, i) => <Avatar key={i} name={n} size={24} label={n} className="dot-settle" />)}</div>
                <div className="pointer-events-none opacity-70"><ClassLadder learners={preview} strand="numeracy" interactive={false} /></div>
              </>
            ) : <div className="pointer-events-none opacity-50"><ClassLadder learners={[]} strand="numeracy" interactive={false} /></div>}
          </IndexCard>
        </aside>
      </div>

      {/* mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-[68px] z-30 flex gap-2 border-t border-line bg-paper/95 p-3 backdrop-blur md:hidden">
        <Button type="submit" form="ob" loading={pending} className="flex-1">{step === 2 ? 'Add learners' : 'Continue'}</Button>
        {step === 2 && <Button type="button" variant="ghost" onClick={() => setDone(`/classrooms/${classroomId}`)}>Skip</Button>}
      </div>
    </div>
  );
}
