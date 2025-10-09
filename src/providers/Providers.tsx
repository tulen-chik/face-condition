'use client';

import { ReactNode } from 'react';

import {
   AdminProvider,
   BlogAdminProvider,
   DatabaseProvider,
   UserProvider,
   GeminiProvider
  } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
        <UserProvider>
              <AdminProvider>
                <BlogAdminProvider>
                  <GeminiProvider>
                    {children}
                    </GeminiProvider>
                </BlogAdminProvider>
              </AdminProvider>
      </UserProvider>
  </DatabaseProvider>
);
} 