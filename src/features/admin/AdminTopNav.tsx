// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import type { ComponentType } from "react";
import {
  DashboardIcon,
  BookOpenIcon,
  ChairIcon,
  CalendarIcon,
  ChefHatIcon,
  BoxIcon,
  SoupIcon,
  ChartIcon,
  PlugIcon,
  PaletteIcon,
  GearIcon,
  LifebuoyIcon,
  ManualIcon,
  UsersIcon,
} from "@/components/Icons";

export type AdminTabId =
  | "dashboard"
  | "menu"
  | "tables"
  | "bookings"
  | "kds"
  | "inventory"
  | "recipes"
  | "analytics"
  | "webhooks"
  | "branding"
  | "settings"
  | "staff"
  | "support"
  | "report"
  | "help";

type TabDef = {
  id: AdminTabId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  badge?: string;
};

const GROUPS: { label: string; tabs: TabDef[] }[] = [
  {
    label: "Operate",
    tabs: [
      { id: "dashboard", label: "Dashboard", Icon: DashboardIcon },
      { id: "menu", label: "Menu", Icon: BookOpenIcon },
      { id: "tables", label: "Tables", Icon: ChairIcon },
      { id: "bookings", label: "Bookings", Icon: CalendarIcon },
      { id: "kds", label: "KDS", Icon: ChefHatIcon },
    ],
  },
  {
    label: "Manage",
    tabs: [
      { id: "inventory", label: "Stock Control", Icon: BoxIcon },
      { id: "recipes", label: "Gravies & Recipes", Icon: SoupIcon },
      { id: "analytics", label: "Analytics", Icon: ChartIcon, badge: "AI SOON" },
      { id: "webhooks", label: "API & Webhooks", Icon: PlugIcon },
    ],
  },
  {
    label: "Setup",
    tabs: [
      { id: "branding", label: "Branding", Icon: PaletteIcon },
      { id: "settings", label: "Settings & BT", Icon: GearIcon },
      { id: "staff", label: "Team & Staff", Icon: UsersIcon },
      { id: "support", label: "Priority Support", Icon: LifebuoyIcon },
      { id: "help", label: "Manual", Icon: ManualIcon },
    ],
  },
];

interface AdminTopNavProps {
  tab: AdminTabId;
  setTab: (tab: AdminTabId) => void;
}

export function AdminTopNav({ tab, setTab }: AdminTopNavProps) {
  return (
    <nav
      className="flex items-stretch gap-4 overflow-x-auto py-2 -mx-1 px-1 scrollbar-hide"
      role="tablist"
      aria-label="Admin sections"
    >
      {GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-1 shrink-0">
          <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-slate-400 pr-1">
            {group.label}
          </span>
          {group.tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  active
                    ? "bg-brand text-white shadow-md shadow-brand/25 font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <t.Icon className="w-4 h-4 shrink-0" />
                {t.label}
                {t.badge && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                      active ? "bg-white/20 text-white" : "bg-brand-lavender text-brand-dark"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

