// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { QrSliceLogo, QrSliceIcon } from "@/components/brand/QrSliceLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DashboardIcon,
  ClipboardListIcon,
  ChefHatIcon,
  ChairIcon,
  BookOpenIcon,
  BoxIcon,
  SoupIcon,
  CreditCardIcon,
  ChartIcon,
  UsersIcon,
  GearIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SearchIcon,
  SlidersIcon,
  PlugIcon,
  CalendarIcon,
  MessageCircleIcon,
  InboxIcon,
  LifebuoyIcon,
  ManualIcon,
} from "@/components/Icons";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";

import { canAccessTab, getRoleBadge } from "@/lib/role-permissions";

export type AdminSectionId =
  // DASHBOARD
  | "dashboard"
  // OPERATIONS
  | "tables"
  | "orders"
  | "pos"
  | "kitchen"
  | "bookings"
  | "inbox"
  // CATALOG
  | "menu"
  | "categories"
  | "modifiers"
  // INVENTORY
  | "inventory"
  | "recipes"
  // CUSTOMERS
  | "crm"
  // REPORTS
  | "analytics"
  // TEAM
  | "staff"
  // SETTINGS
  | "settings"
  | "account"
  | "integrations"
  | "billing"
  | "support"
  | "help";

interface NavItem {
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  href?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "OPERATIONS",
    items: [
      { id: "tables", label: "Tables", icon: ChairIcon },
      { id: "orders", label: "Orders", icon: ClipboardListIcon },
      { id: "pos", label: "POS Terminal", icon: CreditCardIcon, href: "/pos" },
      { id: "kitchen", label: "Kitchen Display", icon: ChefHatIcon },
      { id: "bookings", label: "Reservations", icon: CalendarIcon },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { id: "menu", label: "Menu Items", icon: BookOpenIcon },
      { id: "categories", label: "Categories", icon: SlidersIcon },
      { id: "modifiers", label: "Modifiers", icon: SlidersIcon },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { id: "inventory", label: "Inventory Stock", icon: BoxIcon },
      { id: "recipes", label: "Recipes & Gravies", icon: SoupIcon },
    ],
  },
  {
    title: "CUSTOMERS",
    items: [
      { id: "crm", label: "Customers & Loyalty", icon: UsersIcon },
      { id: "inbox", label: "Inbox", icon: InboxIcon },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { id: "analytics", label: "Analytics & Reports", icon: ChartIcon },
    ],
  },
  {
    title: "TEAM",
    items: [
      { id: "staff", label: "Staff & Permissions", icon: UsersIcon },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { id: "settings", label: "Restaurant Settings", icon: GearIcon },
      { id: "integrations", label: "Integrations Hub", icon: PlugIcon },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { id: "account", label: "Owner Profile & Security", icon: ShieldCheckIcon },
      { id: "billing", label: "Subscription & Billing", icon: CreditCardIcon },
      { id: "support", label: "Priority Support", icon: LifebuoyIcon },
      { id: "help", label: "Operating Manual", icon: ManualIcon },
    ],
  },
];

interface AdminAppShellProps {
  currentSection: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  restaurantName?: string;
  restaurantSlug?: string;
  userRole?: string;
  liveRevenue?: number;
  liveOrders?: number;
  onOpenSearch?: () => void;
  children: React.ReactNode;
}

