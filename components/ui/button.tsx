import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-teal text-white hover:bg-teal-hover dark:text-[#06222A]',
  secondary: 'bg-card text-ink border border-line-strong hover:bg-card-2',
  ghost: 'text-ink hover:bg-paper-2',
  sun: 'bg-sun text-[#2A1C00] hover:brightness-[.96] shadow-[0_1px_0_rgba(92,61,0,.25)]',
  'quiet-warn': 'bg-st-notyet-soft text-st-notyet border border-st-notyet/30 hover:brightness-[.97]',
  link: 'text-teal underline underline-offset-4 decoration-1 hover:text-teal-hover px-0 min-h-0',
  // aliases kept for older call sites
  danger: 'bg-st-notyet-soft text-st-notyet border border-st-notyet/30 hover:brightness-[.97]',
  lime: 'bg-sun text-[#2A1C00] hover:brightness-[.96]',
} as const;
const sizes = { sm: 'min-h-9 px-3 text-[13px]', md: 'min-h-11 px-4 text-[14px]', lg: 'min-h-13 px-5 text-[15px]', child: 'min-h-16 px-8 text-[24px] font-extrabold font-[family-name:var(--font-child)]' } as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; pill?: boolean };

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string, pill?: boolean) =>
  cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background,transform,filter] duration-150 active:scale-[.98]',
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
