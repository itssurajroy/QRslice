// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type FunnelStage = {
  name: string;
  count: number;
  pctOfTotal: number;
  pctOfPrevious: number;
  description: string;
};

function FunnelStageCard({ stage, idx, isFirst }: { stage: FunnelStage; idx: number; isFirst: boolean }) {
  return (
    <div key={stage.name} className="relative">
      {!isFirst && (
        <div className="flex items-center justify-center my-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full">
            <span>↓</span>
            <span>{stage.pctOfPrevious}% passed to next stage</span>
            <span className="text-rose-500 font-normal">
              (-{Math.round((100 - stage.pctOfPrevious) * 10) * 0.1}% drop-off)
            </span>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-violet-50 text-[#5738F5] font-black text-xs flex items-center justify-center border border-violet-100 font-mono">
              {idx + 1}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{stage.name}</h3>
              <p className="text-[11px] text-slate-500">{stage.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-center">
            <div className="text-right">
              <span className="text-base font-black text-slate-900 font-mono">
                {stage.count.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">sessions</span>
            </div>

            <div className="text-right min-w-[70px]">
              <span className="text-sm font-bold text-[#5738F5] font-mono">
                {stage.pctOfTotal}%
              </span>
              <span className="text-[10px] text-slate-400 block">of scans</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
          <div
            className="bg-[#5738F5] h-full rounded-full transition-all duration-500"
            style={{ width: stage.pctOfTotal + "%" }}
          />
        </div>
      </div>
    </div>
  );
}

export function FunnelTab() {
  const { cafes } = useSuperAdmin();
  const [dateRange, setDateRange] = useState("30d");
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [funnelStages, setFunnelStages] = useState<Array<{
    name: string;
    count: number;
    pctOfTotal: number;
    pctOfPrevious: number;
    description: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [overallConversion, setOverallConversion] = useState(0);

  const loadFunnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRestaurant && selectedRestaurant !== "all") params.set("restaurant", selectedRestaurant);
      if (dateRange) params.set("range", dateRange);
      if (deviceFilter && deviceFilter !== "all") params.set("device", deviceFilter);

      const res = await fetch("/api/super/funnel?" + params.toString());
      const data = await res.json();
      if (data.ok && Array.isArray(data.stages)) {
        setFunnelStages(data.stages);
        setOverallConversion(data.overallConversion || 0);
      }
    } catch {
      setFunnelStages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant, dateRange, deviceFilter]);

  useEffect(() => {
    loadFunnel();
  }, [loadFunnel]);

  const renderStages = () => {
    if (loading) {
      return (
        <div className="p-12 text-center text-slate-400 text-xs font-mono">
          Loading funnel data...
        </div>
      );
    }
    if (funnelStages.length === 0) {
      return (
        <div className="p-12 text-center text-slate-400 text-xs">
          No funnel data available for selected filters.
        </div>
      );
    }
    return funnelStages.map((stage, idx) => (
      <FunnelStageCard key={stage.name} stage={stage} idx={idx} isFirst={idx === 0} />
    ));
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Conversion Funnel</h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end dining conversion drop-off analysis from physical QR scan to kitchen bill settlement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Overall Conversion: <strong className="text-emerald-600 font-mono font-bold">{overallConversion}%</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Restaurant:</span>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
          >
            <option value="all">All Restaurants (Platform Total)</option>
            {cafes?.map((c: any) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Device:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
            >
              <option value="all">All Devices</option>
              <option value="ios">iOS Safari (64%)</option>
              <option value="android">Android Chrome (34%)</option>
              <option value="other">Desktop / Other (2%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase ${
                  dateRange === r
                    ? "bg-white text-[#5738F5] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {renderStages()}
      </div>
    </div>
  );
}
