'use client';
import { Field, Textarea } from '@/components/ui/primitives';

export function ConsentCheckbox({ checked, onChange, error, id = 'consent' }: { checked: boolean; onChange: (v: boolean) => void; error?: string; id?: string }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
        <input id={id} type="checkbox" className="mt-1 size-5 accent-[#0F6B5C]" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error || undefined} />
        <span className="text-[14px]">I confirm the school or each child&apos;s guardian has agreed to their first name, age band and answers being recorded in LearnSignal.</span>
      </label>
      {error && <p className="mt-1 text-[13px] font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

export function BulkNamesFields({ value, onChange, errors }: { value: { names: string; consent: boolean }; onChange: (v: { names: string; consent: boolean }) => void; errors: Record<string, string> }) {
  return (
    <>
      <Field label="First names or nicknames (one per line)" htmlFor="names" error={errors.names} hint="No surnames, please. Each child gets a random code like LS-3F9A2C.">
        <Textarea id="names" rows={6} value={value.names} onChange={(e) => onChange({ ...value, names: e.target.value })} invalid={!!errors.names} placeholder={'Ada\nTolu\nMusa'} />
      </Field>
      <ConsentCheckbox checked={value.consent} onChange={(c) => onChange({ ...value, consent: c })} error={errors.consent} />
    </>
  );
}
