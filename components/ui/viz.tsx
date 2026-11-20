import { cn } from '@/lib/utils';
import { STATUS } from './status';

/** MeterRing: SVG ring with rounded caps, animated draw, centre slot. */
export function MeterRing({ value, size = 40, stroke = 4, color = 'var(--teal)', label, children, className }: {
  value: number; size?: number; stroke?: number; color?: string; label: string; children?: React.ReactNode; className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {v > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} className="ring-draw" style={{ ['--len' as string]: c }} />}
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}
export const ProgressRing = MeterRing;

/** Segmented ring (not yet / developing / consistent / insufficient). */
export function SegmentedRing({ parts, size = 120, stroke = 12, label, children }: {
  parts: { value: number; color: string; name: string }[]; size?: number; stroke?: number; label: string; children?: React.ReactNode;
}) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 4 : 0;
  let offset = 0;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${parts.map((p) => `${p.name} ${p.value}`).join(', ')}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {parts.filter((p) => p.value > 0).map((p) => {
          const len = Math.max(0, (p.value / total) * c - gap);
          const el = <circle key={p.name} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${len} ${c}`} strokeDashoffset={-offset} />;
          offset += (p.value / total) * c;
          return el;
        })}
      </svg>
      {children && <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</span>}
    </span>
  );
}

/** StateBar: slim stacked bar with rounded ends and an inline legend with counts. */
export function StateBar({ counts, label, legend = true, hrefFor }: { counts: { not_yet: number; developing: number; consistent: number; insufficient: number }; label: string; legend?: boolean; hrefFor?: (state: 'not_yet' | 'developing' | 'consistent' | 'insufficient') => string }) {
  const order = ['consistent', 'developing', 'not_yet', 'insufficient'] as const;
  const total = order.reduce((n, k) => n + counts[k], 0);
  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-paper-2"
        {...(hrefFor ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `${label}: ${order.map((k) => `${counts[k]} ${STATUS[k].short.toLowerCase()}`).join(', ')}` })}>
        {total > 0 && order.map((k) => counts[k] > 0 && (hrefFor
          ? <a key={k} href={hrefFor(k)} tabIndex={-1} className="h-full transition-opacity first:rounded-l-full last:rounded-r-full hover:opacity-80" style={{ width: `${(counts[k] / total) * 100}%`, background: STATUS[k].fill }} />
          : <span key={k} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(counts[k] / total) * 100}%`, background: STATUS[k].fill }} />))}
      </div>
      {legend && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1" {...(hrefFor ? { 'aria-label': label } : { 'aria-hidden': true })}>
          {order.filter((k) => counts[k] > 0).map((k) => {
            const inner = <><span className="size-2 rounded-full" style={{ background: STATUS[k].fill }} aria-hidden />{STATUS[k].short} <b className="tabular text-ink">{counts[k]}</b></>;
            return hrefFor
              ? <li key={k}><a href={hrefFor(k)} className="flex min-h-7 items-center gap-1 rounded-full px-1.5 -mx-1.5 text-[12px] text-ink-2 hover:bg-surface-2 hover:text-ink">{inner}</a></li>
              : <li key={k} className="flex items-center gap-1 text-[12px] text-ink-2">{inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
