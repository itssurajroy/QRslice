// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 864e5);
  const weekAgoStart = new Date(todayStart.getTime() - 7 * 864e5);
  const monthAgoStart = new Date(todayStart.getTime() - 30 * 864e5);

  // Today's metrics
  const { data: todayOrders } = await db
    .from("orders")
    .select("id, total_paise, payment_status, status, payment_method")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", todayStart.toISOString());

  // Yesterday's metrics
  const { data: yesterdayOrders } = await db
    .from("orders")
    .select("id, total_paise, payment_status, status, payment_method")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", yesterdayStart.toISOString())
    .lt("created_at", todayStart.toISOString());

  // Last 7 days (for 7d comparison)
  const { data: weekOrders } = await db
    .from("orders")
    .select("id, total_paise, payment_status")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", weekAgoStart.toISOString());

  // Last 30 days (for 30d comparison)
  const { data: monthOrders } = await db
    .from("orders")
    .select("id, total_paise, payment_status")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", monthAgoStart.toISOString());

  // Paid orders only
  const todayPaid = (todayOrders || []).filter((o) => o.payment_status === "paid");
  const yesterdayPaid = (yesterdayOrders || []).filter((o) => o.payment_status === "paid");
  const weekPaid = (weekOrders || []).filter((o) => o.payment_status === "paid");
  const monthPaid = (monthOrders || []).filter((o) => o.payment_status === "paid");

  const todayRevenue = todayPaid.reduce((s, o) => s + (o.total_paise || 0), 0);
  const yesterdayRevenue = yesterdayPaid.reduce((s, o) => s + (o.total_paise || 0), 0);
  const weekRevenue = weekPaid.reduce((s, o) => s + (o.total_paise || 0), 0);
  const monthRevenue = monthPaid.reduce((s, o) => s + (o.total_paise || 0), 0);

  const todayOrdersCount = todayPaid.length;
  const yesterdayOrdersCount = yesterdayPaid.length;
  const weekOrdersCount = weekPaid.length;
  const monthOrdersCount = monthPaid.length;

  const todayAvg = todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount) : 0;
  const yesterdayAvg = yesterdayOrdersCount > 0 ? Math.round(yesterdayRevenue / yesterdayOrdersCount) : 0;
  const weekAvg = weekOrdersCount > 0 ? Math.round(weekRevenue / weekOrdersCount) : 0;
  const monthAvg = monthOrdersCount > 0 ? Math.round(monthRevenue / monthOrdersCount) : 0;

  // Calculate deltas
  const revenueDelta = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10 : 0;
  const ordersDelta = yesterdayOrdersCount > 0 ? Math.round(((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 1000) / 10 : 0;
  const avgDelta = yesterdayAvg > 0 ? Math.round(((todayAvg - yesterdayAvg) / yesterdayAvg) * 1000) / 10 : 0;

  // Also 7d and 30d comparisons
  const revenueDelta7d = weekRevenue > 0 ? Math.round(((todayRevenue * 7 - weekRevenue) / weekRevenue) * 1000) / 10 : 0;
  const ordersDelta7d = weekOrdersCount > 0 ? Math.round(((todayOrdersCount * 7 - weekOrdersCount) / weekOrdersCount) * 1000) / 10 : 0;
  const revenueDelta30d = monthRevenue > 0 ? Math.round(((todayRevenue * 30 - monthRevenue) / monthRevenue) * 1000) / 10 : 0;
  const ordersDelta30d = monthOrdersCount > 0 ? Math.round(((todayOrdersCount * 30 - monthOrdersCount) / monthOrdersCount) * 1000) / 10 : 0;

  // Google Review / Feedback Analytics
  const { data: auditEvents } = await db
    .from("audit_events")
    .select("action, metadata")
    .eq("restaurant_id", restaurantId)
    .eq("entity", "customer_feedback")
    .gte("created_at", monthAgoStart.toISOString());

  let totalFeedbacks30d = 0;
  let fiveStarRatings30d = 0;
  let googleReviewClicks30d = 0;

  if (auditEvents) {
    auditEvents.forEach((evt) => {
      if (evt.action === "submit") {
        totalFeedbacks30d++;
        const meta = evt.metadata as any;
        if (meta?.rating === 5 || meta?.rating === 4) {
          fiveStarRatings30d++;
        }
      } else if (evt.action === "google_review_clicked") {
        googleReviewClicks30d++;
      }
    });
  }

  return NextResponse.json({
    ok: true,
    today: {
      revenue: todayRevenue,
      orders: todayOrdersCount,
      avg: todayAvg,
    },
    yesterday: {
      revenue: yesterdayRevenue,
      orders: yesterdayOrdersCount,
      avg: yesterdayAvg,
    },
    deltas: {
      vsYesterday: { revenue: revenueDelta, orders: ordersDelta, avg: avgDelta },
      vs7d: { revenue: revenueDelta7d, orders: ordersDelta7d },
      vs30d: { revenue: revenueDelta30d, orders: ordersDelta30d },
    },
    reputation: {
      totalFeedbacks30d,
      fiveStarRatings30d,
      googleReviewClicks30d,
      conversionRate: fiveStarRatings30d > 0 ? Math.round((googleReviewClicks30d / fiveStarRatings30d) * 100) : 0,
    },
  });
}