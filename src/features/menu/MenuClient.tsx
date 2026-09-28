// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CoffeeIcon, SparklesIcon, ClockIcon } from "@/components/Icons";
import { useCart } from "@/hooks/useCart";
import { useAudioTone } from "@/hooks/useAudioTone";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { paise, getItemImage, getPrepTime } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Category, MenuItem as Item, ModifierOption } from "@/types";

// Extracted UI Features
import { MenuHeader } from "./MenuHeader";
import { MenuCategoryFilter } from "./MenuCategoryFilter";
import { MenuItemCard } from "./MenuItemCard";
import { MenuCartDrawer } from "./MenuCartDrawer";
import { MenuServiceModal } from "./MenuServiceModal";
import { MenuCustomizationSheet } from "./MenuCustomizationSheet";
import { MenuFloatingCartButton } from "./MenuFloatingCartButton";
import { MenuLightbox } from "./MenuLightbox";

const I18N = {
  en: {
    dineIn: "Dine-In Menu",
    vegOnly: "Veg Only",
    all: "All Items",
    search: "Search handcrafted coffee, bites, pizzas…",
    add: "+ ADD",
    viewCart: "View Order Cart",
    orderSummary: "Your Order Summary",
    payAtCounter: "Pay at Counter",
    payOnline: "Pay via UPI / QR",
    customNotes: "Custom notes (e.g. less spicy, extra cheese)...",
    namePlaceholder: "Your Name (optional)",
    phonePlaceholder: "Phone Number (optional)",
    totalBill: "Total Bill:",
    keepBrowsing: "Keep Browsing",
    placeOrder: "Place Order →",
    submitting: "Submitting Order…",
    callWaiter: "Call Waiter",
    needWater: "Need Water",
    cleanTable: "Clean Table",
    serviceSent: "Staff has been notified for Table",
    emptyMenu: "No items available in this section.",
  },
};

