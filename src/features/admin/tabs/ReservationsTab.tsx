// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string; name: string; phone: string; party_size: number;
  starts_at: string; ends_at: string; code: string; status: string; table_ids: string[];
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-brand-lavender border-brand-lavender text-brand-dark",
  pending: "bg-amber-50 border-amber-300 text-amber-800",
  seated: "bg-emerald-50 border-emerald-200 text-emerald-700",
  cancelled: "bg-slate-100 border-slate-200 text-slate-500",
  expired: "bg-slate-100 border-slate-200 text-slate-500",
  no_show: "bg-red-50 border-red-200 text-red-700",
};

export function ReservationsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      setRows(res.ok ? await res.json() : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: "cancel" | "no_show" | "seat" | "accept") {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) load();
  }

  const filtered = rows.filter((r) =>
    !q.trim() ||
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.phone.includes(q.trim()) ||
    r.code.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const pending = filtered.filter((r) => r.status === "pending");
  const main = filtered.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">📅 Today's Reservations</h2>
          <p className="text-xs text-slate-500">{filtered.length} bookings • walk-in QR always wins on conflict</p>
        </div>
        <button type="button" onClick={load} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer">🔄 Refresh</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search name, phone, or code…"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand" />
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-700">⏳ Pending approval ({pending.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-white border border-amber-300 rounded-2xl p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{r.name} <span className="text-slate-500 font-mono text-xs">×{r.party_size}</span></span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${STATUS_STYLE.pending}`}>Pending approval</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {new Date(r.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – {new Date(r.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {r.phone} • Code {r.code}
                </p>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => act(r.id, "accept")} className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer">Accept ✓</button>
                  <button type="button" onClick={() => act(r.id, "cancel")} className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-xs text-slate-500 font-mono py-8 text-center">Loading reservations…</p>
      ) : main.length === 0 && pending.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">No reservations today yet.</p>
      ) : main.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {main.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{r.name} <span className="text-slate-500 font-mono text-xs">×{r.party_size}</span></span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${STATUS_STYLE[r.status] ?? STATUS_STYLE.cancelled}`}>{r.status.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {new Date(r.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – {new Date(r.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {r.phone} • Code {r.code}
              </p>
              {r.status === "confirmed" && (
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => act(r.id, "seat")} className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer">Seat ✓</button>
                  <button type="button" onClick={() => act(r.id, "no_show")} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer">No-show</button>
                  <button type="button" onClick={() => act(r.id, "cancel")} className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

