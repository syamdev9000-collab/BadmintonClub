/** Formats a numeric/string amount as Indian Rupees, e.g. "₹1,234.50". */
export function formatCurrency(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, { hour: "2-digit", minute: "2-digit" });
}

export function formatTime(value: string): string {
  // value like "19:00:00" -> "7:00 PM"
  const [h, m] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value_ = seconds;
  let unit = "second";
  for (const [limit, name] of units) {
    if (value_ < limit) {
      unit = name;
      break;
    }
    value_ = Math.floor(value_ / limit);
  }
  if (value_ < 5 && unit === "second") return "just now";
  return `${value_} ${unit}${value_ !== 1 ? "s" : ""} ago`;
}
