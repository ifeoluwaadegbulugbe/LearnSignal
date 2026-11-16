import { getTeacherContext } from '@/lib/server/context';
import { OnboardingFlow } from './onboarding-flow';

export const metadata = { title: 'Get started' };

export default async function OnboardingPage() {
  const ctx = await getTeacherContext();
  return <OnboardingFlow schools={ctx.schools.map((s) => ({ id: s.id, name: s.name }))} firstName={ctx.fullName.split(' ')[0]} />;
}
