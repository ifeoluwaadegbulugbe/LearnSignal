import type { Metadata, Viewport } from 'next';
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], display: 'swap' });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'LearnSignal', template: '%s · LearnSignal' },
  description: 'Find the exact foundational skill each child is missing, group children who need the same help, and check whether it worked.',
};
export const viewport: Viewport = { themeColor: '#0E1220', width: 'device-width', initialScale: 1 };

// Runs before paint so the saved/system theme applies with no flash.
const themeScript = `(function(){try{var t=localStorage.getItem('ls-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${jakarta.variable} ${nunito.variable} min-h-dvh`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop">Skip to content</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
