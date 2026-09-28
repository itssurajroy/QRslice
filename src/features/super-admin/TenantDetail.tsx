// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";
import { paise } from "@/lib/utils";
import {
  UsersIcon,
  CreditCardIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  CalendarIcon,
  QrCodeIcon,
} from "@/components/Icons";
import { Button } from "@/components/ui/Button";
import SubscriptionForm from "@/app/super/tenants/[id]/SubscriptionForm";
import TenantDangerZone from "@/app/super/tenants/[id]/TenantDangerZone";

function BuildingIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

interface TenantDetailProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    tier: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    billing_status: string;
    created_at: string;
    upi_id: string | null;
    upi_qr_url: string | null;
    whatsapp_enabled: boolean;
    accent_color: string;
    tagline: string | null;
    google_review_url: string | null;
    address: string | null;
    phone: string | null;
    tax_rate: number | null;
  };
  owner: any;
  staff: any[];
  recentOrders: any[];
  todayRevenue: number;
  todayOrdersCount: number;
}

type DetailTab = "overview" | "outlets" | "orders" | "subscription" | "billing" | "integrations" | "activity";

export function TenantDetail({
  tenant,
  owner,
  staff,
  recentOrders,
  todayRevenue,
  todayOrdersCount,
}: TenantDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [drawer, setDrawer] = useState<{
    categories: any[];
    items: any[];
    tables: any[];
    orders: any[];
    audit: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/super/tenant?cafeId=${tenant.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (live && d?.ok) setDrawer(d);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tenant.id]);

  const suspended = (tenant as any).is_suspended ?? tenant.plan === "suspended";

  const daysLeft = () => {
    if (!tenant.trial_ends_at) return "N/A";
    const diff = new Date(tenant.trial_ends_at).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / 864e5);
  };

  const trialDaysRemaining = daysLeft();

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 002-2V6a2 2 0 012-2h4a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 00-2 2H6a2 2 0 00-2 2v10.5a.5.5 0 00.5.5h9a.5.5 0 010 1H6a2 2 0 00-2 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h2.5" />
        </svg>
      ),
    },
    {
      id: "outlets",
      label: "Outlets",
      icon: <BuildingIcon className="w-4 h-4" />,
      badge: drawer?.tables ? `${drawer.tables.length} tables` : undefined,
    },
    {
      id: "orders",
      label: "Orders",
      icon: <ClipboardListIcon className="w-4 h-4" />,
      badge: recentOrders.length ? `${recentOrders.length}` : undefined,
    },
    {
      id: "subscription",
      label: "Subscription",
      icon: <CreditCardIcon className="w-4 h-4" />,
      badge: tenant.plan.toUpperCase(),
    },
    {
      id: "billing",
      label: "Billing",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s.895 2 3 2 3 .895 3-2 .895-2 3-2-.895-2-3-2-.895-2-3-.895-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m-3-6l4-4m0 0L7 14M7 7h.01M17 21h-10a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-6.009A4.988 4.988 0 0017 8c0-2.206-1.523-3.662-4-4.408V2a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h2.5" />
        </svg>
      ),
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <QrCodeIcon className="w-4 h-4" />,
    },
    {
      id: "activity",
      label: "Activity",
      icon: <ShieldCheckIcon className="w-4 h-4" />,
      badge: staff.length ? `${staff.length} staff` : undefined,
    },
  ];

  const ordersList = drawer?.orders && drawer.orders.length > 0 ? drawer.orders : recentOrders;

  return (
    <div className="space-y-6">
      {/* Restaurant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                tenant.plan === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : tenant.plan === "trial"
                  ? "bg-amber-100 text-amber-800"
                  : tenant.plan === "expired"
                  ? "bg-rose-100 text-rose-700"
                  : tenant.plan === "suspended"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tenant.plan}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
            <span>/{tenant.slug}</span>
            <span>•</span>
            <span>ID: {tenant.id}</span>
            {tenant.phone && (
              <>
                <span>•</span>
                <span>{tenant.phone}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`http://${tenant.slug}.localhost:3000`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Preview Menu</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* 7 Required Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1.5 overflow-x-auto pb-2 -mb-px" aria-label="Restaurant Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#5738F5] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Revenue</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{paise(todayRevenue)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Live from today's orders</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Orders</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{todayOrdersCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">Completed / preparing</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan & Trial</p>
                <p className="text-2xl font-bold text-slate-900 capitalize">{tenant.plan}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {tenant.plan === "trial" ? `${trialDaysRemaining} days remaining` : `Status: ${tenant.billing_status}`}
                </p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tables & Staff</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {drawer?.tables?.length ?? 0} <span className="text-sm font-normal text-slate-500">/ {staff.length}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Tables / Active staff</p>
              </div>
            </div>

            {/* Profile & Operational Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Restaurant Profile</h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Owner Name</dt>
                    <dd className="font-semibold text-slate-900">{owner?.name || "Unassigned"}</dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Owner Email</dt>
                    <dd className="font-mono text-slate-900">{owner?.email || "—"}</dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-mono text-slate-900">{tenant.phone || "—"}</dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Address</dt>
                    <dd className="text-right text-slate-900 max-w-[200px] truncate">{tenant.address || "—"}</dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500">Registered Date</dt>
                    <dd className="text-slate-900">{new Date(tenant.created_at).toLocaleDateString("en-IN")}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Platform Governance</h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Subscription Tier</dt>
                    <dd className="font-semibold text-slate-900 uppercase">{tenant.tier || "Standard"}</dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">GST / Tax Rate</dt>
                    <dd className="font-mono text-slate-900">{tenant.tax_rate ? `${tenant.tax_rate}%` : "0%"}</dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500">Menu Catalog</dt>
                    <dd className="text-slate-900 font-semibold">
                      {drawer?.categories?.length ?? 0} categories, {drawer?.items?.length ?? 0} items
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500">Quick Actions</dt>
                    <dd className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("subscription")}
                        className="text-[#5738F5] hover:underline font-semibold"
                      >
                        Edit Plan
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => setActiveTab("activity")}
                        className="text-[#5738F5] hover:underline font-semibold"
                      >
                        Inspect Staff
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* 2. OUTLETS TAB */}
        {activeTab === "outlets" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dining Areas & Tables</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Active dining stations, QR order points, and table capacity for this restaurant location.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  Total Tables: {drawer?.tables?.length ?? 0}
                </span>
              </div>

              {!drawer ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading tables data…</div>
              ) : drawer.tables.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No tables configured for this restaurant yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {drawer.tables.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">#{t.label}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.active !== false ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{t.seats || 2} Seats</span>
                        <span className="font-mono text-slate-400">QR Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Hardware & Terminal Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">POS Terminal</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Online</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Kitchen Display (KDS)</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Online</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Thermal Receipt Printer</span>
                  <span className="text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded font-medium">Standby</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Order History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Realtime and historical orders processed for {tenant.name}.
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono">{ordersList.length} orders loaded</span>
              </div>

              {ordersList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No orders recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="pb-3 pl-2 font-semibold">Order #</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Payment</th>
                        <th className="pb-3 text-right font-semibold">Amount</th>
                        <th className="pb-3 text-right pr-2 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordersList.map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-2 font-bold text-slate-900">#{order.order_number}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === "ready"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : order.status === "preparing"
                                  ? "bg-amber-100 text-amber-800"
                                  : order.status === "served"
                                  ? "bg-brand-lavender text-brand-dark"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.payment_status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-slate-900">
                            {paise(order.total_paise || 0)}
                          </td>
                          <td className="py-3 text-right pr-2 text-slate-500 font-mono">
                            {new Date(order.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Subscription & Lifecycle</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage tier plan, billing interval, trial duration, and platform access.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-brand-lavender text-[#5738F5] border border-indigo-100">
                    Tier: {tenant.tier || "growth"}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                    Status: {tenant.billing_status}
                  </span>
                </div>
              </div>

              <SubscriptionForm
                id={tenant.id}
                plan={tenant.plan}
                trialEndsAt={tenant.trial_ends_at}
                tier={tenant.tier}
              />
            </div>

            {/* Lifecycle Safety & Danger Zone */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Administrative Safety Actions</h3>
              <p className="text-xs text-slate-500 mb-4">
                Emergency suspension, trial expiration, and ownership reassignment.
              </p>
              <TenantDangerZone id={tenant.id} slug={tenant.slug} suspended={suspended} />
            </div>
          </div>
        )}

        {/* 5. BILLING TAB */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Platform Invoices & Transactions</h3>
              <p className="text-xs text-slate-500 mb-4">
                SaaS subscription billing receipts and payout records for {tenant.name}.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Billing Method</p>
                  <p className="text-base font-bold text-slate-900 mt-1">Razorpay Autopay</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Tax Invoice Rate</p>
                  <p className="text-base font-bold text-slate-900 mt-1">{tenant.tax_rate ? `${tenant.tax_rate}% GST` : "Exempt"}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Payment Status</p>
                  <p className="text-base font-bold text-emerald-700 mt-1 capitalize">{tenant.billing_status || "Active"}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">INV-2026-09</td>
                      <td className="p-3 text-slate-600">Sep 2026 (Monthly)</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹1,999.00</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          PAID
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-[#5738F5] hover:underline font-semibold">Download</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">INV-2026-08</td>
                      <td className="p-3 text-slate-600">Aug 2026 (Monthly)</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹1,999.00</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          PAID
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-[#5738F5] hover:underline font-semibold">Download</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. INTEGRATIONS TAB */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Cloud API */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">WhatsApp Notification Bot</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tenant.whatsapp_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tenant.whatsapp_enabled ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Sends automated order bills and preparation status updates to diners via WhatsApp API.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600">
                  Status: {tenant.whatsapp_enabled ? "Connected (Meta Cloud API)" : "Not Configured"}
                </div>
              </div>

              {/* UPI & Payments */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">UPI Instant Settlement</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    CONFIGURED
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Direct diner payments routed into restaurant VPA via dynamic Bharat UPI QR.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 truncate">
                  VPA: {tenant.upi_id || "default@razorpay"}
                </div>
              </div>

              {/* Google Reviews */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Google Review Prompt</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tenant.google_review_url ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tenant.google_review_url ? "ACTIVE" : "NONE"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Encourages satisfied diners to leave Google Business ratings right from digital bill.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600 truncate">
                  {tenant.google_review_url || "No review URL set"}
                </div>
              </div>

              {/* Brand Accent Styling */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Diner Theme Branding</h4>
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300"
                    style={{ backgroundColor: tenant.accent_color || "#5738F5" }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Accent color and custom branding applied to the mobile diner ordering web application.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600">
                  Hex Code: {tenant.accent_color || "#5738F5"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. ACTIVITY TAB (Staff inspection + Audit Trail) */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            {/* Staff Members Section */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Staff Members & Roles</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect café staff accounts, roles, access permissions, and Quick-PIN status.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {staff.length} Members
                </span>
              </div>

              {staff.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No staff accounts registered for this cafe.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="pb-3 pl-2 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 text-right pr-2 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((member: any) => (
                        <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-2 font-semibold text-slate-900">
                            {member.display_name || member.name || "—"}
                          </td>
                          <td className="py-3 font-mono text-slate-600">{member.email}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                member.role === "owner"
                                  ? "bg-brand-lavender text-brand-dark"
                                  : member.role === "manager"
                                  ? "bg-violet-100 text-violet-700"
                                  : member.role === "chef"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                member.active !== false
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {member.active !== false ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2 text-slate-500 font-mono">
                            {new Date(member.created_at || Date.now()).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Restaurant Audit Trail Section */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Audit Trail (Recent 25 events)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Security, config changes, and menu modifications performed on this restaurant.
                  </p>
                </div>
              </div>

              {!drawer ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading audit trail…</div>
              ) : drawer.audit.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="pb-3 pl-2 font-semibold">Action</th>
                        <th className="pb-3 font-semibold">Entity</th>
                        <th className="pb-3 text-right pr-2 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drawer.audit.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-2 font-mono font-bold text-slate-900">{e.action}</td>
                          <td className="py-3 text-slate-600 font-mono">
                            {e.entity}:{String(e.entity_id || "").slice(0, 8)}
                          </td>
                          <td className="py-3 text-right pr-2 text-slate-500 font-mono">
                            {new Date(e.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantDetail;
