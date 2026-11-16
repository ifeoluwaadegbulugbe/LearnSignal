import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Nunito } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], display: 'swap' });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'], weight: ['700', '800'], display: 'swap' });
const jbmono = JetBrains_Mono({ variable: '--font-jbmono', subsets: ['latin'], weight: ['500'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'LearnSignal', template: '%s · LearnSignal' },
  description: 'Find the exact foundational skill each child is missing, group children who need the same help, and check whether it worked.',
};
export const viewport: Viewport = { themeColor: '#0D5C63', width: 'device-width', initialScale: 1 };

// Runs before paint so the saved/system theme applies with no flash. Static string, no user input.
const themeScript = `(function(){try{var t=localStorage.getItem('ls-theme');if(t!=='light'&&t!=='night'){t=matchMedia('(prefers-color-scheme: dark)').matches?'night':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${bricolage.variable} ${inter.variable} ${nunito.variable} ${jbmono.variable} min-h-dvh`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-card focus:px-4 focus:py-2 focus:shadow-pop">Skip to content</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
