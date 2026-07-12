"use client";

import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'mock-app-id'}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#573d82',
          logo: 'https://auth.privy.io/logos/privy-logo.png', // Placeholder
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
