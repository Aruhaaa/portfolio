import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

const v = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 8);

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href={`/assets/css/style.css?v=${v}`} />
        <link rel="stylesheet" href={`/assets/css/admin.css?v=${v}`} />
      </head>
      <body>
        <div className="animated-background">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="admin-wrapper">{children}</div>
        <Script src={`/assets/js/admin.js?v=${v}`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
