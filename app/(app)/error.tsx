'use client';
import { ErrorPanel } from '@/components/ui/states';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel message="Something went wrong loading this page. Your data is safe." retry={reset} />;
}
