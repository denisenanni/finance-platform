'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      console.error('Social login error:', error);
      // Redirect to login page with an error query param
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken && refreshToken) {
      // The login function from AuthContext handles setting cookies and fetching the user
      login(accessToken, refreshToken);

      const callbackUrl = sessionStorage.getItem('callbackUrl');
      sessionStorage.removeItem('callbackUrl'); // Clean up
      router.push(callbackUrl || '/profile'); // Redirect to callbackUrl or default
    } else {
      // Handle the case where tokens are missing without an explicit error
      console.error('Authentication failed: Tokens not found in callback.');
      router.push('/login?error=authentication_failed');
    }
  }, [searchParams, router, login]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#f0f2f5',
        color: '#333',
      }}
    >
      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
        Finalizing authentication, please wait...
      </p>
      <p>You will be redirected shortly.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    // Suspense is required when using useSearchParams in a page rendered with server-side rendering
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          Loading...
        </div>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}