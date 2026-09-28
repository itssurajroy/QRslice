// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type SubRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  billing_status: string | null;
};

function daysLeft(trialEndsAt: string | null): string {
  if (!trialEndsAt) return "—";
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  return `${Math.ceil(diff / 864e5)}d left`;
}

export default function SuperBulkExtend({ rows }: { rows: SubRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trial = rows.filter((r) => r.plan === "trial");
  const active = rows.filter((r) => r.plan === "active");
  const expiredSuspended = rows.filter((r) =>
    ["expired", "suspended", "cancelled"].includes(r.plan)
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExtend(id: string) {
    setRowBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", id, days: 14 }),
      });
      if (!res.ok) throw new Error("Failed to extend trial");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to extend trial");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleActivate(id: string) {
    setRowBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/super/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "activate" }),
      });
      if (!res.ok) throw new Error("Failed to activate");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to activate");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleBulkExtend() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const id of selected) {
        const res = await fetch("/api/super/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extend_trial", id, days: 14 }),
        });
        if (!res.ok) throw new Error(`Bulk extend failed for ${id.slice(0, 8)}`);
      }
      setSelected(new Set());
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Bulk extend failed");
    } finally {
      setBusy(false);
    }
  }

  function renderTable(list: SubRow[], showActivate: boolean) {
    if (list.length === 0) {
      return <p className="p-6 text-center text-xs text-slate-400">None.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 uppercase tracking-wider text-xs">
              <th className="p-4 w-10">
                <span className="sr-only">Select</span>
              </th>
              <th className="p-4">Café</th>
              <th className="p-4">Status</th>
              <th className="p-4">Trial ends</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={`Select ${r.name}`}
                    className="h-4 w-4 accent-indigo-600"
                  />
                </td>
                <td className="p-4 font-bold text-slate-900">
                  {r.name}
                  <span className="block font-mono font-normal text-slate-400">
                    /c/{r.slug}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {r.plan}
                  <span className="block text-slate-400">
                    {r.billing_status ?? "—"} · {daysLeft(r.trial_ends_at)}
                  </span>
                </td>
                <td className="p-4 font-mono text-slate-500">
                  {r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="p-4 text-right space-x-1.5">
                  <button
                    type="button"
                    disabled={rowBusy === r.id}
                    onClick={() => handleExtend(r.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                  >
                    {rowBusy === r.id ? "…" : "Extend +14"}
                  </button>
                  {showActivate && (
                    <button
                      type="button"
                      disabled={rowBusy === r.id}
                      onClick={() => handleActivate(r.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                    >
                      {rowBusy === r.id ? "…" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl">
        <span className="text-xs text-slate-500">
          <strong>{selected.size}</strong> selected
        </span>
        <button
          type="button"
          disabled={busy || selected.size === 0}
          onClick={handleBulkExtend}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer"
        >
          {busy ? "Extending…" : `Bulk extend +14 (${selected.size})`}
        </button>
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <h2 className="p-4 text-sm font-black border-b border-slate-200">
          Trial ({trial.length})
        </h2>
        {renderTable(trial, false)}
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <h2 className="p-4 text-sm font-black border-b border-slate-200">
          Active ({active.length})
        </h2>
        {renderTable(active, false)}
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <h2 className="p-4 text-sm font-black border-b border-slate-200">
          Expired / Suspended ({expiredSuspended.length})
        </h2>
        {renderTable(expiredSuspended, true)}
      </section>
    </div>
  );
}

