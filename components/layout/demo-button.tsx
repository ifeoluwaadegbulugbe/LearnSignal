import { PlayCircle } from 'lucide-react';
import { buttonClass } from '@/components/ui/button';

/** Posts to /api/demo, which signs into the shared sandbox account (synthetic data only). */
export function DemoButton({ size = 'lg' as const }: { size?: 'md' | 'lg' }) {
  return (
    <form action="/api/demo" method="post">
      <button type="submit" className={buttonClass('secondary', size)}><PlayCircle className="size-5" aria-hidden /> Try the demo</button>
    </form>
  );
}
