"use client";

/**
 * Auth context — tracks the logged-in Member (admin or regular) across
 * the app, backed by a JWT stored in localStorage.
 *
 * Why a Context instead of re-fetching per page:
 * - Both the admin and member dashboards need to know "who is logged in
 *   and what's their role" to decide what to render/guard. A single
 *   provider at the root avoids every page re-implementing that fetch +
 *   redirect-if-missing logic.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Member } from "@/lib/types";

interface AuthContextValue {
  member: Member | null;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
    if (!token) {
      setMember(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.get<Member>("/members/me");
      setMember(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.localStorage.removeItem("access_token");
      }
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so the initial auth check doesn't call
    // setState synchronously during the effect's own execution (which
    // can trigger cascading renders).
    queueMicrotask(() => {
      refresh();
    });
  }, [refresh]);

  const setToken = useCallback(
    async (token: string) => {
      window.localStorage.setItem("access_token", token);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem("access_token");
    setMember(null);
  }, []);

  return (
    <AuthContext.Provider value={{ member, isLoading, setToken, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Redirects to /login if not authenticated, or if role doesn't match. */
export function useRequireRole(role: "admin" | "member" | "any") {
  const { member, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!member) {
      router.replace("/login");
      return;
    }
    if (role !== "any" && member.role !== role) {
      router.replace(member.role === "admin" ? "/dashboard" : "/member");
    }
  }, [member, isLoading, role, router]);

  return { member, isLoading };
}
