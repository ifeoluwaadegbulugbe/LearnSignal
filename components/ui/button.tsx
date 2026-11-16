import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50',
  secondary: 'bg-surface text-ink border border-line hover:bg-primary-soft disabled:opacity-60',
  ghost: 'text-ink hover:bg-primary-soft disabled:opacity-60',
  accent: 'bg-accent text-ink hover:brightness-95 disabled:opacity-60',
  danger: 'bg-surface text-danger border border-danger/40 hover:bg-danger/5 disabled:opacity-60',
} as const;
const sizes = { sm: 'min-h-9 px-3 text-sm', md: 'min-h-11 px-4 text-[15px]', lg: 'min-h-12 px-6 text-base' } as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants; size?: keyof typeof sizes; loading?: boolean;
};

export const buttonClass = (variant: keyof typeof variants = 'primary', size: keyof typeof sizes = 'md', extra?: string) =>
  cn('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed', variants[variant], sizes[size], extra);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children }: { href: string; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={buttonClass(variant, size, className)}>{children}</Link>;
}
