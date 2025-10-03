"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Helper to set cookies
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

function AuthCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      console.error("Social login error:", error);
      // Notify the parent window of the failure
      window.opener?.postMessage({ type: "social-auth-callback", success: false, error }, "*");
      window.close();
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens in cookies
      setCookie("access_token", accessToken, 1 / 24); // 1 hour
      setCookie("refresh_token", refreshToken, 7); // 7 days

      // Notify the parent window of success
      window.opener?.postMessage({ type: "social-auth-callback", success: true }, "*");
      window.close();
    }
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <p>Authenticating, please wait...</p>
      <p>This window will close automatically.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}