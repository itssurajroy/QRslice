// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";

type TableAvailability = {
  id: string;
  label: string;
  seats: number;
  available: boolean;
};

export function BookingWidget({ slug }: { slug: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Form State
  const [party, setParty] = useState("2");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // API State
  const [tables, setTables] = useState<TableAvailability[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkAvailability(e: React.FormEvent) {
    e.preventDefault();
    if (!time) return;
    
    setCheckingAvailability(true);
    setError(null);
    setSelectedTable(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const startsAt = new Date(`${today}T${time}`).toISOString();
      
      const res = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          starts_at: startsAt,
          duration_min: 90, // default 90 mins for UI purposes
        }),
      });
      
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to check availability");
        setCheckingAvailability(false);
        return;
      }
      
      setTables(json.tables);
      setStep(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTable) return;
    
    setBusy(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: phone.trim(),
          party_size: Number(party),
          starts_at: new Date(`${today}T${time}`).toISOString(),
          table_ids: [selectedTable],
        }),
      });
      
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Booking failed. The table may have just been reserved.");
        return;
      }
      
      window.open(`/bookings/${json.code}`, "_blank");
      
      // Reset
      setName(""); setPhone(""); setTime("");
      setStep(1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-all";
  const labelStyle = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5";

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col relative">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <span>📅</span> Reserve a Table
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Step {step} of 3: {step === 1 ? "Time & Guests" : step === 2 ? "Pick a Table" : "Your Details"}
        </p>
      </div>
      
      <div className="p-5 space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">⚠️ {error}</div>}

        {/* STEP 1: Time & Party */}
        {step === 1 && (
          <form onSubmit={checkAvailability} className="space-y-4 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Guests</label>
                <input required type="number" min={1} max={60} value={party} onChange={(e) => setParty(e.target.value)} className={input} />
              </div>
              <div>
                <label className={labelStyle}>Time (Today)</label>
                <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
              </div>
            </div>
            
            <button type="submit" disabled={checkingAvailability || !time}
              className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-black text-sm shadow-md shadow-brand/20 transition-all cursor-pointer">
              {checkingAvailability ? "Checking..." : "Find a Table →"}
            </button>
          </form>
        )}

        {/* STEP 2: Visual Table Grid */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
              {tables.map((t) => {
                const isSelected = selectedTable === t.id;
                const partySize = Number(party);
                
                // Optional constraint: warn or disable if table is too small
                const isTooSmall = t.seats < partySize;
                
                if (!t.available) {
                  return (
                    <div key={t.id} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-100 border border-slate-200 opacity-60 cursor-not-allowed">
                      <span className="text-sm font-black text-slate-400">T{t.label}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">🔒 Booked</span>
                    </div>
                  );
                }
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t.id)}
                    type="button"
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand border-brand shadow-md shadow-brand/20 scale-105"
                        : isTooSmall 
                          ? "bg-white border-amber-200 hover:border-amber-400"
                          : "bg-white border-slate-200 hover:border-indigo-400"
                    }`}
                  >
                    <span className={`text-sm font-black ${isSelected ? "text-white" : "text-slate-900"}`}>T{t.label}</span>
                    <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                      isSelected ? "text-indigo-100" : isTooSmall ? "text-amber-600" : "text-slate-500"
                    }`}>
                      {isTooSmall && !isSelected && "⚠️ "} {t.seats} Seats
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer">
                Back
              </button>
              <button 
                type="button" 
                onClick={() => setStep(3)} 
                disabled={!selectedTable}
                className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-black text-sm shadow-md shadow-brand/20 transition-all cursor-pointer"
              >
                Confirm Table →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Guest Details */}
        {step === 3 && (
          <form onSubmit={submitBooking} className="space-y-4 animate-fade-in-up">
            <div>
              <label className={labelStyle}>Name</label>
              <input required value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={input} />
            </div>
            <div>
              <label className={labelStyle}>Phone</label>
              <input required type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={`${input} font-mono`} />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer">
                Back
              </button>
              <button 
                type="submit" 
                disabled={busy || !name.trim() || !phone.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {busy ? "Confirming..." : "Finalize Booking ✓"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
