"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { member, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!member) {
      router.replace("/login");
    } else if (member.role === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/member");
    }
  }, [member, isLoading, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-bg">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-brand-600 text-white">
        <Trophy className="h-6 w-6" />
      </span>
      <p className="text-sm text-ink-secondary">Loading...</p>
    </div>
  );
}
