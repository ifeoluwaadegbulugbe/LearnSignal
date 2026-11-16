// Inline SVG illustration set (flat shapes, pastel palette, no faces, no external images).
import { cn } from '@/lib/utils';

export type IllustrationName = 'empty-learners' | 'empty-groups' | 'empty-exercises' | 'empty-results' | 'error' | 'offline' | 'celebrate' | 'landing-hero' | 'skill-steps';

const LIME = '#C8F135', LILAC = '#B9A8FF', SKY = '#9CCBFF', PEACH = '#FFB996', MINT = '#9FE6C1', INK = '#0E1220', AMBER = '#F2B15C';

export function Illustration({ name, className, title }: { name: IllustrationName; className?: string; title?: string }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  const common = { viewBox: '0 0 200 140', className: cn('h-auto w-full', className), ...a11y };
  switch (name) {
    case 'empty-learners':
      return (
        <svg {...common}>
          <circle cx="100" cy="74" r="58" fill={LILAC} opacity=".25" />
          <rect x="44" y="52" width="48" height="60" rx="12" fill={SKY} /><circle cx="68" cy="44" r="14" fill={SKY} />
          <rect x="108" y="58" width="48" height="54" rx="12" fill={LIME} /><circle cx="132" cy="48" r="13" fill={LIME} />
          <rect x="84" y="80" width="32" height="40" rx="10" fill={PEACH} /><circle cx="100" cy="72" r="11" fill={PEACH} />
          <path d="M150 22v16M142 30h16" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'empty-groups':
      return (
        <svg {...common}>
          <circle cx="62" cy="72" r="38" fill={LIME} opacity=".55" /><circle cx="138" cy="72" r="38" fill={LILAC} opacity=".55" />
          {[[48, 62], [70, 84], [60, 96], [130, 60], [150, 82]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill={INK} opacity=".8" />)}
          <path d="M92 40c10-8 26-8 36 0" stroke={INK} strokeWidth="2.5" strokeDasharray="4 5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'empty-exercises':
      return (
        <svg {...common}>
          <rect x="40" y="30" width="86" height="90" rx="14" fill={SKY} opacity=".55" transform="rotate(-6 83 75)" />
          <rect x="70" y="24" width="90" height="96" rx="14" fill="#fff" stroke={LILAC} strokeWidth="3" />
          <rect x="84" y="44" width="50" height="8" rx="4" fill={LILAC} /><rect x="84" y="62" width="62" height="8" rx="4" fill={LIME} /><rect x="84" y="80" width="40" height="8" rx="4" fill={PEACH} />
          <path d="M162 18l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill={AMBER} />
        </svg>
      );
    case 'empty-results':
      return (
        <svg {...common}>
          <rect x="30" y="96" width="140" height="6" rx="3" fill={INK} opacity=".15" />
          {[[44, 40, SKY], [76, 58, LILAC], [108, 30, LIME], [140, 70, PEACH]].map(([x, h, c], i) => <rect key={i} x={x as number} y={96 - (h as number)} width="22" height={h as number} rx="8" fill={c as string} />)}
          <path d="M40 40c30-22 70-20 120-34" stroke={INK} strokeWidth="2.5" strokeDasharray="4 6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'error':
      return (
        <svg {...common}>
          <circle cx="100" cy="70" r="52" fill={AMBER} opacity=".22" />
          <path d="M100 30l46 80H54z" fill={AMBER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="96" y="58" width="8" height="28" rx="4" fill={INK} /><circle cx="100" cy="96" r="5" fill={INK} />
        </svg>
      );
    case 'offline':
      return (
        <svg {...common}>
          <path d="M50 70a70 70 0 0 1 100 0M66 86a46 46 0 0 1 68 0M84 102a20 20 0 0 1 32 0" stroke={SKY} strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M60 30l80 90" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case 'celebrate':
      return (
        <svg {...common}>
          <circle cx="100" cy="76" r="50" fill={LIME} opacity=".35" />
          <path d="M100 30l12 26 28 3-21 19 6 28-25-14-25 14 6-28-21-19 28-3z" fill={AMBER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {[[40, 36, LILAC], [160, 40, SKY], [36, 110, PEACH], [166, 104, MINT]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="7" fill={c as string} />)}
        </svg>
      );
    case 'skill-steps':
    case 'landing-hero':
      return (
        <svg {...common} viewBox="0 0 220 180">
          {[[20, 130, SKY, 'L1'], [62, 104, LILAC, 'L2'], [104, 78, PEACH, 'N3'], [146, 52, LIME, 'N4']].map(([x, y, c, t], i) => (
            <g key={i}>
              <rect x={x as number} y={y as number} width="56" height={170 - (y as number)} rx="12" fill={c as string} />
              <text x={(x as number) + 28} y={(y as number) + 24} textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>{t}</text>
            </g>
          ))}
          <circle cx="174" cy="34" r="12" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M168 34l4 4 8-8" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

/** Decorative dashed arch outline (references' "arch" motif). */
export function ArchOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden fill="none">
      <path d="M10 236V100a90 90 0 0 1 180 0v136" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 6" />
    </svg>
  );
}
