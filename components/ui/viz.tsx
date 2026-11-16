import { cn } from '@/lib/utils';

/** Circular progress ring (SVG, rounded caps, animated draw). */
export function ProgressRing({ value, size = 40, stroke = 4, color = 'var(--primary)', label, children, className }: {
  value: number; size?: number; stroke?: number; color?: string; label: string; children?: React.ReactNode; className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {v > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} className="ring-draw" style={{ ['--len' as string]: c }} />
        )}
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}

/** Segmented ring: not yet / developing / consistent (+ insufficient) shares. */
export function SegmentedRing({ parts, size = 120, stroke = 12, label, children }: {
  parts: { value: number; color: string; name: string }[]; size?: number; stroke?: number; label: string; children?: React.ReactNode;
}) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 4 : 0;
  let offset = 0;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img"
      aria-label={`${label}: ${parts.map((p) => `${p.name} ${p.value}`).join(', ')}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {parts.filter((p) => p.value > 0).map((p) => {
          const len = Math.max(0, (p.value / total) * c - gap);
          const el = <circle key={p.name} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${len} ${c}`} strokeDashoffset={-offset} />;
          offset += (p.value / total) * c;
          return el;
        })}
      </svg>
      {children && <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</span>}
    </span>
  );
}

/** Tiny bar chart: 8 rounded bars, last (or highlighted) darkest. */
export function MiniBars({ values, highlight, label, className }: { values: number[]; highlight?: number; label: string; className?: string }) {
  const max = Math.max(1, ...values);
  const h = 56;
  const hi = highlight ?? values.length - 1;
  return (
    <svg width={values.length * 14 - 6} height={h} className={className} role="img" aria-label={`${label}: ${values.join(', ')}`}>
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * h);
        return (
          <rect key={i} x={i * 14} y={h - bh} width={8} height={bh} rx={4} className="bar-grow"
            style={{ animationDelay: `${i * 30}ms` }} fill={i === hi ? '#0E1220' : 'rgba(14,18,32,.55)'}>
            <title>{v}</title>
          </rect>
        );
      })}
    </svg>
  );
}
