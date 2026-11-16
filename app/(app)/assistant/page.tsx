import { MessageCircleQuestion } from 'lucide-react';
import { getTeacherContext } from '@/lib/server/context';
import { aiConfig } from '@/lib/ai/gemini';
import { PageHeader } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { AssistantChat } from './assistant-chat';

export const metadata = { title: 'Assistant' };

export default async function AssistantPage() {
  const ctx = await getTeacherContext();
  // Names are substituted locally in the browser; the model only ever sees codes.
  const { data: learners } = await ctx.supabase.from('learners').select('id, code, display_name').is('archived_at', null);
  return (
    <>
      <PageHeader title="Classroom assistant" subtitle="Ask about your class. Answers come only from your data, refer to learners by code, and never guess." />
      {ctx.classrooms.length === 0 ? (
        <EmptyState icon={<MessageCircleQuestion className="size-6" />} title="No classes yet" body="Create a class and assess a few learners first." action={<ButtonLink href="/onboarding">Set up a class</ButtonLink>} />
      ) : (
        <AssistantChat classrooms={ctx.classrooms.map((c) => ({ id: c.id, name: c.name }))} learners={learners ?? []} aiReady={aiConfig().ready} />
      )}
    </>
  );
}
