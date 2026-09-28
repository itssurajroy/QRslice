// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";

export function SupportTab({
  restaurant,
  flash,
}: {
  restaurant: { id?: string; name?: string };
  flash: (kind: "ok" | "err", msg: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketId, setTicketId] = useState("");

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return flash("err", "Please fill in all ticket details");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket");
      
      setIsSubmitting(false);
      setTicketSent(true);
      setTicketId(data.ticketId || `TICK-${Date.now().toString().slice(-6)}`);
      flash("ok", `💎 Priority Support Ticket ${data.ticketId || "submitted"}! SLA Response < 15 mins.`);
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setIsSubmitting(false);
      flash("err", err.message || "Failed to submit ticket");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* SLA Badge & Priority Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950">
              💎 Priority VIP Support
            </span>
            <span className="text-xs text-indigo-300 font-mono">15-Min Guaranteed SLA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">24/7 Dedicated Support Concierge</h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Direct access to senior engineering & onboarding specialists for {restaurant?.name || "your café"}.
          </p>
        </div>

        <a
          href="https://wa.me/918595101297?text=Emergency%20QRslice%20Support%20Needed"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 min-h-[44px]"
        >
          <span>💬 WhatsApp Emergency Desk</span>
        </a>
      </div>

      {/* Ticket Submission Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Submit Priority Ticket</h3>

        {ticketSent && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex justify-between items-center">
            <span>✓ Ticket {ticketId} open! Our engineers are reviewing your inquiry.</span>
            <button
              type="button"
              onClick={() => { setTicketSent(false); setTicketId(""); }}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              New Ticket ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                Support Category
              </label>
              <select
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold bg-white text-slate-900"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="technical">Technical / POS Issue</option>
                <option value="billing">Billing & Razorpay Plan</option>

                <option value="hardware">Thermal Printer & KOT</option>
                <option value="feature">Custom Feature Request</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                Subject Line
              </label>
              <input
                required
                placeholder="Brief summary of issue"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
              Detailed Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the issue, step to reproduce, or assistance needed..."
              className="w-full border border-slate-300 rounded-xl p-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? "Dispatching Ticket..." : "Submit Ticket to Priority Queue →"}
          </button>
        </form>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Direct Email Support</span>
            <span className="text-sm font-mono font-bold text-brand block">support@qrslice.com</span>
            <span className="text-[11px] text-slate-400 block">Response time: {"<"} 1 hour</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Phone Hotline (India)</span>
            <span className="text-sm font-mono font-bold text-slate-800 block">+91 98765 43210</span>
            <span className="text-[11px] text-slate-400 block">Mon - Sun (9:00 AM - 11:00 PM IST)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
