// Copyright (c) 2026 QRslice. All rights reserved.
import { useState } from "react";
import { paise } from "@/lib/utils";

interface Report {
  revenue: number;
  paid: number;
  orders: number;
  avg: number;
}

interface AnalyticsTabProps {
  report: Report;
}

export function ReportSummary({ report }: AnalyticsTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <h2 className="text-base font-black text-slate-900">Today Sales Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Today Revenue</span>
          <div className="text-2xl font-black text-brand font-mono">{paise(report.revenue)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Paid Orders</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">{report.paid}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Tickets</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{report.orders}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Avg Ticket Size</span>
          <div className="text-2xl font-black text-brand font-mono">{paise(report.avg)}</div>
        </div>
      </div>
    </div>
  );
}

interface FloorIntelligenceProps {
  loadingAnalytics: boolean;
  analytics: any;
  loadAnalytics: () => void;
}

export function ComingSoonAnalyticsRoadmap() {
  const [accessRequested, setAccessRequested] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-100 shadow-xl overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-lavender0/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <span>⚡ PRO FEATURE ROADMAP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>COMING SOON</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🚀 Next-Gen AI Analytics &amp; Sales Forecasting Engine</span>
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            We are training deep learning predictive models tailored specifically for Indian F&amp;B businesses. Get automated inventory order recommendations, customer retention metrics, and daily executive summaries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAccessRequested(true)}
          disabled={accessRequested}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
            accessRequested
              ? "bg-emerald-600 text-white border border-emerald-500 cursor-default"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-400/50 shadow-amber-500/20 active:scale-95"
          }`}
        >
          {accessRequested ? "✓ Priority Access Registered!" : "⚡ Request Priority Beta Access ↗"}
        </button>
      </div>

      {/* Access Confirmation Toast */}
      {accessRequested && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="font-bold text-white">Your Café is on the VIP Priority Beta Waitlist!</p>
              <p className="text-emerald-300/80">Our engineering team will unlock your AI predictive suite and notify your registered phone on WhatsApp.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
            Priority #104
          </span>
        </div>
      )}

      {/* Grid of 4 Preview Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Feature Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-brand/40 transition-all space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-lavender0/10 border border-brand/30 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI Demand &amp; Stock Forecasting</h3>
                <span className="text-[10px] font-mono text-indigo-400">Deep Learning Prep Predictor</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-lavender0/10 text-indigo-300 border border-brand/30">
              🔬 Model Training
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-normal">
            Predicts exact weekend ingredient prep quantities, preventing morning stockouts and reducing raw ingredient spoilage by up to 24%.
          </p>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Sat Forecast: Espresso Beans</span>
              <span className="text-emerald-400 font-bold">14.5 kg (+18%)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-[78%]"></div>
            </div>
          </div>
        </div>

        {/* Feature Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 transition-all space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                👥
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Customer LTV &amp; VIP Diner Tracker</h3>
                <span className="text-[10px] font-mono text-amber-400">Repeat Visitor Intelligence</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
              🧪 Private Beta
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-normal">
            Identifies repeat customer phone numbers, favorite order pairings, and churn risk scores so waiters can deliver personalized service.
          </p>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Repeat Guest Ratio</span>
              <span className="text-amber-400 font-bold">42.8% • Top VIP Combo: Coffee + Pizza</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-indigo-400 h-full w-[43%]"></div>
            </div>
          </div>
        </div>

        {/* Feature Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/40 transition-all space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                💸
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">COGS &amp; Gravy Waste Analyzer</h3>
                <span className="text-[10px] font-mono text-emerald-400">Recipe Profit Margin Leakage</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              🛠 In Active Dev
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-normal">
            Calculates real-time cost-of-goods-sold per dish against raw gravy batch usage to detect portion size variances and ingredient leakage.
          </p>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Avg Dish Profit Margin</span>
              <span className="text-emerald-400 font-bold">74.2% (Optimal: 75%)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[74%]"></div>
            </div>
          </div>
        </div>

        {/* Feature Card 4 */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-sky-500/40 transition-all space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xl">
                📱
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WhatsApp 11 PM Executive Digest</h3>
                <span className="text-[10px] font-mono text-sky-400">Automated EOD Owner PDF</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/30">
              ✅ Beta Testing
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-normal">
            Sends an automated PDF sales breakdown, net profit, top waiter speed, and peak hour summary directly to the owner's WhatsApp at closing.
          </p>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Daily Delivery Time</span>
              <span className="text-sky-400 font-bold">11:00 PM Sharp (WhatsApp PDF)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full w-[100%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloorIntelligence({ loadingAnalytics, analytics, loadAnalytics }: FloorIntelligenceProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900">Floor Intelligence &amp; Dining Trends</h2>
            <p className="text-xs text-slate-500">Peak dining rush hours, dish velocity &amp; revenue channels</p>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 cursor-pointer"
          >
            🔄 Refresh Stats
          </button>
        </div>

        {loadingAnalytics ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            <span className="text-2xl block mb-2">📊</span>
            Compiling floor analytics…
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* 1. Peak Hour Rush Heatmap (8 AM - 11 PM) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  🔥 Peak Hour Dining Rush Heatmap (8:00 AM – 11:00 PM)
                </span>
                <span className="text-xs text-slate-400 font-mono">Floor Occupancy Intensity</span>
              </div>

              {(() => {
                const slots = analytics.hourly_slots || [];
                const maxCount = Math.max(1, ...slots.map((s: any) => s.count || 0));

                return (
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 pt-1">
                    {slots.map((slot: any, idx: number) => {
                      const intensity = Math.min(100, Math.round(((slot.count || 0) / maxCount) * 100));
                      return (
                        <div key={idx} className="text-center group relative cursor-pointer">
                          <div
                            style={{ height: `${Math.max(20, (intensity / 100) * 80)}px` }}
                            className={`w-full rounded-md transition-all ${
                              slot.count === 0
                                ? "bg-slate-200/80"
                                : intensity > 75
                                ? "bg-red-500 shadow-md shadow-red-500/20"
                                : intensity > 45
                                ? "bg-amber-500 shadow-md shadow-amber-500/20"
                                : "bg-emerald-500/70"
                            } group-hover:scale-105`}
                          ></div>
                          <span className="text-xs font-mono text-slate-400 block mt-1">
                            {slot.hour.replace(" ", "")}
                          </span>

                          {/* Tooltip on Hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 whitespace-nowrap shadow-xl z-20 pointer-events-none font-sans">
                            <p className="font-bold text-brand">{slot.hour} • {slot.label}</p>
                            <p className="text-slate-500 font-mono">{slot.count || 0} guest orders</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 2. Leaderboards & Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Top Selling Leaderboard */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  🏆 Top High-Velocity Dishes
                </span>
                <div className="space-y-2">
                  {(() => {
                    const topDishes = analytics.top_items || analytics.topItems || [];
                    if (topDishes.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs text-slate-400 font-mono">
                          No dish sales recorded yet today
                        </div>
                      );
                    }
                    return topDishes.slice(0, 10).map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-200/40 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center font-mono text-xs text-slate-400 font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-slate-900 font-medium">{it.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-brand font-mono font-bold">×{it.quantity || it.count || 1}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Payment Distribution */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                    💳 Settlement Methods
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-600 font-medium">💵 Cash at Counter</span>
                      <span className="font-bold font-mono text-brand">
                        {analytics.cash_count ?? 0} orders (PAID)
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-600 font-medium">📱 UPI / QR Channels</span>
                      <span className="font-bold font-mono text-emerald-600">
                        {analytics.upi_count ?? 0} orders
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-brand-lavender border border-indigo-100 text-xs text-slate-600">
                  💡 <strong>Smart Floor Tip</strong>: Real-time floor occupancy and kitchen order velocity are synchronized live from your Supabase database tables.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Embedded Pro AI Analytics Coming Soon Roadmap */}
      <ComingSoonAnalyticsRoadmap />
    </div>
  );
}

