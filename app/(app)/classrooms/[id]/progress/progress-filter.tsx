'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Select } from '@/components/ui/primitives';

export function ProgressFilter({ skills, value }: { skills: { id: string; name: string }[]; value: string }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="max-w-xs">
      <label htmlFor="pf" className="mb-1 block text-sm font-semibold">Filter by skill</label>
      <Select id="pf" value={value} onChange={(e) => router.push(e.target.value ? `${path}?skill=${e.target.value}` : path)}>
        <option value="">All skills</option>
        {skills.map((s) => <option key={s.id} value={s.id}>{s.id} {s.name}</option>)}
      </Select>
    </div>
  );
}
