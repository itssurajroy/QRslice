// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import { JobsTab } from "./JobsTab";

type Health = { failedWebhooks: number; errorAudits: number; failedPayments: number; checked_at: string };

type Subsystem = { name: string; status: string; ping: string };

type Alert = { severity: "red" | "amber"; text: string; tab: string };

function Indicator({ label, value, degraded, description }: { label: string; value: number; degraded: boolean; description: string }) {
  const bad = value > 0;
  const statusColor = degraded
    ? "bg-slate-100 text-slate-600 border-slate-200"
    : bad
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const dot = degraded ? "bg-slate-400" : bad ? "bg-rose-500 animate-pulse" : "bg-emerald-500";

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
            {degraded ? "Unavailable" : bad ? "Needs Attention" : "Healthy"}
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{degraded ? "—" : value}</span>
          <span className="text-xs font-semibold text-slate-400">incidents</span>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 font-medium mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span>{description}</span>
        <span>Past 24h</span>
      </div>
    </div>
  );
}

export function SystemHealthTab() {
  const { tab, kpis, setTab } = useSuperAdmin();
  const [activeSubTab, setActiveSubTab] = useState<"monitoring" | "jobs">(tab === "jobs" ? "jobs" : "monitoring");
  const [health, setHealth] = useState<Health>({ failedWebhooks: 0, errorAudits: 0, failedPayments: 0, checked_at: "" });
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super/system-health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data.health);
      setSubsystems(data.subsystems || []);
      setDegraded(false);
    } catch {
      setHealth({ failedWebhooks: 0, errorAudits: 0, failedPayments: 0, checked_at: "" });
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const alerts: Alert[] = React.useMemo(() => {
    const a: Alert[] = [];
    if (health.failedPayments > 0)
      a.push({ severity: "red", text: `${health.failedPayments} failed payment${health.failedPayments > 1 ? "s" : ""} in 24h`, tab: "billing" });
    if (health.failedWebhooks > 0)
      a.push({ severity: "red", text: `${health.failedWebhooks} failed webhook${health.failedWebhooks > 1 ? "s" : ""} in 24h`, tab: "audit" });
    if (health.errorAudits > 0)
      a.push({ severity: "amber", text: `${health.errorAudits} error audits in 24h`, tab: "audit" });
    if ((kpis?.trialsEnding7d ?? 0) > 0)
      a.push({ severity: "amber", text: `${kpis.trialsEnding7d} trial${kpis.trialsEnding7d > 1 ? "s" : ""} expiring within 7 days`, tab: "restaurants" });
    if ((kpis?.suspended ?? 0) > 0)
      a.push({ severity: "amber", text: `${kpis.suspended} suspended tenant${kpis.suspended > 1 ? "s" : ""} need${kpis.suspended > 1 ? "" : "s"} review`, tab: "restaurants" });
    return a;
  }, [health, kpis]);

  return (
    <div className="space-y-6">
      {/* Segmented Sub-Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab("monitoring")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "monitoring"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Telemetry & Subsystems
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("jobs")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "jobs"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Background Jobs Queue
        </button>
      </div>

      {activeSubTab === "jobs" ? (
        <JobsTab />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">System Infrastructure Health</h2>
                <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#5738F5] text-[10px] font-black uppercase tracking-wider border border-violet-100">
                  Live Monitoring
                </span>
              </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {loading
              ? "Checking telemetry signals & endpoints…"
              : degraded
              ? "Health telemetry signals unavailable — running on degraded fallback."
              : `Last verified at ${health.checked_at ? new Date(health.checked_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={loadHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? "Inspecting…" : "Refresh Signals"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Indicator
          label="Failed Webhooks"
          value={health.failedWebhooks}
          degraded={degraded}
          description="Razorpay & partner hooks"
        />
        <Indicator
          label="Error Audits"
          value={health.errorAudits}
          degraded={degraded}
          description="Security & auth exceptions"
        />
        <Indicator
          label="Failed Payments"
          value={health.failedPayments}
          degraded={degraded}
          description="Subscription payment drops"
        />
      </div>

      {/* Action Center — items needing a human, derived from live signals */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Action Center</h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${alerts.length === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            {alerts.length === 0 ? "All clear" : `${alerts.length} open`}
          </span>
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium">No trials expiring, no failures, no suspended tenants. Nothing needs you right now.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.severity === "red" ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`}></span>
                  <span className="text-xs font-semibold text-slate-800 truncate">{a.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTab(a.tab)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#5738F5] font-bold text-xs hover:bg-violet-50 shrink-0 cursor-pointer transition-colors"
                >
                  Review →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform subsystem status */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Subsystem Connectivity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {subsystems.map((s) => (
            <div key={s.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">{s.name}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.ping} latency</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${s.status === "Operational" ? "bg-emerald-500" : "bg-rose-500"} shadow-sm ${s.status === "Operational" ? "shadow-emerald-500/50" : ""}`}></span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
