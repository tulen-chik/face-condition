'use client';

import { ReactNode } from 'react';

import {
   AdminProvider,
   BlogAdminProvider,
   DatabaseProvider,
   UserProvider,
   GeminiProvider,
   NotesProvider
  } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
        <UserProvider>
              <AdminProvider>
                <BlogAdminProvider>
                  <GeminiProvider>
                    <NotesProvider>
                      {children}
                    </NotesProvider>
                    </GeminiProvider>
                </BlogAdminProvider>
              </AdminProvider>
      </UserProvider>
  </DatabaseProvider>
);
} 