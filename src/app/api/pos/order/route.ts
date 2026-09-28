// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { deductInventoryIngredients } from "@/lib/inventory";
import { processCustomerLoyalty, redeemCustomerPoints } from "@/lib/crm";
import { calculateAuthoritativePricing, type PricingItemInput } from "@/lib/pricing";
import { isValidGstin, normalizeGstin, validateSplitTender } from "@/lib/validation";
import { POS_SETTLE_ROLES } from "@/lib/pos-guard";

function normalizePaymentMethod(pm: string): "counter" | "online" {
  const p = String(pm || "").toLowerCase();
  if (p === "online" || p === "upi" || p === "card") return "online";
  return "counter";
}

function isUniqueViolation(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      String((err as { code: unknown }).code) === "23505",
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUSTOM_ITEM_PREFIX = "custom-";
const OPEN_ITEM_NAME = "Open Item";
// A3: portion delta max ₹10,000 (1,000,000 paise)
const MAX_PORTION_DELTA_PAISE = 1_000_000;
// A7: bounded retries when order_number collides under the unique index
const ORDER_NUMBER_MAX_ATTEMPTS = 5;

// Custom (open) items have no menu_items row; order_items.menu_item_id FKs to
// menu_items(id), so they are persisted under a per-restaurant Open Item SKU.
async function getOrCreateOpenItemSku(
  admin: ReturnType<typeof createSupabaseAdmin>,
  restaurantId: string,
): Promise<string | null> {
  const { data: existing } = await admin
    .from("menu_items")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("name", OPEN_ITEM_NAME)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: cat } = await admin
    .from("menu_categories")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  let categoryId = cat?.id || null;
  if (!categoryId) {
    const { data: newCat, error: catErr } = await admin
      .from("menu_categories")
      .insert({ restaurant_id: restaurantId, name: "Custom", sort_order: 999 })
      .select("id")
      .single();
    if (catErr || !newCat) return null;
    categoryId = newCat.id;
  }

  const { data: created, error: createErr } = await admin
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: OPEN_ITEM_NAME,
      description: "System SKU for POS custom/open items",
      price_paise: 0,
      is_veg: true,
      available: true,
    })
    .select("id")
    .single();
  if (createErr || !created) return null;
  return created.id;
}

