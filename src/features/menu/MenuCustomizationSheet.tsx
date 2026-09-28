// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { paise } from "@/lib/utils";
import type { MenuItem, ModifierGroup, ModifierOption } from "@/types";

interface MenuCustomizationSheetProps {
  item: MenuItem | null;
  allItems: MenuItem[];
  onClose: () => void;
  onConfirm: (selectedModifiers: ModifierOption[], customNote: string) => void;
}

export function MenuCustomizationSheet({
  item,
  allItems,
  onClose,
  onConfirm,
}: MenuCustomizationSheetProps) {
  const [selectedMods, setSelectedMods] = useState<Record<string, ModifierOption>>({});
  const [customNote, setCustomNote] = useState("");

  if (!item) return null;

  // Derive active groups that have options
  const groups = (item.modifier_groups || []).filter(g => g.options && g.options.length > 0);

  // Calculate total price based on selected modifiers
  const selectedOptions = Object.values(selectedMods);
  const addonsTotal = selectedOptions.reduce((acc, opt) => acc + opt.price_delta_paise, 0);
  const currentTotal = item.price_paise + addonsTotal;

  // Validation
  let isValid = true;
  for (const group of groups) {
    const selectedInGroup = selectedOptions.filter(opt => opt.modifier_group_id === group.id).length;
    if (group.required && selectedInGroup < group.min_select) {
      isValid = false;
      break;
    }
  }

  const handleToggleOption = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedMods(prev => {
      const next = { ...prev };
      const currentlySelected = Object.values(next).filter(opt => opt.modifier_group_id === group.id);
      
      const isSelected = !!next[option.id];
      if (isSelected) {
        delete next[option.id];
      } else {
        // Check max_select
        if (currentlySelected.length >= group.max_select) {
          if (group.max_select === 1) {
            // Auto swap if single select
            const existingId = currentlySelected[0].id;
            delete next[existingId];
            next[option.id] = option;
          }
          // If > 1, ignore click or show error (we'll just ignore for now)
          return next;
        }
        next[option.id] = option;
      }
      return next;
    });
  };

  // Cross Sell logic
  const crossSellItems = (item.cross_sell_items || [])
    .map(id => allItems.find(i => i.id === id))
    .filter(Boolean) as MenuItem[];

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white border border-slate-200 rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-black text-slate-900 text-base tracking-tight">
              Customize Dish
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {item.name} • <span className="font-mono text-[#5738F5] font-black">{paise(item.price_paise)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Modifiers */}
        {groups.map(group => {
          const selectedCount = Object.values(selectedMods).filter(opt => opt.modifier_group_id === group.id).length;
          const isSatisfied = !group.required || selectedCount >= group.min_select;

          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  {group.name}
                </label>
                <span className={`text-[10px] font-bold ${isSatisfied ? "text-slate-400" : "text-amber-500"}`}>
                  {group.required ? `Pick at least ${group.min_select}` : "Optional"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(group.options || []).map(opt => {
                  const isSelected = !!selectedMods[opt.id];
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleOption(group, opt)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-violet-50 border-[#5738F5] shadow-xs ring-1 ring-[#5738F5]"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? "text-[#5738F5]" : "text-slate-700"}`}>
                        {opt.name}
                      </span>
                      {opt.price_delta_paise > 0 && (
                        <span className={`text-[10px] font-semibold mt-1 ${isSelected ? "text-violet-700" : "text-slate-500"}`}>
                          + {paise(opt.price_delta_paise)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Special Notes */}
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
            📝 Special Instructions
          </label>
          <input
            type="text"
            placeholder="e.g. Less oil, extra crispy..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            maxLength={100}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] transition-colors"
          />
        </div>

        {/* Cross-Sell / Frequently Bought Together */}
        {crossSellItems.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
              ✨ Frequently Bought Together
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {crossSellItems.map(csItem => (
                <div key={csItem.id} className="min-w-[140px] snap-start border border-slate-200 rounded-xl p-2 bg-slate-50">
                  <div className="h-16 w-full rounded-lg bg-slate-200 mb-2 overflow-hidden">
                    {csItem.image_url && (
                      <img src={csItem.image_url} alt={csItem.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-900 leading-tight truncate">{csItem.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-500">{paise(csItem.price_paise)}</p>
                  <button
                    type="button"
                    onClick={() => onConfirm([], `Add ${csItem.name} combo`)} // We can handle this better in MenuClient, for now just a note or we can fire another callback
                    className="mt-2 w-full py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticky Confirm */}
        <div className="sticky bottom-0 pt-4 bg-white border-t border-slate-100">
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) onConfirm(selectedOptions, customNote);
            }}
            className={`w-full py-3.5 rounded-2xl font-black text-sm cursor-pointer shadow-lg active:scale-95 transition-all ${
              isValid 
                ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white hover:opacity-95 shadow-violet-500/25"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            Add to Order • {paise(currentTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
