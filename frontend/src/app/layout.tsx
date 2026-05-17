import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Saarthi — Performance, tracked with precision',
  description: 'Enterprise goal setting & attrition intelligence',
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            duration={4000}
            visibleToasts={3}
            richColors
            closeButton
            toastOptions={{
              className: 'sonner-toast',
              style: {
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-1)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