export async function POST(req: NextRequest) {
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

  const {
    table_id,
    order_type, // 'dine_in' | 'takeaway' | 'delivery'
    customer_name,
    customer_phone,
    items,
    discount_paise = 0,
    redeem_points = 0,
    payment_method = "cash",
    payment_status = "paid",
    split_cash_paise = 0,
    split_upi_paise = 0,
    notes = "",
    idempotency_key: bodyIdempotencyKey,
    customer_gstin,
    priority = false,
  } = body;

  // A18: offline queue sends Idempotency-Key header; body wins when present.
  const headerIdempotencyKey = req.headers.get("idempotency-key")?.trim() || undefined;
  const idempotency_key = bodyIdempotencyKey || headerIdempotencyKey;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
  }

  const paymentStatus =
    payment_status === "unpaid" ? "unpaid" : payment_status === "refunded" ? "refunded" : "paid";

  // PAY gate: marking a new order paid requires settle roles (owner/manager/super_admin).
  // Unpaid KOTs remain available to all POS order roles.
  if (paymentStatus === "paid" && !(POS_SETTLE_ROLES as readonly string[]).includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden: only managers and owners can settle payments" },
      { status: 403 },
    );
  }

  // A15: optional B2B buyer GSTIN — reject malformed values early.
  let buyerGstin: string | null = null;
  if (customer_gstin != null && String(customer_gstin).trim() !== "") {
    const normalized = normalizeGstin(String(customer_gstin));
    if (!isValidGstin(normalized)) {
      return NextResponse.json(
        { error: "Invalid customer GSTIN (expected 15-char Indian GSTIN)" },
        { status: 400 },
      );
    }
    buyerGstin = normalized;
  }

  const admin = createSupabaseAdmin();

  // Idempotency check
  if (idempotency_key) {
    const { data: existing } = await admin
      .from("orders")
      .select("id, status_token, order_number, total_paise, subtotal_paise, payment_status")
      .eq("idempotency_key", idempotency_key)
      .eq("restaurant_id", user.restaurantId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        ok: true,
        order: existing,
        idempotent: true,
      });
    }
  }

  // Fetch restaurant details (tax rate)
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id, tax_rate")
    .eq("id", user.restaurantId)
    .maybeSingle();

  // Fetch catalog modifier config
  const { data: modConfig } = await admin
    .from("platform_config")
    .select("value")
    .eq("restaurant_id", user.restaurantId)
    .eq("key", "modifier_groups")
    .maybeSingle();

  const verifiedModifierPriceMap = new Map<string, number>();
  const rawGroups = modConfig?.value || [];
  if (Array.isArray(rawGroups)) {
    for (const group of rawGroups) {
      if (Array.isArray(group.options)) {
        for (const opt of group.options) {
          if (opt && typeof opt.name === "string") {
            verifiedModifierPriceMap.set(
              opt.name.trim().toLowerCase(),
              Number(opt.price_adjustment_paise) || 0,
            );
          }
        }
      }
    }
  }

  // Validate items — only real menu-item UUIDs go into the .in() query
  // (custom- prefixed ids would trip PostgREST's uuid parse and 500).
  const itemIds = items
    .map((i: any) => i.id || i.menu_item_id)
    .filter((id: unknown) => typeof id === "string" && UUID_RE.test(id));
  const hasCustomItems = items.some((i: any) => {
    const id = i.id || i.menu_item_id;
    return typeof id === "string" && id.startsWith(CUSTOM_ITEM_PREFIX);
  });
  const openItemId = hasCustomItems
    ? await getOrCreateOpenItemSku(admin, user.restaurantId)
    : null;

  const dbItems = itemIds.length
    ? (await admin
        .from("menu_items")
        .select("id, name, price_paise, hsn")
        .in("id", itemIds)
        .eq("restaurant_id", user.restaurantId)).data
    : [];

  if (dbItems === null) {
    return NextResponse.json({ error: "Failed to validate items" }, { status: 500 });
  }

  const dbMap = new Map(dbItems.map((it) => [it.id, it]));

  // Build pricing inputs
  const pricingItems: PricingItemInput[] = [];
  for (const it of items) {
    const itemId = it.id || it.menu_item_id;

    if (typeof itemId === "string" && itemId.startsWith(CUSTOM_ITEM_PREFIX)) {
      // Open item: validate name + price server-side, persist under the Open Item SKU.
      if (!openItemId) continue;
      const customName = String(it.name || "").trim().slice(0, 80);
      const customPricePaise = Math.round(Number(it.price_paise ?? it.price) || 0);
      if (!customName || customPricePaise < 1 || customPricePaise > 10_000_000) continue;
      pricingItems.push({
        menu_item_id: openItemId,
        item_name: customName,
        base_price_paise: customPricePaise,
        quantity: Number(it.quantity) || 1,
        notes: it.notes || "",
        hsn: null,
      });
      continue;
    }

    const matched = dbMap.get(itemId);
    if (!matched) continue;

    const rawModifiers = Array.isArray(it.modifiers) ? it.modifiers : [];
    const sanitizedModifiers = rawModifiers.map((m: any) => {
      const optName = typeof m === "string" ? m : m.option_name || m.name || "";
      const optKey = optName.trim().toLowerCase();
      const catalogPrice = verifiedModifierPriceMap.get(optKey);
      // B6: when a modifier catalog exists, unknown modifiers are rejected
      // (map empty → catalog not configured → allow free-text / legacy path).
      if (verifiedModifierPriceMap.size > 0 && catalogPrice === undefined) {
        return { __unknown: true, option_name: optName };
      }
      const verifiedDelta = catalogPrice !== undefined ? catalogPrice : (Number(m.price_delta_paise) || 0);
      if (Number(m.price_delta_paise) < 0 || verifiedDelta < 0) {
        return { __negative: true, option_name: optName };
      }
      return {
        option_name: optName,
        price_delta_paise: verifiedDelta,
        quantity: Number(m.quantity) || 1,
      };
    });

    const unknownMod = sanitizedModifiers.find(
      (m: any) => m.__unknown || m.__negative,
    ) as { __unknown?: boolean; __negative?: boolean; option_name?: string } | undefined;
    if (unknownMod) {
      return NextResponse.json(
        {
          error: unknownMod.__negative
            ? `Modifier "${unknownMod.option_name || ""}" has an invalid price delta`
            : `Unknown modifier "${unknownMod.option_name || ""}"`,
        },
        { status: 400 },
      );
    }

    // A3: reject negative / excessive portion deltas at the route (pricing also clamps).
    const portionDeltaRaw = Number(it.portion_delta_paise);
    if (Number.isFinite(portionDeltaRaw) && portionDeltaRaw < 0) {
      return NextResponse.json(
        { error: `Invalid portion delta for item (must be >= 0)` },
        { status: 400 },
      );
    }
    if (Number.isFinite(portionDeltaRaw) && portionDeltaRaw > MAX_PORTION_DELTA_PAISE) {
      return NextResponse.json(
        { error: `Portion delta exceeds maximum (₹10,000)` },
        { status: 400 },
      );
    }

    pricingItems.push({
      menu_item_id: matched.id,
      item_name: matched.name,
      base_price_paise: matched.price_paise,
      portion_name: it.portion_name || undefined,
      portion_delta_paise: Number.isFinite(portionDeltaRaw) ? portionDeltaRaw : 0,
      modifiers: sanitizedModifiers as PricingItemInput["modifiers"],
      quantity: Number(it.quantity) || 1,
      notes: it.notes || "",
      hsn: matched.hsn || null,
    });
  }

  if (pricingItems.length === 0) {
    return NextResponse.json({ error: "No valid menu items in cart" }, { status: 400 });
  }

  // Validate loyalty balance if redeeming points
  let pointsToUse = 0;
  if (redeem_points > 0) {
    if (!customer_phone) {
      return NextResponse.json(
        { error: "Customer phone number is required to redeem loyalty points" },
        { status: 400 },
      );
    }
    const { data: cust } = await admin
      .from("restaurant_customers")
      .select("id, loyalty_points")
      .eq("restaurant_id", user.restaurantId)
      .eq("phone", customer_phone)
      .maybeSingle();

    if (!cust || (cust.loyalty_points || 0) < redeem_points) {
      return NextResponse.json(
        {
          error: `Insufficient loyalty points (available: ${cust?.loyalty_points || 0}, requested: ${redeem_points})`,
        },
        { status: 400 },
      );
    }
    pointsToUse = redeem_points;
  }

  // Authoritative server-side pricing engine calculation
  const taxRate = Number(restaurant?.tax_rate) || 0;
  const pricingResult = calculateAuthoritativePricing({
    items: pricingItems,
    discount_paise: Number(discount_paise) || 0,
    loyalty_points_to_redeem: pointsToUse,
    tax_rate_percent: taxRate,
  });

  // A5: split tender must exactly equal the order total when paid via mixed/split.
  const wantsSplit =
    String(payment_method).toLowerCase() === "mixed" ||
    Number(split_cash_paise) > 0 ||
    Number(split_upi_paise) > 0;
  if (paymentStatus === "paid" && wantsSplit) {
    const cash = Math.round(Number(split_cash_paise) || 0);
    const upi = Math.round(Number(split_upi_paise) || 0);
    const check = validateSplitTender(pricingResult.total_paise, cash, upi);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
  }

  const validUuid =
    (typeof idempotency_key === "string" && UUID_RE.test(idempotency_key)
      ? idempotency_key
      : null) || crypto.randomUUID();

  let resolvedTableId = null;
  if (table_id) {
    const { data: requestedTable } = await admin
      .from("restaurant_tables")
      .select("id")
      .eq("id", table_id)
      .eq("restaurant_id", user.restaurantId)
      .maybeSingle();
    if (!requestedTable) {
      return NextResponse.json(
        { error: "Invalid table selected or table does not belong to this restaurant" },
        { status: 400 },
      );
    }
    resolvedTableId = requestedTable.id;
  }

  if (!resolvedTableId) {
    const { data: fallbackTable } = await admin
      .from("restaurant_tables")
      .select("id")
      .eq("restaurant_id", user.restaurantId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    resolvedTableId = fallbackTable?.id || null;
  }
  if (!resolvedTableId) {
    return NextResponse.json(
      { error: "No active table found for this café. Create a table first." },
      { status: 400 },
    );
  }

  const validOrderType =
    order_type === "takeaway" || order_type === "delivery" ? order_type : "dine_in";

  const baseOrderPayload: Record<string, unknown> = {
    restaurant_id: user.restaurantId,
    table_id: resolvedTableId,
    subtotal_paise: pricingResult.subtotal_paise,
    tax_paise: pricingResult.tax_paise,
    discount_paise: pricingResult.discount_paise,
    total_paise: pricingResult.total_paise,
    pricing_snapshot: pricingResult.snapshot,
    payment_method: normalizePaymentMethod(payment_method),
    payment_status: paymentStatus,
    status: paymentStatus === "paid" ? "preparing" : "pending",
    order_type: validOrderType,
    customer_name:
      customer_name ||
      (validOrderType === "takeaway"
        ? "Takeaway Guest"
        : validOrderType === "delivery"
          ? "Delivery Guest"
          : "Walk-in Guest"),
    customer_phone: customer_phone || "",
    customer_gstin: buyerGstin,
    priority: Boolean(priority),
    idempotency_key: validUuid,
    status_token: validUuid,
    notes: notes || "",
  };

  // A7: insert with bounded retry on (restaurant_id, order_number) unique violations.
  let order: Record<string, unknown> | null = null;
  let oErr: { message?: string } | null = null;
  for (let attempt = 0; attempt < ORDER_NUMBER_MAX_ATTEMPTS; attempt++) {
    const orderNumber = `POS-${Math.floor(Math.random() * 900000) + 100000}-${attempt + 1}`;
    const result = await admin
      .from("orders")
      .insert({ ...baseOrderPayload, order_number: orderNumber })
      .select()
      .single();
    if (!result.error && result.data) {
      order = result.data;
      oErr = null;
      break;
    }
    if (!isUniqueViolation(result.error)) {
      oErr = result.error;
      break;
    }
    // 23505 → regenerate order_number and retry
  }

  if (oErr || !order) {
    return NextResponse.json(
      { error: oErr?.message || "Order creation failed" },
      { status: 500 },
    );
  }

  const orderNumber = String(order.order_number || "");
  const orderId = String(order.id);
  const restaurantId = user.restaurantId!;

  // Deduct validated loyalty points and record transaction
  if (pointsToUse > 0 && customer_phone) {
    try {
      await redeemCustomerPoints(admin, restaurantId, customer_phone, pointsToUse, orderId);
    } catch (err) {
      console.error("[POS] Failed to redeem loyalty points:", err);
    }
  }

  // Insert Order Items
  const itemsToInsert = pricingResult.items.map((it) => ({
    order_id: order.id,
    menu_item_id: it.menu_item_id,
    item_name: it.item_name,
    unit_price_paise: it.unit_price_paise,
    quantity: it.quantity,
    line_total_paise: it.line_total_paise,
    notes: it.notes,
    hsn: it.hsn,
  }));

  const { data: insertedItems, error: itemsInsertErr } = await admin
    .from("order_items")
    .insert(itemsToInsert)
    .select("id");

  if (itemsInsertErr) {
    console.error("[POS] Order items insert failed:", itemsInsertErr);
  }

  // Insert Item Modifiers into order_item_modifiers
  if (insertedItems && insertedItems.length > 0) {
    const modRows: Array<{
      order_item_id: string;
      option_name: string;
      price_delta_paise: number;
    }> = [];

    pricingResult.items.forEach((it, idx) => {
      const parentId = insertedItems[idx]?.id;
      if (parentId) {
        it.modifiers.forEach((m) => {
          modRows.push({
            order_item_id: parentId,
            option_name: m.option_name,
            price_delta_paise: m.price_delta_paise,
          });
        });
      }
    });

    if (modRows.length > 0) {
      await admin.from("order_item_modifiers").insert(modRows);
    }
  }

  // Record payments — only when paid (B5: unpaid mixed/orders insert no rows).
  if (paymentStatus === "paid") {
    if (String(payment_method).toLowerCase() === "mixed") {
      // A5 already validated cash+upi === total; no 50/50 fallback.
      const cashAmount = Math.round(Number(split_cash_paise) || 0);
      const upiAmount = Math.round(Number(split_upi_paise) || 0);

      await admin.from("payments").insert([
        {
          order_id: order.id,
          provider: "cash",
          amount_paise: cashAmount,
          status: "success",
        },
        {
          order_id: order.id,
          provider: "upi_qr",
          amount_paise: upiAmount,
          status: "success",
        },
      ]);
    } else {
      const method = String(payment_method).toLowerCase();
      await admin.from("payments").insert({
        order_id: order.id,
        provider: method === "upi" || method === "online" ? "upi_qr" : method === "card" ? "card_pos" : "cash",
        amount_paise: pricingResult.total_paise,
        status: "success",
      });
    }
  }

  // Auto-deduct raw ingredient stock
  deductInventoryIngredients(admin, user.restaurantId, pricingResult.items).catch((err) =>
    console.error("[POS] Inventory deduction error:", err)
  );

  // Audit event
  await admin.from("audit_events").insert({
    restaurant_id: user.restaurantId,
    actor_id: user.userId,
    entity: "order",
    entity_id: order.id,
    action: "pos_billing",
    metadata: {
      order_number: orderNumber,
      order_type: validOrderType,
      payment_method,
      total_paise: pricingResult.total_paise,
      subtotal_paise: pricingResult.subtotal_paise,
      tax_paise: pricingResult.tax_paise,
      discount_paise: pricingResult.discount_paise,
    },
  });

  // Loyalty processing on payment completion
  let loyaltyData = { pointsEarned: 0, newTotalPoints: 0 };
  if (paymentStatus === "paid" && customer_phone) {
    try {
      loyaltyData = await processCustomerLoyalty(
        admin,
        restaurantId,
        customer_phone,
        customer_name || "",
        pricingResult.total_paise,
        orderId,
        orderNumber,
      );
    } catch (err) {
      console.error("[POS] Loyalty processing failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    order: {
      ...order,
      order_items: pricingResult.items,
      loyalty: loyaltyData,
    },
  });
}
