// Copyright (c) 2026 QRslice. All rights reserved.
export type TenantRole = "owner" | "manager" | "staff" | "kitchen" | "waiter";

export const ROLE_BADGES: Record<TenantRole, { label: string; badge: string; icon: string }> = {
  owner: { label: "Owner", badge: "bg-amber-100 text-amber-800 border-amber-300", icon: "👑" },
  manager: { label: "Manager", badge: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: "🛡️" },
  staff: { label: "Staff", badge: "bg-slate-100 text-slate-700 border-slate-300", icon: "👤" },
  kitchen: { label: "Kitchen", badge: "bg-orange-100 text-orange-800 border-orange-300", icon: "👨‍🍳" },
  waiter: { label: "Waiter", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: "🧾" },
};

/**
 * Tab Permissions Matrix.
 *
 * PIN roles are intentionally narrow:
 * - kitchen → KDS only (plus support/help)
 * - waiter → order-taking only: orders, tables, bookings (plus support/help)
 * Revenue and settlement (analytics, report, billing) are owner-only.
 */
export const ALLOWED_TABS: Record<TenantRole, Set<string>> = {
  staff: new Set([
    "orders",
    "pos",
    "kitchen",
    "kds",
    "tables",
    "bookings",
    "reservations",
    "inbox",
    "support",
    "help",
  ]),
  kitchen: new Set([
    "kitchen",
    "kds",
    "support",
    "help",
  ]),
  waiter: new Set([
    "orders",
    "pos",
    "tables",
    "bookings",
    "reservations",
    "support",
    "help",
  ]),
  manager: new Set([
    "dashboard",
    "orders",
    "pos",
    "kitchen",
    "kds",
    "tables",
    "bookings",
    "reservations",
    "menu",
    "categories",
    "modifiers",
    "inventory",
    "recipes",
    "crm",
    "communications",
    "inbox",
    "staff",
    "support",
    "help",
  ]),
  owner: new Set([
    "dashboard",
    "orders",
    "pos",
    "kitchen",
    "kds",
    "tables",
    "bookings",
    "reservations",
    "menu",
    "categories",
    "modifiers",
    "inventory",
    "recipes",
    "analytics",
    "report",
    "crm",
    "communications",
    "inbox",
    "staff",
    "settings",
    "account",
    "branding",
    "integrations",
    "webhooks",
    "billing",
    "support",
    "help",
  ]),
};

export function normalizeRole(role: string | null | undefined): TenantRole {
  const raw = String(role || "staff").toLowerCase();
  if (raw === "owner") return "owner";
  if (raw === "manager" || raw === "admin") return "manager";
  if (raw === "kitchen" || raw === "chef") return "kitchen";
  if (raw === "waiter") return "waiter";
  return "staff";
}

export function canAccessTab(role: string | null | undefined, tab: string): boolean {
  return ALLOWED_TABS[normalizeRole(role)].has(tab);
}

export function getDefaultTabForRole(role: string | null | undefined): string {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "kitchen") return "kitchen";
  if (normalizedRole === "owner" || normalizedRole === "manager") return "dashboard";
  return "orders";
}

export function getRoleBadge(role: string | null | undefined) {
  return ROLE_BADGES[normalizeRole(role)];
}
