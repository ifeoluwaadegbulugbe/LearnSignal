// SkillArt: deterministic, original geometric art for each skill (no faces, no photos, no clip-art).
// Literacy = letter blocks, speech arcs, books. Numeracy = counters, number lines, ten-frames, balance beams.
import { cn } from '@/lib/utils';

type ArtKey = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'literacy' | 'numeracy' | 'both' | 'assess' | 'identify' | 'group' | 'intervene' | 'reassess';

const GRAD: Record<string, [string, string]> = {
  L1: ['#6C52F0', '#3D9BFF'], L2: ['#12B3A8', '#FFC83D'], L3: ['#FF7A2F', '#F06A9B'], L4: ['#3D9BFF', '#12B3A8'], L5: ['#5B3FE0', '#F06A9B'], L6: ['#FFC83D', '#FF7A2F'],
  N1: ['#12B3A8', '#3D9BFF'], N2: ['#FFC83D', '#12B3A8'], N3: ['#6C52F0', '#12B3A8'], N4: ['#FF7A2F', '#FFC83D'], N5: ['#3D9BFF', '#6C52F0'], N6: ['#F06A9B', '#FF7A2F'],
  literacy: ['#6C52F0', '#3D9BFF'], numeracy: ['#12B3A8', '#FFC83D'], both: ['#5B3FE0', '#FF7A2F'],
  assess: ['#6C52F0', '#3D9BFF'], identify: ['#3D9BFF', '#12B3A8'], group: ['#12B3A8', '#FFC83D'], intervene: ['#FFC83D', '#FF7A2F'], reassess: ['#FF7A2F', '#F06A9B'],
};
const W = 'rgba(255,255,255,.92)', W2 = 'rgba(255,255,255,.55)', W3 = 'rgba(255,255,255,.28)', INK = '#13172B';

function Block({ x, y, s = 30, ch, tilt = 0 }: { x: number; y: number; s?: number; ch: string; tilt?: number }) {
  return (
    <g transform={`rotate(${tilt} ${x + s / 2} ${y + s / 2})`}>
      <rect x={x} y={y} width={s} height={s} rx={7} fill={W} />
      <text x={x + s / 2} y={y + s * 0.68} textAnchor="middle" fontSize={s * 0.55} fontWeight="700" fontFamily="ui-rounded, system-ui" fill={INK}>{ch}</text>
    </g>
  );
}
function Dots({ x, y, n, cols = 5, r = 6, gap = 16 }: { x: number; y: number; n: number; cols?: number; r?: number; gap?: number }) {
  return <g>{Array.from({ length: n }).map((_, i) => <circle key={i} cx={x + (i % cols) * gap} cy={y + Math.floor(i / cols) * gap} r={r} fill={W} />)}</g>;
}

