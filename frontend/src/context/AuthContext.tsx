"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { apiClient } from "@/lib/api-client";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  provider?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    apiClient.clearFailedQueue();
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    apiClient.logout().catch(console.error);
  }, []);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }

    const handleAuthError = () => {
      logout();
    };

    window.addEventListener("auth-error", handleAuthError);

    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [fetchUser, logout]);

  const login = useCallback(
    (accessToken: string, refreshToken: string) => {
      Cookies.set("accessToken", accessToken, {
        secure: true,
        sameSite: "strict",
      });
      Cookies.set("refreshToken", refreshToken, {
        secure: true,
        sameSite: "strict",
      });
      fetchUser();
    },
    [fetchUser]
  );

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
