// Copyright (c) 2026 QRslice. All rights reserved.
import { useState } from "react";
import { paise } from "@/lib/utils";
import type { CartLine } from "@/types";
import { CreditCardIcon } from "@/components/Icons";

interface PosCartDrawerProps {
  mobileCartOpen: boolean;
  setMobileCartOpen: (v: boolean) => void;
  cart: CartLine[];
  orderType: "dine_in" | "takeaway" | "delivery";
  setOrderType: (v: "dine_in" | "takeaway" | "delivery") => void;
  selectedTable: { id: string; label: string } | null;
  setSelectedTable: (t: any) => void;
  clearCart: () => void;
  updateQty: (id: string, delta: number) => void;
  setItemNotes: (id: string, note: string) => void;

  handleParkTab: () => void;
  parkedTabs: Array<{ id: string; time: string; customer: string; cart: CartLine[] }>;
  handleRecallTab: (tab: { id: string; time: string; customer: string; cart: CartLine[] }) => void;

  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  flatDiscountRupees: string;
  setFlatDiscountRupees: (v: string) => void;

  subtotalPaise: number;
  discountPaise: number;
  finalTotalPaise: number;

  paymentMethod: "cash" | "upi" | "card" | "mixed";
  setPaymentMethod: (m: "cash" | "upi" | "card" | "mixed") => void;
  isSplitTender: boolean;
  setIsSplitTender: (v: boolean) => void;
  splitCashAmount: string;
  setSplitCashAmount: (v: string) => void;
  splitUpiAmount: string;
  setSplitUpiAmount: (v: string) => void;

  amountReceived: string;
  setAmountReceived: (v: string) => void;

  handleSettle: (status: "paid" | "unpaid") => void;
  isSettling: boolean;
  /** PAY gate — only owner/manager/super_admin. Hides PAY for other roles. */
  canSettlePay?: boolean;

  customerPhone?: string;
  setCustomerPhone?: (v: string) => void;
  customerGstin?: string;
  setCustomerGstin?: (v: string) => void;
  rushPriority?: boolean;
  setRushPriority?: (v: boolean) => void;
  customerPoints?: number | null;
  redeemPoints?: number;
  setRedeemPoints?: (v: number) => void;
  handleCheckPoints?: () => void;
  isCheckingPoints?: boolean;

  liveOrders?: any[];
  handleUpdateOrderStatus?: (id: string, status: string, orderNumber: string, tableLabel: string) => void;
  onOpenWaModal?: (ord: any) => void;
}

const QUICK_TAGS = ["🌶️ Spicy", "🧀 Extra Cheese", "🚫 No Sugar", "🥣 On Side", "🧊 Extra Ice"];

