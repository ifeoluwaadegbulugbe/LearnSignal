// LearnSignal illustration kit: flat inline SVG, 2–3 palette colours, rounded shapes, no faces.
import { cn } from '@/lib/utils';

export type IllustrationName = 'empty-learners' | 'empty-groups' | 'empty-practice' | 'empty-exercises' | 'empty-results' | 'error' | 'offline' | 'celebrate' | 'landing' | 'landing-hero' | 'skill-steps';

const TEAL = 'var(--teal)', TEAL_S = 'var(--teal-soft)', SUN = 'var(--sun)', SUN_S = 'var(--sun-soft)', CLAY = 'var(--clay)', CLAY_S = 'var(--clay-soft)', SKY_S = 'var(--sky-soft)', LINE = 'var(--line-strong)', CARD = 'var(--card)';

/** Three small stepped tiles with the learner dot (the logo motif). Replaces the retired arcs. */
function StepGlyph({ x, y, s = 1, color = TEAL, o = 1 }: { x: number; y: number; s?: number; color?: string; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill={color}>
      <rect x="-16" y="-6" width="9" height="9" rx="3" opacity=".45" /><rect x="-5" y="-6" width="9" height="9" rx="3" opacity=".7" />
      <rect x="6" y="-6" width="9" height="9" rx="3" /><rect x="6" y="-17" width="9" height="9" rx="3" />
      <circle cx="10.5" cy="-23" r="4" fill="var(--tangerine)" />
    </g>
  );
}

export function Illustration({ name, className, title }: { name: IllustrationName; className?: string; title?: string }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  const common = { viewBox: '0 0 200 140', className: cn('h-auto w-full', className), ...a11y };
  switch (name) {
    case 'empty-learners': // stack of index cards
      return (
        <svg {...common}>
          <rect x="44" y="40" width="96" height="66" rx="10" fill={SKY_S} transform="rotate(-8 92 73)" />
          <rect x="52" y="34" width="96" height="66" rx="10" fill={SUN_S} transform="rotate(4 100 67)" />
          <rect x="56" y="38" width="96" height="66" rx="10" fill={CARD} stroke={LINE} strokeWidth="2" />
          <rect x="64" y="30" width="30" height="12" rx="5" fill={TEAL} />
          {[58, 70, 82].map((y) => <rect key={y} x="68" y={y} width={y === 82 ? 44 : 72} height="4" rx="2" fill={LINE} />)}
          <circle cx="138" cy="92" r="9" fill={TEAL_S} stroke={TEAL} strokeWidth="2" />
        </svg>
      );
    case 'empty-groups': // three stepping stones
      return (
        <svg {...common}>
          <path d="M20 112c40-6 120-6 160 0" stroke={SKY_S} strokeWidth="18" strokeLinecap="round" fill="none" />
          <ellipse cx="54" cy="96" rx="24" ry="10" fill={TEAL_S} stroke={TEAL} strokeWidth="2" />
          <ellipse cx="102" cy="80" rx="24" ry="10" fill={SUN_S} stroke={SUN} strokeWidth="2" />
          <ellipse cx="150" cy="64" rx="24" ry="10" fill={CLAY_S} stroke={CLAY} strokeWidth="2" />
          <StepGlyph x={150} y={44} s={0.7} />
        </svg>
      );
    case 'empty-practice':
    case 'empty-exercises': // open notebook
      return (
        <svg {...common}>
          <path d="M30 40c24-8 46-8 70 2v70c-24-10-46-10-70-2z" fill={CARD} stroke={LINE} strokeWidth="2" />
          <path d="M170 40c-24-8-46-8-70 2v70c24-10 46-10 70-2z" fill={CARD} stroke={LINE} strokeWidth="2" />
          {[56, 68, 80, 92].map((y) => <path key={y} d={`M42 ${y}c14-3 30-3 46 1M112 ${y + 1}c16-4 32-4 46-1`} stroke={LINE} strokeWidth="2" fill="none" />)}
          <rect x="128" y="20" width="10" height="56" rx="3" fill={SUN} transform="rotate(30 133 48)" />
          <path d="M150 64l-6 10 1-12z" fill={CLAY} />
        </svg>
      );
    case 'empty-results': // ladder with a lamp
      return (
        <svg {...common}>
          <rect x="70" y="20" width="6" height="110" rx="3" fill={TEAL} /><rect x="116" y="20" width="6" height="110" rx="3" fill={TEAL} />
          {[34, 56, 78, 100, 122].map((y) => <rect key={y} x="73" y={y} width="46" height="5" rx="2.5" fill={TEAL_S} stroke={TEAL} strokeWidth="1.5" />)}
          <path d="M150 50v-20h16" stroke={LINE} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M140 50h24l-6 14h-12z" fill={SUN} />
          <path d="M152 70l-16 50M152 70l16 50" stroke={SUN} strokeWidth="1.5" opacity=".5" />
        </svg>
      );
    case 'error': // tangled pencil line
      return (
        <svg {...common}>
          <path d="M30 100c20-40 40 30 60-10s-30-40 0-40 30 60 50 30 10-40 30-20" stroke={CLAY} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="150" y="40" width="12" height="54" rx="3" fill={SUN} transform="rotate(35 156 67)" />
          <path d="M146 96l-8 10 2-14z" fill={TEAL} />
        </svg>
      );
    case 'offline': // cloud with a dash
      return (
        <svg {...common}>
          <path d="M60 96h80a24 24 0 0 0 0-48 34 34 0 0 0-64-6 22 22 0 0 0-16 54z" fill={SKY_S} stroke={LINE} strokeWidth="2" />
          <rect x="82" y="70" width="36" height="6" rx="3" fill={TEAL} />
        </svg>
      );
    case 'celebrate': // sun rising over a ladder
      return (
        <svg {...common}>
          <circle cx="100" cy="98" r="44" fill={SUN_S} /><circle cx="100" cy="98" r="28" fill={SUN} />
          {[-60, -30, 0, 30, 60].map((a) => <rect key={a} x="98" y="34" width="4" height="14" rx="2" fill={SUN} transform={`rotate(${a} 100 98)`} />)}
          <rect x="0" y="98" width="200" height="42" fill="var(--paper)" />
          <rect x="78" y="70" width="5" height="70" rx="2.5" fill={TEAL} /><rect x="117" y="70" width="5" height="70" rx="2.5" fill={TEAL} />
          {[84, 104, 124].map((y) => <rect key={y} x="80" y={y} width="40" height="4" rx="2" fill={TEAL} />)}
        </svg>
      );
    case 'landing':
    case 'landing-hero':
    case 'skill-steps': // large ladder + stepped tiles
      return (
        <svg {...common} viewBox="0 0 220 180">
          <StepGlyph x={150} y={60} s={2.2} color={TEAL} o={0.12} />
          <rect x="60" y="14" width="7" height="160" rx="3.5" fill={TEAL} /><rect x="130" y="14" width="7" height="160" rx="3.5" fill={TEAL} />
          {[30, 58, 86, 114, 142].map((y, i) => <rect key={y} x="64" y={y} width="70" height="6" rx="3" fill={i === 2 ? SUN : TEAL_S} stroke={TEAL} strokeWidth="1.5" />)}
          {[[82, 140, CLAY_S], [100, 140, SKY_S], [90, 82, SUN_S], [112, 82, TEAL_S]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={(y as number) - 8} r="8" fill={c as string} stroke={LINE} strokeWidth="1.5" />)}
        </svg>
      );
  }
}
