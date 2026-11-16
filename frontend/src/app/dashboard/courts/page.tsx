"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Plus, Clock, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Court } from "@/lib/types";

const ACCENTS = [
  "from-brand-600 to-brand-800",
  "from-emerald-500 to-teal-700",
  "from-lime-500 to-brand-700",
  "from-teal-500 to-brand-800",
];

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [timings, setTimings] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  function loadCourts() {
    api.get<Court[]>("/courts?only_active=false").then(setCourts).catch(() => setCourts([]));
  }

  useEffect(loadCourts, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/courts", {
        name,
        location,
        price_per_hour: pricePerHour,
        available_timings: timings || null,
        contact_number: contact || null,
      });
      setName("");
      setLocation("");
      setPricePerHour("");
      setTimings("");
      setContact("");
      setShowForm(false);
      loadCourts();
      show("Court added", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Court Management"
        description="Courts your club plays at across Hyderabad."
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add court"}
          </Button>
        }
      />

      {showForm && (
        <Panel title="Add a court">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} />
            <Input
              label="Price / hour (Rs.)"
              type="number"
              required
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
            />
            <Input
              label="Available timings"
              value={timings}
              onChange={(e) => setTimings(e.target.value)}
              placeholder="6 AM - 11 PM daily"
            />
            <Input label="Contact number" value={contact} onChange={(e) => setContact(e.target.value)} />
            {error && <p className="sm:col-span-3 text-sm font-medium text-danger-600">{error}</p>}
            <div className="sm:col-span-3">
              <Button type="submit" isLoading={isSubmitting}>
                Add court
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {!courts ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : courts.length === 0 ? (
        <EmptyState icon={MapPin} title="No courts added yet" description="Add your first court above." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courts.map((c, i) => (
            <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <div className={`flex h-24 items-end bg-gradient-to-br p-4 text-white ${ACCENTS[i % ACCENTS.length]}`}>
                <MapPin className="h-6 w-6 opacity-80" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-ink">{c.name}</h4>
                  <StatusBadge tone={c.is_active ? "success" : "neutral"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </StatusBadge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                  <MapPin className="h-3.5 w-3.5" /> {c.location}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <IndianRupee className="h-3.5 w-3.5" /> {formatCurrency(c.price_per_hour)} / hour
                </p>
                {c.available_timings && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-secondary">
                    <Clock className="h-3.5 w-3.5" /> {c.available_timings}
                  </p>
                )}
                {c.contact_number && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-secondary">
                    <Phone className="h-3.5 w-3.5" /> {c.contact_number}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