export function PosCartDrawer({
  mobileCartOpen,
  setMobileCartOpen,
  cart,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  clearCart,
  updateQty,
  setItemNotes,
  handleParkTab,
  parkedTabs: _parkedTabs,
  handleRecallTab: _handleRecallTab,
  discountPercent,
  setDiscountPercent,
  flatDiscountRupees,
  setFlatDiscountRupees,
  subtotalPaise,
  discountPaise,
  finalTotalPaise,
  paymentMethod,
  setPaymentMethod,
  isSplitTender,
  setIsSplitTender,
  splitCashAmount,
  setSplitCashAmount,
  splitUpiAmount,
  setSplitUpiAmount,
  amountReceived,
  setAmountReceived,
  handleSettle,
  isSettling,
  canSettlePay = false,
  customerPhone,
  setCustomerPhone,
  customerGstin = "",
  setCustomerGstin,
  rushPriority = false,
  setRushPriority,
  customerPoints,
  redeemPoints = 0,
  setRedeemPoints,
  handleCheckPoints,
  isCheckingPoints,
  liveOrders,
  handleUpdateOrderStatus,
  onOpenWaModal,
}: PosCartDrawerProps) {
  const [splitGuests, setSplitGuests] = useState<number>(1);
  const isRushKOT = rushPriority;

  const pointsDiscount = (redeemPoints || 0) * 100;

  // Filter active KDS orders for current table
  const activeTableOrders = selectedTable && liveOrders
    ? liveOrders.filter(
        (o) => o.table_label === selectedTable.label && o.status !== "served" && o.status !== "cancelled"
      )
    : [];

  return (
    <aside
      className={`${
        mobileCartOpen ? "fixed inset-0 z-50 flex flex-col bg-white p-3.5 sm:p-4 pb-safe animate-slide-in-bottom" : "hidden"
      } md:flex md:static w-full md:w-80 lg:w-96 bg-white border-l border-black/[0.06] flex-col shrink-0 shadow-xs overflow-y-auto`}
    >
      <div className="p-3.5 border-b border-black/[0.06] flex items-center justify-between bg-[#F5F5F7]/80 backdrop-blur-md shrink-0">
        <div>
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>Register Ticket</span>
            {orderType === "dine_in" && selectedTable && (
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#007AFF]/10 text-[#007AFF] font-bold border border-[#007AFF]/20">
                {selectedTable.label}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{cart.length} item lines</p>
        </div>
        <div className="flex gap-2 items-center">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-[#FF3B30] hover:text-[#FF3B30]/80 font-bold cursor-pointer transition-colors p-1"
            >
              Clear
            </button>
          )}
          {mobileCartOpen && (
            <button
              type="button"
              onClick={() => setMobileCartOpen(false)}
              className="md:hidden px-3 py-1.5 bg-black/[0.05] text-slate-800 rounded-xl text-xs font-semibold min-h-[44px]"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* ORDER TYPE SELECTOR */}
      <div className="px-3 pt-3 shrink-0">
        <div className="flex bg-black/[0.04] p-1 rounded-2xl text-xs font-semibold text-slate-600">
          {(
            [
              { id: "dine_in", label: "Dine-in" },
              { id: "takeaway", label: "Takeaway" },
              { id: "delivery", label: "Delivery" },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setOrderType(o.id);
                if (o.id !== "dine_in") setSelectedTable(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                orderType === o.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE KDS KITCHEN STREAM MONITOR FOR SELECTED TABLE */}
      {selectedTable && activeTableOrders.length > 0 && (
        <div className="p-3 bg-amber-50/90 border-b border-amber-200 space-y-2 text-xs shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <span>👨‍🍳 Kitchen Live Sync Stream</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold text-[10px]">
                {selectedTable.label} ({activeTableOrders.length})
              </span>
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {activeTableOrders.map((ord) => {
              const isReady = ord.status === "ready";
              return (
                <div
                  key={ord.id}
                  className="p-2 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <span>Order #{ord.order_number}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isReady
                            ? "bg-emerald-500 text-white animate-pulse"
                            : ord.status === "preparing"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isReady ? "🛎️ READY TO SERVE" : ord.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {ord.items?.length || 0} items in kitchen
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {onOpenWaModal && (
                      <button
                        type="button"
                        onClick={() => onOpenWaModal(ord)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[#34C759] font-black text-xs cursor-pointer shadow-sm active:scale-95 whitespace-nowrap shrink-0 border border-[#34C759]/20"
                        title="WhatsApp Bill"
                      >
                        💬
                      </button>
                    )}
                    {isReady && handleUpdateOrderStatus && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateOrderStatus(
                            ord.id,
                            "served",
                            String(ord.order_number),
                            String(ord.table_label || "")
                          )
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                      >
                        ✓ Serve Table
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
        {cart.map((ci) => (
          <div
            key={ci.item.id}
            className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 text-xs shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-slate-900 truncate">{ci.item.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {paise(ci.item.price_paise)} × {ci.quantity} ={" "}
                  <span className="text-brand font-bold">
                    {paise(ci.item.price_paise * ci.quantity)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQty(ci.item.id, -1)}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 text-base border border-slate-200"
                >
                  -
                </button>
                <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                  {ci.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(ci.item.id, 1)}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-brand hover:bg-brand-dark text-white font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 text-base shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Kitchen Modifier Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const current = ci.notes || "";
                    const next = current.includes(tag)
                      ? current.replace(tag, "").trim()
                      : `${current} ${tag}`.trim();
                    setItemNotes(ci.item.id, next);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all active:scale-95 ${
                    ci.notes?.includes(tag)
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                      : "bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        {cart.length === 0 && (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <CreditCardIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-slate-500 font-medium">Cart is empty. Tap any dish to start billing.</p>
          </div>
        )}
      </div>

      {/* Bill Settle Area */}
      <div className="p-3.5 bg-white border-t border-slate-200 space-y-3 shrink-0">
        {/* Corporate GSTIN Input Field */}
        <div className="text-xs">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">💼 B2B GSTIN (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 27AAAAA0000A1Z5"
            value={customerGstin}
            onChange={(e) => setCustomerGstin?.(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-brand font-bold"
          />
        </div>

        {/* Rush KOT Toggle & Park Tab Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRushPriority?.(!isRushKOT)}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 active:scale-95 ${
              isRushKOT
                ? "bg-red-600 text-white border-red-500 shadow-md animate-pulse"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
            }`}
          >
            <span>🔥 Rush KOT</span>
          </button>

          <button
            type="button"
            onClick={handleParkTab}
            disabled={cart.length === 0}
            className="flex-1 py-2 px-3 min-h-[40px] rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>Park Tab (F8)</span>
          </button>
        </div>

        {/* Customer & Loyalty Section */}
        <div className="mb-4">
          <div className="flex gap-2 items-center">
            <input
              type="tel"
              placeholder="Customer Phone (e.g. 9876543210)"
              value={customerPhone || ""}
              onChange={(e) => setCustomerPhone?.(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleCheckPoints}
              disabled={isCheckingPoints || (customerPhone?.length || 0) < 10}
              className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
            >
              Check Points
            </button>
          </div>
          
          {customerPoints !== null && customerPoints !== undefined && (
            <div className="mt-2 p-2.5 bg-brand-lavender border border-indigo-100 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-indigo-900">Available Points: {customerPoints}</span>
                {customerPoints > 0 && (
                  <span className="text-brand font-semibold">1 pt = ₹1</span>
                )}
              </div>
              
              {customerPoints > 0 && (
                <div className="mt-2">
                  <label htmlFor="redeem-points" className="sr-only">Points to redeem</label>
                  <input
                    id="redeem-points"
                    type="range"
                    min="0"
                    max={Math.min(customerPoints, Math.floor(subtotalPaise * 0.25 / 100))}
                    value={redeemPoints || 0}
                    onChange={(e) => setRedeemPoints?.(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-brand-dark mt-1 font-medium">
                    <span>Redeeming: {redeemPoints || 0} pts</span>
                    <span>Max: {Math.min(customerPoints, Math.floor(subtotalPaise * 0.25 / 100))} pts (25% cap)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Apply Discount:</span>
            {discountPaise > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDiscountPercent(0);
                  setFlatDiscountRupees("");
                }}
                className="text-red-600 hover:underline normal-case cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setFlatDiscountRupees("");
                  setDiscountPercent(pct);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all active:scale-95 min-h-[36px] ${
                  discountPercent === pct && !flatDiscountRupees
                    ? "bg-[#007AFF] text-white font-bold shadow-xs"
                    : "bg-black/[0.03] border border-black/[0.04] text-slate-600 hover:bg-black/[0.06]"
                }`}
              >
                {pct}%
              </button>
            ))}
            <div className="flex items-center gap-1 bg-black/[0.03] px-2.5 py-1 rounded-xl border border-black/[0.04] min-h-[36px]">
              <span className="text-xs text-slate-400 font-mono">₹</span>
              <input
                type="number"
                placeholder="Flat"
                value={flatDiscountRupees}
                onChange={(e) => {
                  setDiscountPercent(0);
                  setFlatDiscountRupees(e.target.value);
                }}
                className="w-14 bg-transparent text-xs font-mono text-slate-900 focus:outline-none text-right font-bold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs pt-2.5 border-t border-black/[0.06]">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-slate-700">{paise(subtotalPaise)}</span>
          </div>
          {discountPaise > 0 && (
            <div className="flex justify-between text-[#34C759] font-semibold">
              <span className="text-slate-500 font-medium">
                Discount {flatDiscountRupees ? `(Flat ₹${flatDiscountRupees})` : `(${discountPercent}%)`}:
              </span>
              <span className="font-mono text-emerald-600 font-medium">-{paise(discountPaise)}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-slate-500 font-medium">Points Redeemed:</span>
              <span className="font-mono text-emerald-600 font-medium">-{paise(pointsDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base font-bold text-slate-900 pt-1">
            <span>Total Payable:</span>
            <span className="text-[#007AFF] font-mono font-bold">{paise(finalTotalPaise)}</span>
          </div>
        </div>

        {/* Split Bill per Guest Calculator */}
        <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>👥 Split per Guest:</span>
            {splitGuests > 1 && (
              <span className="font-mono text-[#007AFF] font-bold text-sm">
                {paise(Math.round(finalTotalPaise / splitGuests))} / guest
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSplitGuests(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                  splitGuests === num
                    ? "bg-[#007AFF] text-white border-[#007AFF] shadow-xs font-bold"
                    : "bg-white text-slate-700 border-black/[0.06] hover:bg-slate-50"
                }`}
              >
                {num === 1 ? "1 Guest" : `${num} Guests`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: "cash", label: "Cash" },
                { id: "upi", label: "UPI" },
                { id: "card", label: "Card" },
                { id: "mixed", label: "Split" },
              ] as const
            ).map((pm) => {
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(pm.id);
                    setIsSplitTender(pm.id === "mixed");
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all active:scale-95 min-h-[44px] ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                      : "bg-[#F5F5F7] border-black/[0.04] text-slate-700 hover:bg-black/[0.06]"
                  }`}
                >
                  {pm.label}
                </button>
              );
            })}
          </div>

          {/* Mixed Tender Split Breakdown */}
          {isSplitTender && (
            <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2 animate-in fade-in">
              <div className="text-xs font-semibold text-[#007AFF] uppercase tracking-wider">Mixed Tender Split:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Cash Tender (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300"
                    value={splitCashAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplitCashAmount(val);
                      const rem = Math.max(0, finalTotalPaise / 100 - (parseFloat(val) || 0));
                      setSplitUpiAmount(rem > 0 ? rem.toFixed(2) : "0");
                    }}
                    className="w-full bg-white border border-black/[0.08] rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007AFF] font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">UPI Tender (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={splitUpiAmount}
                    onChange={(e) => setSplitUpiAmount(e.target.value)}
                    className="w-full bg-white border border-black/[0.08] rounded-xl p-2 text-xs text-[#34C759] font-mono focus:outline-none focus:border-[#34C759] font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {paymentMethod === "cash" && !isSplitTender && (
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-500 uppercase block">
                Cash Tender Received (₹)
              </label>
            </div>
            <input
              type="number"
              placeholder={`Enter cash amount (e.g. ${(finalTotalPaise / 100).toFixed(0)})`}
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007AFF] focus:bg-white min-h-[44px] transition-all font-bold shadow-xs"
            />
            {amountReceived && Number(amountReceived) > 0 && (
              <>
                {Number(amountReceived) * 100 >= finalTotalPaise ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs shadow-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>💵</span> Change to Return:
                    </span>
                    <span className="font-mono text-base font-black text-emerald-700">
                      ₹{((Number(amountReceived) * 100 - finalTotalPaise) / 100).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <span>⚠️</span> Short Amount:
                    </span>
                    <span className="font-mono font-bold text-amber-700">
                      ₹{((finalTotalPaise - Number(amountReceived) * 100) / 100).toFixed(2)} remaining
                    </span>
                  </div>
                )}
              </>
            )}
            {/* Quick Cash Tender Pills */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setAmountReceived(String(Math.ceil(finalTotalPaise / 100)))}
                className="px-3 py-1.5 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 border border-[#007AFF]/20 rounded-xl text-xs font-mono font-bold text-[#007AFF] cursor-pointer shrink-0 min-h-[36px] active:scale-95 transition-all"
              >
                Exact ₹{Math.ceil(finalTotalPaise / 100)}
              </button>
              {[100, 200, 500, 1000, 2000]
                .filter((v) => v >= finalTotalPaise / 100)
                .map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountReceived(String(val))}
                    className="px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.04] rounded-xl text-xs font-mono font-semibold text-slate-800 cursor-pointer shrink-0 min-h-[36px] active:scale-95 transition-all"
                  >
                    ₹{val}
                  </button>
                ))}
            </div>
          </div>
        )}

        {paymentMethod === "upi" && !isSplitTender && (
          <div className="p-3 bg-brand-lavender/70 border border-indigo-100 rounded-2xl space-y-1.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between text-indigo-900 font-bold">
              <span className="flex items-center gap-1.5">
                <span>⚡ UPI Dynamic Counter</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-lavender text-indigo-800 text-[10px] font-mono">
                Scan & Pay
              </span>
            </div>
            <p className="text-[11px] text-brand-dark leading-snug">
              Instruct customer to scan cafe QR code for ₹{(finalTotalPaise / 100).toFixed(2)}. Verify cashier receipt / soundbox before clicking Pay.
            </p>
          </div>
        )}

        {/* Primary Action Buttons: SEND KOT vs PAY */}
        <div className="flex gap-2.5 pt-2 pb-safe">
          <button
            type="button"
            onClick={() => handleSettle("unpaid")}
            disabled={isSettling || cart.length === 0}
            className={`${canSettlePay ? "flex-1" : "w-full"} py-3 px-2 rounded-2xl bg-[#FF9500] hover:bg-[#FF9500]/90 text-white font-black text-xs cursor-pointer shadow-sm disabled:opacity-40 min-h-[48px] transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5`}
          >
            <div className="flex items-center gap-1.5">
              <span>👨‍🍳 SEND KOT</span>
              <span className="text-[9px] px-1 py-0.2 bg-black/20 rounded font-mono font-semibold">F6</span>
            </div>
            <span className="text-[10px] text-white/85 font-normal">Kitchen Ticket Only</span>
          </button>
          {canSettlePay && (
            <button
              type="button"
              onClick={() => handleSettle("paid")}
              disabled={isSettling || cart.length === 0}
              className="flex-1 py-3 px-2 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-black text-xs cursor-pointer shadow-sm disabled:opacity-40 min-h-[48px] transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
            >
              <div className="flex items-center gap-1.5">
                <span>💳 {isSettling ? "Settling..." : `PAY ${paise(finalTotalPaise)}`}</span>
                <span className="text-[9px] px-1 py-0.2 bg-white/25 rounded font-mono font-semibold">F7</span>
              </div>
              <span className="text-[10px] text-white/85 font-normal">Settle & Receipt</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
