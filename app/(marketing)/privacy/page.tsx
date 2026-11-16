import { Card } from '@/components/ui/primitives';

export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
      <h1 className="text-[40px] font-bold leading-tight">Privacy, in plain language</h1>
      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">What we store about children</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>A first name or nickname chosen by the teacher (no surnames).</li>
          <li>An age band (for example 7–8), not a date of birth.</li>
          <li>Answers to assessment and practice questions, and the skill states worked out from them.</li>
          <li>Short notes the teacher writes.</li>
        </ul>
        <p>We never store photos, addresses, phone numbers or audio recordings. Children do not have accounts or passwords.</p>
      </Card>
      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">Consent</h2>
        <p>Before adding a child, the teacher confirms that the school or the child&apos;s guardian has agreed. We record when this was confirmed.</p>
      </Card>
      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">Who can see what</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Teachers see only the classrooms they teach.</li>
          <li>School admins see totals only (for example “6 learners developing subtraction”). They never see names or codes, and groups smaller than 3 are hidden.</li>
          <li>These rules are enforced in the database itself (row-level security), not only on screen.</li>
        </ul>
      </Card>
      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">AI and third parties</h2>
        <p>LearnSignal uses Google&apos;s Gemini model for two things: drafting practice questions and answering teacher questions about class data. Prompts contain skill information and random learner codes (like LS-3F9A2C) only — never names.</p>
        <p>This prototype uses Gemini&apos;s free tier, where Google may use prompts to improve its products. That is why we send only pseudonymous skill data. Before any real pilot, a paid tier that does not train on prompts should be used.</p>
      </Card>
      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">Not a diagnosis</h2>
        <p>LearnSignal shows which skills a child has demonstrated so far. It does not diagnose any condition and never labels a child.</p>
      </Card>
      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">Deleting data</h2>
        <p>Teachers can archive a learner (hidden from lists) or permanently delete a learner or classroom in Settings. Permanent deletion removes all of that child&apos;s answers, states and notes immediately.</p>
      </Card>
    </article>
  );
}
