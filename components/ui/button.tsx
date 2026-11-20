import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TANGERINE = 'bg-tangerine text-[#2A1300] hover:brightness-[.95] shadow-[0_6px_16px_rgba(255,122,47,.28)] hover:-translate-y-px';
const WARN = 'bg-st-notyet-soft text-st-notyet border border-st-notyet/30 hover:brightness-[.97]';
const variants = {
  primary: 'bg-violet text-white hover:bg-violet-hover hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(91,63,224,.28)] dark:text-[#0C0F1A]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2 hover:border-violet/40',
  ghost: 'text-ink hover:bg-surface-2',
  tangerine: TANGERINE,
  'quiet-warn': WARN,
  link: 'text-violet-deep underline-offset-4 hover:underline px-0 min-h-0 dark:text-violet',
  // aliases kept for older call sites
  sun: TANGERINE, lime: TANGERINE, danger: WARN,
} as const;
const sizes = { sm: 'min-h-9 px-3 text-[13px]', md: 'min-h-11 px-4 text-[14px]', lg: 'min-h-13 px-6 text-[15px]', child: 'min-h-16 px-8 text-[24px] font-extrabold font-[family-name:var(--font-child)]' } as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; pill?: boolean };

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string, pill?: boolean) =>
  cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background,transform,box-shadow,filter] duration-150 active:scale-[.98]',
    'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
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
