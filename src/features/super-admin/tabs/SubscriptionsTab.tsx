// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

export function SubscriptionsTab() {
  const { tab, cafes, openDrawer, subscriptionPlans } = useSuperAdmin();
  const [search, setSearch] = useState("");
  const [apiMrrPaise, setApiMrrPaise] = useState<number | null>(null);

  // Wire to the same /api/super/billing dataset (paise-accurate server MRR).
  useEffect(() => {
    fetch("/api/super/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.ok && typeof d.mrr_paise === "number") setApiMrrPaise(d.mrr_paise); })
      .catch(() => {});
  }, []);

  // Extract live monthly price from context
  const activePlan = (subscriptionPlans || []).find((p: any) => p.billing_cycle === "monthly" && p.active !== false);
  const monthlyPaise = activePlan?.price_paise || 99900;
  const monthlyRupees = Math.round(monthlyPaise / 100);

  // Calculate stats based on cafe plan & billing_status
  const activeCafes = cafes.filter((c: any) => c.plan === "active" || c.billing_status === "active");
  const trialCafes = cafes.filter((c: any) => c.plan === "trial" || (!c.plan && c.billing_status !== "active"));
  const suspendedCafes = cafes.filter((c: any) => c.plan === "suspended" || c.plan === "cancelled");
  
  // Prefer server MRR (mrr_cents sums, integer paise).
  const mrr = apiMrrPaise !== null ? Math.round(apiMrrPaise / 100) : activeCafes.length * monthlyRupees;

  const filtered = cafes.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* MRR Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Monthly MRR</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
              Contracted
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3 font-mono tracking-tight">
            ₹{mrr.toLocaleString("en-IN")}<span className="text-sm text-slate-400 font-sans font-medium">/mo</span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ₹{monthlyRupees.toLocaleString("en-IN")} / active subscriber
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Paid Tenants</span>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
              Live
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3 font-mono tracking-tight">{activeCafes.length}</div>
          <div className="mt-3 text-xs text-slate-400 font-medium">Generating recurring revenue</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active In Free Trial</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-100">
              Pipeline
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3 font-mono tracking-tight">{trialCafes.length}</div>
          <div className="mt-3 text-xs text-amber-600 font-medium">14-day evaluation period</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search subscriptions by tenant café name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1 font-medium text-xs"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 font-black text-sm text-slate-900">
          Tenant Subscriptions Ledger ({filtered.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">Tenant Café</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Subscription Status</th>
                <th className="p-4">Billing Rate</th>
                <th className="p-4">Cadence</th>
                <th className="p-4">Renewal / Expiry</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c: any) => {
                const isPaid = c.plan === "active" || c.billing_status === "active";
                const isTrial = c.plan === "trial" || (!c.plan && !isPaid);
                const isSuspended = c.plan === "suspended" || c.plan === "cancelled";
                const statusLabel = isPaid ? "Active Paid" : isTrial ? "Free Trial" : isSuspended ? "Suspended" : "Free";

                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-slate-400 text-[10px] font-mono mt-0.5">/c/{c.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-violet-50 text-[#5738F5] border border-violet-200 px-2.5 py-0.5 rounded-full font-black uppercase text-[10px]">
                        {c.tier || "Pro Suite"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isTrial
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500" : isTrial ? "bg-amber-500" : "bg-rose-500"}`}></span>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {isPaid ? "₹999/mo" : "Free"}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">Monthly</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {c.subscription_ends_at
                        ? new Date(c.subscription_ends_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                        : c.trial_ends_at
                          ? new Date(c.trial_ends_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDrawer(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-[#5738F5] border border-violet-200 font-bold text-xs cursor-pointer transition-all"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    No subscriptions match your search.
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
