// Inline-SVG counters for counting items (no emoji images, no external assets).
import { cn } from '@/lib/utils';

type Kind = 'mango' | 'orange' | 'star' | 'ball' | 'cap';
const KIND: Record<string, Kind> = { '🥭': 'mango', '🍊': 'orange', '⭐': 'star', '⚽': 'ball' };

function Shape({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'mango': return <g><ellipse cx="20" cy="22" rx="12" ry="14" fill="#F2A93B" transform="rotate(-20 20 22)" /><path d="M22 8c4-4 9-4 11-2-3 3-7 4-11 2z" fill="#2E9D63" /></g>;
    case 'orange': return <g><circle cx="20" cy="22" r="13" fill="#E8833A" /><circle cx="16" cy="18" r="3" fill="#F6B07A" /><path d="M20 9c3-3 7-3 9-1-3 2-6 3-9 1z" fill="#2E9D63" /></g>;
    case 'star': return <path d="M20 5l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L20 28.6l-9.3 4.9 1.8-10.3L5 15.9l10.4-1.5z" fill="#FFB627" stroke="#5C3D00" strokeWidth="1.2" strokeLinejoin="round" />;
    case 'ball': return <g><circle cx="20" cy="20" r="14" fill="#fff" stroke="#16222B" strokeWidth="2" /><path d="M20 13l6 4-2 7h-8l-2-7z" fill="#16222B" /></g>;
    case 'cap': return <g><circle cx="20" cy="20" r="13" fill="#3B82C4" /><circle cx="20" cy="20" r="9" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="3 3" /></g>;
  }
}

/** Renders "🥭🥭🥭" style picture strings as rows of simple SVG objects, grouped in fives for easy counting. */
export function Counters({ picture, className }: { picture: string; className?: string }) {
  const parts = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(picture)].map((s) => s.segment).filter((s) => s.trim());
  const kind = KIND[parts[0]] ?? 'cap';
  const groups: number[][] = [];
  parts.forEach((_, i) => { if (i % 5 === 0) groups.push([]); groups[groups.length - 1].push(i); });
  return (
    <div className={cn('flex flex-wrap gap-x-5 gap-y-2', className)} role="img" aria-label={`${parts.length} ${kind === 'cap' ? 'objects' : `${kind}${parts.length === 1 ? '' : 's'}`}`}>
      {groups.map((g, gi) => (
        <span key={gi} className="flex gap-1">
          {g.map((i) => <svg key={i} viewBox="0 0 40 40" className="size-11 sm:size-12" aria-hidden><Shape kind={kind} /></svg>)}
        </span>
      ))}
    </div>
  );
}
