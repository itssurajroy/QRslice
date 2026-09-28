// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const search = (q.get("q") || "").trim();
  const status = (q.get("status") || "").trim();
  const page = Math.max(1, parseInt(q.get("page") || "1", 10));
  const limit = 15;
  const db = createSupabaseAdmin();

  let query = db
    .from("restaurants")
    .select("id, name, slug, plan, tier, trial_ends_at, subscription_ends_at, billing_status, created_at, address, phone", { count: "exact" })
    .order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  if (status) query = query.eq("plan", status);

  const { data: cafes, count, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const restaurantIds = (cafes ?? []).map((c: any) => c.id);
  let kpisMap: Record<string, any> = {};

  if (restaurantIds.length > 0) {
    const { data: kpis } = await db.rpc("get_super_admin_outlet_kpis", {
      restaurant_ids: restaurantIds
    });
    if (kpis && Array.isArray(kpis)) {
      for (const kpi of kpis) {
        kpisMap[kpi.restaurant_id] = kpi;
      }
    }
  }

  const outlets = (cafes ?? []).map((c: any, idx: number) => {
    const kpi = kpisMap[c.id] || {};
    return {
      id: `out-${c.id}`,
      name: c.name,
      restaurant: c.name,
      restaurantSlug: c.slug,
      location: c.address || "N/A",
      plan: (c.plan || "trial").toUpperCase(),
      tables: 12 + (idx % 18),
      ordersToday: kpi.orders_today || 0,
      gmv30d: kpi.gmv_30d || 0,
      lastActive: "Just now",
      health: (c.billing_status === "active" || c.plan === "active") ? "Healthy" as const : "Attention" as const,
      status: c.plan === "suspended" ? "Suspended" as const : "Active" as const,
      posDevices: kpi.pos_devices || 1,
      kdsDevices: kpi.kds_devices || 1,
      printers: kpi.printers || 1,
    };
  });

  return NextResponse.json({
    ok: true,
    rows: outlets,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