export function AdminAppShell({
  currentSection,
  onSelectSection,
  restaurantName = "QRslice",
  restaurantSlug = "cafe",
  userRole,
  liveRevenue = 0,
  liveOrders = 0,
  onOpenSearch,
  children,
}: AdminAppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' for search, 'Esc' to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
        e.preventDefault();
        onOpenSearch?.();
      }
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen, onOpenSearch]);

  const roleBadge = getRoleBadge(userRole);
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessTab(userRole, item.id)),
  })).filter((group) => group.items.length > 0);

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F5F7] flex flex-col font-[family-name:var(--font-geist-sans)] selection:bg-[#5738F5] selection:text-white">
      {/* MOBILE TOP BAR (lg:hidden) */}
      <div className="lg:hidden bg-white/90 backdrop-blur-xl border-b border-[#E7E4F0] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 -ml-1 rounded-xl text-[#6F7185] hover:text-[#17142B] hover:bg-slate-100 transition-colors touch-target flex items-center justify-center"
            title="Open Menu"
            aria-label="Open Navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <QrSliceLogo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link
            href={`/c/${restaurantSlug}`}
            target="_blank"
            className="px-2.5 py-1.5 rounded-xl bg-[#EEEAFE] text-[#5738F5] font-bold text-xs flex items-center gap-1 touch-target min-h-[36px]"
          >
            <span>Menu ↗</span>
          </Link>
          <Link
            href="/pos?view=kitchen"
            className="px-2.5 py-1.5 rounded-xl bg-[#5738F5] text-white font-bold text-xs touch-target min-h-[36px] flex items-center"
          >
            KDS
          </Link>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#E7E4F0] transition-all duration-300 z-20 select-none ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo & Brand Header */}
          <div className="h-16 px-5 border-b border-[#E7E4F0] flex items-center justify-between">
            {collapsed ? (
              <div className="mx-auto">
                <QrSliceIcon className="w-8 h-8" />
              </div>
            ) : (
              <QrSliceLogo size="md" />
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-[#6F7185] hover:text-[#17142B] hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Quick Outlet Selector */}
          {!collapsed && (
            <div className="p-3 mx-3 my-2 rounded-2xl bg-[#EEEAFE]/60 border border-[#5738F5]/15 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5738F5]">
                    ACTIVE OUTLET
                  </span>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] rounded-full font-bold border ${roleBadge.badge}`}>
                    {roleBadge.icon} {roleBadge.label}
                  </span>
                </div>
                <div className="text-xs font-black text-[#17142B] truncate">{restaurantName}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="System Online" />
            </div>
          )}

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
            {/* Top-level Dashboard Button */}
            {canAccessTab(userRole, "dashboard") && (
              <button
                type="button"
                onClick={() => onSelectSection("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentSection === "dashboard"
                    ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25 font-extrabold"
                    : "text-[#6F7185] hover:text-[#17142B] hover:bg-[#EEEAFE]/50"
                } ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? "Dashboard" : undefined}
              >
                <DashboardIcon className={`w-4 h-4 shrink-0 ${currentSection === "dashboard" ? "text-white" : "text-current"}`} />
                {!collapsed && <span className="truncate">Dashboard</span>}
              </button>
            )}

            {visibleGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 py-1 text-[10px] font-black tracking-widest text-[#6F7185] uppercase">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = currentSection === item.id;
                  const Icon = item.icon;
                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25 font-extrabold"
                            : "text-[#6F7185] hover:text-[#17142B] hover:bg-[#EEEAFE]/50"
                        } ${collapsed ? "justify-center px-0" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-current"}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25 font-extrabold"
                          : "text-[#6F7185] hover:text-[#17142B] hover:bg-[#EEEAFE]/50"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-current"}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#E7E4F0] space-y-2">
            <InstallPwaButton
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all ${
                collapsed ? "justify-center px-0" : ""
              }`}
            />
            <Link
              href={`/c/${restaurantSlug}`}
              target="_blank"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <span>🍽️</span>
              {!collapsed && <span>Live Guest Menu ↗</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER / BOTTOM SHEET OVERLAY */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-stretch lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-full sm:w-80 max-w-full bg-white rounded-t-3xl sm:rounded-none max-h-[88dvh] sm:max-h-full sm:h-full flex flex-col z-10 shadow-2xl p-4 sm:p-5 pb-safe animate-slide-in-bottom sm:animate-none">
              {/* Drag Handle for iOS bottom sheet */}
              <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E4F0] shrink-0">
                <QrSliceLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition-colors"
                  aria-label="Close navigation"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {canAccessTab(userRole, "dashboard") && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection("dashboard");
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                      currentSection === "dashboard"
                        ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25"
                        : "text-[#6F7185] hover:text-[#17142B] hover:bg-slate-50"
                    }`}
                  >
                    <DashboardIcon className="w-4 h-4" />
                    <span>Dashboard Overview</span>
                  </button>
                )}
                {visibleGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6F7185] px-2 pt-1">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const isActive = currentSection === item.id;
                      const Icon = item.icon;
                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setMobileDrawerOpen(false)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                              isActive
                                ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25"
                                : "text-[#6F7185] hover:text-[#17142B] hover:bg-slate-50"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      }
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelectSection(item.id);
                            setMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                            isActive
                              ? "bg-[#5738F5] text-white shadow-md shadow-[#5738F5]/25"
                              : "text-[#6F7185] hover:text-[#17142B] hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Sheet Footer */}
              <div className="pt-3 border-t border-[#E7E4F0] flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <InstallPwaButton className="text-xs font-bold text-emerald-600 hover:text-emerald-700 py-2 px-3 rounded-xl hover:bg-emerald-50" />
                  <Link
                    href={`/c/${restaurantSlug}`}
                    target="_blank"
                    className="text-xs font-bold text-[#5738F5] hover:underline py-2 px-3"
                  >
                    Guest Menu ↗
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-600 hover:text-red-700 py-2 px-3 rounded-xl hover:bg-red-50 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
                <Link
                  href={`/c/${restaurantSlug}`}
                  target="_blank"
                  className="text-xs font-bold text-[#5738F5] hover:underline py-2 px-3"
                >
                  Guest Menu ↗
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 py-3.5 sticky top-0 z-10 hidden lg:flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {greetingTime()}, {restaurantName}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleBadge.badge}`}>
                  <span>{roleBadge.icon}</span>
                  <span>{roleBadge.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Here's what's happening today.</p>
            </div>

            {/* Quick Metrics & Search */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs text-[#6F7185] font-semibold border border-slate-200/60 transition-all cursor-pointer"
              >
                <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Search orders, items, tables…</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-300 shadow-2xs">
                  /
                </kbd>
              </button>

              <div className="flex items-center gap-2 border-l border-[#E7E4F0] pl-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEEAFE] border border-[#5738F5]/20">
                  <span className="text-[11px] font-semibold text-[#5738F5]">Revenue</span>
                  <span className="font-mono font-black text-xs text-[#5738F5]">
                    ₹{(liveRevenue / 100).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-700">Orders</span>
                  <span className="font-mono font-black text-xs text-emerald-700">{liveOrders}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              </div>

              <NotificationBell />

              <button
                type="button"
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </header>

          {/* Sub-body Content Slot */}
          <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto space-y-6 pb-28 lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* IOS BOTTOM TAB BAR (lg:hidden) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#E7E4F0] px-2 py-1 pb-safe flex items-center justify-around shadow-lg shadow-black/5"
      >
        <button
          type="button"
          onClick={() => onSelectSection("dashboard")}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target ${
            currentSection === "dashboard" ? "text-[#5738F5]" : "text-[#6F7185] hover:text-[#17142B]"
          }`}
        >
          <DashboardIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Overview</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectSection("orders")}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target relative ${
            currentSection === "orders" ? "text-[#5738F5]" : "text-[#6F7185] hover:text-[#17142B]"
          }`}
        >
          <ClipboardListIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Orders</span>
          {liveOrders > 0 && (
            <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelectSection("tables")}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-target ${
            currentSection === "tables" ? "text-[#5738F5]" : "text-[#6F7185] hover:text-[#17142B]"
          }`}
        >
          <ChairIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Tables</span>
        </button>
        <Link
          href="/pos"
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all text-[#6F7185] hover:text-[#17142B] touch-target"
        >
          <CreditCardIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">POS</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all text-[#6F7185] hover:text-[#17142B] touch-target"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
          </svg>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">More</span>
        </button>
      </nav>
    </div>
  );
}

