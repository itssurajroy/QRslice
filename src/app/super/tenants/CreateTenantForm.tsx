// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to create tenant");
        return;
      }
      setName("");
      setSlug("");
      setOwnerName("");
      setOwnerEmail("");
      router.refresh();
    } catch {
      setError("Network error creating tenant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
      <div>
        <h2 className="text-sm font-black text-slate-900">Create Tenant</h2>
        <p className="text-xs text-slate-500">Provisions a trial café + owner login (14-day trial by default).</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Café name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="Curry Leaf"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            required
            minLength={2}
            maxLength={50}
            pattern="[a-z0-9-]+"
            placeholder="curry-leaf"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Owner name</span>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="Asha Sharma"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Owner email</span>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            required
            placeholder="owner@example.com"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </div>
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
      >
        {loading ? "Creating…" : "Create Tenant"}
      </button>
    </form>
  );
}

