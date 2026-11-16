import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-[0_1px_2px_rgba(79,70,229,.25)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  lime: 'bg-lime text-[#0E1220] hover:brightness-95 shadow-[0_0_24px_rgba(200,241,53,.25)]',
  'ghost-dark': 'text-on-dark border border-white/20 hover:bg-white/10',
  danger: 'bg-amber-bg text-amber-ink border border-st-notyet/30 hover:brightness-[0.97]',
  link: 'text-primary underline underline-offset-4 hover:text-primary-hover px-0 min-h-0',
} as const;
const sizes = { sm: 'min-h-9 px-3 text-[13px]', md: 'min-h-11 px-4 text-[14px]', lg: 'min-h-13 px-6 text-[15px]', child: 'min-h-16 px-8 text-[24px] font-extrabold' } as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; pill?: boolean };

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string, pill?: boolean) =>
  cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background,transform,box-shadow,filter] duration-150 active:scale-[.98]',
    'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
    pill || size === 'lg' || size === 'child' ? 'rounded-full' : 'rounded-xl',
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
