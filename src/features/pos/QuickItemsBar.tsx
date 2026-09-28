// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { paise } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface QuickItemsBarProps {
  items: MenuItem[];
  cart: Array<{ item: MenuItem; quantity: number; notes?: string }>;
  onAddToCart: (item: MenuItem) => void;
  maxItems?: number;
}

export function QuickItemsBar({
  items,
  cart,
  onAddToCart,
  maxItems = 8,
}: QuickItemsBarProps) {
  // Get most frequently ordered items (mock: first available items, or items in cart)
  const cartItemIds = new Set(cart.map((c) => c.item.id));
  const quickItems = items
    .filter((i) => i.available)
    .sort((a, b) => {
      // Prioritize items already in cart, then by price (popular items tend to be mid-range)
      const aInCart = cartItemIds.has(a.id);
      const bInCart = cartItemIds.has(b.id);
      if (aInCart && !bInCart) return -1;
      if (!aInCart && bInCart) return 1;
      return a.price_paise - b.price_paise;
    })
    .slice(0, maxItems);

  if (quickItems.length === 0) return null;

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-2 shrink-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-bold text-brand uppercase tracking-wider">⚡ Quick Items</span>
        <span className="text-xs text-slate-400 font-mono">({quickItems.length})</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {quickItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAddToCart(item)}
            className="flex-shrink-0 px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-slate-700 hover:border-indigo-300 shadow-sm transition-all cursor-pointer min-w-[100px] text-left"
            aria-label={`Add ${item.name} - ${paise(item.price_paise)}`}
          >
            <div className="font-bold text-xs truncate">{item.name}</div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-mono text-brand font-bold">{paise(item.price_paise)}</span>
              <span className="w-5 h-5 rounded-lg bg-brand-lavender text-brand flex items-center justify-center text-[10px] font-black">+</span>
            </div>
            {item.is_veg && (
              <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Veg
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
