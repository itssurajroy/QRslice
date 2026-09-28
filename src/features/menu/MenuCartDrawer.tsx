// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ShoppingBagIcon } from "@/components/Icons";
import { paise } from "@/lib/utils";
import type { CartLine } from "@/types";

interface MenuCartDrawerProps {
  cartOpen: boolean;
  onClose: () => void;
  cartLines: CartLine[];
  tableLabel: string;
  restaurantName: string;
  totalQty: number;
  totalPaise: number;
  loyaltyPoints: number;
  paymentMethod: "counter" | "online";
  setPaymentMethod: (m: "counter" | "online") => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  t: Record<string, string>;
  upiQrUrl?: string;
  upiId?: string;
  bookingCode?: string;
  setBookingCode?: (v: string) => void;
}

export function MenuCartDrawer({
  cartOpen,
  onClose,
  cartLines,
  tableLabel,
  restaurantName,
  totalQty,
  totalPaise,
  loyaltyPoints,
  paymentMethod,
  setPaymentMethod,
  name,
  setName,
  phone,
  setPhone,
  error,
  submitting,
  onSubmit,
  onIncrease,
  onDecrease,
  onUpdateNote,
  t,
  upiQrUrl,
  upiId,
  bookingCode,
  setBookingCode,
}: MenuCartDrawerProps) {
  if (!cartOpen) return null;

  const [dynamicUpiQr, setDynamicUpiQr] = useState<string | null>(null);

  useEffect(() => {
    if (paymentMethod === "online" && !upiQrUrl && upiId && totalPaise > 0) {
      const amount = (totalPaise / 100).toFixed(2);
      const pn = encodeURIComponent(restaurantName);
      const uri = `upi://pay?pa=${upiId}&pn=${pn}&am=${amount}&cu=INR`;
      QRCode.toDataURL(uri, { width: 220, margin: 1 }).then(setDynamicUpiQr).catch(() => {});
    } else {
      setDynamicUpiQr(null);
    }
  }, [paymentMethod, upiQrUrl, upiId, totalPaise, restaurantName]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-[2rem] sm:rounded-[2rem] max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 text-[#5738F5] flex items-center justify-center font-bold">
              <ShoppingBagIcon className="w-5 h-5 text-[#5738F5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {t.orderSummary}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Table {tableLabel} • {restaurantName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 text-xs font-black cursor-pointer touch-manipulation transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Cart Item Lines */}
          <div className="space-y-2.5">
            {cartLines.map((l) => (
              <div
                key={l.item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-slate-900 text-sm block truncate">
                      {l.item.name}
                    </span>
                    <span className="text-xs text-[#5738F5] font-black font-mono">
                      {paise((l.item.price_paise + (l.selectedModifiers || []).reduce((a, m) => a + m.price_delta_paise, 0)) * l.quantity)}
                    </span>
                    {l.selectedModifiers && l.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1 font-medium leading-tight">
                        {l.selectedModifiers.map(m => (
                          <span key={m.id} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {m.name} {m.price_delta_paise > 0 && `(+${paise(m.price_delta_paise)})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 bg-violet-50 p-1 rounded-xl border border-violet-200/80">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center cursor-pointer shadow-xs active:scale-90 transition-all"
                      onClick={() => onDecrease(l.item.id)}
                    >
                      −
                    </button>
                    <span className="font-black text-xs text-[#5738F5] min-w-5 text-center font-mono">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center cursor-pointer shadow-xs active:scale-90 transition-all"
                      onClick={() => onIncrease(l.item.id)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <input
                  placeholder={t.customNotes}
                  value={l.notes || ""}
                  maxLength={200}
                  onChange={(e) => onUpdateNote(l.item.id, e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl w-full px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Loyalty Points Preview */}
          {loyaltyPoints > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                <span>🏆</span>
                <span>Loyalty Points Earned</span>
              </span>
              <span className="text-xs font-black text-amber-700 font-mono">
                +{loyaltyPoints} pts
              </span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Select Payment Mode</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod("counter")}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  paymentMethod === "counter"
                    ? "bg-violet-50/80 border-[#5738F5] text-slate-900 shadow-sm ring-1 ring-[#5738F5]"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">💵</span>
                  <span className="text-xs font-black text-slate-900">
                    Pay at Counter
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Settle cash/card after meal
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  paymentMethod === "online"
                    ? "bg-violet-50/80 border-[#5738F5] text-slate-900 shadow-sm ring-1 ring-[#5738F5]"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">📱</span>
                  <span className="text-xs font-black text-[#5738F5]">
                    Scan UPI QR
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  GPay, PhonePe, Paytm QR
                </span>
              </button>
            </div>
          </div>

          {/* Render UPI QR if selected and available */}
          {paymentMethod === "online" && (upiQrUrl || dynamicUpiQr) && (
            <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in-up">
              <span className="text-xs font-black text-slate-900 mb-2 uppercase tracking-widest text-center">
                Scan Store QR to Pay
              </span>
              <img src={(upiQrUrl || dynamicUpiQr) as string} alt="Store UPI QR" className="w-32 h-32 rounded-xl bg-white p-2 border border-slate-200 shadow-sm" />
              <span className="text-xs font-bold text-[#5738F5] mt-2 text-center font-mono">
                Pay exact amount ₹{(totalPaise / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Guest Details */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5738F5] flex items-center gap-1.5">
                <span>📝 Your Details</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Your Name (Optional)
                </label>
                <input
                  placeholder="e.g. Suraj Roy"
                  value={name}
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  maxLength={15}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] font-mono"
                />
              </div>
            </div>
            {setBookingCode && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Booking Code (if reserved)
                </label>
                <input
                  placeholder="e.g. A1B2C3"
                  value={bookingCode ?? ""}
                  maxLength={6}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5738F5] font-mono uppercase"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${paymentMethod === "counter" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
            <span>{paymentMethod === "counter" ? "⚠️" : "✓"}</span>
            <span>{paymentMethod === "counter" ? "Pay at counter after meal. Kitchen ticket will print now." : "Prepaid — Complete UPI payment to confirm."}</span>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              {t.totalBill}
            </span>
            <span className="text-2xl font-black text-[#5738F5] font-mono">
              {paise(totalPaise)}
            </span>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer touch-manipulation min-h-[44px]"
            >
              {t.keepBrowsing}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || totalQty === 0}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs sm:text-sm transition-all disabled:opacity-50 shadow-lg shadow-violet-500/25 cursor-pointer touch-manipulation active:scale-95 min-h-[44px]"
            >
              {submitting ? t.submitting : t.placeOrder}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
