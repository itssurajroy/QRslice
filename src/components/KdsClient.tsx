// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { KitchenView } from "@/features/pos/KitchenView";
import { useAudioTone } from "@/hooks/useAudioTone";

export default function KdsClient({
  restaurant,
}: {
  restaurant: any;
  user: any;
}) {
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const supabase = getSupabaseBrowserClient();
  const { playAudioTone } = useAudioTone();

  const flash = (kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchLiveOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("restaurant_id", restaurant?.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLiveOrders(data || []);
    } catch (err: any) {
      console.error("KDS Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurant, supabase]);

  useEffect(() => {
    fetchLiveOrders();

    const channelName = `kds-live-orders-${restaurant?.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant?.id}`,
        },
        async (payload: any) => {
          // Fetch only the newly inserted order with items rather than reloading the full 24h table
          try {
            const { data: newOrder } = await supabase
              .from("orders")
              .select("*, items:order_items(*)")
              .eq("id", payload.new.id)
              .single();

            if (newOrder) {
              setLiveOrders((prev) => {
                if (prev.some((o) => o.id === newOrder.id)) return prev;
                return [...prev, newOrder];
              });
              playAudioTone("newOrder");
            } else {
              fetchLiveOrders();
            }
          } catch {
            fetchLiveOrders();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant?.id}`,
        },
        (payload: any) => {
          // Incremental state update: update the matching order in place
          setLiveOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
          );
        }
      )
      .subscribe();

    // Adaptive 30-second background heartbeat (only as a fallback in case WebSockets drop)
    const heartbeat = setInterval(fetchLiveOrders, 30000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id, supabase, fetchLiveOrders, playAudioTone]);

  const handleUpdateOrderStatus = async (
    id: string,
    status: string,
    orderNumber: string,
    tableLabel: string
  ) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      playAudioTone("statusChange");
      flash("ok", `Order #${orderNumber} (${tableLabel}) updated to ${status.toUpperCase()}`);
      fetchLiveOrders();
    } catch (err: any) {
      flash("err", err.message || "Failed to update order status");
    }
  };

  return (
    <main className="h-dvh flex flex-col bg-slate-900 text-slate-100 font-sans antialiased overflow-hidden selection:bg-brand selection:text-white">
      {/* KDS Header */}
      <header className="bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 pt-[max(0.6rem,env(safe-area-inset-top))] shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md">
            🍳
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
              <span>{restaurant?.name || "Kitchen Display System"}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 text-[10px] uppercase font-bold tracking-wider">
                LIVE KDS
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {liveOrders.filter((o) => o.status !== "served" && o.status !== "cancelled").length} active tickets in queue
            </p>
          </div>
        </div>

        {msg && (
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black animate-fade-in-up border ${
              msg.kind === "ok"
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                : "bg-red-950/80 text-red-300 border-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            📱 Open POS Terminal
          </Link>
          <button
            type="button"
            onClick={fetchLiveOrders}
            className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-black shadow-lg shadow-brand/30 transition-all active:scale-95 cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Main KDS Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-mono">Connecting live kitchen tickets stream...</p>
          </div>
        </div>
      ) : (
        <KitchenView
          liveOrders={liveOrders}
          fetchLiveOrders={fetchLiveOrders}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          restaurant={restaurant}
        />
      )}
    </main>
  );
}

