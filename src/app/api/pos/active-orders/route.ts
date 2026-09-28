// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { processCustomerLoyalty } from "@/lib/crm";
import { isUniqueViolation, planSettlement, settleProvider } from "@/lib/settle";
import { canSettleComplete, canTransition } from "@/lib/order-transitions";

// orders.payment_method is constrained to ('counter','online'): the channel
// category. POS methods cash/upi/card map to it; the exact method is kept in
// payments.provider.
function normalizePaymentMethod(pm: string): "counter" | "online" {
  const p = String(pm || "").toLowerCase();
  if (p === "online" || p === "upi" || p === "card") return "online";
  return "counter";
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client: session is validated by getSessionUser() and scoped by restaurant_id.
  const db = createSupabaseAdmin();

  // Fetch all active orders (including served + unpaid so cashier can collect bill)
  const { data: orders, error } = await db
    .from("orders")
    .select(
      "id, order_number, status, payment_status, payment_method, total_paise, subtotal_paise, priority, created_at, delay_minutes, table_id, customer_name, customer_phone, restaurant_tables(id, label, seats), order_items(*)",
    )
    .eq("restaurant_id", user.restaurantId)
    .or("status.in.(pending,confirmed,preparing,ready),and(status.eq.served,payment_status.eq.unpaid)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const liveOrders = (orders || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    priority: Boolean(o.priority),
    total_paise: o.total_paise,
    subtotal_paise: o.subtotal_paise,
    created_at: o.created_at,
    delay_minutes: o.delay_minutes || 0,
    table_id: o.table_id,
    table_label: o.restaurant_tables?.label || "Takeaway / Counter",
    customer_name: o.customer_name || "Guest",
    customer_phone: o.customer_phone,
    items: o.order_items || [],
  }));

  return NextResponse.json({ ok: true, orders: liveOrders });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId, payment_status = "paid", payment_method = "cash", status } = body;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // Only manager, owner, or super_admin can modify payment status
  const canManagePayments =
    user.role === "owner" || user.role === "manager" || user.role === "super_admin";
  if (payment_status && !canManagePayments) {
    return NextResponse.json(
      { error: "Forbidden: Manager or Owner role required to settle payments" },
      { status: 403 },
    );
  }

  // Use admin client: session is validated by getSessionUser() and scoped by restaurant_id.
  const db = createSupabaseAdmin();

  const { data: current, error: curErr } = await db
    .from("orders")
    .select("id, payment_status, total_paise, customer_phone, customer_name, status")
    .eq("id", orderId)
    .eq("restaurant_id", user.restaurantId)
    .maybeSingle();

  if (curErr || !current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // B4: when settling with a status bump, only allow legal transitions
  // (or settle-complete from an active status to completed).
  if (status && status !== current.status) {
    const legal = canTransition(current.status, status);
    const settleComplete =
      payment_status === "paid" &&
      status === "completed" &&
      canSettleComplete(current.status);
    if (!legal && !settleComplete) {
      return NextResponse.json(
        { error: `Invalid status transition from ${current.status} to ${status}` },
        { status: 422 },
      );
    }
  }

  // A2: idempotent double-settle — never insert a second payments row.
  if (payment_status === "paid" && current.payment_status === "paid") {
    return NextResponse.json({
      ok: true,
      order: current,
      alreadySettled: true,
    });
  }

  const updates: Record<string, any> = {
    payment_status,
    payment_method: normalizePaymentMethod(payment_method),
  };
  if (status) updates.status = status;

  // B1: winner-takes-all conditional claim of unpaid→paid.
  let query = db
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .eq("restaurant_id", user.restaurantId);
  if (payment_status === "paid") {
    query = query.in("payment_status", ["unpaid", "verification_pending"]);
  }

  const { data: updated, error } = await query.select().maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const won = Boolean(updated);
  const plan = planSettlement({
    currentPaymentStatus: current.payment_status,
    requestedPaymentStatus: payment_status,
    wonConditionalUpdate: won,
    hasCustomerPhone: Boolean(current.customer_phone),
  });

  if (plan.kind === "already_settled" || plan.kind === "conflict") {
    const { data: fresh } = await db
      .from("orders")
      .select()
      .eq("id", orderId)
      .eq("restaurant_id", user.restaurantId)
      .maybeSingle();
    return NextResponse.json({
      ok: true,
      order: fresh || current,
      alreadySettled: true,
      conflict: plan.kind === "conflict",
    });
  }

  if (plan.kind === "noop") {
    if (!won) {
      const { data: fresh } = await db
        .from("orders")
        .select()
        .eq("id", orderId)
        .eq("restaurant_id", user.restaurantId)
        .maybeSingle();
      return NextResponse.json({ ok: true, order: fresh || current });
    }
    return NextResponse.json({ ok: true, order: updated });
  }

  // plan.kind === "settle" — only the winner inserts payment + credits loyalty.
  if (plan.insertPayment) {
    const provider = settleProvider(payment_method);
    const { error: payErr } = await db.from("payments").insert({
      order_id: orderId,
      provider,
      amount_paise: updated?.total_paise ?? current.total_paise,
      status: "success",
    });
    // 23505 = a concurrent winner already recorded this tender (B1 race).
    if (payErr && !isUniqueViolation(payErr)) {
      console.error("[POS] Payment insert failed:", payErr);
    }

    if (plan.creditLoyalty) {
      processCustomerLoyalty(
        db,
        user.restaurantId,
        current.customer_phone!,
        current.customer_name || "",
        updated?.total_paise ?? current.total_paise,
        orderId,
        "",
      ).catch((err) => console.error("Loyalty processing failed:", err));
    }
  }

  return NextResponse.json({ ok: true, order: updated || current });
}
