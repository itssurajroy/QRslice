// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getTenantBySlugAndTableLabel, canOrder } from '@/lib/tenant';
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { MenuClient } from "@/features/menu/MenuClient";
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; tableLabel: string }>;
}): Promise<Metadata> {
  const { slug, tableLabel } = await params;
  const { tenant } = await getTenantBySlugAndTableLabel(slug, tableLabel);
  const cleanLabel = decodeURIComponent(tableLabel);
  const cafeName = tenant?.name || 'QRslice';

  return {
    title: cafeName + ' — Table ' + cleanLabel + ' Menu & Ordering',
    description: 'Browse the contactless digital menu and order fresh food & drinks directly from Table ' + cleanLabel + ' at ' + cafeName + '.',
    openGraph: {
      title: cafeName + ' | Table ' + cleanLabel,
      description: 'Order fresh food & beverages directly from your table.',
      images: tenant?.logo_url ? [tenant.logo_url] : [],
    },
    // Per-table ordering URLs must never be indexed.
    robots: { index: false, follow: false },
  };
}

export default async function NamedCafeTablePage({
  params,
}: {
  params: Promise<{ slug: string; tableLabel: string }>;
}) {
  const { slug, tableLabel } = await params;
  const { tenant, table } = await getTenantBySlugAndTableLabel(slug, tableLabel);

  if (!tenant || !table || !table.active) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-6 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center text-3xl mx-auto">
            ⚠️
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Table Not Found or Inactive</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Table "{decodeURIComponent(tableLabel)}" is currently unavailable for {tenant?.name || 'this café'}. Please ask café staff or check the table number.
          </p>
          <div className="pt-2">
            <Link
              href={tenant ? ('/c/' + tenant.slug) : '/'}
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              View Café Menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!canOrder(tenant)) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-6 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center text-3xl mx-auto">
            ☕
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{tenant.name}</h1>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            🚫 <strong>Ordering Temporarily Paused</strong>
            <p className="text-xs text-amber-600 mt-1">
              The café subscription is currently being renewed. Please order directly with your server.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const db = createSupabaseAdmin();

  const [{ data: categories }, { data: items }] = await Promise.all([
    db
      .from('menu_categories')
      .select('id, restaurant_id, name, sort_order')
      .eq('restaurant_id', tenant.id)
      .order('sort_order'),
    db
      .from('menu_items')
      .select(`
        id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available, sort_order,
        is_bestseller, spice_index, tags, cross_sell_items,
        menu_item_modifier_groups(
          modifier_groups(
            id, restaurant_id, name, min_select, max_select, required,
            modifier_options(id, modifier_group_id, name, price_delta_paise, active)
          )
        )
      `)
      .eq('restaurant_id', tenant.id)
      .eq('available', true),
  ]);

  const mappedItems = (items ?? []).map((item: any) => {
    const modifier_groups = item.menu_item_modifier_groups
      ?.map((link: any) => link.modifier_groups)
      .filter(Boolean) || [];

    // Filter to only active modifier options
    modifier_groups.forEach((group: any) => {
      if (group.modifier_options) {
        group.options = group.modifier_options.filter((opt: any) => opt.active);
        delete group.modifier_options;
      }
    });

    delete item.menu_item_modifier_groups;
    
    return {
      ...item,
      modifier_groups
    };
  });

  return (
    <MenuClient
      qrToken={table.qr_token}
      tableLabel={table.label}
      restaurantName={tenant.name}
      categories={categories ?? []}
      items={mappedItems}
    />
  );
}