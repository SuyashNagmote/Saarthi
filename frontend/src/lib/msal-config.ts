import type { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || 'dummy-client-id-for-demo',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'User.ReadBasic.All'],
};
