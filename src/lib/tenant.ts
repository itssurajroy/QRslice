// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  logo_url: string | null;
  accent_color: string | null;
  tagline: string | null;
  google_review_url: string | null;
  plan: "trial" | "active" | "suspended" | "cancelled";
  tier?: "starter" | "pro" | "enterprise";
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_status: string | null;
  upi_qr_url: string | null;
  upi_id?: string | null;
};

export type TierLimits = {
  maxTables: number | null;
  maxItems: number | null;
  kds: boolean;
  branding: boolean;
  analytics: boolean;
  multiLocation: boolean;
  crm: boolean;
  loyalty: boolean;
};

// Single unified QRslice plan (Unlimited Everything, ₹999/mo, ₹9,999/yr)
export function getTierLimits(tier: string = "pro"): TierLimits {
  if (tier === "starter") {
    return {
      maxTables: null,
      maxItems: null,
      kds: true,
      branding: true,
      analytics: true,
      multiLocation: true,
      crm: true,
      loyalty: true,
    };
  }
  if (tier === "pro") {
    return {
      maxTables: null,
      maxItems: null,
      kds: true,
      branding: true,
      analytics: true,
      multiLocation: true,
      crm: true,
      loyalty: true,
    };
  }
  return {
    maxTables: null,
    maxItems: null,
    kds: true,
    branding: true,
    analytics: true,
    multiLocation: true,
    crm: true,
    loyalty: true,
  };
}

export type SubscriptionState = "trial" | "active" | "expired" | "suspended" | "cancelled";

// Single source of truth for where a café stands in the trial → paid lifecycle.
export function getSubscriptionState(
  t: Pick<Tenant, "plan" | "trial_ends_at"> | null,
): SubscriptionState {
  if (!t) return "expired";
  if (t.plan === "active") return "active";
  if (t.plan === "suspended") return "suspended";
  if (t.plan === "cancelled") return "cancelled";
  if (t.plan === "trial") {
    if (!t.trial_ends_at) return "trial"; // safety: no expiry set yet
    return new Date(t.trial_ends_at).getTime() > Date.now() ? "trial" : "expired";
  }
  return "expired";
}

// Whole days remaining in the trial (0 when not trialling or lapsed).
export function trialDaysLeft(t: Pick<Tenant, "plan" | "trial_ends_at"> | null): number {
  if (!t || t.plan !== "trial" || !t.trial_ends_at) return 0;
  return Math.max(0, Math.ceil((new Date(t.trial_ends_at).getTime() - Date.now()) / 864e5));
}

// True when the café is allowed to take orders.
export function canOrder(t: Pick<Tenant, "plan" | "trial_ends_at"> | null): boolean {
  if (!t) return false;
  if (t.plan === "active") return true;
  if (t.plan === "trial") {
    if (!t.trial_ends_at) return true; // safety: no expiry set yet
    return new Date(t.trial_ends_at).getTime() > Date.now();
  }
  return false;
}

// Resolve a tenant by its public slug. Returns null if not found.
export async function getRestaurantBySlug(slug: string): Promise<Tenant | null> {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("restaurants")
    .select(
      "id,name,slug,currency,logo_url,accent_color,tagline,plan,tier,trial_starts_at,trial_ends_at,subscription_ends_at,billing_status,upi_qr_url,upi_id,google_review_url",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getRestaurantBySlug] Supabase Error:", error);
    return null;
  }
  if (!data) return null;
  return data as Tenant;
}

// Resolve a tenant from a table QR token (used by /t/[token] + /api/orders).
export async function getTenantByTableToken(
  token: string,
): Promise<{ tenant: Tenant | null; tableId: string | null; tableActive: boolean }> {
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("restaurant_tables")
    .select(
      "id, active, restaurant_id, restaurants(id,name,slug,currency,logo_url,accent_color,tagline,plan,tier,trial_starts_at,trial_ends_at,subscription_ends_at,billing_status)",
    )
    .eq("qr_token", token)
    .maybeSingle();

  if (error || !data) return { tenant: null, tableId: null, tableActive: false };
  const r = (data as any).restaurants as Tenant | undefined;
  return {
    tenant: r ?? null,
    tableId: data.id,
    tableActive: Boolean(data.active),
  };
}

import { resolveTableByLabel as _resolve } from "./table-helpers";
export function resolveTableByLabel(tables: { label: string }[], rawLabel: string) {
  return _resolve(tables as any, rawLabel) as any;
}

// Resolve a tenant and table by cafe slug and table label (used by /c/[slug]/t/[tableLabel]).
export async function getTenantBySlugAndTableLabel(
  slug: string,
  tableLabel: string,
): Promise<{ tenant: Tenant | null; table: any | null }> {
  const db = createSupabaseAdmin();
  const tenant = await getRestaurantBySlug(slug);
  if (!tenant) return { tenant: null, table: null };

  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, label, seats, qr_token, active, restaurant_id")
    .eq("restaurant_id", tenant.id)
    .eq("active", true);

  const table = resolveTableByLabel((tables as any) || [], tableLabel);
  if (table) return { tenant, table };
  const { data: fallback } = await db
    .from("restaurant_tables")
    .select("id, label, seats, qr_token, active, restaurant_id")
    .eq("restaurant_id", tenant.id)
    .ilike("label", decodeURIComponent(tableLabel).trim())
    .maybeSingle();

  return { tenant, table: fallback || null };
}

