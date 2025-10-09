"use client"
import { AuthForm } from '@/components/auth/AuthForm';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const Loading = () => <LoadingSpinner />;

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}