'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/lib/msal-config';

const msalInstance = new PublicClientApplication(msalConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MsalProvider>
  );
}
