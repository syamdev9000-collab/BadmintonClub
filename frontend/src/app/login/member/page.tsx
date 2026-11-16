"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export default function MemberLoginPage() {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setToken } = useAuth();
  const router = useRouter();

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/auth/otp/request", { mobile_number: mobileNumber });
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<TokenResponse>("/auth/otp/verify", {
        mobile_number: mobileNumber,
        code,
      });
      await setToken(res.access_token);
      router.push("/member");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired code");
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
            <Smartphone className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-bold text-ink">Member sign in</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Track your balance, payments & playing schedule.
          </p>
        </div>

        <Panel>
          {step === "mobile" ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <Input
                label="Mobile number"
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="9876543210"
                hint="Only numbers registered by the admin can sign in."
              />
              {error && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-ink-secondary">
                Enter the 6-digit code sent to <strong className="text-ink">{mobileNumber}</strong>.
              </p>
              <Input
                label="OTP code"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
              {error && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Verify & sign in
              </Button>
              <button
                type="button"
                onClick={() => setStep("mobile")}
                className="w-full text-center text-xs font-medium text-ink-secondary hover:text-ink"
              >
                Use a different number
              </button>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}
