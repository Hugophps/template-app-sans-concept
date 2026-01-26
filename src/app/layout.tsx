import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { appConfig } from '@/config/app';
import './globals.css';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
});

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  title: appConfig.publicAppName,
  description: `${appConfig.publicAppName} app template`
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const brandStyle = { '--color-brand': appConfig.primaryColor } as CSSProperties;

  return (
    <html lang={appConfig.defaultLocale}>
      <body className={`${displayFont.variable} ${bodyFont.variable}`} style={brandStyle}>
        {children}
      </body>
    </html>
  );
}
