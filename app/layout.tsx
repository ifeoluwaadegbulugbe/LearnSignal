import type { Metadata, Viewport } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const sora = Sora({ variable: '--font-sora', subsets: ['latin'], weight: ['600', '700'], display: 'swap' });
const dmsans = DM_Sans({ variable: '--font-dmsans', subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'LearnSignal', template: '%s · LearnSignal' },
  description: 'Find the exact foundational skill each child is missing, group children who need the same help, and check whether it worked.',
  applicationName: 'LearnSignal',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  openGraph: { title: 'LearnSignal', description: 'Find the exact skill each child is missing.', type: 'website' },
};
export const viewport: Viewport = { themeColor: '#5B3FE0', width: 'device-width', initialScale: 1 };

// Runs before paint so the saved/system theme applies with no flash. Static string, no user input.
const themeScript = `(function(){try{var t=localStorage.getItem('ls-theme');if(t!=='light'&&t!=='night'){t=matchMedia('(prefers-color-scheme: dark)').matches?'night':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${sora.variable} ${dmsans.variable} min-h-dvh`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop">Skip to content</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
