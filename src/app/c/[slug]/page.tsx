// Copyright (c) 2026 QRslice. All rights reserved.
import { notFound } from "next/navigation";
import { getRestaurantBySlug, canOrder, getTierLimits } from "@/lib/tenant";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import PublicCafeClient from "@/components/PublicCafeClient";

import type { Metadata } from "next";
import { createRestaurantSchema, createBreadcrumbSchema, getCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getRestaurantBySlug(slug);
  if (!tenant) return { title: "Restaurant Not Found" };

  const canonicalUrl = getCanonicalUrl(`/c/${slug}`);

  return {
    title: `${tenant.name} — Digital Menu & Contactless Table Ordering`,
    description: `Browse the fresh culinary menu and place contactless table orders at ${tenant.name}. Prepared fresh, delivered right to your table.`,
    openGraph: {
      title: `${tenant.name} | Digital Menu & Table Ordering`,
      description: `Browse dishes, customize your order, and pay seamlessly from your phone at ${tenant.name}.`,
      images: tenant.logo_url ? [tenant.logo_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tenant.name} | Digital Menu & Table Ordering`,
      description: `Browse dishes, customize your order, and pay seamlessly from your phone at ${tenant.name}.`,
      images: tenant.logo_url ? [tenant.logo_url] : [],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PublicCafePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ table?: string; t?: string }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const tableParam = sp.table || sp.t || undefined;
  const tenant = await getRestaurantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const db = createSupabaseAdmin();
  const [{ data: categories }, { data: items }, { data: tables }, { data: modifierGroupsData }] = await Promise.all([
    db
      .from("menu_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", tenant.id)
      .order("sort_order", { ascending: true }),
    db
      .from("menu_items")
      .select("id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available")
      .eq("restaurant_id", tenant.id)
      .eq("available", true),
    db
      .from("restaurant_tables")
      .select("id, label, seats, active")
      .eq("restaurant_id", tenant.id)
      .eq("active", true)
      .order("label", { ascending: true }),
    db
      .from("modifier_groups")
      .select("id, name, required, min_select, max_select, modifier_options(id, name, price_delta_paise, active)")
      .eq("restaurant_id", tenant.id)
  ]);

  const itemIds = items?.map(i => i.id) || [];
  const { data: itemModifiersData } = await db
    .from("menu_item_modifier_groups")
    .select("menu_item_id, modifier_group_id")
    .in("menu_item_id", itemIds);

  const orderable = canOrder(tenant);
  const limits = getTierLimits(tenant.tier);

  const restaurantSchema = createRestaurantSchema(tenant);
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Restaurants", url: "/restaurants" },
    { name: tenant.name, url: `/c/${tenant.slug}` },
  ]);

  return (
    <div
      style={
        {
          "--accent": tenant.accent_color || "#D97706",
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PublicCafeClient
        restaurant={tenant}
        tables={tables ?? []}
        categories={categories ?? []}
        items={items ?? []}
        modifierGroups={modifierGroupsData ?? []}
        itemModifiers={itemModifiersData ?? []}
        canOrder={orderable}
        limits={limits}
        upiQrUrl={tenant.upi_qr_url || undefined}
        initialTableLabel={tableParam}
      />
    </div>
  );
}
