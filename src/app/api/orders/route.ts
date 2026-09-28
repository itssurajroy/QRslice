// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { computeOrderChecksum, generateAuditBlockHash } from "@/lib/crypto";
import { deductInventoryIngredients } from "@/lib/inventory";
import { overlaps, istDayStart } from "@/lib/booking";
import { processCustomerLoyalty } from "@/lib/crm";
import { calculateAuthoritativePricing, type PricingItemInput } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // A18: prefer body key; fall back to Idempotency-Key header from offline queue.
  const headerIdempotencyKey = req.headers.get("idempotency-key")?.trim() || undefined;
  const idempotencyKey =
    input.idempotency_key || headerIdempotencyKey || crypto.randomUUID();

  // Rate limit: per token and per IP
  const limit = Number(process.env.ORDER_RATE_LIMIT || 10);
  const window = Number(process.env.ORDER_RATE_WINDOW || 60);
  const rl = rateLimit(`${input.qr_token}:${ip}`, limit, window);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many orders from this device. Please wait a moment.", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const db = createSupabaseAdmin();

  // Resolve QR token -> table + restaurant (server-side only)
  const { data: table, error: tErr } = await db
    .from("restaurant_tables")
    .select("id, restaurant_id, active, label, restaurants(plan, trial_ends_at, tax_rate)")
    .eq("qr_token", input.qr_token)
    .maybeSingle();
  if (tErr || !table || !table.active) {
    return NextResponse.json(
      { error: "Invalid or inactive table QR code. Please ask staff for assistance." },
      { status: 404 },
    );
  }

  // Gating: Verify restaurant plan and trial status
  const rest = (table as any).restaurants;
  const isPlanActive = rest?.plan === "active";
  const isTrialActive =
    rest?.plan === "trial" &&
    (!rest?.trial_ends_at || new Date(rest.trial_ends_at).getTime() > Date.now());

  if (!isPlanActive && !isTrialActive) {
    return NextResponse.json(
      { error: "Café subscription is inactive or trial has expired. Ordering is paused." },
      { status: 403 },
    );
  }

  let linkedReservationId: string | null = null;
  if (input.reservation_code) {
    const { data: res } = await db
      .from("table_reservations")
      .select("id, table_ids, status, starts_at, ends_at")
      .eq("restaurant_id", table.restaurant_id)
      .eq("code", input.reservation_code.toUpperCase())
      .gte("starts_at", istDayStart().toISOString())
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (res && res.status === "confirmed" && res.table_ids.includes(table.id)) {
      linkedReservationId = res.id;
      await db.from("table_reservations").update({ status: "seated" }).eq("id", res.id);
    }
  }
  if (!linkedReservationId) {
    const now = new Date();
    const { data: holds } = await db
      .from("table_reservations")
      .select("id, table_ids, starts_at, ends_at")
      .eq("restaurant_id", table.restaurant_id)
      .eq("status", "confirmed")
      .lte("starts_at", new Date(now.getTime() + 90 * 60000).toISOString());
    for (const h of holds ?? []) {
      if (!h.table_ids.includes(table.id)) continue;
      // BOOKING_DEFAULT_MIN window
      if (!overlaps(now, new Date(now.getTime() + 90 * 60000), new Date(h.starts_at), new Date(h.ends_at))) continue;
      await db.from("table_reservations").update({ status: "expired" }).eq("id", h.id);
      await db.from("audit_events").insert({
        restaurant_id: table.restaurant_id, entity: "reservation",
        entity_id: h.id, action: "walkin_override", metadata: { table_id: table.id },
      });
    }
  }

  // Idempotency: if this key already created an order, return existing
  const { data: existing } = await db
    .from("orders")
    .select("id, status_token, order_number")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      order_id: existing.id,
      status_token: existing.status_token,
      order_number: existing.order_number,
      idempotent: true,
    });
  }

  // Recompute prices + availability from DB (never trust client prices)
  const itemIds = Array.from(new Set(input.items.map((i) => i.menu_item_id)));
  const { data: menuItems, error: mErr } = await db
    .from("menu_items")
    .select("id, name, price_paise, available, category_id")
    .in("id", itemIds)
    .eq("restaurant_id", table.restaurant_id);
  if (mErr || !menuItems) {
    return NextResponse.json({ error: "Menu validation failed" }, { status: 500 });
  }
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  // Fetch verified modifier options from database
  const { data: dbOptions } = await db
    .from("modifier_options")
    .select("name, price_delta_paise, modifier_groups!inner(restaurant_id)")
    .eq("modifier_groups.restaurant_id", table.restaurant_id)
    .eq("active", true);

  const verifiedModifierPriceMap = new Map<string, number>();
  if (dbOptions) {
    for (const opt of dbOptions) {
      verifiedModifierPriceMap.set(
        opt.name.trim().toLowerCase(),
        Number(opt.price_delta_paise) || 0
      );
    }
  }

  // Fallback for legacy hardcoded string modifiers in case they are missing from DB
  const legacyFallbacks = [
    { name: "Regular", price_adjustment_paise: 0 },
    { name: "Large", price_adjustment_paise: 6000 },
    { name: "Jumbo / Family Pack", price_adjustment_paise: 12000 },
    { name: "Mild", price_adjustment_paise: 0 },
    { name: "Medium", price_adjustment_paise: 0 },
    { name: "Spicy / Desi Hot", price_adjustment_paise: 0 },
  ];
  for (const opt of legacyFallbacks) {
    const key = opt.name.trim().toLowerCase();
    if (!verifiedModifierPriceMap.has(key)) {
      verifiedModifierPriceMap.set(key, opt.price_adjustment_paise);
    }
  }

  const unavailable: string[] = [];
  const pricingInputItems: PricingItemInput[] = [];

  for (const ci of input.items) {
    const mi = byId.get(ci.menu_item_id);
    if (!mi) {
      unavailable.push("Item not found");
      continue;
    }
    if (!mi.available) {
      unavailable.push(mi.name);
      continue;
    }

    // Verify and re-price each modifier from server catalog
    const sanitizedModifiers = (ci.modifiers || []).map((m) => {
      const optKey = m.option_name.trim().toLowerCase();
      const catalogPrice = verifiedModifierPriceMap.get(optKey);
      // If catalog has an official price adjustment, enforce it; otherwise clamp untrusted delta to 0
      const verifiedDelta = catalogPrice !== undefined ? catalogPrice : 0;
      return {
        option_name: m.option_name,
        price_delta_paise: verifiedDelta,
      };
    });

    pricingInputItems.push({
      menu_item_id: mi.id,
      item_name: mi.name,
      base_price_paise: mi.price_paise,
      modifiers: sanitizedModifiers,
      quantity: ci.quantity,
      notes: ci.notes || "",
    });
  }

  if (pricingInputItems.length === 0) {
    return NextResponse.json(
      { error: "No available items in cart", unavailable },
      { status: 409 },
    );
  }

  const taxRate = Number((table as any).restaurants?.tax_rate) || 0;
  const pricingResult = calculateAuthoritativePricing({
    items: pricingInputItems,
    tax_rate_percent: taxRate,
  });

  const orderItems = pricingResult.items;
  const subtotal = pricingResult.subtotal_paise;

  // Generate order number (retry on unique conflict)
  let orderNumber = "";
  let orderId = "";
  let statusToken = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    orderNumber = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${
      Math.floor(Math.random() * 9000) + 1000
    }`;
    const { data: ins, error: insErr } = await db
      .from("orders")
      .insert({
        restaurant_id: table.restaurant_id,
        table_id: table.id,
        order_number: orderNumber,
        subtotal_paise: pricingResult.subtotal_paise,
        tax_paise: pricingResult.tax_paise,
        discount_paise: pricingResult.discount_paise,
        total_paise: pricingResult.total_paise,
        pricing_snapshot: pricingResult.snapshot,
        payment_method: input.payment_method,
        customer_name: input.customer_name ?? "",
        customer_phone: input.customer_phone ?? "",
        idempotency_key: idempotencyKey,
        reservation_id: linkedReservationId,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id, status_token")
      .single();
    if (insErr) {
      if (insErr.code === "23505") continue; // order_number collision
      return NextResponse.json({ error: "Order creation failed: " + insErr.message }, { status: 500 });
    }
    orderId = ins.id;
    statusToken = ins.status_token;
    break;
  }
  if (!orderId) {
    return NextResponse.json({ error: "Could not allocate order number" }, { status: 500 });
  }

  // Insert items + modifiers
  const itemRows = orderItems.map((oi) => ({
    order_id: orderId,
    menu_item_id: oi.menu_item_id,
    item_name: oi.item_name,
    unit_price_paise: oi.unit_price_paise,
    quantity: oi.quantity,
    line_total_paise: oi.line_total_paise,
    notes: oi.notes,
  }));
  const { data: insertedItems, error: oiErr } = await db
    .from("order_items")
    .insert(itemRows)
    .select("id");
  if (oiErr) {
    return NextResponse.json({ error: "Failed to persist order items: " + oiErr.message }, { status: 500 });
  }

  const modRows: {
    order_item_id: string;
    option_name: string;
    price_delta_paise: number;
  }[] = [];
  orderItems.forEach((oi, idx) => {
    const insertedId = insertedItems[idx]?.id;
    if (insertedId) {
      oi.modifiers.forEach((m) =>
        modRows.push({
          order_item_id: insertedId,
          option_name: m.option_name,
          price_delta_paise: m.price_delta_paise,
        }),
      );
    }
  });
  if (modRows.length) {
    await db.from("order_item_modifiers").insert(modRows);
  }

  // Fetch last audit hash to chain blocks
  const { data: lastAudit } = await db
    .from("audit_events")
    .select("metadata")
    .eq("restaurant_id", table.restaurant_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevHash = (lastAudit?.metadata as any)?.block_hash || null;
  const payloadHash = computeOrderChecksum(input.items);
  const blockHash = generateAuditBlockHash(prevHash, {
    order_id: orderId,
    order_number: orderNumber,
    subtotal,
    payload_hash: payloadHash,
    ip,
  });

  // Audit event with cryptographic security metadata
  await db.from("audit_events").insert({
    restaurant_id: table.restaurant_id,
    entity: "order",
    entity_id: orderId,
    action: "create",
    metadata: {
      source: "qr",
      order_number: orderNumber,
      payload_hash: payloadHash,
      block_hash: blockHash,
      prev_hash: prevHash,
      ip,
      userAgent: userAgent.slice(0, 150),
    },
  });

  // Auto-deduct ingredients from inventory if payment is already guaranteed online.
  // Unpaid counter orders are held as pending and deducted upon staff confirmation in POS/KDS.
  if (input.payment_method === "online") {
    deductInventoryIngredients(db, table.restaurant_id, orderItems).catch(
      (err) => console.error("Inventory deduction failed:", err)
    );
  }

  // Loyalty preview only: actual points are credited upon verified payment settlement
  const potentialPoints = input.customer_phone ? Math.floor(subtotal / 10000) : 0;

  return NextResponse.json({
    order_id: orderId,
    status_token: statusToken,
    order_number: orderNumber,
    checksum: payloadHash.slice(0, 12),
    unavailable,
    loyalty: { pointsEarned: potentialPoints, status: "pending_payment" },
  });
}



