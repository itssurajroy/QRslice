// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import Link from "next/link";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import { useSuperAdmin } from "./SuperAdminContext";

type NavItem = {
  id: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  count?: number;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function ChartBarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function BuildingIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function StoreIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-2 9H5L3 3zm1 9v8a1 1 0 001 1h14a1 1 0 001-1v-8M9 21v-6h6v6" />
    </svg>
  );
}

function UsersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ShoppingBagIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function PulseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function MegaphoneIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}

function CogIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClipboardListIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function LifebuoyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function PuzzlePieceIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a2 2 0 012 2v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a2 2 0 01-2 2h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a2 2 0 01-2-2v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V8a2 2 0 012-2h3a1 1 0 001-1V4z" />
    </svg>
  );
}

function CommandLineIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function FlagIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LockClosedIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function FunnelIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function GlobeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function isItemActive(itemId: string, currentTab: string): boolean {
  if (itemId === "restaurants") return currentTab === "restaurants" || currentTab === "cafes" || currentTab === "tenants" || currentTab === "outlets";
  if (itemId === "dashboard") return currentTab === "dashboard" || currentTab === "analytics" || currentTab === "funnel";
  if (itemId === "system-health") return currentTab === "system-health" || currentTab === "health" || currentTab === "jobs";
  if (itemId === "admins") return currentTab === "admins" || currentTab === "roles" || currentTab === "users";
  if (itemId === "settings") return currentTab === "settings" || currentTab === "config" || currentTab === "feature-flags" || currentTab === "broadcast" || currentTab === "announcements" || currentTab === "api-keys" || currentTab === "content";
  return currentTab === itemId;
}

function getSuperNavGroups(totalCafes?: number): NavGroup[] {
  return [
    {
      title: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: ChartBarIcon },
      ],
    },
    {
      title: "Platform Operations",
      items: [
        { id: "restaurants", label: "Restaurants", icon: BuildingIcon, count: totalCafes },
        { id: "subscriptions", label: "Subscriptions", icon: CreditCardIcon },
        { id: "billing", label: "Billing", icon: CreditCardIcon },
        { id: "orders", label: "Live Orders", icon: ShoppingBagIcon },
        { id: "support", label: "Support", icon: LifebuoyIcon },
      ],
    },
    {
      title: "Infrastructure",
      items: [
        { id: "system-health", label: "System Health", icon: PulseIcon },
        { id: "integrations", label: "Integrations", icon: PuzzlePieceIcon },
      ],
    },
    {
      title: "Governance & Control",
      items: [
        { id: "admins", label: "Admins & Roles", icon: ShieldCheckIcon },
        { id: "audit", label: "Audit Logs", icon: ClipboardListIcon },
        { id: "settings", label: "Settings", icon: CogIcon },
      ],
    },
  ];
}

export function SuperSidebar() {
  const { tab, setTab, totalCafes } = useSuperAdmin();
  const groups = getSuperNavGroups(totalCafes);

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between flex-shrink-0 h-full select-none">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/super" className="flex items-center gap-3 group">
          <div>
            <div className="flex items-center gap-1.5">
              <QrSliceLogo size="md" className="group-hover:scale-105 transition-transform duration-200" priority />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="System Live"></span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
              Super Console
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id, tab);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#5738F5] text-white shadow-sm shadow-[#5738F5]/25 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All systems operational</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">99.98%</span>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-xs"
        >
          <GlobeIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>View Public Site ↗</span>
        </Link>
      </div>
    </aside>
  );
}

export function SuperMobileDrawer() {
  const { tab, setTab, totalCafes, mobileMenuOpen, setMobileMenuOpen } = useSuperAdmin();

  if (!mobileMenuOpen) return null;

  const groups = getSuperNavGroups(totalCafes);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch lg:hidden animate-fade-in">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className="relative w-full sm:w-80 max-w-full bg-white rounded-t-3xl sm:rounded-none max-h-[90dvh] sm:max-h-full sm:h-full flex flex-col z-10 shadow-2xl p-4 sm:p-5 pb-safe animate-slide-in-bottom sm:animate-none">
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <QrSliceLogo size="sm" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Super Console
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition-colors"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.id, tab);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                      isActive
                        ? "bg-[#5738F5] text-white shadow-sm font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <Link
            href="/"
            target="_blank"
            className="text-xs font-bold text-[#5738F5] hover:underline py-2"
          >
            Public Site ↗
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
