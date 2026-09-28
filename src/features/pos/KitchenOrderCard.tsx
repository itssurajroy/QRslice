// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ClockIcon } from "@/components/Icons";

export type KitchenItem = {
  id: string;
  item_name?: string | null;
  quantity: number;
  spice_level?: string | null;
  size_variant?: string | null;
  notes?: string | null;
  bumped?: boolean;
  category?: string | null;
};

export type OrderRow = {
  id: string;
  table_label?: string | null;
  order_number: string | number;
  payment_status: string;
  created_at: string;
  status: string;
  order_type?: string | null;
  customer_phone?: string | null;
  total_paise?: number;
  priority?: boolean;
  delay_minutes?: number;
  items?: KitchenItem[];
};

interface KitchenOrderCardProps {
  order: OrderRow;
  nextStatus: string;
  nextLabel: string;
  onUpdateStatus: (
    id: string,
    status: string,
    orderNumber: string,
    tableLabel: string
  ) => void;
  onTogglePriority?: (id: string) => void;
  onRecallOrder?: (id: string) => void;
}

const FRESH_MINS = 2;
const OVERDUE_MINS = 20;

function typeShort(order: OrderRow): string {
  const type = order.order_type || (order.table_label ? "dine_in" : "takeaway");
  if (type === "takeaway") return "Takeaway";
  if (type === "delivery") return "Delivery";
  return "Dine-In";
}

export function KitchenOrderCard({
  order,
  nextStatus,
  nextLabel,
  onUpdateStatus,
  onTogglePriority,
}: KitchenOrderCardProps) {
  const [elapsedMins, setElapsedMins] = useState(0);
  const [bumpedItems, setBumpedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const calculateElapsed = () => {
      if (!order.created_at) return;
      const start = new Date(order.created_at).getTime();
      let mins = Math.max(0, Math.floor((Date.now() - start) / 60000));
      if (order.delay_minutes) {
        mins = Math.max(0, mins - order.delay_minutes);
      }
      setElapsedMins(mins);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000);
    return () => clearInterval(interval);
  }, [order.created_at, order.delay_minutes]);

  const toggleItemBump = (itemId: string) => {
    setBumpedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Timer state: fresh < 2m (amber accent), normal < 12m, red overdue ≥ 12m
  const isFresh = elapsedMins < FRESH_MINS;
  const isOverdue = elapsedMins >= OVERDUE_MINS;

  const cardAccent = order.priority
    ? "border-red-500 bg-red-50 shadow-md ring-2 ring-red-400"
    : isOverdue
      ? "border-red-400 bg-red-50/40 ring-2 ring-red-400/30"
      : isFresh
        ? "border-slate-200 border-l-4 border-l-amber-400"
        : "border-slate-200";

  const timerBadge = isOverdue
    ? "bg-red-100 text-red-700 border-red-300 font-black animate-pulse"
    : "bg-slate-100 text-slate-600 border-slate-200 font-bold";

  const allItemsBumped =
    order.items &&
    order.items.length > 0 &&
    order.items.every((it) => bumpedItems[it.id]);

  const [isDelaying, setIsDelaying] = useState(false);
  const [delayAdded, setDelayAdded] = useState<number | null>(null);

  const handleAddDelay = async (mins: number) => {
    setIsDelaying(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delay_minutes: mins,
          delay_reason: "Fresh cooking preparation",
        }),
      });
      if (res.ok) {
        setDelayAdded((prev) => (prev || 0) + mins);
        setTimeout(() => setDelayAdded(null), 4000);
      }
    } catch (err) {
      console.error("Failed to add kitchen delay:", err);
    } finally {
      setIsDelaying(false);
    }
  };

  const tableLabel = order.table_label || null;
  const headerLabel = tableLabel ? `${tableLabel} · ${typeShort(order)}` : typeShort(order);

  return (
    <div
      className={`bg-white border text-slate-900 shadow-sm hover:shadow-md ${cardAccent} rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between transition-all`}
    >
      <div>
        {/* Header: T07 · Dine-In · 2 min */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
          <div className="min-w-0">
            <p className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
              {headerLabel}{" "}
              <span className="text-slate-300 font-bold">·</span>{" "}
              <span className={`font-mono ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                {elapsedMins} min
              </span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              #{order.order_number}
              {order.priority && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-bounce">
                  🔥 Rush
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onTogglePriority && (
              <button
                type="button"
                onClick={() => onTogglePriority(order.id)}
                className={`p-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors min-w-[28px] min-h-[28px] ${
                  order.priority
                    ? "bg-red-600 text-white border-red-500"
                    : "bg-slate-100 text-slate-500 border-slate-200 hover:text-red-600"
                }`}
                title="Toggle High Priority Rush Ticket"
              >
                🔥
              </button>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${timerBadge}`}
            >
              <ClockIcon className="w-3 h-3 inline mr-0.5" />
              {isOverdue ? `${elapsedMins}m !` : `${elapsedMins}m`}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5 py-1.5 text-[13px]">
          {order.items?.map((it) => {
            const isBumped = !!bumpedItems[it.id];
            const mods = [it.spice_level, it.size_variant].filter(Boolean).join(" · ");
            return (
              <div key={it.id}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleItemBump(it.id)}
                    aria-label={isBumped ? `Uncheck ${it.item_name}` : `Check off ${it.item_name}`}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      isBumped
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-slate-300 text-transparent hover:border-emerald-400"
                    }`}
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </button>
                  <span className={`font-bold text-slate-900 ${isBumped ? "line-through opacity-40" : ""}`}>
                    {it.quantity}× {it.item_name}
                  </span>
                </div>
                {(mods || it.notes) && (
                  <p className="text-xs text-amber-700 font-medium pl-7 leading-snug">
                    {[mods, it.notes].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Delay controls */}
        <div className="flex items-center gap-1.5">
          {[5, 10].map((m) => (
            <button
              key={m}
              type="button"
              disabled={isDelaying}
              onClick={() => handleAddDelay(m)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 text-[11px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              +{m}m
            </button>
          ))}
          {delayAdded !== null && (
            <span className="text-[11px] font-bold text-brand">+{delayAdded}m added ✓</span>
          )}
          <span
            className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              order.payment_status === "paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {order.payment_status === "paid" ? "Paid" : "Unpaid"}
          </span>
        </div>
      </div>

      {/* Primary action: amber fill + white text */}
      <button
        type="button"
        onClick={() =>
          onUpdateStatus(order.id, nextStatus, String(order.order_number), order.table_label || "Takeaway")
        }
        className="w-full py-3 rounded-xl font-black text-xs transition-all cursor-pointer min-h-[44px] active:scale-[0.98] bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/25"
      >
        {allItemsBumped ? `✓ ${nextLabel} (All Checked)` : nextLabel}
      </button>
    </div>
  );
}

