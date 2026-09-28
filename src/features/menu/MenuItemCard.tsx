// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { SparklesIcon, ClockIcon } from "@/components/Icons";
import { paise, getItemImage, getPrepTime } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  inCartQty: number;
  idx: number;
  onAdd: (item: MenuItem) => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onImageClick: (item: MenuItem) => void;
  tAdd: string;
}

export function MenuItemCard({
  item,
  inCartQty,
  idx,
  onAdd,
  onIncrease,
  onDecrease,
  onImageClick,
  tAdd,
}: MenuItemCardProps) {
  const fallbackUrl = getItemImage(item.name, item.is_veg);
  const [imgUrl, setImgUrl] = useState(item.image_url || fallbackUrl);
  const isFeatured = idx < 2; // Top 2 items get Chef's Pick badge

  return (
    <article
      className="group bg-white rounded-[1.75rem] p-4 sm:p-5 transition-all duration-300 flex items-start justify-between gap-4 cursor-pointer relative shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 hover:border-[#5738F5]/40 hover:shadow-[0_12px_32px_-8px_rgba(87,56,245,0.12)] hover:-translate-y-0.5 animate-fade-in-up"
      style={{ animationDelay: `${idx * 25}ms`, animationFillMode: "both" }}
      onClick={() => onAdd(item)}
    >
      {/* Featured / Bestseller Pill */}
      {(item.is_bestseller || isFeatured) && (
        <div className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#5738F5] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-violet-500/20 z-10 flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          <span>{item.is_bestseller ? "👑 Bestseller" : "Chef's Pick"}</span>
        </div>
      )}

      {/* Left: Culinary Info */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {/* Veg / Non-Veg Icon */}
          <span
            className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm border ${
              item.is_veg
                ? "border-emerald-600 text-emerald-600"
                : "border-rose-600 text-rose-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
          </span>

          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              item.is_veg
                ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
                : "text-rose-700 bg-rose-50 border border-rose-200/80"
            }`}
          >
            {item.is_veg ? "Veg" : "Non-Veg"}
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/70 font-medium">
            <ClockIcon className="w-2.5 h-2.5 text-slate-400" />
            <span>{getPrepTime(item.name)}</span>
          </span>

          {/* Spice Index */}
          {(item.spice_index ?? 0) > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              {"🌶️".repeat(item.spice_index || 0)}
            </span>
          )}

          {/* Dynamic Tags */}
          {(item.tags || []).map(tag => (
            <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        {/* Dish Title */}
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-[#5738F5] transition-colors leading-snug mb-1">
          {item.name}
        </h3>

        {/* Price & Rating */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-black text-sm sm:text-base text-[#5738F5] font-mono tracking-tight">
            {paise(item.price_paise)}
          </span>
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
            ★ 4.8
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pr-1">
            {item.description}
          </p>
        )}
      </div>

      {/* Right: Culinary Visual & Stepper */}
      <div className="relative shrink-0 flex flex-col items-center ml-1">
        <div
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-inner relative group-hover:border-[#5738F5]/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(item);
          }}
          title="Click to view full photo"
        >
          <img
            src={imgUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgUrl(fallbackUrl)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>

        {/* Floating Add / Quantity Stepper */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {inCartQty === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              aria-label={`Add ${item.name} to order`}
              className="w-24 sm:w-28 py-2 rounded-xl bg-white text-[#5738F5] hover:bg-violet-50 font-black text-xs border border-slate-200/90 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_18px_-4px_rgba(87,56,245,0.18)] hover:border-violet-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
            >
              + ADD
            </button>
          ) : (
            <div className="w-24 sm:w-28 flex items-center justify-between bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white rounded-xl px-1.5 py-1.5 shadow-[0_6px_18px_-2px_rgba(87,56,245,0.35)] border border-[#5738F5]">
              <button
                type="button"
                onClick={() => onDecrease(item.id)}
                aria-label={`Decrease ${item.name}`}
                className="w-6 h-6 flex items-center justify-center font-black text-sm hover:bg-white/20 rounded-lg transition-colors cursor-pointer active:scale-90"
              >
                −
              </button>
              <span className="font-mono text-xs font-black px-1 text-white">
                {inCartQty}
              </span>
              <button
                type="button"
                onClick={() => onIncrease(item.id)}
                aria-label={`Increase ${item.name}`}
                className="w-6 h-6 flex items-center justify-center font-black text-sm hover:bg-white/20 rounded-lg transition-colors cursor-pointer active:scale-90"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
