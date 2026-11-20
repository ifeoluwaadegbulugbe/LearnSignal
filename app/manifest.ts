import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LearnSignal',
    short_name: 'LearnSignal',
    description: 'Find the exact skill each child is missing.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F8F8FC',
    theme_color: '#5B3FE0',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
