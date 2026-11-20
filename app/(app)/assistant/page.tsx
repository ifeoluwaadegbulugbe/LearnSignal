import { getTeacherContext } from '@/lib/server/context';
import { aiConfig } from '@/lib/ai/gemini';
import { PageHeader } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { AssistantChat } from '@/components/assistant/chat';

export const metadata = { title: 'Ask' };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string; class?: string }> }) {
  const sp = await searchParams;
  const ctx = await getTeacherContext();
  // Names are resolved in the browser; the model only ever sees codes.
  const [{ data: learners }, { data: profile }] = await Promise.all([
    ctx.supabase.from('learners').select('id, code, display_name').is('archived_at', null),
    ctx.supabase.from('profiles').select('ai_enabled').eq('id', ctx.user.id).single(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ask LearnSignal" subtitle="Answers come only from your class data and refer to learners by code. Nothing is guessed." />
      {ctx.classrooms.length === 0 ? (
        <EmptyState illustration="empty-learners" title="No classes yet" body="Create a class and check a few learners first." action={<ButtonLink href="/onboarding">Set up a class</ButtonLink>} />
      ) : (
        <AssistantChat classrooms={ctx.classrooms.map((c) => ({ id: c.id, name: c.name }))} learners={learners ?? []}
          aiReady={aiConfig().ready && profile?.ai_enabled !== false}
          initialClassroomId={ctx.classrooms.find((c) => c.id === sp.class)?.id} seedQuestion={sp.q?.slice(0, 300)} />
      )}
    </div>
  );
}
