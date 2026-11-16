"use client";

import { Input } from "@/components/ui/Input";

export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        label="From"
        type="date"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        className="w-auto"
      />
      <Input
        label="To"
        type="date"
        value={endDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        className="w-auto"
      />
    </div>
  );
}
