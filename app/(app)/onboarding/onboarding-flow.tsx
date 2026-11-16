'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, School, Users, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, Field, Input, Select } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { createClassroom, createSchool } from '@/lib/actions/setup';
import { addLearnersBulk } from '@/lib/actions/learners';
import { loadDemoClass } from '@/lib/actions/demo';
import { cn } from '@/lib/utils';
import { BulkNamesFields } from '@/components/assessment/bulk-names-fields';

const NG_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Outside Nigeria'];
const GRADES = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Mixed / remedial'];

export function OnboardingFlow({ schools, firstName }: { schools: { id: string; name: string }[]; firstName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(schools.length ? 1 : 0);
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '');
  const [classroomId, setClassroomId] = useState('');
  const [school, setSchool] = useState({ name: '', state: '' });
  const [cls, setCls] = useState({ name: '', grade: 'Primary 3' });
  const [names, setNames] = useState({ names: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const steps = [{ label: 'School', icon: School }, { label: 'Classroom', icon: GraduationCap }, { label: 'Learners', icon: Users }];

  const run = (fn: () => Promise<void>) => { setFormError(null); start(fn); };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-bold">Welcome{firstName ? `, ${firstName}` : ''}</h1>
      <p className="mt-1 text-muted">Three quick steps. You can change everything later.</p>

      <ol className="my-6 flex gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s.label} className={cn('flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-[14px] font-semibold', i === step ? 'border-primary bg-primary-soft text-primary-dark' : i < step ? 'border-line text-st-consistent' : 'border-line text-muted')} aria-current={i === step ? 'step' : undefined}>
            {i < step ? <Check className="size-4" aria-hidden /> : <s.icon className="size-4" aria-hidden />} {s.label}
          </li>
        ))}
      </ol>

      {formError && <ErrorPanel message={formError} className="mb-4" />}

      {step === 0 && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
            const r = await createSchool(school);
            if (!r.ok) { setErrors(r.error.fields ?? {}); setFormError(r.error.fields ? null : r.error.message); return; }
            setErrors({}); setSchoolId(r.data.id); setStep(1);
          }); }}>
            <h2 className="text-xl font-bold">Your school</h2>
            <Field label="School name" htmlFor="sname" error={errors.name}><Input id="sname" value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} invalid={!!errors.name} placeholder="e.g. Ikeja Primary School" /></Field>
            <Field label="State" htmlFor="sstate" error={errors.state}>
              <Select id="sstate" value={school.state} onChange={(e) => setSchool({ ...school, state: e.target.value })}>
                <option value="">Choose (optional)</option>{NG_STATES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <p className="text-[13px] text-muted">You become this school&apos;s admin. Admins see totals only, never children&apos;s names.</p>
            <Button type="submit" loading={pending}>Continue</Button>
          </form>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
            const r = await createClassroom({ schoolId, name: cls.name, grade: cls.grade, language: 'en' });
            if (!r.ok) { setErrors(r.error.fields ?? {}); setFormError(r.error.fields ? null : r.error.message); return; }
            setErrors({}); setClassroomId(r.data.id); setStep(2);
          }); }}>
            <h2 className="text-xl font-bold">Your classroom</h2>
            {schools.length > 1 && (
              <Field label="School" htmlFor="school"><Select id="school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            )}
            <Field label="Class name" htmlFor="cname" error={errors.name}><Input id="cname" value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} invalid={!!errors.name} placeholder="e.g. Primary 3A" /></Field>
            <Field label="Grade" htmlFor="grade" error={errors.grade}><Select id="grade" value={cls.grade} onChange={(e) => setCls({ ...cls, grade: e.target.value })}>{GRADES.map((g) => <option key={g}>{g}</option>)}</Select></Field>
            <Field label="Language of instruction" htmlFor="lang" hint="Only English content is available in this version."><Select id="lang" disabled><option>English</option></Select></Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={pending}>Continue</Button>
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(async () => {
                const r = await loadDemoClass(schoolId);
                if (!r.ok) { setFormError(r.error.message); return; }
                toast('Demo class loaded (sample data).');
                router.push(`/classrooms/${r.data.classroomId}`);
              })}><Sparkles className="size-4" aria-hidden /> Load demo class instead</Button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(async () => {
            const r = await addLearnersBulk({ classroomId, names: names.names, consent: names.consent || undefined });
            if (!r.ok) { setErrors(r.error.fields ?? {}); setFormError(r.error.fields ? null : r.error.message); return; }
            toast(`${r.data.added} learner${r.data.added === 1 ? '' : 's'} added.${r.data.skipped.length ? ` ${r.data.skipped.length} skipped (too long).` : ''}`);
            router.push(`/classrooms/${classroomId}`);
          }); }}>
            <h2 className="text-xl font-bold">Add your first learners</h2>
            <BulkNamesFields value={names} onChange={setNames} errors={errors} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={pending}>Add learners</Button>
              <Button type="button" variant="ghost" onClick={() => router.push(`/classrooms/${classroomId}`)}>Skip for now</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
