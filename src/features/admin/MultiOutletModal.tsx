// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type Outlet = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  logoUrl?: string | null;
  tagline?: string | null;
  plan?: string;
  tier?: string;
  revenueTodayPaise: number;
  ordersToday: number;
  activeOrdersCount: number;
  lastOrderTime: string | null;
  status: "active" | "busy" | "closed";
};

export function MultiOutletModal({
  currentRestaurantId,
  currentRestaurantName,
  onClose,
}: {
  currentRestaurantId: string;
  currentRestaurantName: string;
  onClose: () => void;
}) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveSync, setIsLiveSync] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [franchiseTotalRevenuePaise, setFranchiseTotalRevenuePaise] = useState(0);
  const [franchiseTotalOrders, setFranchiseTotalOrders] = useState(0);

  // New Outlet Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchSlug, setNewBranchSlug] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const fetchOutlets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/admin/outlets");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setOutlets(data.outlets || []);
          setFranchiseTotalRevenuePaise(data.franchiseTotalRevenuePaise || 0);
          setFranchiseTotalOrders(data.franchiseTotalOrders || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch franchise outlets:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial fetch and Realtime order listener
  useEffect(() => {
    fetchOutlets();

    const channel = supabase
      .channel("franchise-multi-outlet-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          setIsLiveSync(true);
          fetchOutlets(true);
          setTimeout(() => setIsLiveSync(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOutlets, supabase]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreatingBranch(true);

    try {
      const res = await fetch("/api/admin/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranchName,
          slug: newBranchSlug,
          address: newBranchAddress,
          phone: newBranchPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create new outlet branch");
      }

      setOutlets((prev) => [...prev, data.outlet]);
      setShowAddModal(false);
      setNewBranchName("");
      setNewBranchSlug("");
      setNewBranchAddress("");
      setNewBranchPhone("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Branch creation failed");
    } finally {
      setCreatingBranch(false);
    }
  };

  // Base domain derived from the current host — works on localhost
  // (*.localhost resolves to 127.0.0.1), any dev domain, and qrslice.com
  // without hardcoding an external DNS service.
  const outletBase = (): string | null => {
    if (typeof window === "undefined") return null;
    const hostname = window.location.host.split(":")[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null; // IP literal: no subdomains
    const labels = hostname.split(".");
    if (labels.length <= 1 || hostname === "localhost") return "localhost";
    return labels.slice(-2).join(".");
  };

  const handleSwitchOutlet = (outlet: Outlet) => {
    if (typeof window === "undefined") return;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;
    const base = outletBase();

    // IP-literal hosts can't do subdomains: stay on same-host admin.
    const targetUrl = base
      ? `${protocol}//${outlet.slug}.${base}${port}/admin`
      : `${protocol}//${window.location.host}/admin`;

    window.location.assign(targetUrl);
  };

  const filteredOutlets = outlets.filter((out) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      out.name.toLowerCase().includes(q) ||
      out.slug.toLowerCase().includes(q) ||
      out.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-lavender text-brand-dark border border-brand-lavender">
              ⚡ Franchise Enterprise Dashboard
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                isLiveSync
                  ? "bg-emerald-500 text-white animate-pulse shadow-md"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveSync ? "bg-white" : "bg-emerald-500"
                }`}
              ></span>
              {isLiveSync ? "Realtime Updating..." : "Realtime Live Sync"}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Multi-Outlet Franchise Operations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time live multi-branch revenue monitoring, active order tracking, and instant operational context switching.
          </p>
        </div>

        {/* Consolidated Franchise Revenue Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-indigo-800/50 grid grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
              Franchise Revenue Today
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5 block">
              ₹{(franchiseTotalRevenuePaise / 100).toLocaleString("en-IN")}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
              Total Orders Today
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5 block">
              {franchiseTotalOrders}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
              Active Outlets
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
              {outlets.length} Branches
            </span>
          </div>
        </div>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search branch by name, location, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>+</span> Add Franchise Branch
          </button>
        </div>

        {/* Outlets List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px] max-h-[360px]">
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-bold">Syncing live outlet metrics across franchise...</p>
            </div>
          ) : filteredOutlets.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <p className="text-sm font-bold text-slate-700">No outlets found matching &quot;{searchQuery}&quot;</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or add a new branch.</p>
            </div>
          ) : (
            filteredOutlets.map((out) => {
              const isCurrent = out.id === currentRestaurantId;
              return (
                <div
                  key={out.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? "bg-brand-lavender/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-base">{out.name}</span>
                      {isCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-brand text-white font-black text-[9px] uppercase tracking-wider">
                          ✓ Current Context
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] font-mono">
                          {(() => { const b = outletBase(); return b ? `${out.slug}.${b}` : out.slug; })()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium">📍 {out.address}</p>

                    <div className="flex items-center gap-4 text-xs font-mono pt-1">
                      <span className="font-black text-slate-900">
                        Revenue: <span className="text-emerald-700">₹{(out.revenueTodayPaise / 100).toLocaleString("en-IN")}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-700">Orders: {out.ordersToday}</span>
                      {out.activeOrdersCount > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[10px]">
                            ⚡ {out.activeOrdersCount} Live Orders
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        out.status === "active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : out.status === "busy"
                          ? "bg-amber-100 text-amber-950 border border-amber-300 animate-pulse"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {out.status === "busy" ? "🔥 Busy Kitchen" : out.status === "active" ? "🟢 Live Active" : "⏸️ Closed / Idle"}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/c/${out.slug}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                        title="View Public QR Menu"
                      >
                        Menu ↗
                      </Link>

                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => handleSwitchOutlet(out)}
                          className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-extrabold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          Switch Outlet &rarr;
                        </button>
                      ) : (
                        <span className="text-xs font-black text-brand px-2 py-1">Active Outlet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between text-xs">
          <Link
            href="/super"
            onClick={onClose}
            className="text-brand font-extrabold hover:underline flex items-center gap-1"
          >
            <span>👑</span> Open Super Admin Console (/super) &rarr;
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>

      {/* Add New Outlet Branch Sub-Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900">Add New Franchise Outlet</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a new café branch under your franchise. Starter categories and 5 default tables will be auto-generated.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Branch / Outlet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Curry Leaf — Cyber Hub"
                  value={newBranchName}
                  onChange={(e) => {
                    setNewBranchName(e.target.value);
                    if (!newBranchSlug) {
                      setNewBranchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Subdomain URL Slug *</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="cyberhub"
                    value={newBranchSlug}
                    onChange={(e) => setNewBranchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-l-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs font-mono text-slate-500">
                    {(() => { const b = outletBase(); return b ? `.${b}` : ""; })()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">City / Location Address</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber City, DLF Phase 2, Gurugram"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingBranch}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                >
                  {creatingBranch ? "Creating Branch..." : "Create Franchise Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

