// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type FlagRow = {
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string;
};

export function PlatformConfigForm({
  initialTrialDays,
  initialMonthly,
  initialYearly,
  initialMaintenance,
}: {
  initialTrialDays: number;
  initialMonthly: number;
  initialYearly: number;
  initialMaintenance: boolean;
}) {
  const router = useRouter();
  const [trialDays, setTrialDays] = useState(initialTrialDays);
  const [monthly, setMonthly] = useState(initialMonthly);
  const [yearly, setYearly] = useState(initialYearly);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/super/platform", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trial_days: Number(trialDays),
          price_monthly: Number(monthly),
          price_yearly: Number(yearly),
          maintenance_mode: maintenance,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to save platform settings");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error saving platform settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4"
    >
      <div>
        <h2 className="text-sm font-black text-slate-900">Platform Settings</h2>
        <p className="text-xs text-slate-500">Trial length, pricing defaults, and maintenance mode.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Trial days
          </span>
          <input
            type="number"
            min={1}
            max={90}
            value={trialDays}
            onChange={(e) => setTrialDays(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Price monthly (₹)
          </span>
          <input
            type="number"
            min={0}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Price yearly (₹)
          </span>
          <input
            type="number"
            min={0}
            value={yearly}
            onChange={(e) => setYearly(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </div>
      <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <span>
          <span className="block text-xs font-bold text-slate-900">Maintenance mode</span>
          <span className="block text-xs text-slate-500">Show a maintenance notice to customers</span>
        </span>
        <input
          type="checkbox"
          checked={maintenance}
          onChange={(e) => setMaintenance(e.target.checked)}
          aria-label="Maintenance mode"
          className="h-5 w-5 accent-indigo-600"
        />
      </label>
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      {saved && <p className="text-xs font-bold text-emerald-600">Saved.</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
      >
        {loading ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}

export function FlagsManager({ initialFlags }: { initialFlags: FlagRow[] }) {
  const router = useRouter();
  const [flags, setFlags] = useState<FlagRow[]>(initialFlags);
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleFlag(flag: FlagRow) {
    setRowBusy(flag.key);
    setError(null);
    try {
      const res = await fetch("/api/super/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, enabled: !flag.enabled, description: flag.description }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to update flag");
        return;
      }
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: !f.enabled } : f)));
      router.refresh();
    } catch {
      setError("Network error updating flag");
    } finally {
      setRowBusy(null);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim().toLowerCase(), enabled: true, description: description.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to create flag");
        return;
      }
      if (data?.flag) setFlags((prev) => [...prev, data.flag].sort((a, b) => a.key.localeCompare(b.key)));
      setKey("");
      setDescription("");
      router.refresh();
    } catch {
      setError("Network error creating flag");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onCreate}
        className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3"
      >
        <div>
          <h2 className="text-sm font-black text-slate-900">New Feature Flag</h2>
          <p className="text-xs text-slate-500">Keys use lowercase letters, numbers, and dashes.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            required
            minLength={2}
            maxLength={50}
            pattern="[a-z0-9-]+"
            placeholder="new-checkout"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="Description (optional)"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
        >
          {loading ? "Creating…" : "Create Flag"}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 uppercase tracking-wider text-xs">
                <th className="p-4">Flag</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flags.map((f) => (
                <tr key={f.key} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{f.key}</td>
                  <td className="p-4 text-slate-600">{f.description || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold uppercase text-xs ${
                        f.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {f.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      disabled={rowBusy === f.key}
                      onClick={() => toggleFlag(f)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                    >
                      {rowBusy === f.key ? "…" : f.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No feature flags yet — create the first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

