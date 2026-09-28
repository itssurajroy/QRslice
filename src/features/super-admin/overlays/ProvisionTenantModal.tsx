// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useSuperAdmin } from "../SuperAdminContext";

export function ProvisionTenantModal() {
  const ctx = useSuperAdmin();
  const {
    showNewCafeModal,
    setShowNewCafeModal,
    newCafeName,
    setNewCafeName,
    newCafeSlug,
    setNewCafeSlug,
    newCafeOwnerName,
    setNewCafeOwnerName,
    newCafeOwnerEmail,
    setNewCafeOwnerEmail,
    creatingCafe,
    handleCreateCafeSubmit,
  } = ctx;

  const ownerEmailValid =
    !newCafeOwnerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCafeOwnerEmail.trim());

  if (!showNewCafeModal) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setShowNewCafeModal(false)}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
              Provision New Café Tenant
            </h3>
            <p className="text-xs text-slate-500">Deploy fresh dining environment & owner credentials</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCafeModal(false)}
            className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateCafeSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Café Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amber Artisan Coffee"
              value={newCafeName}
              onChange={(e) => {
                setNewCafeName(e.target.value);
                setNewCafeSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                );
              }}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              URL Slug
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-mono text-xs">qrslice.com/c/</span>
              <input
                type="text"
                required
                placeholder="amber-coffee"
                value={newCafeSlug}
                onChange={(e) => setNewCafeSlug(e.target.value.toLowerCase())}
                className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 pl-28 text-[#5738F5] font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Owner Name
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={newCafeOwnerName}
              onChange={(e) => setNewCafeOwnerName(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Owner Email Address
            </label>
            <input
              type="email"
              placeholder="owner@example.com"
              value={newCafeOwnerEmail}
              onChange={(e) => setNewCafeOwnerEmail(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 font-medium"
            />
            {!ownerEmailValid && (
              <p className="mt-1 text-[11px] font-bold text-rose-600">Enter a valid email address.</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-900">Subscription Tier</span>
              <select
                value={ctx.newCafeTier}
                onChange={(e) => ctx.setNewCafeTier(e.target.value as "starter" | "pro" | "enterprise")}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#5738F5]/50"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-500 block">
              {ctx.newCafeTier === "starter" && "Basic Menu, 10 Tables, POS"}
              {ctx.newCafeTier === "pro" && "Unlimited Tables, Advanced Analytics, KDS, Custom Branding"}
              {ctx.newCafeTier === "enterprise" && "Everything + CRM, Loyalty, Multi-Location"}
            </span>
          </div>

          <button
            type="submit"
            disabled={creatingCafe || !newCafeName || !newCafeSlug || !ownerEmailValid}
            className="w-full py-3 rounded-xl bg-[#5738F5] hover:bg-[#492ee0] text-white font-bold text-xs shadow-sm shadow-[#5738F5]/25 active:scale-95 disabled:opacity-50 cursor-pointer mt-2 transition-all"
          >
            {creatingCafe ? "Provisioning Tenant…" : "Create & Launch Café Tenant →"}
          </button>
        </form>
      </div>
    </div>
  );
}
