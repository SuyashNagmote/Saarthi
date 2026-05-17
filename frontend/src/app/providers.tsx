'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/lib/msal-config';

const msalInstance = new PublicClientApplication(msalConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    // MSAL v3 requires explicit initialization and handling the redirect hash 
    // before it can successfully close the popup window.
    msalInstance.initialize().then(() => {
      return msalInstance.handleRedirectPromise();
    }).then(() => {
      setIsMsalInitialized(true);
    }).catch(console.error);
  }, []);

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

  // Don't render the app until MSAL is ready, otherwise the popup won't close
  if (!isMsalInitialized) {
    return null; 
  }

  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MsalProvider>
  );
}
