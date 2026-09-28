// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionForm({
  id,
  plan,
  trialEndsAt,
  tier,
}: {
  id: string;
  plan: string;
  trialEndsAt: string | null;
  tier: string | null;
}) {
  const router = useRouter();
  const [planValue, setPlanValue] = useState(plan === "active" ? "active" : "trial");
  const [dateValue, setDateValue] = useState(trialEndsAt ? trialEndsAt.slice(0, 16) : "");
  const [tierValue, setTierValue] = useState(tier ?? "pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("Save subscription changes for this tenant?")) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/super/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "set_fields",
          plan: planValue,
          trial_ends_at: dateValue ? new Date(dateValue).toISOString() : undefined,
          tier: tierValue,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to save subscription");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error saving subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
      <div>
        <h2 className="text-sm font-black text-slate-900">Subscription</h2>
        <p className="text-xs text-slate-500">Plan + trial expiry. Status is derived automatically.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan</span>
          <select
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="trial">trial</option>
            <option value="active">active</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trial ends at</span>
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier</span>
          <select
            value={tierValue}
            onChange={(e) => setTierValue(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="starter">starter</option>
            <option value="pro">pro</option>
            <option value="enterprise">enterprise</option>
          </select>
        </label>
      </div>
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      {saved && <p className="text-xs font-bold text-emerald-600">Saved.</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
      >
        {loading ? "Saving…" : "Save Subscription"}
      </button>
    </form>
  );
}
