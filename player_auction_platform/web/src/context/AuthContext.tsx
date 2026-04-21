"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '../hooks/useConfirm';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_BASE_URL } from '@/lib/api';

const API_URL = API_BASE_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token");
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const [isLoading] = useState(false);
  const router = useRouter();
  const { confirm, ConfirmationModal } = useConfirm();

  useEffect(() => {
    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        if (!e.newValue) {
          // Token or user was removed (Logout in another tab)
          setToken(null);
          setUser(null);
          router.replace("/login");
        } else {
          // Token or user was updated (Login in another tab)
          const newToken = localStorage.getItem("token");
          const storedUser = localStorage.getItem("user");
          setToken(newToken);
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Global fix to prevent mouse wheel from changing number input values
    const handleWheel = (e: WheelEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" &&
        (e.target as HTMLInputElement).type === "number" &&
        document.activeElement === e.target
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleActualLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const logout = useCallback(() => {
    confirm({
      title: "Confirm Logout",
      message: "Are you sure you want to sign out of your account?",
      confirmText: "Sign Out",
      isDestructive: true,
      onConfirm: handleActualLogout
    });
  }, [confirm, handleActualLogout]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
      <ConfirmationModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
