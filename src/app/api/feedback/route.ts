// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status_token, rating, feedback, compliments = [], is_google_click = false } = body;
  if (!status_token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("id, restaurant_id, table_id, order_number")
    .eq("status_token", status_token)
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (is_google_click) {
    // Log Google Review Click independently
    const { error: clickErr } = await admin.from("audit_events").insert({
      restaurant_id: order.restaurant_id,
      entity: "customer_feedback",
      entity_id: order.id,
      action: "google_review_clicked",
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        rating: rating || 5, // Implicit 5 if they clicked directly
        clicked_at: new Date().toISOString(),
      },
    });
    if (clickErr) return NextResponse.json({ error: clickErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Click logged" });
  }

  // Record standard feedback into audit_events for admin insights
  const { error: aErr } = await admin.from("audit_events").insert({
    restaurant_id: order.restaurant_id,
    entity: "customer_feedback",
    entity_id: order.id,
    action: "submit",
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      rating,
      feedback: feedback?.trim() || "",
      compliments,
      submitted_at: new Date().toISOString(),
      requires_manager_attention: rating <= 3,
    },
  });

  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  // Smart alert: 1-3 stars send private alert to manager
  if (rating <= 3) {
    // TODO: Send low rating alert via email or dashboard notification instead of WhatsApp
  }

  return NextResponse.json({ ok: true, message: "Thank you for your feedback!" });
}


