"use client";

/**
 * Minimal global toast system (success/error feedback).
 *
 * Why a Context instead of a library: our needs are simple (show a
 * message, auto-dismiss) and this avoids an extra dependency. Any
 * component can call `useToast().show(...)` after an action succeeds
 * or fails.
 */

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "border-success-600/20 bg-white text-success-600",
  error: "border-danger-600/20 bg-white text-danger-600",
  info: "border-info-600/20 bg-white text-info-600",
};

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg",
                TONE_CLASSES[toast.tone]
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-ink">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
