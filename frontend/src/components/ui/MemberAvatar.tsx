import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const PALETTE = [
  "bg-brand-100 text-brand-700",
  "bg-accent-300/50 text-brand-800",
  "bg-info-50 text-info-600",
  "bg-warning-50 text-warning-600",
];

function paletteFor(name: string) {
  const index = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[index];
}

export function MemberAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClasses,
        paletteFor(name || "?"),
        className
      )}
    >
      {initials(name || "?")}
    </span>
  );
}