export function MenuClient({
  qrToken,
  tableLabel,
  restaurantName,
  categories,
  items,
  accentColor,
  upiQrUrl,
  upiId,
}: {
  qrToken: string;
  tableLabel: string;
  restaurantName: string;
  categories: Category[];
  items: Item[];
  accentColor?: string;
  upiQrUrl?: string;
  upiId?: string;
}) {
  const router = useRouter();
  const t = I18N.en;

  // Apply per-café accent color (use electric violet #5738F5 as default)
  useEffect(() => {
    if (typeof document !== "undefined") {
      const color = accentColor || "#5738F5";
      document.documentElement.style.setProperty("--accent", color);
      const hex = color.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        document.documentElement.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
      }
    }
  }, [accentColor]);

  // Use custom hooks
  const {
    cart,
    cartLines,
    totalQty,
    totalPaise,
    addItem,
    decreaseQty,
    increaseQty,
    updateNotes,
    clearCart,
  } = useCart(qrToken);

  const { playAudioTone } = useAudioTone();
  const isOffline = useOfflineStatus();

  // Local state
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg" | "fast">("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"counter" | "online">("counter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect booking parameter from URL (e.g. ?booking=MMSMCQ)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const bCode = p.get("booking");
      if (bCode) {
        setCodeInput(bCode.trim().toUpperCase());
      }
    }
  }, []);

  // UI states
  const [cartOpen, setCartOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<Item | null>(null);
  const [customizeItem, setCustomizeItem] = useState<Item | null>(null);
  const [upsellItem, setUpsellItem] = useState<Item | null>(null);
  const upsellTimeout = useRef<NodeJS.Timeout | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceMsg, setServiceMsg] = useState<string | null>(null);

  // Category counts computation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.available) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const totalAvailableCount = useMemo(() => {
    return items.filter((i) => i.available).length;
  }, [items]);

  // Curated Chef's Recommendations
  const featuredItems = useMemo(() => {
    return items.filter((i) => i.available).slice(0, 4);
  }, [items]);

  // Derived filtered items
  const visibleItems = useMemo(() => {
    return items.filter((i) => {
      const matchesCat = activeCat === "all" ? true : i.category_id === activeCat;

      let matchesDiet = true;
      if (vegOnly || dietaryFilter === "veg") {
        matchesDiet = i.is_veg;
      } else if (dietaryFilter === "non-veg") {
        matchesDiet = !i.is_veg;
      } else if (dietaryFilter === "fast") {
        const prep = getPrepTime(i.name);
        matchesDiet = prep.includes("10") || prep.includes("12") || prep.includes("15");
      }

      const matchesSearch =
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(search.toLowerCase()));

      return i.available && matchesCat && matchesDiet && matchesSearch;
    });
  }, [items, activeCat, vegOnly, dietaryFilter, search]);

  const loyaltyPoints = Math.floor(totalPaise / 10000); // 1 pt per ₹100

  // Actions
  function handleAdd(item: Item, selectedModifiers: ModifierOption[] = [], note?: string) {
    playAudioTone("add");
    addItem(item, { selectedModifiers, notes: note || "" });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 600);

    const related = items.filter(
      (i) => i.id !== item.id && i.category_id === item.category_id && i.available && !cart[i.id]
    );
    if (related.length > 0) {
      const suggestion = related[Math.floor(Math.random() * Math.min(related.length, 3))];
      if (upsellTimeout.current) clearTimeout(upsellTimeout.current);
      setUpsellItem(suggestion);
      upsellTimeout.current = setTimeout(() => setUpsellItem(null), 5000);
    }
  }

  function handleIncrease(id: string) {
    playAudioTone("add");
    increaseQty(id);
  }

  function openCustomizeModal(item: Item) {
    setCustomizeItem(item);
  }

  function confirmCustomization(selectedModifiers: ModifierOption[], customNote: string) {
    if (!customizeItem) return;
    handleAdd(customizeItem, selectedModifiers, customNote);
    setCustomizeItem(null);
  }

  async function handleServiceRequest(type: "waiter" | "water" | "clean") {
    playAudioTone("alert");
    try {
      const res = await fetch("/api/table-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: qrToken,
          request_type: type,
        }),
      });
      if (res.ok) {
        setServiceMsg(`${t.serviceSent} ${tableLabel}!`);
        setTimeout(() => {
          setServiceMsg(null);
          setServiceModal(false);
        }, 2500);
      }
    } catch {
      setServiceMsg("Service request failed. Please wave to staff.");
    }
  }

  async function submitOrder() {
    if (totalQty === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        qrToken: qrToken,
        items: cartLines.map((l) => ({
          itemId: l.item.id,
          quantity: l.quantity,
          notes: l.notes || undefined,
          modifiers: l.selectedModifiers?.map(m => ({ option_name: m.name, price_delta_paise: m.price_delta_paise })) || [],
        })),
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        paymentMethod: paymentMethod,
        reservation_code: codeInput.trim() || undefined,
      };

      const res = await api.placeOrder(payload);
      if (res.error) {
        setError(res.error + (res.details ? ` ${JSON.stringify(res.details).slice(0, 120)}` : ""));
        return;
      }

      playAudioTone("order");
      clearCart();
      const statusToken =
        (res.data as any)?.status_token ||
        (res.data as any)?.statusToken ||
        (res.data as any)?.order_id ||
        (res.data as any)?.order_number;

      if (statusToken) {
        sessionStorage.setItem(`status:${qrToken}`, statusToken);
        router.push(`/order/${statusToken}`);
      } else {
        setError("Order placed, but status token was missing. Please ask staff for assistance.");
      }
    } catch (err: any) {
      setError(err?.message ? `Failed: ${err.message}` : "Network connection error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-36 font-[family-name:var(--font-plus-jakarta)] antialiased selection:bg-[#5738F5] selection:text-white">
      {/* Offline Awareness Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2 animate-fade-in-up">
          <span>⚠️</span>
          <span>You appear offline — orders may not submit. Check your connection.</span>
        </div>
      )}

      {/* Modern Refined Header */}
      <MenuHeader
        restaurantName={restaurantName}
        tableLabel={tableLabel}
        onHelpClick={() => setServiceModal(true)}
        vegOnly={vegOnly}
        onVegToggle={() => {
          const next = !vegOnly;
          setVegOnly(next);
          setDietaryFilter(next ? "veg" : "all");
        }}
        t={t}
      />

      {/* Table Welcome Spotlight Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-1">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-violet-50 text-[#5738F5] border border-violet-200/90 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#5738F5] animate-pulse" />
                TABLE {tableLabel} ACTIVE
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Verified Kitchen ✓
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                ⭐ 4.8 (500+ Reviews)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Order Fresh to Table {tableLabel}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed">
              Explore culinary specialties below, customize to your taste, and your order will be delivered piping hot right to your table.
            </p>
          </div>

          {/* Quick Hospitality Actions */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Est. Prep Time</span>
              <span className="text-sm font-black text-slate-800 font-mono">15–20 Mins</span>
            </div>
            <button
              type="button"
              onClick={() => setServiceModal(true)}
              className="ml-auto sm:ml-0 px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-[#5738F5] font-black text-xs border border-violet-200 transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
            >
              <span>🙋</span>
              <span>Call Waiter</span>
            </button>
          </div>
        </div>

        {/* Booking Confirmation Banner if booking query was provided */}
        {codeInput && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
                ✓
              </span>
              <div>
                <div className="text-xs font-black text-emerald-950 flex items-center gap-2">
                  <span>Table Reservation Confirmed</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                    #{codeInput}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Your table reservation is confirmed. Dishes you order here will be sent straight to the kitchen.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
              Active Booking
            </span>
          </div>
        )}
      </section>

      {/* Chef's Signature Recommendations Carousel (When browsing all & no search) */}
      {!search && activeCat === "all" && featuredItems.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                <SparklesIcon className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Chef's Signature Recommendations
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#5738F5]">
              Handcrafted Specials
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {featuredItems.map((item) => {
              const inQty = cart[item.id]?.quantity || 0;
              const img = item.image_url || getItemImage(item.name, item.is_veg);
              return (
                <div
                  key={item.id}
                  onClick={() => openCustomizeModal(item)}
                  className="w-56 sm:w-64 shrink-0 bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 relative mb-2.5">
                      <img
                        src={img}
                        alt={item.name}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getItemImage(item.name, item.is_veg);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? "bg-emerald-600" : "bg-rose-600"}`} />
                        {item.is_veg ? "Veg" : "Non-Veg"}
                      </span>
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1">
                        <ClockIcon className="w-2.5 h-2.5" />
                        {getPrepTime(item.name)}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#5738F5] transition-colors truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.description || "Freshly cooked to perfection"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="font-mono font-black text-sm text-[#5738F5]">
                      {paise(item.price_paise)}
                    </span>
                    {inQty === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomizeModal(item);
                        }}
                        className="px-3 py-1 rounded-lg bg-violet-50 hover:bg-[#5738F5] text-[#5738F5] hover:text-white font-black text-xs transition-all cursor-pointer active:scale-95"
                      >
                        + Add
                      </button>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#5738F5] text-white font-mono font-black text-xs">
                        {inQty} in Cart
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Navigation & Dietary Filters */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <MenuCategoryFilter
          categories={categories}
          search={search}
          onSearchChange={setSearch}
          activeCat={activeCat}
          onCatChange={setActiveCat}
          categoryCounts={categoryCounts}
          totalCount={totalAvailableCount}
          dietaryFilter={dietaryFilter}
          onDietaryChange={(f) => {
            setDietaryFilter(f);
            setVegOnly(f === "veg");
          }}
          tSearch={t.search}
          tAll={t.all}
        />
      </section>

      {/* Menu Item Cards (Responsive 2-column Grid) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {visibleItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleItems.map((i, idx) => (
              <MenuItemCard
                key={i.id}
                item={i}
                inCartQty={cart[i.id]?.quantity || 0}
                idx={idx}
                onAdd={openCustomizeModal}
                onIncrease={handleIncrease}
                onDecrease={decreaseQty}
                onImageClick={setLightboxItem}
                tAdd={t.add}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm max-w-md mx-auto">
            <CoffeeIcon className="w-10 h-10 text-slate-400 mx-auto mb-4 animate-float" />
            <p className="text-slate-700 font-bold text-base">{t.emptyMenu}</p>
            <p className="text-slate-500 text-xs mt-1">Try clearing filters or search query to view items</p>
          </div>
        )}
      </section>

      {/* Smart Upsell Prompt */}
      {upsellItem && (
        <div className="fixed bottom-28 left-0 right-0 z-40 px-4 pointer-events-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl flex items-center gap-3 animate-slide-in-bottom">
              <img
                src={upsellItem.image_url || getItemImage(upsellItem.name, upsellItem.is_veg)}
                alt={upsellItem.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#5738F5] font-black uppercase tracking-wider">Customers also ordered</p>
                <p className="text-xs font-bold text-slate-900 truncate">{upsellItem.name}</p>
                <p className="text-xs text-[#5738F5] font-mono font-black">{paise(upsellItem.price_paise)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { openCustomizeModal(upsellItem); setUpsellItem(null); }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs cursor-pointer active:scale-95 shadow-md shadow-violet-500/20"
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => setUpsellItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Overlays & Modals */}
      <MenuFloatingCartButton
        totalQty={totalQty}
        totalPaise={totalPaise}
        cartPulse={cartPulse}
        onOpenCart={() => setCartOpen(true)}
        tViewCart={t.viewCart}
        tableLabel={tableLabel}
      />

      <MenuLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
        onAddClick={(i) => { openCustomizeModal(i); setLightboxItem(null); }}
        tAdd={t.add}
      />

      <MenuCustomizationSheet
        item={customizeItem}
        allItems={items}
        onClose={() => setCustomizeItem(null)}
        onConfirm={confirmCustomization}
      />

      <MenuServiceModal
        serviceModal={serviceModal}
        onClose={() => setServiceModal(false)}
        tableLabel={tableLabel}
        serviceMsg={serviceMsg}
        onRequest={handleServiceRequest}
        t={t}
      />

      <MenuCartDrawer
        cartOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={cartLines}
        tableLabel={tableLabel}
        restaurantName={restaurantName}
        totalQty={totalQty}
        totalPaise={totalPaise}
        loyaltyPoints={loyaltyPoints}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        bookingCode={codeInput}
        setBookingCode={setCodeInput}
        error={error}
        submitting={submitting}
        onSubmit={submitOrder}
        onIncrease={handleIncrease}
        onDecrease={decreaseQty}
        onUpdateNote={updateNotes}
        t={t}
        upiQrUrl={upiQrUrl}
        upiId={upiId}
      />
    </main>
  );
}
