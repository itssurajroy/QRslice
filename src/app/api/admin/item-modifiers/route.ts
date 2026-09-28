// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const itemId = req.nextUrl.searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("menu_item_modifier_groups")
    .select("modifier_group_id")
    .eq("menu_item_id", itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    ok: true, 
    linkedGroups: data.map((d: any) => d.modifier_group_id) 
  });
}

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId, groupIds } = await req.json();
    if (!itemId || !Array.isArray(groupIds)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = createSupabaseAdmin();
    
    // 1. Verify item belongs to restaurant
    const { data: itemData, error: itemError } = await db
      .from("menu_items")
      .select("id")
      .eq("id", itemId)
      .eq("restaurant_id", auth.restaurantId)
      .single();

    if (itemError || !itemData) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 2. Delete existing links
    await db
      .from("menu_item_modifier_groups")
      .delete()
      .eq("menu_item_id", itemId);

    // 3. Insert new links
    if (groupIds.length > 0) {
      const inserts = groupIds.map((groupId, idx) => ({
        menu_item_id: itemId,
        modifier_group_id: groupId,
        sort_order: idx,
      }));

      await db.from("menu_item_modifier_groups").insert(inserts);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
