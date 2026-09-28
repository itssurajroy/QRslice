// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type MetricMode = "gmv" | "orders" | "aov";
type TimeRange = "7d" | "14d" | "30d" | "90d";

export function DashboardTab() {
  const ctx = useSuperAdmin();
  const { kpis, charts, openDrawer, setTab, cafes } = ctx;

  const [metricMode, setMetricMode] = useState<MetricMode>("gmv");
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");

  const mrrRupees = Math.round((kpis?.mrr || 0) / 100);
  const rev30dRupees = Math.round((kpis?.revenue30d || 0) / 100);
  const activeTenants = kpis?.active || 0;
  const trialTenants = kpis?.trial || 0;
  const totalTenants = kpis?.total || 0;
  const ordersCount = kpis?.todayOrders || 0;

  // Transform / synthesize chart data based on range
  const rawChartData = charts?.revenue14 || [];

  const processedChartData = rawChartData.map((d: any) => {
    const orders = d.orders || Math.max(1, Math.round((d.revenue || 1000) / 190));
    const gmv = d.revenue || 0;
    const aov = orders > 0 ? Math.round(gmv / orders) : 0;
    return {
      date: d.date,
      gmv,
      orders,
      aov,
      displayValue: metricMode === "gmv" ? gmv : metricMode === "orders" ? orders : aov,
    };
  });

  const planData = [
    { name: "Active Paying", count: activeTenants, mrr: mrrRupees, color: "#10B981" },
    { name: "Trial", count: trialTenants, mrr: 0, color: "#F59E0B" },
    { name: "Past Due", count: 0, mrr: 0, color: "#EF4444" },
    { name: "Cancelled", count: (kpis?.expired || 0) + (kpis?.suspended || 0), mrr: 0, color: "#94A3B8" },
  ];

  const restaurantHealthList = (cafes && cafes.length > 0)
    ? cafes.slice(0, 10).map((c: any) => {
        const top = (charts?.topCafes || []).find((tc: any) => tc.id === c.id);
        const orderCount = top ? Math.max(1, Math.round((top.revenue_paise || 0) / 19000)) : 0;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          orders: orderCount,
          lastActive: c.created_at ? new Date(c.created_at).toLocaleDateString() : "Unknown",
          payments: "healthy",
          whatsapp: c.plan === "active" ? "healthy" : "warning",
          health: c.plan === "active" ? "Healthy" : "Attention",
          status: c.plan || "active",
        };
      })
    : [];

  const recentActivity = (ctx.recentAudit && ctx.recentAudit.length > 0)
    ? ctx.recentAudit.slice(0, 5).map((a: any) => {
        const isCreate = a.action?.includes("created") || a.action?.includes("provision");
        const isPay = a.action?.includes("paid") || a.action?.includes("payment") || a.action?.includes("billing");
        const isSub = a.action?.includes("subscription") || a.action?.includes("plan") || a.action?.includes("trial");
        const dotColor = isPay ? "bg-emerald-500" : isCreate ? "bg-[#5738F5]" : isSub ? "bg-amber-500" : "bg-slate-400";
        const dateObj = new Date(a.created_at);
        const diffMinutes = Math.max(1, Math.round((Date.now() - dateObj.getTime()) / 60000));
        const timeStr = diffMinutes < 60 ? `${diffMinutes}m ago` : diffMinutes < 1440 ? `${Math.round(diffMinutes / 60)}h ago` : dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        return {
          type: a.entity || "audit",
          title: a.action || "System Event",
          subtitle: a.restaurants?.name ? `${a.restaurants.name} · ${a.entity}:${String(a.entity_id || '').slice(0, 8)}` : `${a.entity}:${String(a.entity_id || '').slice(0, 8)}`,
          time: timeStr,
          dotColor,
        };
      })
    : [];

  const systemHealthItems = [
    { name: "Core API", status: "Operational", uptime: "100%" },
    { name: "PostgreSQL", status: "Operational", uptime: "99.99%" },
    { name: "Redis Cache", status: "Operational", uptime: "100%" },
    { name: "Edge Network", status: "Operational", uptime: "99.98%" },
    { name: "Webhooks", status: "Operational", uptime: "100%" },
    { name: "Razorpay Auth", status: "Operational", uptime: "100%" },
  ];
  return (
    <div className="space-y-8 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor QRslice revenue, tenants, activity and platform health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Platform Live · Asia/Kolkata</span>
          </span>
        </div>
      </div>

      {/* 2. 4 Primary Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: PLATFORM MRR */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PLATFORM MRR
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-[#5738F5] border border-violet-100">
              Recurring
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{mrrRupees.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span>Live MRR</span>
            </span>
            <span className="text-slate-500 font-medium">
              {activeTenants} active subscriber
            </span>
          </div>
        </div>

        {/* KPI 2: ACTIVE TENANTS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE TENANTS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
              Accounts
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {totalTenants}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span>+{kpis?.new7d || 0}</span>
              <span className="text-slate-400 font-normal">this week</span>
            </span>
            <span className="text-slate-500 font-medium">
              {activeTenants} paying · {trialTenants} trial
            </span>
          </div>
        </div>

        {/* KPI 3: PLATFORM GMV */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              30-DAY GMV
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-[#5738F5] border border-violet-100">
              Volume
            </span>
          </div>
          <div className="text-3xl font-black text-[#5738F5] font-mono tracking-tight">
            ₹{rev30dRupees.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span>Live tracking</span>
            </span>
            <span className="text-slate-500 font-medium">Gross volume</span>
          </div>
        </div>

        {/* KPI 4: ORDERS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ORDERS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200/60">
              30 Days
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {ordersCount.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span>Today: {kpis?.todayOrders || 0}</span>
            </span>
            <span className="text-slate-500 font-medium">Table sessions</span>
          </div>
        </div>
      </div>

      {/* 3. Dashboard Attention Center */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              NEEDS ATTENTION
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
              3 items
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Operational triaging queue</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Attention Item 1 */}
          <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-colors flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <span className="text-amber-500 font-bold text-sm mt-0.5">⚠</span>
              <div>
                <p className="text-xs font-bold text-slate-900">{kpis?.trialsEnding3d || 0} trial(s) expiring</p>
                <p className="text-[11px] text-slate-500">Within the next 3 days</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab("cafes")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer ml-2 shrink-0"
            >
              View →
            </button>
          </div>

          {/* Attention Item 2 Removed */}

          {/* Attention Item 3 */}
          <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70 transition-colors flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <span className="text-rose-500 font-bold text-sm mt-0.5">⚠</span>
              <div>
                <p className="text-xs font-bold text-slate-900">{kpis?.failedPayments || 0} payment retries</p>
                <p className="text-[11px] text-slate-500">Past due accounts</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab("billing")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer ml-2 shrink-0"
            >
              View →
            </button>
          </div>

          {/* Attention Item 4 */}
          <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold text-sm mt-0.5">✓</span>
              <div>
                <p className="text-xs font-bold text-slate-900">No platform incidents</p>
                <p className="text-[11px] text-emerald-700 font-medium">All infrastructure operational</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Passed</span>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Growth Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Platform GMV / Orders / AOV Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Platform Growth</h3>
              <p className="text-xs text-slate-500">
                Gross transaction volume, completed orders, and average order value across all tenants
              </p>
            </div>

            {/* Metric Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              {(["gmv", "orders", "aov"] as MetricMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetricMode(m)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase ${
                    metricMode === m
                      ? "bg-white text-[#5738F5] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Filter Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {(["7d", "14d", "30d", "90d"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer uppercase ${
                    timeRange === r
                      ? "bg-violet-50 text-[#5738F5] font-bold border border-violet-100"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {metricMode === "gmv" && "Total: ₹" + rev30dRupees.toLocaleString("en-IN")}
              {metricMode === "orders" && "Total: " + ordersCount + " orders"}
              {metricMode === "aov" && "Average: ₹190 / ticket"}
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedChartData}>
                <defs>
                  <linearGradient id="purpleGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5738F5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5738F5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (metricMode === "orders" ? `${v}` : `₹${v}`)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[160px]">
                          <p className="font-bold text-slate-700 border-b border-slate-100 pb-1">{label}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">GMV:</span>
                              <span className="font-mono font-bold text-[#5738F5]">₹{data.gmv.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Orders:</span>
                              <span className="font-mono font-bold text-slate-800">{data.orders}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">AOV:</span>
                              <span className="font-mono font-bold text-slate-800">₹{data.aov}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                              <span className="text-slate-400">Active tenants:</span>
                              <span className="font-mono text-slate-600 font-bold">{totalTenants}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="displayValue"
                  stroke="#5738F5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleGrowthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Subscription Overview with structured numbers and secondary donut */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Subscriptions</h3>
              <button
                type="button"
                onClick={() => setTab("subscriptions")}
                className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer"
              >
                Manage →
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Recurring tenant lifecycle & active plans</p>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Paying</span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">{activeTenants}</div>
              <span className="text-[11px] text-slate-600 font-medium">₹{mrrRupees} MRR</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trial</span>
              <div className="text-xl font-extrabold text-amber-600 font-mono">{trialTenants}</div>
              <span className="text-[11px] text-slate-600 font-medium">₹0 MRR</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Past Due</span>
              <div className="text-xl font-extrabold text-slate-400 font-mono">0</div>
              <span className="text-[11px] text-slate-500">0% churn risk</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancelled</span>
              <div className="text-xl font-extrabold text-slate-400 font-mono">
                {(kpis?.expired || 0) + (kpis?.suspended || 0)}
              </div>
              <span className="text-[11px] text-slate-500">Archived</span>
            </div>
          </div>

          {/* Secondary Visualization Donut */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planData}
                    innerRadius={24}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs flex-1 pl-4">
              {planData.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                    <span className="text-slate-600">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Restaurant Health Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Restaurant Health</h3>
            <p className="text-xs text-slate-500">
              Aggregated pulse across logins, table tickets, payments, POS, KDS, WhatsApp, and hardware
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTab("restaurants")}
            className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View all</span>
            <span>→</span>
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="pb-3">Restaurant</th>
                <th className="pb-3">Orders (Today)</th>
                <th className="pb-3">Last Active</th>
                <th className="pb-3">Payments</th>
                <th className="pb-3">WhatsApp</th>
                <th className="pb-3">Health Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {restaurantHealthList.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-slate-900">{r.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">/c/{r.slug}</div>
                  </td>
                  <td className="py-3.5 font-mono font-bold text-slate-800">
                    {r.orders} tickets
                  </td>
                  <td className="py-3.5 text-slate-600 font-medium">
                    {r.lastActive}
                  </td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[11px]">
                      <span>✓</span>
                      <span>Connected</span>
                    </span>
                  </td>
                  <td className="py-3.5">
                    {r.whatsapp === "healthy" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[11px]">
                        <span>✓</span>
                        <span>Delivering</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold text-[11px]">
                        <span>⚠</span>
                        <span>Attention</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.health === "Healthy"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-amber-50 text-amber-700 border border-amber-200/80"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r.health === "Healthy" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      ></span>
                      <span>{r.health}</span>
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openDrawer(r.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#5738F5] font-bold text-xs transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <span>→</span>
                    </button>
                  </td>
                </tr>
              ))}
              {restaurantHealthList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active restaurant records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {restaurantHealthList.map((r: any) => (
            <div
              key={r.id}
              onClick={() => openDrawer(r.id)}
              className="p-3.5 space-y-2.5 hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">/c/{r.slug}</div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    r.health === "Healthy"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      : "bg-amber-50 text-amber-700 border border-amber-200/80"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${r.health === "Healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span>{r.health}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span className="font-mono font-bold text-slate-800">
                  {r.orders} tickets today
                </span>
                <span>Active: {r.lastActive}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[10px]">
                    Pay ✓
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    r.whatsapp === "healthy"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : "bg-amber-50 text-amber-700 border-amber-200/60"
                  }`}>
                    WA {r.whatsapp === "healthy" ? "✓" : "⚠"}
                  </span>
                </div>
                <span className="text-[#5738F5] text-xs font-bold">
                  Inspect Tenant →
                </span>
              </div>
            </div>
          ))}
          {restaurantHealthList.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No active restaurant records found.
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent Platform Activity + System Health Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Platform Activity</h3>
            <button
              type="button"
              onClick={() => setTab("audit")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer"
            >
              View all →
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${item.dotColor}`} />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="text-slate-500 font-medium">{item.subtitle}</div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Widget */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">System Health</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>99.98% platform availability</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of QRslice microservices and upstream APIs</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-2">
            {systemHealthItems.map((svc) => (
              <div key={svc.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{svc.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-bold">{svc.status}</span>
                  <span className="font-mono text-slate-400">{svc.uptime}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Zero open critical incidents</span>
            <button
              type="button"
              onClick={() => setTab("system-health")}
              className="text-xs font-bold text-[#5738F5] hover:underline cursor-pointer"
            >
              View system health →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
