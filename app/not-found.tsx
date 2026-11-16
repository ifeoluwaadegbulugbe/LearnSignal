import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <EmptyState title="Page not found" body="That page does not exist, or you do not have access to it." action={<ButtonLink href="/dashboard">Go to dashboard</ButtonLink>} />
    </main>
  );
}
