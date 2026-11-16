import type { Metadata, Viewport } from 'next';
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], display: 'swap' });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'LearnSignal', template: '%s · LearnSignal' },
  description: 'Find the exact foundational skill each child is missing, group children who need the same help, and check whether it worked.',
};
export const viewport: Viewport = { themeColor: '#0F6B5C', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${nunito.variable} min-h-dvh`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
