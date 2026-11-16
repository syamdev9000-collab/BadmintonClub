"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export default function AdminLoginPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setToken } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.postForm<TokenResponse>("/auth/admin/login", {
        username: mobileNumber,
        password,
      });
      await setToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-bold text-ink">Admin sign in</h1>
          <p className="mt-1 text-sm text-ink-secondary">Manage members, courts & finances.</p>
        </div>

        <Panel>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Mobile number"
              type="tel"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9876543210"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
