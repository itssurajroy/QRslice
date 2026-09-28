// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;

  const { data: groupsData, error: groupsError } = await db
    .from("modifier_groups")
    .select("id, name, required, min_select, max_select, modifier_options(id, name, price_delta_paise, active)")
    .eq("restaurant_id", restaurantId);

  if (groupsError) {
    return NextResponse.json({ error: groupsError.message }, { status: 500 });
  }

  const groups = groupsData.map((g: any) => ({
    id: g.id,
    name: g.name,
    required: g.required || g.min_select > 0,
    multi_select: g.max_select > 1,
    options: (g.modifier_options || []).filter((o: any) => o.active !== false).map((o: any) => ({
      id: o.id,
      name: o.name,
      price_adjustment_paise: o.price_delta_paise,
    })),
  }));

  return NextResponse.json({ ok: true, groups });
}

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;

  try {
    const body = await req.json();
    const { groups } = body;

    if (!Array.isArray(groups)) {
      return NextResponse.json({ error: "groups array required" }, { status: 400 });
    }

    // Process each group
    for (const group of groups) {
      const isNewGroup = group.id.startsWith("mod-");
      const groupId = isNewGroup ? crypto.randomUUID() : group.id;

      if (isNewGroup) {
        group.id = groupId;
      }

      await db.from("modifier_groups").upsert({
        id: groupId,
        restaurant_id: restaurantId,
        name: group.name,
        required: group.required,
        min_select: group.required ? 1 : 0,
        max_select: group.multi_select ? 10 : 1,
      });

      // Update options
      const existingOptionsRes = await db
        .from("modifier_options")
        .select("id")
        .eq("modifier_group_id", groupId);
      
      const existingOptionIds = new Set((existingOptionsRes.data || []).map((o) => o.id));

      for (const opt of group.options) {
        const isNewOpt = opt.id.startsWith("opt-");
        const optId = isNewOpt ? crypto.randomUUID() : opt.id;
        
        if (isNewOpt) {
          opt.id = optId;
        }

        await db.from("modifier_options").upsert({
          id: optId,
          modifier_group_id: groupId,
          name: opt.name,
          price_delta_paise: opt.price_adjustment_paise,
          active: true,
        });

        existingOptionIds.delete(optId);
      }

      // Delete removed options
      for (const removedId of existingOptionIds) {
        await db.from("modifier_options").update({ active: false }).eq("id", removedId);
      }
    }

    // Now handle deleted groups: any group in DB for this restaurant not in `groups`
    const currentGroupsIds = new Set(groups.map((g) => g.id));
    const allDbGroupsRes = await db.from("modifier_groups").select("id").eq("restaurant_id", restaurantId);
    if (allDbGroupsRes.data) {
      for (const dbGroup of allDbGroupsRes.data) {
        if (!currentGroupsIds.has(dbGroup.id)) {
          // It was deleted
          await db.from("modifier_groups").delete().eq("id", dbGroup.id);
          // (modifier_options should cascade or we can leave them orphaned if constraints allow)
        }
      }
    }

    return NextResponse.json({ ok: true, groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save modifiers" }, { status: 500 });
  }
}