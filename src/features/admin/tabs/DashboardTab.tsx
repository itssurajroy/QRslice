// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { paise } from "@/lib/utils";
import { calculateDetailedTableStatus } from "@/features/booking/floorStatus";
import {
  CreditCardIcon,
  ClipboardListIcon,
  ChairIcon,
  ArrowRightIcon,
  ChefHatIcon,
  ChartIcon,
  FlameIcon,
} from "@/components/Icons";

interface DashboardTabProps {
  liveRevenue: number;
  liveOrders: number;
  itemList: any[];
  tableList: any[];
  recentOrders: any[];
  setTab: (tab: any) => void;
  restaurant: any;
  restaurantId: string;
}

export function DashboardTab({
  liveRevenue,
  liveOrders,
  itemList,
  tableList,
  recentOrders,
  setTab,
  restaurant,
  restaurantId,
}: DashboardTabProps) {
  const [salesPeriod, setSalesPeriod] = useState<"today" | "yesterday" | "7d" | "30d">("today");
  const [deltas, setDeltas] = useState<{
    revenue: number;
    orders: number;
    avg: number;
  }>({ revenue: 0, orders: 0, avg: 0 });
  
  const [reputation, setReputation] = useState<{
    totalFeedbacks30d: number;
    fiveStarRatings30d: number;
    googleReviewClicks30d: number;
    conversionRate: number;
  }>({ totalFeedbacks30d: 0, fiveStarRatings30d: 0, googleReviewClicks30d: 0, conversionRate: 0 });

  const [loadingDeltas, setLoadingDeltas] = useState(true);

  // Fetch real deltas from analytics API
  useEffect(() => {
    setLoadingDeltas(true);
    fetch(`/api/analytics/dashboard`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.ok) {
          if (d.deltas?.vsYesterday) setDeltas(d.deltas.vsYesterday);
          if (d.reputation) setReputation(d.reputation);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDeltas(false));
  }, [restaurantId]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate Average Order Value
  const avgOrderValue = liveOrders > 0 ? Math.round(liveRevenue / liveOrders) : 0;

  // Derive order activity by status
  const orderCounts = useMemo(() => {
    let newCount = 0;
    let prepCount = 0;
    let readyCount = 0;
    let completedCount = 0;

    recentOrders.forEach((o: any) => {
      const s = (o.status || "").toLowerCase();
      if (s === "pending" || s === "new" || s === "confirmed") newCount++;
      else if (s === "preparing") prepCount++;
      else if (s === "ready") readyCount++;
      else if (s === "served" || s === "completed") completedCount++;
    });

    return { newCount, prepCount, readyCount, completedCount };
  }, [recentOrders]);

  // Derive table operational details
  const tableStatusList = useMemo(() => {
    return tableList.map((t) => {
      const detailed = calculateDetailedTableStatus(t, recentOrders, [], new Set(), new Date());
      return { table: t, detailed };
    });
  }, [tableList, recentOrders]);

  const activeTablesCount = tableList.filter((t: any) => t.active !== false).length;
  const occupiedTables = tableStatusList.filter((ts) => ts.table.active !== false && ts.detailed.state !== "available");
  const availableCount = Math.max(0, activeTablesCount - occupiedTables.length);

  // Derive top/popular items from actual recent orders
  const popularItems = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {};
    recentOrders.forEach((o: any) => {
      const items = o.order_items || o.items || [];
      items.forEach((it: any) => {
        if (!counts[it.item_name]) {
          counts[it.item_name] = { name: it.item_name, count: 0, revenue: 0 };
        }
        counts[it.item_name].count += it.quantity || 1;
        counts[it.item_name].revenue += (it.unit_price_paise || 0) * (it.quantity || 1);
      });
    });

    const list = Object.values(counts).sort((a, b) => b.count - a.count);
    return list.slice(0, 5);
  }, [recentOrders]);

  // Payment Breakdown
  const paymentSummary = useMemo(() => {
    let upiPaise = 0;
    let cashPaise = 0;
    let cardPaise = 0;

    recentOrders.forEach((o: any) => {
      const m = (o.payment_method || "").toLowerCase();
      const amount = o.total_paise || 0;
      if (m.includes("upi") || m.includes("qr") || m.includes("online")) {
        upiPaise += amount;
      } else if (m.includes("cash")) {
        cashPaise += amount;
      } else {
        cardPaise += amount;
      }
    });

    const total = upiPaise + cashPaise + cardPaise;
    return {
      upiPaise,
      cashPaise,
      cardPaise,
      total,
      upiPct: total > 0 ? Math.round((upiPaise / total) * 100) : 0,
      cashPct: total > 0 ? Math.round((cashPaise / total) * 100) : 0,
      cardPct: total > 0 ? Math.round((cardPaise / total) * 100) : 0,
    };
  }, [recentOrders]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. COCKPIT HEADER (Section 2 Specification) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-[#17142B] tracking-tight">
            {greeting}, {restaurant?.name || "Restaurant"}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#6F7185] font-semibold mt-1">
            <span>Today · {todayFormatted}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-bold">Kitchen &amp; Floor Live</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTab("tables")}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-xs transition-colors cursor-pointer"
          >
            Live Floor Plan
          </button>

          <Link
            href="/pos"
            className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/20 transition-all cursor-pointer"
          >
            <span>Open POS</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. KPI CARDS ROW WITH DELTAS (Section 2 Specification) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F7185]">
              Today&apos;s Sales
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCardIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {liveOrders === 0 ? paise(0) : paise(liveRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
            {liveOrders === 0 ? (
              <span className="text-slate-400 font-normal">No orders yet today</span>
            ) : (
              <>
                <span>{deltas.revenue >= 0 ? "↑" : "↓"} {Math.abs(deltas.revenue).toFixed(1)}%</span>
                <span className="text-slate-400 font-normal">vs yesterday</span>
              </>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F7185]">
              Orders
            </span>
            <span className="w-8 h-8 rounded-xl bg-[rgba(87,56,245,0.08)] text-[#5738F5] flex items-center justify-center">
              <ClipboardListIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {liveOrders}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
            {liveOrders === 0 ? (
              <span className="text-slate-400 font-normal">Awaiting first ticket</span>
            ) : (
              <>
                <span>{deltas.orders >= 0 ? "↑" : "↓"} {Math.abs(deltas.orders).toFixed(1)}%</span>
                <span className="text-slate-400 font-normal">pace</span>
              </>
            )}
          </div>
        </div>

        {/* Avg. Order */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F7185]">
              Avg. Order
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ChartIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {liveOrders === 0 ? "—" : paise(avgOrderValue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
            {liveOrders === 0 ? (
              <span className="text-slate-400 font-normal">Calculated after first ticket</span>
            ) : (
              <>
                <span>{deltas.avg >= 0 ? "↑" : "↓"} {Math.abs(deltas.avg).toFixed(1)}%</span>
                <span className="text-slate-400 font-normal">per guest ticket</span>
              </>
            )}
          </div>
        </div>

        {/* Active Tables */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F7185]">
              Active Tables
            </span>
            <span className="w-8 h-8 rounded-xl bg-brand-lavender text-brand flex items-center justify-center">
              <ChairIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#17142B] font-mono tracking-tight">
            {occupiedTables.length} / {tableList.length}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-slate-500">
            <span className="text-emerald-700 font-extrabold">{availableCount} available</span>
            <span>· dine-in floor</span>
          </div>
        </div>
      </div>

      {/* 3. LIVE OPERATIONS & KITCHEN STATUS (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tables Live Strip */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#17142B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Table Operations</span>
              </h3>
              <p className="text-[11px] text-[#6F7185]">Active dining sessions across floor</p>
            </div>
            <button
              type="button"
              onClick={() => setTab("tables")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Floor Plan</span>
              <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {occupiedTables.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All tables are currently open. Orders placed by guests will appear here live.
              </div>
            ) : (
              occupiedTables.map(({ table, detailed }) => {
                const isNeedsBill = detailed.state === "needs_bill";
                const isCooking = detailed.state === "cooking";
                const isSeated = detailed.state === "seated";

                return (
                  <div
                    key={table.id}
                    onClick={() => setTab("tables")}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#5738F5]/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isNeedsBill
                            ? "bg-amber-500 animate-pulse"
                            : isCooking
                            ? "bg-orange-500 animate-pulse"
                            : isSeated
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <div>
                        <span className="font-mono font-black text-xs text-[#17142B] mr-2">
                          TABLE {table.label.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {detailed.elapsedMinutes > 0 ? `${detailed.elapsedMinutes}m elapsed` : "Just seated"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {detailed.totalPaise > 0 && (
                        <span className="font-mono font-black text-xs text-[#17142B]">
                          {paise(detailed.totalPaise)}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isNeedsBill
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : isCooking
                            ? "bg-orange-100 text-orange-900 border border-orange-200"
                            : isSeated
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isNeedsBill ? "Billing" : isCooking ? "Preparing" : isSeated ? "Ordering" : "Occupied"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kitchen Status 3-Column Counter */}
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#17142B] flex items-center gap-2">
                <ChefHatIcon className="w-4 h-4 text-[#5738F5]" />
                <span>Kitchen Line Status</span>
              </h3>
              <p className="text-[11px] text-[#6F7185]">Live order preparation backlog</p>
            </div>
            <Link
              href="/pos?view=kitchen"
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Open KDS</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-[#EEEAFE]/50 border border-[#5738F5]/20 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5738F5]">NEW</div>
              <div className="text-3xl font-black font-mono text-[#5738F5] mt-1">
                {orderCounts.newCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Awaiting start</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                PREPARING
              </div>
              <div className="text-3xl font-black font-mono text-amber-700 mt-1 flex items-center justify-center gap-1">
                <FlameIcon className="w-4 h-4 text-orange-500 inline" />
                <span>{orderCounts.prepCount}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">On stoves/grills</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                READY
              </div>
              <div className="text-3xl font-black font-mono text-emerald-700 mt-1">
                {orderCounts.readyCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Call bell active</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SALES CHART & INTELLIGENCE WIDGETS */}
      <div className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#17142B]">
              Sales Velocity &amp; Analytics
            </h3>
            <p className="text-[11px] text-[#6F7185]">Revenue pacing across dine-in, QR &amp; takeaway</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSalesPeriod(p.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesPeriod === p.id
                    ? "bg-white text-[#5738F5] shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom 4-Section Grid: Top Selling, Recent Orders, Payment Summary, Reputation */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-2">
          {/* Top Selling Items */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#17142B] border-b border-slate-100 pb-2">
              Top Selling Dishes
            </div>
            <div className="space-y-2">
              {popularItems.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No orders recorded yet.</div>
              ) : (
                popularItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#17142B] truncate">{item.name}</span>
                    </div>
                    <span className="font-mono font-black text-slate-700 shrink-0">
                      {item.count} orders
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#17142B] border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Recent Orders</span>
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="text-[11px] text-[#5738F5] hover:underline cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentOrders.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No recent orders.</div>
              ) : (
                recentOrders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-mono font-bold text-[#17142B]">
                        #{o.id.slice(0, 6)}
                      </span>
                      <span className="text-slate-400 ml-1.5 font-bold">
                        {o.table_label ? `T${o.table_label}` : "Direct"}
                      </span>
                    </div>
                    <span className="font-mono font-black text-slate-800">
                      {paise(o.total_paise || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#17142B] border-b border-slate-100 pb-2">
              Payment Settlement
            </div>
            {paymentSummary.total === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                <span className="text-xs font-bold text-slate-600 block">No payments settled yet today</span>
                <span className="text-[11px] text-slate-400 block">UPI, cash, and card breakdown will appear here once guests settle tickets.</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-600">UPI / QR Payment</span>
                    <span className="font-mono font-black text-[#17142B]">{paymentSummary.upiPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5738F5]" style={{ width: `${paymentSummary.upiPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-600">Cash at Counter</span>
                    <span className="font-mono font-black text-[#17142B]">{paymentSummary.cashPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${paymentSummary.cashPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-600">Card POS</span>
                    <span className="font-mono font-black text-[#17142B]">{paymentSummary.cardPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${paymentSummary.cardPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reputation Funnel (New Widget) */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#17142B] border-b border-slate-100 pb-2 flex justify-between items-center">
              <span>Google Reviews (30d)</span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-slate-600">Total Feedback Received</div>
                <div className="font-mono font-black text-slate-900">{reputation.totalFeedbacks30d}</div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200/50">
                <div className="font-bold text-amber-700 flex items-center gap-1.5">
                  <span className="text-amber-500">★</span> High Ratings (4-5)
                </div>
                <div className="font-mono font-black text-amber-900">{reputation.fiveStarRatings30d}</div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/50">
                <div className="font-bold text-indigo-700">Google Redirects</div>
                <div className="font-mono font-black text-indigo-900">{reputation.googleReviewClicks30d}</div>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div className="font-bold text-slate-500 text-[10px] uppercase">Conversion Rate</div>
                <div className="font-black text-emerald-600 text-sm">{reputation.conversionRate}%</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
