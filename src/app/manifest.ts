import type { MetadataRoute } from 'next';
import { appConfig } from '@/config/app';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.publicAppName,
    short_name: appConfig.publicAppName,
    description: `${appConfig.publicAppName} PWA`,
    start_url: `/${appConfig.defaultLocale}`,
    display: 'standalone',
    background_color: '#f6f5f1',
    theme_color: appConfig.primaryColor,
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      },
      {
        src: '/icons/maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
