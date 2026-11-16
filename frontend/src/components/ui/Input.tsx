import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

function FieldChrome({
  label,
  hint,
  error,
  required,
  children,
}: FieldWrapperProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-ink">
          {label}
          {required && <span className="text-danger-600"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const fieldBaseClasses =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-bg disabled:text-ink-muted";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps
>(({ label, hint, error, required, className, ...props }, ref) => {
  return (
    <FieldChrome label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        required={required}
        className={cn(
          fieldBaseClasses,
          error ? "border-danger-600 focus:ring-danger-600/20" : "border-border-strong",
          className
        )}
        {...props}
      />
    </FieldChrome>
  );
});
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps
>(({ label, hint, error, required, className, children, ...props }, ref) => {
  return (
    <FieldChrome label={label} hint={hint} error={error} required={required}>
      <select
        ref={ref}
        required={required}
        className={cn(fieldBaseClasses, "border-border-strong", className)}
        {...props}
      >
        {children}
      </select>
    </FieldChrome>
  );
});
Select.displayName = "Select";
