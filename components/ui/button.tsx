import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One dominant action per screen: `primary` (violet). Everything else is `secondary`
 * (outlined), `ghost` or `link`. Tangerine is never a button colour, so the old
 * `tangerine`/`sun` variants render as primary.
 */
const PRIMARY = 'bg-violet-500 text-on-primary hover:bg-violet-700 dark:hover:bg-violet-700';
const WARN = 'bg-surface text-st-notyet border border-st-notyet/40 hover:bg-st-notyet-soft';
const variants = {
  primary: PRIMARY,
  secondary: 'bg-surface text-ink border border-line-strong hover:border-violet-500/50 hover:bg-violet-50',
  ghost: 'text-ink hover:bg-violet-50',
  'quiet-warn': WARN,
  link: 'text-violet-700 underline underline-offset-4 hover:no-underline px-0 min-h-0',
  // older call sites
  tangerine: PRIMARY, sun: PRIMARY, lime: PRIMARY, danger: WARN,
} as const;
const sizes = {
  sm: 'min-h-11 px-3.5 text-[14px]',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-11 px-5 text-[16px]',
  child: 'min-h-16 px-8 text-[22px] font-bold',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; pill?: boolean };

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string, pill?: boolean) =>
  cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background,border-color,transform] duration-150 active:scale-[.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    pill || size === 'child' ? 'rounded-full' : 'rounded-[12px]',
    variants[variant], sizes[size], extra,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, pill, className, children, disabled, ...props }, ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className, pill)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = 'primary', size = 'md', pill, className, children, ...rest }: { href: string; variant?: ButtonVariant; size?: ButtonSize; pill?: boolean; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return <Link href={href} className={buttonClass(variant, size, className, pill)} {...rest}>{children}</Link>;
}
