// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || typeof token !== "string" || token.length < 16) {
    return NextResponse.json({ error: "Invalid status token format" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  // Find order by status_token
  const { data: order } = await db
    .from("orders")
    .select("id, payment_status")
    .eq("status_token", token)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ message: "Already paid" }, { status: 200 });
  }

  // Update status to verification_pending
  const { error } = await db
    .from("orders")
    .update({ payment_status: "verification_pending" })
    .eq("id", order.id);

  if (error) {
    console.error("Failed to mark order for UPI verification:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
