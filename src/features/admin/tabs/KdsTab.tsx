// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

import { speakHumanVoice } from "@/lib/tts";

interface KdsItem {
  item_name: string;
  quantity: number;
}

interface KdsTicket {
  id: string;
  order_number: string;
  status: string;
  table_label?: string;
  table?: { label: string };
  order_items?: KdsItem[];
  items?: KdsItem[];
}

export function KdsTab({
  restaurantId,
  flash,
}: {
  restaurantId: string;
  flash: (kind: "ok" | "err", msg: string) => void;
}) {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const speakVoice = useCallback(
    (text: string) => {
      if (!soundEnabled) return;
      speakHumanVoice(text);
    },
    [soundEnabled]
  );

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/kds/tickets");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTickets(data);
        } else if (Array.isArray(data?.orders)) {
          setTickets(data.orders);
        } else if (Array.isArray(data?.tickets)) {
          setTickets(data.tickets);
        } else {
          setTickets([]);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel("admin-kds-tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          fetchTickets();
          speakVoice("Kitchen queue updated");
        }
      )
      .subscribe();

    const interval = setInterval(fetchTickets, 5000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, soundEnabled, supabase, fetchTickets, speakVoice]);

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        flash("ok", `Order status updated to ${status}`);
        fetchTickets();
      } else {
        flash("err", "Failed to update order status");
      }
    } catch {
      flash("err", "Network error updating order");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>👨‍🍳 Kitchen Display System (KDS) Live Stream</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ticket expeditor, preparation timers & voice call bells.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              soundEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
            }`}
          >
            {soundEnabled ? "🔊 Voice Call Bell: ON" : "🔇 Voice Call Bell: OFF"}
          </button>

          <Link
            href="/pos?view=kitchen"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <span>Open Fullscreen KDS Monitor ↗</span>
          </Link>
        </div>
      </div>

      {/* Ticket Grid */}
      {(() => {
        const ticketList = Array.isArray(tickets) ? tickets : [];
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[300px]">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                Connecting to live kitchen feed…
              </div>
            ) : ticketList.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <span className="text-3xl">✨</span>
                <p className="text-sm font-bold text-slate-800">All Kitchen Tickets Cleared!</p>
                <p className="text-xs text-slate-400">No active pending or preparing dishes in queue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketList.map((t) => {
              const itemsList = t.order_items || t.items || [];
              const isPreparing = t.status === "preparing";
              const isReady = t.status === "ready";

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 shadow-sm ${
                    isReady
                      ? "bg-emerald-50 border-emerald-200"
                      : isPreparing
                      ? "bg-amber-50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-black text-base text-slate-900">
                        #{t.order_number}
                      </span>
                      <span className="text-xs font-bold text-slate-500 block">
                        Table {t.table?.label || t.table_label || "Counter"}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isReady
                          ? "bg-emerald-600 text-white"
                          : isPreparing
                          ? "bg-amber-500 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 border-t border-b border-slate-200/60 py-3 max-h-48 overflow-y-auto">
                    {itemsList.map((it: any, idx) => (
                      <div key={idx} className="text-xs space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{it.item_name}</span>
                          <span className="text-brand font-mono">×{it.quantity}</span>
                        </div>
                        {Array.isArray(it.modifiers) && it.modifiers.length > 0 && (
                          <div className="text-[11px] text-amber-700 font-medium pl-2 border-l-2 border-amber-300">
                            + {it.modifiers.join(", ")}
                          </div>
                        )}
                        {it.notes && (
                          <div className="text-[11px] text-slate-500 italic pl-2 border-l-2 border-slate-300">
                            Note: {it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {t.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(t.id, "confirmed")}
                        className="w-full py-2 rounded-xl bg-brand text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Accept Ticket ✓
                      </button>
                    )}
                    {t.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(t.id, "preparing")}
                        className="w-full py-2 rounded-xl bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Start Cooking 🔥
                      </button>
                    )}
                    {t.status === "preparing" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(t.id, "ready")}
                        className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Mark Ready 🔔
                      </button>
                    )}
                    {t.status === "ready" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(t.id, "served")}
                        className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Serve & Clear ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

