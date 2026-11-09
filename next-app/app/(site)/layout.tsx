import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import Script from 'next/script';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E3E5E1',
};

// A new address for the CSS and script on every deploy, so browsers never keep an old copy
const v = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 8);

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Switches on the styles for the scripted page before anything is drawn, so nothing jumps */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href={`/assets/css/site.css?v=${v}`} />
      </head>
      <body>
        {children}
        <Script src={`/assets/js/site.js?v=${v}`} strategy="lazyOnload" />
      </body>
    </html>
  );
}
