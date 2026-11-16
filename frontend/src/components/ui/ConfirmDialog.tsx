"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  isLoading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <button
            onClick={onCancel}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={tone} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