function Scene({ k }: { k: ArtKey }) {
  switch (k) {
    case 'L1': return <g><Block x={34} y={30} ch="a" tilt={-8} /><Block x={74} y={22} ch="m" tilt={4} /><Block x={114} y={34} ch="s" tilt={-3} /><path d="M160 34a10 10 0 0 1 0 22M168 28a18 18 0 0 1 0 34" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" /></g>;
    case 'L2': return <g><Block x={28} y={32} s={28} ch="c" /><Block x={64} y={32} s={28} ch="a" /><Block x={100} y={32} s={28} ch="t" /><path d="M42 74q50 18 100 0" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M136 66l8 8-10 4" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>;
    case 'L3': return <g>{[0, 1, 2].map((i) => <rect key={i} x={40 + i * 10} y={22 + i * 8} width={96} height={44} rx={10} fill={i === 2 ? W : W2} />)}<rect x={74} y={50} width={44} height={8} rx={4} fill={INK} opacity=".7" /></g>;
    case 'L4': return <g><rect x={30} y={26} width={140} height={56} rx={12} fill={W} />{[38, 52, 66].map((y, i) => <rect key={y} x={42} y={y} width={i === 2 ? 70 : 112} height={7} rx={3.5} fill={INK} opacity={0.18 + i * 0.12} />)}<circle cx={152} cy={69} r={6} fill="#FF7A2F" /></g>;
    case 'L5': return <g><path d="M40 34q30-12 58 0v48q-28-12-58 0z" fill={W} /><path d="M156 34q-30-12-58 0v48q28-12 58 0z" fill={W2} /><circle cx={160} cy={30} r={14} fill={W} /><text x={160} y={36} textAnchor="middle" fontSize="18" fontWeight="800" fill={INK}>?</text></g>;
    case 'L6': return <g><path d="M44 30h76a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12H76l-16 12v-12H44a12 12 0 0 1-12-12V42a12 12 0 0 1 12-12z" fill={W} /><circle cx={150} cy={62} r={16} fill="none" stroke={W} strokeWidth="6" /><path d="M162 74l12 12" stroke={W} strokeWidth="7" strokeLinecap="round" /></g>;
    case 'N1': return <g>{['3', '7', '12', '20'].map((n, i) => <Block key={n} x={26 + i * 38} y={32 + (i % 2) * 8} s={32} ch={n} tilt={i % 2 ? 4 : -4} />)}</g>;
    case 'N2': return <g><Dots x={44} y={34} n={10} /><Dots x={130} y={34} n={4} cols={2} r={7} gap={18} /></g>;
    case 'N3': return <g><Dots x={34} y={40} n={6} cols={3} /><path d="M98 50h20M108 40v20" stroke={W} strokeWidth="5" strokeLinecap="round" /><Dots x={132} y={40} n={4} cols={2} /></g>;
    case 'N4': return <g><path d="M24 70h152" stroke={W} strokeWidth="4" strokeLinecap="round" />{Array.from({ length: 9 }).map((_, i) => <rect key={i} x={28 + i * 18} y={64} width={3} height={12} rx={1.5} fill={W} />)}<path d="M154 58q-18-26-36 0M118 58q-18-26-36 0" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M82 58l-2-10 9 4" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" /></g>;
    case 'N5': return <g><rect x={30} y={30} width={96} height={42} rx={8} fill="none" stroke={W} strokeWidth="3" />{Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={40 + (i % 5) * 19} cy={41 + Math.floor(i / 5) * 20} r={6} fill={W} />)}{[0, 1, 2].map((i) => <rect key={i} x={140 + i * 10} y={30} width={6} height={42} rx={3} fill={W} />)}</g>;
    case 'N6': return <g><path d="M100 30v44M70 80h60" stroke={W} strokeWidth="5" strokeLinecap="round" /><path d="M46 44h108" stroke={W} strokeWidth="5" strokeLinecap="round" /><path d="M46 44l-14 22h28zM154 44l-14 22h28z" fill={W2} stroke={W} strokeWidth="3" strokeLinejoin="round" /><Dots x={40} y={58} n={3} cols={3} r={4} gap={9} /><Dots x={146} y={58} n={2} cols={2} r={4} gap={10} /></g>;
    case 'literacy': return <g><Block x={36} y={28} ch="A" tilt={-6} /><Block x={76} y={36} ch="b" tilt={5} /><path d="M120 34q30-12 50 0v42q-20-12-50 0z" fill={W} /></g>;
    case 'numeracy': return <g><Block x={36} y={30} ch="7" tilt={-5} /><path d="M80 48h16M88 40v16" stroke={W} strokeWidth="5" strokeLinecap="round" /><Dots x={112} y={36} n={6} cols={3} /></g>;
    case 'both': return <g><Block x={40} y={30} ch="a" tilt={-6} /><Block x={80} y={36} ch="3" tilt={5} /><Dots x={128} y={38} n={4} cols={2} r={7} gap={18} /></g>;
    case 'assess': return <g><rect x={62} y={22} width={76} height={60} rx={12} fill={W} /><path d="M78 44l8 8 16-16" stroke="#5B3FE0" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><rect x={78} y={64} width={44} height={6} rx={3} fill={INK} opacity=".25" /></g>;
    case 'identify': return <g><circle cx={92} cy={50} r={22} fill="none" stroke={W} strokeWidth="7" /><path d="M108 66l18 18" stroke={W} strokeWidth="8" strokeLinecap="round" /><circle cx={92} cy={50} r={8} fill={W} /></g>;
    case 'group': return <g>{[[60, 46], [84, 36], [84, 60], [126, 48], [146, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill={i < 3 ? W : W2} />)}</g>;
    case 'intervene': return <g><rect x={50} y={26} width={100} height={54} rx={12} fill={W} /><circle cx={70} cy={53} r={8} fill="#FF7A2F" /><circle cx={92} cy={53} r={8} fill="#12B3A8" /><circle cx={114} cy={53} r={8} fill="#5B3FE0" /></g>;
    case 'reassess': return <g><path d="M60 72V34M100 72V48M140 72V24" stroke={W} strokeWidth="14" strokeLinecap="round" /><path d="M54 30l40 12 46-22" stroke={W2} strokeWidth="3" fill="none" strokeDasharray="5 5" /></g>;
  }
}

/** Art band/tile. `skill` may be a skill id (L1–N6), a strand, 'both', or a loop stage. */
export function SkillArt({ skill, className, rounded = 'top' }: { skill: string; className?: string; rounded?: 'top' | 'all' | 'none' }) {
  const k = (GRAD[skill] ? skill : skill.startsWith('L') ? 'literacy' : 'numeracy') as ArtKey;
  const [a, b] = GRAD[k];
  const id = `sa-${k}`;
  return (
    <div className={cn('relative h-24 w-full overflow-hidden', rounded === 'top' && 'rounded-t-[20px]', rounded === 'all' && 'rounded-[14px]', className)} aria-hidden>
      <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
        <rect width="200" height="100" fill={`url(#${id})`} />
        <circle cx="182" cy="-6" r="46" fill={W3} /><circle cx="8" cy="104" r="30" fill={W3} />
        <Scene k={k} />
      </svg>
    </div>
  );
}
