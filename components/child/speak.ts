'use client';
// Browser text-to-speech for reading prompts aloud. No audio is recorded or sent anywhere.
export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.lang = 'en-GB';
  const voice = window.speechSynthesis.getVoices().find((v) => /en-(NG|GB)/i.test(v.lang));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}
export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
