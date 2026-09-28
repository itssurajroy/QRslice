// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  percentage: number;
  targetScope: "All" | "Pro Plan" | "Pilot Tenants" | "Internal Only";
  createdBy: string;
  lastModified: string;
  modifiedBy: string;
};

const scopeMap: Record<string, FeatureFlag["targetScope"]> = {
  all: "All",
  pro: "Pro Plan",
  pilot: "Pilot Tenants",
  internal: "Internal Only",
};

export function FeatureFlagsTab() {
  const { flash } = useSuperAdmin();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRolloutPct, setNewRolloutPct] = useState(100);
  const [newEnabled, setNewEnabled] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchFlags = useCallback(() => {
    setLoading(true);
    fetch("/api/super/flags")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.flags)) {
          const mapped: FeatureFlag[] = d.flags.map((f: any) => ({
            id: `flag-${f.key}`,
            key: f.key,
            name: f.key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: f.description || "No description",
            enabled: f.enabled ?? false,
            percentage: f.rollout_pct ?? (f.enabled ? 100 : 0),
            targetScope: "All",
            createdBy: "super@qrslice.test",
            lastModified: f.updated_at ? new Date(f.updated_at).toLocaleDateString("en-IN") : "Never",
            modifiedBy: "super@qrslice.test",
          }));
          setFlags(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleFlag = async (flagId: string) => {
    const flag = flags.find((f) => f.id === flagId);
    if (!flag) return;
    const nextState = !flag.enabled;
    const nextPct = nextState ? (flag.percentage === 0 ? 100 : flag.percentage) : 0;
    try {
      const res = await fetch("/api/super/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: flag.key,
          enabled: nextState,
          rollout_pct: nextPct,
          description: flag.description,
        }),
      });
      if (res.ok) {
        flash("ok", `Feature flag "${flag.name}" ${nextState ? "enabled" : "disabled"} (Audited)`);
        setFlags((prev) =>
          prev.map((f) =>
            f.id === flagId
              ? { ...f, enabled: nextState, percentage: nextPct, lastModified: "Just now" }
              : f
          )
        );
      } else {
        const err = await res.json().catch(() => ({}));
        flash("err", err.error || "Failed to update feature flag");
      }
    } catch {
      flash("err", "Network error updating feature flag");
    }
  };

  const updatePercentage = async (flagId: string, pct: number) => {
    const flag = flags.find((f) => f.id === flagId);
    if (!flag) return;
    const nextEnabled = pct > 0;
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flagId ? { ...f, percentage: pct, enabled: nextEnabled, lastModified: "Just now" } : f
      )
    );
    try {
      const res = await fetch("/api/super/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: flag.key,
          enabled: nextEnabled,
          rollout_pct: pct,
          description: flag.description,
        }),
      });
      if (res.ok) {
        flash("ok", `Feature flag "${flag.name}" traffic set to ${pct}%`);
      } else {
        flash("err", "Failed to update percentage");
      }
    } catch {
      flash("err", "Network error updating percentage");
    }
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (cleanKey.length < 2) {
      flash("err", "Key must be at least 2 characters (alphanumeric and dashes)");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/super/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cleanKey,
          enabled: newEnabled,
          rollout_pct: newRolloutPct,
          description: newDesc.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        flash("ok", `Feature flag "${cleanKey}" created successfully`);
        setShowCreateModal(false);
        setNewKey("");
        setNewDesc("");
        setNewRolloutPct(100);
        fetchFlags();
      } else {
        flash("err", data.error || "Failed to create feature flag");
      }
    } catch {
      flash("err", "Network error creating feature flag");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feature Flags Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control progressive feature rollouts, dark launches, and tenant-targeted feature gating.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#492ee0] text-white font-bold text-xs transition-all shadow-sm shadow-[#5738F5]/25 cursor-pointer flex items-center gap-1.5"
          >
            <span>＋ Add Feature Flag</span>
          </button>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Active Experiments: <strong className="text-slate-900 font-mono">{flags.filter((f) => f.enabled).length} Live</strong>
          </span>
        </div>
      </div>

      {/* Flag Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading feature flags…</div>
        ) : flags.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No feature flags configured.</div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{flag.name}</h3>
                    <code className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {flag.key}
                    </code>
                  </div>
                  <p className="text-xs text-slate-500 max-w-2xl">{flag.description}</p>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold ${
                      flag.enabled ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {flag.enabled ? `${flag.percentage}% Rollout` : "Disabled"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFlag(flag.id)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      flag.enabled ? "bg-[#5738F5]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        flag.enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Rollout Slider & Target Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <label htmlFor={`traffic-${flag.id}`}>Traffic Allocation</label>
                    <span className="font-mono font-bold text-slate-900">{flag.percentage}%</span>
                  </div>
                  <input
                    id={`traffic-${flag.id}`}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={flag.percentage}
                    onChange={(e) => updatePercentage(flag.id, Number(e.target.value))}
                    className="w-full accent-[#5738F5] cursor-pointer"
                  />
                </div>

                <div className="text-xs text-slate-600">
                  <span className="text-slate-400 block text-[11px]">Targeting Scope:</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-violet-50 text-[#5738F5] font-bold border border-violet-100">
                    {flag.targetScope}
                  </span>
                </div>

                <div className="text-xs text-slate-400 text-right">
                  <span>Modified by </span>
                  <strong className="text-slate-700">{flag.modifiedBy}</strong>
                  <span className="block text-[11px] font-mono">{flag.lastModified}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateFlag}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Feature Flag</h3>
                <p className="text-xs text-slate-500">Configure progressive rollout or dark launch</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Flag Key</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. upi-autopay-v2"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-[#5738F5]"
                  required
                />
                <span className="text-[10px] text-slate-400">Lower-case alphanumeric with hyphens</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the feature or experiment purpose…"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#5738F5] resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div>
                  <label htmlFor="new-traffic" className="text-xs font-bold text-slate-800">Initial Traffic Allocation</label>
                  <div className="text-[11px] font-mono text-slate-500">{newRolloutPct}%</div>
                </div>
                <input
                  id="new-traffic"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newRolloutPct}
                  onChange={(e) => setNewRolloutPct(Number(e.target.value))}
                  className="w-36 accent-[#5738F5] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-xs font-bold text-slate-800">Enabled Immediately</span>
                <input
                  type="checkbox"
                  checked={newEnabled}
                  onChange={(e) => setNewEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#5738F5] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 rounded-xl bg-[#5738F5] text-white text-xs font-bold hover:bg-[#492ee0] shadow-sm shadow-[#5738F5]/25 cursor-pointer disabled:opacity-50"
              >
                {isCreating ? "Creating…" : "Save Flag"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
