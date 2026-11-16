'use client';
import { useRouter } from 'next/navigation';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/primitives';

export function SchoolActions({ csv, schools, current }: { csv: string[][]; schools: { id: string; name: string }[]; current: string }) {
  const router = useRouter();
  const download = () => {
    const body = csv.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'learnsignal-school-insights.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <>
      {schools.length > 1 && <Select aria-label="School" className="w-48" value={current} onChange={(e) => router.push(`/school?school=${e.target.value}`)}>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}
      <Button variant="secondary" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print</Button>
      <Button variant="secondary" onClick={download}><Download className="size-4" aria-hidden /> Export CSV</Button>
    </>
  );
}
