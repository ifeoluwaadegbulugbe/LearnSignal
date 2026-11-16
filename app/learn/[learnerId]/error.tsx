'use client';
export default function ChildError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FFF8EC] p-6 text-center font-[family-name:var(--font-child)]">
      <div className="rounded-3xl bg-white p-8">
        <p className="text-[24px] font-bold">Something got stuck. Please ask your teacher.</p>
        <button onClick={reset} className="mt-6 min-h-16 rounded-full bg-primary px-8 text-[24px] font-extrabold text-white">Try again</button>
      </div>
    </div>
  );
}
