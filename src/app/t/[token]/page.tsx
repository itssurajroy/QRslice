// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantByTableToken, canOrder } from "@/lib/tenant";
import { MenuClient } from "@/features/menu/MenuClient";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { tenant } = await getTenantByTableToken(token);
  const cafeName = tenant?.name || "QRslice";

  return {
    title: `${cafeName} — Contactless Table Ordering`,
    description: `Order fresh food & beverages directly from your table at ${cafeName}.`,
    openGraph: {
      title: `${cafeName} | Table Ordering`,
      description: `Browse dishes, customize your order, and pay seamlessly from your phone.`,
      images: tenant?.logo_url ? [tenant.logo_url] : [],
    },
    // Per-table capability URLs must never be indexed.
    robots: { index: false, follow: false },
  };
}

export default async function TablePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { tenant, tableId, tableActive } = await getTenantByTableToken(token);

  if (!tenant || !tableId || !tableActive) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-6 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
            ⚠️
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Table QR Expired or Inactive</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This QR code is either unassigned or has been deactivated. Please notify the café staff or scan the updated table card.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs transition-all shadow-md shadow-violet-500/20"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Check subscription expiry gating
  if (!canOrder(tenant)) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-6 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
            ☕
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{tenant.name}</h1>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            🚫 <strong className="font-black">Ordering Temporarily Paused</strong>
            <p className="text-xs text-amber-700 mt-1">
              The café subscription is currently being renewed. Please order directly with your server.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const db = createSupabaseAdmin();

  // Resolve table label
  const { data: tableData } = await db
    .from("restaurant_tables")
    .select("label")
    .eq("id", tableId)
    .single();

  // Fetch categories and in-stock items
  const [{ data: categories }, { data: items }] = await Promise.all([
    db
      .from("menu_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", tenant.id)
      .order("sort_order"),
    db
      .from("menu_items")
      .select("id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available")
      .eq("restaurant_id", tenant.id)
      .eq("available", true),
  ]);

  return (
    <MenuClient
      qrToken={token}
      tableLabel={tableData?.label || "T01"}
      restaurantName={tenant.name}
      categories={categories ?? []}
      items={items ?? []}
      accentColor={tenant.accent_color || undefined}
      upiQrUrl={tenant.upi_qr_url || undefined}
      upiId={tenant.upi_id || undefined}
    />
  );
}