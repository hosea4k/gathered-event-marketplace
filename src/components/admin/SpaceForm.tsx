"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Space } from "@/lib/types";

export default function SpaceForm({ initial, spaceId }: { initial?: Space; spaceId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    capacity: initial?.capacity ?? 50,
    pricePerHour: initial?.pricePerHour ?? 100,
    minHours: initial?.minHours ?? 2,
    cleaningFee: initial?.cleaningFee ?? 0,
    amenities: initial?.amenities.join(", ") ?? "",
    photos: initial?.photos.join("\n") ?? "",
    openTime: initial?.openTime ?? "09:00",
    closeTime: initial?.closeTime ?? "23:00",
    isActive: initial?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
      photos: form.photos.split(/\n|,/).map((s) => s.trim()).filter(Boolean),
    };

    const res = await fetch(spaceId ? `/api/admin/spaces/${spaceId}` : "/api/admin/spaces", {
      method: spaceId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong saving this space.");
      return;
    }
    router.push("/admin/spaces");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="City">
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} required />
        </Field>
      </div>
      <Field label="Tagline">
        <input className="input" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} required />
      </Field>
      <Field label="Description">
        <textarea
          className="input min-h-28"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
        />
      </Field>
      <Field label="Address">
        <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} required />
      </Field>

      <div className="grid grid-cols-4 gap-3">
        <Field label="Capacity">
          <input
            type="number"
            min={1}
            className="input"
            value={form.capacity}
            onChange={(e) => set("capacity", Number(e.target.value))}
          />
        </Field>
        <Field label="$ / hour">
          <input
            type="number"
            min={0}
            className="input"
            value={form.pricePerHour}
            onChange={(e) => set("pricePerHour", Number(e.target.value))}
          />
        </Field>
        <Field label="Min hours">
          <input
            type="number"
            min={1}
            className="input"
            value={form.minHours}
            onChange={(e) => set("minHours", Number(e.target.value))}
          />
        </Field>
        <Field label="Cleaning fee">
          <input
            type="number"
            min={0}
            className="input"
            value={form.cleaningFee}
            onChange={(e) => set("cleaningFee", Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Open time">
          <input
            type="time"
            className="input"
            value={form.openTime}
            onChange={(e) => set("openTime", e.target.value)}
          />
        </Field>
        <Field label="Close time">
          <input
            type="time"
            className="input"
            value={form.closeTime}
            onChange={(e) => set("closeTime", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Amenities (comma-separated)">
        <input className="input" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} />
      </Field>
      <Field label="Photo URLs (one per line)">
        <textarea
          className="input min-h-24"
          value={form.photos}
          onChange={(e) => set("photos", e.target.value)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        Listed (visible to guests)
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Saving…" : spaceId ? "Save changes" : "Create space"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
