// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const { type, ...data } = body;
  const admin = createSupabaseAdmin();

  const isOwner = user.role === "owner" || user.role === "super_admin";
  const isManagerOrOwner = isOwner || user.role === "manager";

  if (type === "toggle_item" || type === "toggle_item_availability") {
    const { itemId, available } = data;
    const { error } = await admin
      .from("menu_items")
      .update({ available: Boolean(available) })
      .eq("id", itemId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "update_settings") {
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: Owner role required" }, { status: 403 });
    }
    const { name, currency, taxRate, address, phone, upiId, upiQrUrl } = data;
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (currency !== undefined) updates.currency = currency || "INR";
    if (taxRate !== undefined) updates.tax_rate = Number(taxRate);
    if (address !== undefined) updates.address = String(address).trim() || null;
    if (phone !== undefined) updates.phone = String(phone).trim() || null;
    if (upiId !== undefined) updates.upi_id = String(upiId).trim() || null;
    if (upiQrUrl !== undefined) updates.upi_qr_url = String(upiQrUrl).trim() || null;

    const { error } = await admin
      .from("restaurants")
      .update(updates)
      .eq("id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "update_branding") {
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: Owner role required" }, { status: 403 });
    }
    const { logoUrl, tagline, googleReviewUrl, accentColor } = data;
    let cleanReviewUrl: string | null | undefined = undefined;
    if (googleReviewUrl !== undefined) {
      if (googleReviewUrl === null || String(googleReviewUrl).trim() === "") {
        cleanReviewUrl = null;
      } else {
        const trimmed = String(googleReviewUrl).trim();
        if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
          return NextResponse.json(
            { error: "Google review URL must begin with https://" },
            { status: 422 },
          );
        }
        cleanReviewUrl = trimmed;
      }
    }

    const { error } = await admin
      .from("restaurants")
      .update({
        logo_url: logoUrl !== undefined ? (logoUrl || null) : undefined,
        tagline: tagline !== undefined ? (String(tagline || "").trim() || null) : undefined,
        google_review_url: cleanReviewUrl,
        accent_color: accentColor || "#f59e0b",
      })
      .eq("id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "create_item") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { categoryId, name, pricePaise, description, isVeg, imageUrl, isBestseller, spiceIndex, tags } = data;
    const { data: item, error } = await admin
      .from("menu_items")
      .insert({
        restaurant_id: user.restaurantId,
        category_id: categoryId,
        name: String(name).trim(),
        price_paise: Number(pricePaise || 0),
        description: String(description || "").trim(),
        is_veg: Boolean(isVeg),
        is_bestseller: Boolean(isBestseller),
        spice_index: Number(spiceIndex || 0),
        tags: Array.isArray(tags) ? tags : [],
        image_url: imageUrl || null,
        available: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, item });
  }

  if (type === "delete_item") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { itemId } = data;
    const { error } = await admin
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "create_category") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { name, sortOrder } = data;
    const { data: category, error } = await admin
      .from("menu_categories")
      .insert({
        restaurant_id: user.restaurantId,
        name: String(name).trim(),
        sort_order: Number(sortOrder || 0),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, category });
  }

  if (type === "delete_category") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { categoryId } = data;
    const { error } = await admin
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "create_table") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { label, seats } = data;
    const cleanLabel = String(label || "").trim();
    if (!cleanLabel) {
      return NextResponse.json({ error: "Table label is required" }, { status: 400 });
    }

    const { data: table, error } = await admin
      .from("restaurant_tables")
      .insert({
        restaurant_id: user.restaurantId,
        label: cleanLabel,
        seats: Math.max(1, Math.min(50, Number(seats || 4))),
        active: true,
        qr_token: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, table });
  }

  if (type === "update_table") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { tableId, label, seats, active } = data;
    if (!tableId) {
      return NextResponse.json({ error: "Table ID required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (label !== undefined) {
      const cleanLabel = String(label).trim();
      if (!cleanLabel) {
        return NextResponse.json({ error: "Table label cannot be empty" }, { status: 400 });
      }
      updates.label = cleanLabel;
    }
    if (seats !== undefined) {
      updates.seats = Math.max(1, Math.min(50, Number(seats || 4)));
    }
    if (active !== undefined) {
      updates.active = Boolean(active);
    }

    const { data: table, error } = await admin
      .from("restaurant_tables")
      .update(updates)
      .eq("id", tableId)
      .eq("restaurant_id", user.restaurantId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, table });
  }

  if (type === "toggle_table_active") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { tableId, active } = data;
    if (!tableId) {
      return NextResponse.json({ error: "Table ID required" }, { status: 400 });
    }

    const { data: table, error } = await admin
      .from("restaurant_tables")
      .update({ active: Boolean(active) })
      .eq("id", tableId)
      .eq("restaurant_id", user.restaurantId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, table });
  }

  if (type === "regenerate_qr") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { tableId } = data;
    if (!tableId) {
      return NextResponse.json({ error: "Table ID required" }, { status: 400 });
    }

    const newToken = crypto.randomUUID();
    const { data: table, error } = await admin
      .from("restaurant_tables")
      .update({ qr_token: newToken })
      .eq("id", tableId)
      .eq("restaurant_id", user.restaurantId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, table, qr_token: newToken });
  }

  if (type === "bulk_create_tables") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { prefix = "T", start = 1, count = 5, seats = 4 } = data;
    const startNum = Math.max(1, Number(start) || 1);
    const totalCount = Math.max(1, Math.min(30, Number(count) || 5));
    const capacity = Math.max(1, Math.min(50, Number(seats) || 4));
    const cleanPrefix = String(prefix || "").trim();

    const rows = [];
    for (let i = 0; i < totalCount; i++) {
      const num = startNum + i;
      const label = `${cleanPrefix}${num < 10 ? "0" + num : num}`;
      rows.push({
        restaurant_id: user.restaurantId,
        label,
        seats: capacity,
        active: true,
        qr_token: crypto.randomUUID(),
      });
    }

    const { data: tables, error } = await admin
      .from("restaurant_tables")
      .insert(rows)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tables });
  }

  if (type === "delete_table") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { tableId } = data;
    const { error } = await admin
      .from("restaurant_tables")
      .delete()
      .eq("id", tableId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "bulk_import_items") {
    if (!isManagerOrOwner) {
      return NextResponse.json({ error: "Forbidden: Manager or Owner role required" }, { status: 403 });
    }
    const { items: rawItems } = data;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "No items provided for import" }, { status: 400 });
    }

    // Ensure all categories exist or map them
    const { data: existingCats } = await admin
      .from("menu_categories")
      .select("id, name")
      .eq("restaurant_id", user.restaurantId);

    const catMap = new Map<string, string>();
    (existingCats || []).forEach((c) => catMap.set(c.name.toLowerCase(), c.id));

    const defaultCatId = existingCats?.[0]?.id;
    if (!defaultCatId) {
      // Create a default category if none exists
      const { data: newCat } = await admin
        .from("menu_categories")
        .insert({ restaurant_id: user.restaurantId, name: "General Menu", sort_order: 1 })
        .select("id")
        .single();
      if (newCat) catMap.set("general menu", newCat.id);
    }

    const rowsToInsert = rawItems.map((item: any) => {
      const categoryName = (item.category || "General Menu").trim().toLowerCase();
      const catId = catMap.get(categoryName) || defaultCatId;
      const pricePaise = Math.max(0, Math.round(Number(item.price || 0) * 100));

      return {
        restaurant_id: user.restaurantId,
        category_id: catId,
        name: String(item.name || "").trim(),
        price_paise: pricePaise,
        description: String(item.description || "").trim(),
        is_veg: Boolean(item.isVeg ?? true),
        available: true,
      };
    }).filter((r) => r.name.length > 0);

    const { data: inserted, error } = await admin
      .from("menu_items")
      .insert(rowsToInsert)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: inserted?.length || 0, items: inserted });
  }


  if (type === "update_order_customer") {
    const { orderId, customerPhone } = data;
    if (!orderId || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { error } = await admin
      .from("orders")
      .update({ customer_phone: String(customerPhone).trim() })
      .eq("id", orderId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown operation type" }, { status: 400 });
}

