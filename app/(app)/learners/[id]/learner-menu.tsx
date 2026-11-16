'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/primitives';
import { Segmented } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { archiveLearner, updateLearner } from '@/lib/actions/learners';

export function LearnerMenu({ learner }: { learner: { id: string; name: string; ageBand: string | null; archived: boolean } }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: learner.name, age: learner.ageBand ?? '' });
  const [err, setErr] = useState<string>();
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" aria-label="More actions" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="px-3"><MoreHorizontal className="size-5" /></Button>
      {open && (
        <div role="menu" className="absolute bottom-12 right-0 z-50 w-52 rounded-[18px] border border-line bg-card p-1.5 shadow-pop md:bottom-auto md:top-12">
          <button role="menuitem" onClick={() => { setOpen(false); setEdit(true); }} className="flex min-h-11 w-full items-center gap-2 rounded-[12px] px-3 text-[14px] hover:bg-paper-2"><Pencil className="size-4" aria-hidden /> Edit details</button>
          <button role="menuitem" disabled={pending} onClick={() => start(async () => {
            const r = await archiveLearner(learner.id, !learner.archived);
            setOpen(false);
            if (!r.ok) toast(r.error.message, 'error'); else { toast(learner.archived ? `${learner.name} restored.` : `${learner.name} archived. Their history is kept.`); router.refresh(); }
          })} className="flex min-h-11 w-full items-center gap-2 rounded-[12px] px-3 text-[14px] hover:bg-paper-2">
            {learner.archived ? <><ArchiveRestore className="size-4" aria-hidden /> Restore</> : <><Archive className="size-4" aria-hidden /> Archive</>}
          </button>
        </div>
      )}
      <Dialog open={edit} onClose={() => setEdit(false)} title="Edit learner">
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); start(async () => {
          const r = await updateLearner({ learnerId: learner.id, displayName: form.name, ageBand: form.age || null });
          if (!r.ok) { setErr(r.error.fields?.displayName ?? r.error.message); return; }
          setErr(undefined); setEdit(false); toast('Saved.'); router.refresh();
        }); }}>
          <Field label="First name or nickname" htmlFor="ed-name" error={err} hint="Up to 30 characters. No surnames."><Input id="ed-name" maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!err} /></Field>
          <div><span className="mb-1.5 block text-[14px] font-semibold">Age band</span><Segmented name="ed-age" label="Age band" value={form.age} onChange={(v) => setForm({ ...form, age: v })} options={['5-6', '7-8', '9-10', '11+'].map((a) => ({ id: a, label: a }))} /></div>
          <div className="flex gap-2"><Button type="submit" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button></div>
        </form>
      </Dialog>
    </div>
  );
}
