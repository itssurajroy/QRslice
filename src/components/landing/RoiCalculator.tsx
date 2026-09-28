// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { Calculator, TrendingUp, Clock, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function RoiCalculator() {
  const [tables, setTables] = useState(18);
  const [avgTicket, setAvgTicket] = useState(480);
  const [turnsPerDay, setTurnsPerDay] = useState(3.5);
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;
  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp;

  // Calculations
  const dailyOrders = Math.round(tables * turnsPerDay);
  const dailyRevenue = dailyOrders * avgTicket;
  const monthlyRevenue = dailyRevenue * 30;

  // Faster table turnover gives ~15-20% extra capacity during peak hours
  const monthlyTurnoverGain = Math.round(monthlyRevenue * 0.14);
  // Estimated 18 minutes saved per table turn
  const totalHoursSavedMonthly = Math.round((dailyOrders * 30 * 16) / 60);
  // Estimated food aggregator commission (20%) if orders were processed through delivery/aggregator apps
  const aggregatorCostSaved = Math.round(monthlyRevenue * 0.08); // conservative direct dine-in capture
  // QRslice investment
  const qrsliceCost = 999;
  const netMonthlyBenefit = monthlyTurnoverGain + aggregatorCostSaved - qrsliceCost;
  const roiMultiplier = Math.max(12, Math.round(netMonthlyBenefit / qrsliceCost));

  return (
    <section id="roi-calculator" className="py-20 sm:py-28 bg-gradient-to-b from-white via-violet-50/20 to-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100/70 border border-violet-200 rounded-full mb-4 shadow-sm"
            variants={variants}
          >
            <Calculator className="w-4 h-4 text-[#5738F5]" />
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Profit & ROI Calculator
            </span>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-5"
            variants={variants}
          >
            See how much your café unlocks with{" "}
            <span className="bg-gradient-to-r from-[#5738F5] to-[#8B5CF6] bg-clip-text text-transparent">
              faster table turns
            </span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
            variants={variants}
          >
            Traditional table service wastes 15–20 minutes per table on handing menus, shouting orders, and printing paper bills. Slide to model your outlet:
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* Controls Column */}
          <motion.div
            className="lg:col-span-6 bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-7"
            initial={noMotion ? {} : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5 }}
          >
            {/* Slider 1: Tables */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="roi-tables" className="text-sm font-bold text-slate-800">
                  Number of Tables / Spots
                </label>
                <span className="text-base font-extrabold text-[#5738F5] bg-violet-50 px-3 py-1 rounded-xl border border-violet-200/60">
                  {tables} tables
                </span>
              </div>
              <input
                id="roi-tables"
                type="range"
                min={4}
                max={60}
                step={1}
                value={tables}
                onChange={(e) => setTables(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5738F5]"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                <span>4 tables (Micro café)</span>
                <span>60 tables (Large bistro)</span>
              </div>
            </div>

            {/* Slider 2: Average Ticket Size */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="roi-avg-ticket" className="text-sm font-bold text-slate-800">
                  Average Order / Bill Value
                </label>
                <span className="text-base font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/60">
                  ₹{avgTicket}
                </span>
              </div>
              <input
                id="roi-avg-ticket"
                type="range"
                min={150}
                max={1800}
                step={25}
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                <span>₹150 (Chai & Snacks)</span>
                <span>₹1,800 (Full Dining)</span>
              </div>
            </div>

            {/* Slider 3: Daily Table Turnover */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="roi-turns" className="text-sm font-bold text-slate-800">
                  Average Table Turns Per Day
                </label>
                <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
                  {turnsPerDay.toFixed(1)}× turns
                </span>
              </div>
              <input
                id="roi-turns"
                type="range"
                min={1.5}
                max={8}
                step={0.5}
                value={turnsPerDay}
                onChange={(e) => setTurnsPerDay(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                <span>1.5× (Slow casual)</span>
                <span>8.0× (Rush QSR)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero transaction commission
              </span>
              <span>Flat ₹999/mo per outlet</span>
            </div>
          </motion.div>

          {/* Result Card Column */}
          <motion.div
            className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-[#1E1548] to-[#120D2C] text-white rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden border border-violet-800/40"
            initial={noMotion ? {} : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5738F5]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Estimated Impact
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-bold text-emerald-300">
                  {roiMultiplier}× Monthly ROI
                </div>
              </div>

              {/* Big Metric Display */}
              <div>
                <div className="text-sm font-medium text-slate-300 mb-1">
                  Est. Additional Revenue & Savings:
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span>+₹{netMonthlyBenefit.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-slate-400 font-normal">/ month</span>
                </div>
              </div>

              {/* Key breakdown pills */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs text-violet-200 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Turnover Boost
                  </div>
                  <div className="text-lg font-extrabold text-white">
                    +₹{monthlyTurnoverGain.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    From 16m faster table turnover
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs text-amber-200 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Waiter Time Saved
                  </div>
                  <div className="text-lg font-extrabold text-white">
                    {totalHoursSavedMonthly} hrs / mo
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Staff focuses on guest hospitality
                  </div>
                </div>
              </div>

              {/* Comparison banner */}
              <div className="bg-violet-950/60 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-slate-300">
                <div>
                  <span className="font-bold text-white">QRslice Cost: </span>
                  <span>Just ₹999/month flat</span>
                </div>
                <span className="font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  No 20% Cuts
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/onboarding"
                className="w-full py-4 bg-gradient-to-r from-[#5738F5] via-[#6D28D9] to-[#7C3AED] hover:brightness-110 text-white font-bold rounded-2xl text-center flex items-center justify-center gap-2 shadow-lg shadow-violet-950/80 transition-all cursor-pointer"
              >
                <span>Unlock This Growth — Start 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
