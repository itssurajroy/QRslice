// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CoffeeIcon,
  BellIcon,
  SearchIcon,
  SparklesIcon,
  ShoppingBagIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  PhoneIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@/components/Icons";
import { paise, getItemImage, getCategoryEmoji } from "@/lib/utils";
import { api } from "@/lib/api";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { BookingWidget } from "@/features/booking/BookingWidget";
import { Tenant, TierLimits } from "@/lib/tenant";
import type { Category, MenuItem as Item } from "@/types";

interface PublicCafeClientProps {
  restaurant: Tenant;
  // qr_token is intentionally absent: tokens are fetched lazily via
  // /api/public/resolve-table and never shipped in the server HTML payload.
  tables: Array<{
    id: string;
    label: string;
    seats: number;
    active: boolean;
  }>;
  categories: Category[];
  items: Item[];
  canOrder: boolean;
  limits: TierLimits;
  upiQrUrl?: string;
  initialTableLabel?: string;
  modifierGroups?: any[];
  itemModifiers?: any[];
}

type DietFilter = "all" | "veg" | "nonveg";

export type CartItemCustomization = {
  item: Item;
  quantity: number;
  selectedOptions: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    pricePaise: number;
  }>;
  notes: string;
};

// Smart label decider
function getSmartDishLabel(item: Item): { text: string; icon: string; bg: string; textCol: string } | null {
  const lower = (item.name + " " + (item.description || "")).toLowerCase();
  if (
    lower.includes("butter chicken") ||
    lower.includes("paneer tikka") ||
    lower.includes("biryani") ||
    lower.includes("dal makhani")
  ) {
    return { text: "BESTSELLER", icon: "🔥", bg: "bg-rose-50 border-rose-200", textCol: "text-rose-700" };
  }
  if (lower.includes("special") || lower.includes("signature") || lower.includes("chef")) {
    return { text: "Chef's Pick", icon: "⭐", bg: "bg-amber-50 border-amber-200", textCol: "text-amber-800" };
  }
  if (lower.includes("spicy") || lower.includes("chilli") || lower.includes("masala") || lower.includes("mirch")) {
    return { text: "Spicy", icon: "🌶️", bg: "bg-orange-50 border-orange-200", textCol: "text-orange-800" };
  }
  if (lower.includes("healthy") || lower.includes("salad") || lower.includes("diet")) {
    return { text: "Healthy", icon: "💚", bg: "bg-emerald-50 border-emerald-200", textCol: "text-emerald-800" };
  }
  if (lower.includes("popular") || lower.includes("favorite")) {
    return { text: "Popular", icon: "🔥", bg: "bg-purple-50 border-purple-200", textCol: "text-purple-800" };
  }
  return null;
}

export default function PublicCafeClient({
  restaurant,
  tables,
  categories,
  items,
  canOrder,
  upiQrUrl,
  initialTableLabel,
  modifierGroups = [],
  itemModifiers = [],
}: PublicCafeClientProps) {
  const router = useRouter();

  // Active table state
  const [selectedTable, setSelectedTable] = useState<{
    id: string;
    label: string;
    qr_token: string | null;
  } | null>(null);

  // Cart state: lineKey -> CartItemCustomization
  const [cart, setCart] = useState<Record<string, CartItemCustomization>>({});

  // UI Filters and Modals
  const [diet, setDiet] = useState<DietFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || "");

  // Modals & Sheets
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Product Customization Drawer
  const [customizingItem, setCustomizingItem] = useState<Item | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [customNotes, setCustomNotes] = useState("");

  // Customer identity
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saveCustomerDetails, setSaveCustomerDetails] = useState(true);
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);

  // Live active order status banner
  const [activeOrderToken, setActiveOrderToken] = useState<string | null>(null);
  const [recentFavorites, setRecentFavorites] = useState<Item[]>([]);

  // Checkout submission
  const [paymentMethod, setPaymentMethod] = useState<"counter" | "online">("counter");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Auto-detect table from URL query (?table=5 or ?t=T05), localStorage, or single-table cafe
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (initialTableLabel && tables.length > 0) {
      const cleanParam = decodeURIComponent(initialTableLabel).trim().toLowerCase().replace(/^t(able)?\s*/i, "");
      const matched = tables.find(
        (t) =>
          t.label.toLowerCase() === initialTableLabel.toLowerCase() ||
          t.label.toLowerCase().replace(/^t(able)?\s*/i, "") === cleanParam ||
          t.id === initialTableLabel
      );
      if (matched) {
        setSelectedTable({ id: matched.id, label: matched.label, qr_token: null });
        try {
          localStorage.setItem(`qrslice_table_${restaurant.id}`, JSON.stringify({ id: matched.id, label: matched.label }));
        } catch { /* ignore */ }
        return;
      }
    }

    // Restore from localStorage if not provided in URL
    try {
      const saved = localStorage.getItem(`qrslice_table_${restaurant.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const matched = tables.find((t) => t.id === parsed.id || t.label === parsed.label);
        if (matched) {
          setSelectedTable({ id: matched.id, label: matched.label, qr_token: null });
          return;
        }
      }
    } catch { /* ignore */ }

    // If there is only 1 table in the restaurant, auto-assign it
    if (tables.length === 1 && tables[0]) {
      setSelectedTable({ id: tables[0].id, label: tables[0].label, qr_token: null });
    }
  }, [initialTableLabel, tables, restaurant.id]);

  // 2. Restore saved customer name/phone and past favorites
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedName = localStorage.getItem("qrslice_guest_name");
      const savedPhone = localStorage.getItem("qrslice_guest_phone");
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);

      const savedFavs = localStorage.getItem(`qrslice_favs_${restaurant.id}`);
      if (savedFavs) {
        const favIds: string[] = JSON.parse(savedFavs);
        const matched = items.filter((it) => favIds.includes(it.id));
        setRecentFavorites(matched.slice(0, 4));
      }

      const activeToken = sessionStorage.getItem(`active_order_${restaurant.id}`);
      if (activeToken) setActiveOrderToken(activeToken);
    } catch { /* ignore */ }
  }, [restaurant.id, items]);

  // 3. Loyalty Points Lookup
  useEffect(() => {
    if (customerPhone.length < 10) {
      setCustomerPoints(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/customer-balance?phone=${customerPhone}&restaurant_id=${restaurant.id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerPoints(data.points ?? null);
        }
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerPhone, restaurant.id]);

  // 4. Cart storage
  useEffect(() => {
    const storageKey = selectedTable ? `table:${selectedTable.id}` : `guest_${restaurant.id}`;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(`cart:${storageKey}`);
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch { /* ignore */ }
    }
  }, [selectedTable, restaurant.id]);

  useEffect(() => {
    const storageKey = selectedTable ? `table:${selectedTable.id}` : `guest_${restaurant.id}`;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`cart:${storageKey}`, JSON.stringify(cart));
      } catch { /* ignore */ }
    }
  }, [cart, selectedTable, restaurant.id]);

  // 5. Header Scroll & Category Spy
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      const categoryElements = categories.map((c) => document.getElementById(`category-${c.id}`));
      for (let i = categoryElements.length - 1; i >= 0; i--) {
        const el = categoryElements[i];
        if (el && window.scrollY >= el.offsetTop - 190) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  // Lazy resolve qr_token
  const resolveQrToken = async (): Promise<string | null> => {
    if (!selectedTable) return null;
    if (selectedTable.qr_token) return selectedTable.qr_token;
    try {
      const res = await fetch("/api/public/resolve-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurant.id, table_id: selectedTable.id }),
      });
      if (!res.ok) return null;
      const { qr_token } = await res.json();
      if (!qr_token) return null;
      setSelectedTable((prev) => (prev ? { ...prev, qr_token } : prev));
      return qr_token as string;
    } catch {
      return null;
    }
  };

  const handleSelectTable = (table: { id: string; label: string }) => {
    setSelectedTable({ id: table.id, label: table.label, qr_token: null });
    try {
      localStorage.setItem(`qrslice_table_${restaurant.id}`, JSON.stringify({ id: table.id, label: table.label }));
    } catch { /* ignore */ }
    setIsTableModalOpen(false);

    if (pendingItem) {
      openCustomization(pendingItem);
      setPendingItem(null);
    }
  };

  // Open item drawer
  const openCustomization = (item: Item) => {
    setCustomizingItem(item);
    setSelectedOptions({});
    setCustomNotes("");
  };

  // Quick 1-click add
  const quickAddItem = (item: Item) => {
    const lineKey = `${item.id}_none`;
    setCart((prev) => {
      const existing = prev[lineKey];
      return {
        ...prev,
        [lineKey]: {
          item,
          quantity: (existing?.quantity || 0) + 1,
          selectedOptions: [],
          notes: "",
        },
      };
    });
  };

  // Add customized item from Drawer
  const handleAddCustomizedToCart = () => {
    if (!customizingItem) return;

    // Filter relevant groups
    const itemModLinks = itemModifiers?.filter((m: any) => m.menu_item_id === customizingItem.id) || [];
    const itemGroups = modifierGroups?.filter((g: any) => itemModLinks.some((l: any) => l.modifier_group_id === g.id)) || [];
    
    // Validate Required
    for (const g of itemGroups) {
      const selected = selectedOptions[g.id] || [];
      if (g.required && selected.length < 1) {
        alert(`Please select an option for ${g.name}`);
        return;
      }
    }

    const optionsFlat: Array<{groupId: string, groupName: string, optionId: string, optionName: string, pricePaise: number}> = [];
    for (const g of itemGroups) {
      const selectedIds = selectedOptions[g.id] || [];
      for (const optId of selectedIds) {
        const opt = g.modifier_options.find((o: any) => o.id === optId);
        if (opt) {
          optionsFlat.push({
            groupId: g.id,
            groupName: g.name,
            optionId: opt.id,
            optionName: opt.name,
            pricePaise: opt.price_delta_paise,
          });
        }
      }
    }

    const sortedIds = optionsFlat.map(o => o.optionId).sort().join(",");
    const lineKey = `${customizingItem.id}_${sortedIds}`;

    setCart((prev) => {
      const existing = prev[lineKey];
      return {
        ...prev,
        [lineKey]: {
          item: customizingItem,
          quantity: (existing?.quantity || 0) + 1,
          selectedOptions: optionsFlat,
          notes: customNotes.trim(),
        },
      };
    });

    setCustomizingItem(null);
  };

  const updateQuantity = (lineKey: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[lineKey];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[lineKey];
        return next;
      }
      return {
        ...prev,
        [lineKey]: { ...existing, quantity: nextQty },
      };
    });
  };

  // Cart calculations
  const cartLines = useMemo(() => Object.entries(cart).map(([key, data]) => ({ key, ...data })), [cart]);
  const totalQty = useMemo(() => cartLines.reduce((sum, line) => sum + line.quantity, 0), [cartLines]);

  const totalPaise = useMemo(() => {
    return cartLines.reduce((sum, line) => {
      const optionsTotal = line.selectedOptions.reduce((a, b) => a + b.pricePaise, 0);
      const unitPaise = line.item.price_paise + optionsTotal;
      return sum + unitPaise * line.quantity;
    }, 0);
  }, [cartLines]);

  // Filtered menu items
  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesDiet = diet === "all" ? true : diet === "veg" ? item.is_veg : !item.is_veg;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchesDiet && matchesSearch;
    });
  }, [items, diet, searchQuery]);

  // "Popular with guests" showcase items (top 4-6 signature dishes)
  const popularDishes = useMemo(() => {
    const signaturePicks = ["butter chicken", "paneer tikka", "biryani", "dal makhani", "naan", "chole bhature"];
    const found = items.filter((it) => signaturePicks.some((sig) => it.name.toLowerCase().includes(sig)));
    return found.length > 0 ? found.slice(0, 6) : items.slice(0, 4);
  }, [items]);

  // Smart cross-selling pairings for Cart drawer
  const crossSellRecommendations = useMemo(() => {
    const keywords = ["naan", "roti", "lime", "lassi", "jamun", "cold drink", "salad"];
    const inCartItemIds = new Set(cartLines.map((c) => c.item.id));
    return items.filter((it) => !inCartItemIds.has(it.id) && keywords.some((kw) => it.name.toLowerCase().includes(kw))).slice(0, 3);
  }, [items, cartLines]);

  // Smooth scroll
  const scrollToCategory = (catId: string) => {
    const el = document.getElementById(`category-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      setIsTableModalOpen(true);
      return;
    }
    if (totalQty === 0) return;

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const qrToken = await resolveQrToken();
      if (!qrToken) {
        setOrderError("Could not verify your table. Please re-select your table and try again.");
        return;
      }

      // Persist user details if opted in
      if (saveCustomerDetails) {
        if (customerName) localStorage.setItem("qrslice_guest_name", customerName);
        if (customerPhone) localStorage.setItem("qrslice_guest_phone", customerPhone);
      }

      // Record items to favorites
      const itemIds = cartLines.map((c) => c.item.id);
      localStorage.setItem(`qrslice_favs_${restaurant.id}`, JSON.stringify(itemIds));

      const payload = {
        qrToken,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        items: cartLines.map((line) => {
          const notesParts = [
            line.selectedOptions.length > 0 ? `Options: ${line.selectedOptions.map((a) => a.optionName).join(", ")}` : null,
            line.notes,
          ].filter(Boolean);

          const modifiers = line.selectedOptions.map(opt => ({
            option_name: opt.optionName,
            price_delta_paise: opt.pricePaise,
          }));

          return {
            itemId: line.item.id,
            quantity: line.quantity,
            notes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
            spiceLevel: "Medium",
            modifiers,
          };
        }),
      };

      const res = await api.placeOrder(payload);
      if (res.error) {
        setOrderError(res.error + (res.details ? ` ${JSON.stringify(res.details)}` : ""));
        return;
      }

      // Clear cart
      setCart({});
      sessionStorage.removeItem(`cart:table:${selectedTable.id}`);

      const statusToken =
        (res.data as any)?.status_token ||
        (res.data as any)?.statusToken ||
        (res.data as any)?.order_id ||
        (res.data as any)?.order_number;

      if (statusToken) {
        sessionStorage.setItem(`status:table:${selectedTable.id}`, statusToken);
        sessionStorage.setItem(`active_order_${restaurant.id}`, statusToken);
        setActiveOrderToken(statusToken);

        const loyalty = (res.data as any)?.loyalty;
        const qs = loyalty?.pointsEarned ? `?earned=${loyalty.pointsEarned}${loyalty.newTotalPoints ? `&total=${loyalty.newTotalPoints}` : ""}` : "";
        router.push(`/order/${statusToken}${qs}`);
      } else {
        setOrderError("Order placed successfully. Please notify your server for your ticket.");
      }
    } catch (err: any) {
      setOrderError(err?.message || "Failed to submit order. Please check network connection.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Call Waiter / Table Service
  const handleCallService = async (type: "water" | "bill" | "waiter" | "clean") => {
    if (!selectedTable) {
      setIsTableModalOpen(true);
      return;
    }
    setServiceLoading(true);
    try {
      const qrToken = await resolveQrToken();
      if (!qrToken) {
        setServiceMessage("Could not verify your table. Please re-select and try again.");
        return;
      }
      const res = await fetch("/api/table-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrToken, request_type: type }),
      });
      if (res.ok) {
        setServiceMessage(`Staff notified for Table ${selectedTable.label}! Assistance is on the way.`);
        setTimeout(() => {
          setServiceMessage(null);
          setIsServiceModalOpen(false);
        }, 2200);
      } else {
        setServiceMessage("Request received. Server has been notified.");
      }
    } catch {
      setServiceMessage("Service call dispatched to desk.");
    } finally {
      setServiceLoading(false);
    }
  };

  // Dynamic UPI URL for exact amount if UPI ID is present
  const upiPaymentUrl = useMemo(() => {
    if (restaurant.upi_id && totalPaise > 0) {
      const rupees = (totalPaise / 100).toFixed(2);
      const uri = `upi://pay?pa=${encodeURIComponent(restaurant.upi_id)}&pn=${encodeURIComponent(
        restaurant.name
      )}&am=${rupees}&cu=INR&tn=${encodeURIComponent(
        `Table ${selectedTable?.label || "DineIn"} - ${restaurant.name}`
      )}`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(uri)}`;
    }
    return upiQrUrl || null;
  }, [restaurant.upi_id, restaurant.name, totalPaise, selectedTable, upiQrUrl]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-[family-name:var(--font-plus-jakarta)] selection:bg-amber-600 selection:text-white flex flex-col relative pb-32">
      {/* ─── Top Bar: Subscription Notification (if paused) ─── */}
      {!canOrder && (
        <div className="bg-amber-700 text-white px-4 py-2 text-center text-xs font-bold shadow-xs flex items-center justify-center gap-2 relative z-50">
          <span>☕</span>
          <span>Online ordering is currently paused. Please browse our menu below and order with your server.</span>
        </div>
      )}

      {/* ─── 1. New Mobile-First Header ─── */}
      <header
        className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all duration-200 pt-[env(safe-area-inset-top)] ${
          scrolled ? "py-2.5 shadow-sm" : "py-3 shadow-xs"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Monogram & Identity */}
            <div className="flex items-center gap-3 min-w-0">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                  {restaurant.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black text-stone-900 tracking-tight truncate">
                    {restaurant.name}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                    <CheckIcon className="w-2.5 h-2.5 text-emerald-600" />
                    Verified
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium truncate">
                  <span>Authentic Cuisine</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                    <StarIcon className="w-3 h-3 fill-amber-500 text-amber-500 inline-block" />
                    4.8 (500+)
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <InstallPwaButton className="hidden sm:flex px-2 py-1.5 rounded-xl bg-brand-lavender hover:bg-brand-lavender text-brand-dark font-bold text-xs border border-indigo-200 transition-colors" />
              
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchActive(!isSearchActive);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isSearchActive
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600"
                }`}
                title="Search Menu"
              >
                <SearchIcon className="w-4 h-4" />
              </button>

              {/* Call Waiter */}
              {canOrder && (
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(true)}
                  className="p-2 sm:px-3 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Call Waiter"
                >
                  <BellIcon className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Call Waiter</span>
                </button>
              )}

              {/* Table Pill */}
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  selectedTable
                    ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                }`}
                title="Change Table Number"
              >
                <MapPinIcon className={`w-3.5 h-3.5 ${selectedTable ? "text-amber-400" : "text-amber-700"}`} />
                <span>{selectedTable ? `Table ${selectedTable.label}` : "Pick Table"}</span>
                <span className="text-[10px] opacity-70">▾</span>
              </button>
            </div>
          </div>

          {/* Subheader Status Strip */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 text-[11px] font-medium text-stone-600">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                OPEN NOW
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3 text-stone-400" />
                15–20 min prep
              </span>
            </div>
            {selectedTable && (
              <span className="text-[10px] font-bold text-stone-500">
                Direct Table Ordering Active
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ─── Expandable Quick Search Input ─── */}
      {isSearchActive && (
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-4 py-2.5 animate-fade-in">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes, ingredients or categories (e.g. Paneer, Biryani, Naan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Live Active Order Stepper (if diner placed an order) ─── */}
      {activeOrderToken && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-md border border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  ● Order in Kitchen
                </span>
                {selectedTable && <span className="text-xs text-stone-300 font-mono">Table {selectedTable.label}</span>}
              </div>
              <p className="text-xs text-stone-300">
                ✓ Order received • Kitchen accepted • Cooking (12–18 min)
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/order/${activeOrderToken}`)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Track Live Order</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. Premium Compact Restaurant Hero ─── */}
      <section className="relative w-full pt-6 pb-4 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2">
              Authentic Dining Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight mb-2">
              {restaurant.name}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mb-4">
              {restaurant.tagline || "Authentic flavours. Made fresh for you with authentic ingredients."}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {restaurant.google_review_url && (restaurant.google_review_url.startsWith("https://") || restaurant.google_review_url.startsWith("http://")) && (
                <a
                  href={restaurant.google_review_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200/60"
                >
                  <StarIcon className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>4.8 · 500+ Reviews</span>
                </a>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700">
                <ClockIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>15–20 min</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("category-bar");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                View Menu ↓
              </button>
            </div>
          </div>

          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-gradient-to-br from-amber-100/40 to-orange-100/20 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* ─── Recent Diner Favorites ("Welcome back 👋") ─── */}
      {recentFavorites.length > 0 && !searchQuery && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-2 w-full">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">👋</span>
              <div>
                <div className="text-xs font-black text-stone-900">Welcome back!</div>
                <div className="text-[11px] text-stone-600">Quickly re-order your recent favorites:</div>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {recentFavorites.map((fav) => (
                <button
                  key={`fav-${fav.id}`}
                  type="button"
                  onClick={() => quickAddItem(fav)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-amber-200/90 text-stone-800 hover:border-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <span>{fav.name}</span>
                  <span className="font-mono text-amber-800 font-black">{paise(fav.price_paise)}</span>
                  <span className="text-emerald-700 font-black">+</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 9. "Popular at [Restaurant]" Showcase ─── */}
      {popularDishes.length > 0 && !searchQuery && diet === "all" && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h3 className="text-lg font-black text-stone-900 tracking-tight">
                Popular at {restaurant.name}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Guest Favorites
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {popularDishes.map((it) => {
              const inCartCount = Object.values(cart)
                .filter((c) => c.item.id === it.id)
                .reduce((sum, c) => sum + c.quantity, 0);
              const imgUrl = it.image_url || getItemImage(it.name, it.is_veg);

              return (
                <div
                  key={`pop-${it.id}`}
                  className="shrink-0 w-44 bg-white rounded-2xl border border-stone-200/90 p-2.5 flex flex-col shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-stone-100">
                    <img src={imgUrl} alt={it.name} className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 left-1.5 bg-white/95 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-200 shadow-2xs flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${it.is_veg ? "bg-emerald-600" : "bg-red-600"}`} />
                      <span className={it.is_veg ? "text-emerald-700" : "text-red-700"}>
                        {it.is_veg ? "Veg" : "Non-Veg"}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 line-clamp-1 mb-1">{it.name}</h4>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="font-black text-xs text-stone-900 font-mono">
                      {paise(it.price_paise)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCustomization(it)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs border border-amber-200 transition-all cursor-pointer active:scale-95"
                    >
                      {inCartCount > 0 ? `${inCartCount} in cart` : "+ ADD"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 4. Sticky Category Bar with Diet Filters ─── */}
      <div id="category-bar" className="sticky top-[calc(58px+env(safe-area-inset-top))] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 py-2.5 shadow-xs transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Diet Segmented Control */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl shrink-0 border border-stone-200/80">
            <button
              type="button"
              onClick={() => setDiet("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                diet === "all" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDiet("veg")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                diet === "veg" ? "bg-white text-emerald-700 shadow-2xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Veg
            </button>
            <button
              type="button"
              onClick={() => setDiet("nonveg")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                diet === "nonveg" ? "bg-white text-red-700 shadow-2xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              Non-Veg
            </button>
          </div>

          {/* Horizontally Scrollable Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((c) => {
              const count = visibleItems.filter((i) => i.category_id === c.id).length;
              if (count === 0 && searchQuery) return null;
              const isActive = activeCategory === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => scrollToCategory(c.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <span>{getCategoryEmoji(c.name)} {c.name}</span>
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 5. Main Menu Feed (Horizontal Food Cards) ─── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 w-full flex-1">
        {categories.map((cat) => {
          const categoryDishes = visibleItems.filter((it) => it.category_id === cat.id);
          if (categoryDishes.length === 0) return null;

          return (
            <section key={cat.id} id={`category-${cat.id}`} className="mb-10 scroll-mt-[120px]">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/80">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-stone-900 tracking-tight">
                    {getCategoryEmoji(cat.name)} {cat.name}
                  </h3>
                </div>
                <span className="text-xs font-bold text-stone-500">
                  {categoryDishes.length} {categoryDishes.length === 1 ? "dish" : "dishes"}
                </span>
              </div>

              {/* Horizontal Food Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {categoryDishes.map((dish) => {
                  const inCartQty = Object.values(cart)
                    .filter((c) => c.item.id === dish.id)
                    .reduce((sum, c) => sum + c.quantity, 0);

                  const imageUrl = dish.image_url || getItemImage(dish.name, dish.is_veg);
                  const smartLabel = getSmartDishLabel(dish);

                  return (
                    <article
                      key={dish.id}
                      onClick={() => openCustomization(dish)}
                      className="group bg-white rounded-2xl p-3.5 transition-all duration-200 flex items-start justify-between gap-3.5 cursor-pointer relative shadow-2xs border border-stone-200/80 hover:border-amber-300 hover:shadow-xs"
                    >
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-3.5 h-3.5 flex items-center justify-center rounded-xs border ${
                              dish.is_veg ? "border-emerald-600 text-emerald-600" : "border-red-600 text-red-600"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          </span>

                          {smartLabel && (
                            <span className={`px-2 py-0.2 rounded text-[10px] font-black border ${smartLabel.bg} ${smartLabel.textCol}`}>
                              {smartLabel.icon} {smartLabel.text}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-amber-800 transition-colors leading-snug mb-1">
                          {dish.name}
                        </h4>

                        <div className="font-black text-sm text-stone-900 font-mono mb-1.5">
                          {paise(dish.price_paise)}
                        </div>

                        {dish.description && (
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                        <span className="text-[10px] text-amber-700 font-bold mt-1.5 inline-block">
                          Customizable ▾
                        </span>
                      </div>

                      {/* Right: Image & Add Action */}
                      <div className="relative shrink-0 flex flex-col items-center">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-stone-100 relative shadow-inner">
                          <img
                            src={imageUrl}
                            alt={dish.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          {inCartQty === 0 ? (
                            <button
                              type="button"
                              onClick={() => openCustomization(dish)}
                              className="px-4 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs border border-amber-300 shadow-2xs active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
                            >
                              + ADD
                            </button>
                          ) : (
                            <div className="flex items-center bg-stone-900 text-white rounded-xl px-2 py-1 shadow-xs border border-stone-800 font-bold text-xs">
                              <span className="px-1">{inCartQty} in cart</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Empty Search State */}
        {visibleItems.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto my-8 shadow-xs">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="text-base font-black text-stone-900 mb-1">No dishes matched "{searchQuery}"</h3>
            <p className="text-xs text-stone-500 mb-4">
              Try searching with another keyword or resetting your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDiet("all");
              }}
              className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ─── 11. Cleanly Separated Reservation Flow ─── */}
        <div className="relative py-8 my-4 text-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#FAF8F5] px-4 text-xs font-bold uppercase tracking-widest text-stone-400">
              Or
            </span>
          </div>
        </div>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs text-center max-w-xl mx-auto mb-12">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-2xl mb-3 shadow-inner">
            📅
          </div>
          <h3 className="text-xl font-black text-stone-900 tracking-tight">Planning Ahead?</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Guarantee your preferred seating at {restaurant.name} for your family dinner or celebration with instant booking.
          </p>
          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>📅 Reserve a Table</span>
            <span>→</span>
          </button>
        </section>
      </main>

      {/* ─── 3. Sticky Bottom Order Bar ─── */}
      {totalQty > 0 && (
        <aside aria-label="Order Cart Bar" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 sm:left-4 right-3 sm:right-4 z-40 max-w-xl mx-auto animate-fade-in-up">
          <div className="bg-stone-950 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-sm shadow-sm">
                {totalQty}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-white font-mono">
                  <span>{paise(totalPaise)}</span>
                  <span className="text-stone-400 font-sans font-medium text-xs">
                    • {totalQty} {totalQty === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3 text-amber-400" />
                  <span>{selectedTable ? `Table ${selectedTable.label}` : "Pick Table to Order"}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider min-h-[44px]"
            >
              <span>View Cart</span>
              <span>→</span>
            </button>
          </div>
        </aside>
      )}

      {/* ─── 7. Product Customization Drawer ─── */}
      {customizingItem && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setCustomizingItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90dvh] sm:max-h-[85dvh] flex flex-col animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Bottom Sheet Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2 shrink-0" />
            {/* Header Image */}
            <div className="relative aspect-[16/9] w-full bg-stone-100 shrink-0">
              <img
                src={customizingItem.image_url || getItemImage(customizingItem.name, customizingItem.is_veg)}
                alt={customizingItem.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 text-stone-700 hover:bg-white flex items-center justify-center font-bold text-sm shadow-sm border border-stone-200"
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black border border-stone-200 shadow-sm flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${customizingItem.is_veg ? "bg-emerald-600" : "bg-red-600"}`} />
                <span>{customizingItem.is_veg ? "Pure Veg" : "Non-Veg"}</span>
              </div>
            </div>

            {/* Customizer Details */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className="text-xl font-black text-stone-900">{customizingItem.name}</h3>
                  <span className="text-lg font-black text-amber-800 font-mono">
                    {paise(customizingItem.price_paise)}
                  </span>
                </div>
                {customizingItem.description && (
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {customizingItem.description}
                  </p>
                )}
              </div>

              {/* Dynamic Modifiers */}
              {(() => {
                const itemModLinks = itemModifiers?.filter((m: any) => m.menu_item_id === customizingItem.id) || [];
                const itemGroups = modifierGroups?.filter((g: any) => itemModLinks.some((l: any) => l.modifier_group_id === g.id)) || [];
                
                return itemGroups.map((group) => {
                  return (
                    <div key={group.id}>
                      <label className="text-xs font-black text-stone-900 uppercase tracking-wider block mb-2">
                        {group.name} {group.required && <span className="text-red-500">*</span>}
                        {group.max_select > 1 && <span className="text-stone-400 font-normal ml-2">(Max {group.max_select})</span>}
                      </label>
                      <div className="space-y-2">
                        {group.modifier_options?.map((opt: any) => {
                          const isChecked = (selectedOptions[group.id] || []).includes(opt.id);
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked ? "bg-amber-50/60 border-amber-300" : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type={group.max_select === 1 ? "radio" : "checkbox"}
                                  name={`modifier-${group.id}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (group.max_select === 1) {
                                      setSelectedOptions(prev => ({ ...prev, [group.id]: [opt.id] }));
                                    } else {
                                      setSelectedOptions(prev => {
                                        const curr = prev[group.id] || [];
                                        if (e.target.checked) {
                                          if (group.max_select && curr.length >= group.max_select) {
                                            alert(`You can only select up to ${group.max_select} options`);
                                            return prev;
                                          }
                                          return { ...prev, [group.id]: [...curr, opt.id] };
                                        } else {
                                          return { ...prev, [group.id]: curr.filter(id => id !== opt.id) };
                                        }
                                      });
                                    }
                                  }}
                                  className={`text-amber-600 focus:ring-amber-500 ${group.max_select === 1 ? "" : "rounded"}`}
                                />
                                <span className="text-xs font-bold text-stone-800">{opt.name}</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-stone-600">{opt.price_delta_paise > 0 ? `+${paise(opt.price_delta_paise)}` : ""}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Cooking Instructions */}
              <div>
                <label className="text-xs font-black text-stone-900 uppercase tracking-wider block mb-1.5">
                  Chef Instructions (Optional)
                </label>
                <textarea
                  placeholder="e.g. Less spicy, crispy, extra onions, no coriander..."
                  value={customNotes}
                  maxLength={150}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 focus:bg-white resize-none h-16"
                />
              </div>
            </div>

            {/* Bottom Add Action */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 shrink-0 pb-safe">
              {(() => {
                const itemModLinks = itemModifiers?.filter((m: any) => m.menu_item_id === customizingItem.id) || [];
                const itemGroups = modifierGroups?.filter((g: any) => itemModLinks.some((l: any) => l.modifier_group_id === g.id)) || [];
                let optionsTotalPaise = 0;
                for (const g of itemGroups) {
                  const selectedIds = selectedOptions[g.id] || [];
                  for (const optId of selectedIds) {
                    const opt = g.modifier_options?.find((o: any) => o.id === optId);
                    if (opt) {
                      optionsTotalPaise += opt.price_delta_paise;
                    }
                  }
                }
                const linePrice = customizingItem.price_paise + optionsTotalPaise;

                return (
                  <button
                    type="button"
                    onClick={handleAddCustomizedToCart}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider min-h-[48px]"
                  >
                    <span>Add to Order • {paise(linePrice)}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. Drawer: Cart & Checkout ─── */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90dvh] sm:max-h-[85dvh] flex flex-col animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Bottom Sheet Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2 shrink-0" />
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5 text-amber-600" />
                  <span>Your Order Summary</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {selectedTable ? `Table ${selectedTable.label} • ` : ""}
                  {restaurant.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-500 flex items-center justify-center font-bold text-sm hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {cartLines.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-4xl block mb-2">🍽️</span>
                  <p className="text-sm font-bold text-stone-700">Your cart is empty</p>
                  <p className="text-xs text-stone-400 mt-1">Explore the menu and add dishes to order.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cartLines.map((line) => {
                      const optionsSum = line.selectedOptions.reduce((sum, opt) => sum + opt.pricePaise, 0);
                      const unitPrice = line.item.price_paise + optionsSum;

                      return (
                        <div
                          key={line.key}
                          className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  line.item.is_veg ? "bg-emerald-600" : "bg-red-600"
                                }`}
                              />
                              <h4 className="text-xs sm:text-sm font-black text-stone-900 truncate">
                                {line.item.name}
                              </h4>
                            </div>

                            <div className="text-[11px] text-stone-500 mt-0.5 space-y-0.5">
                              <div>{paise(unitPrice)} each</div>
                              {line.selectedOptions.length > 0 && (
                                <div className="text-stone-600 text-[10px]">
                                  + {line.selectedOptions.map((opt) => opt.optionName).join(", ")}
                                </div>
                              )}
                              {line.notes && <span>• "{line.notes}"</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-xs font-black text-stone-900">
                              {paise(unitPrice * line.quantity)}
                            </span>
                            <div className="flex items-center bg-white border border-stone-200 rounded-xl px-1.5 py-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(line.key, -1)}
                                className="w-5 h-5 flex items-center justify-center font-black text-xs text-stone-600 hover:text-red-600"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs font-black px-1.5">{line.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(line.key, 1)}
                                className="w-5 h-5 flex items-center justify-center font-black text-xs text-stone-600 hover:text-emerald-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 10. Smart Cross-Selling: "Complete your meal?" */}
                  {crossSellRecommendations.length > 0 && (
                    <div className="pt-3 border-t border-stone-200">
                      <div className="flex items-center gap-1 text-xs font-black text-stone-900 mb-2">
                        <span>✨</span>
                        <span>Complete your meal?</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {crossSellRecommendations.map((rec) => (
                          <button
                            key={`rec-${rec.id}`}
                            type="button"
                            onClick={() => quickAddItem(rec)}
                            className="shrink-0 p-2 rounded-xl bg-amber-50/70 border border-amber-200 hover:border-amber-400 text-left transition-all active:scale-95 cursor-pointer"
                          >
                            <div className="text-[11px] font-bold text-stone-800 line-clamp-1">{rec.name}</div>
                            <div className="flex items-center justify-between gap-3 mt-1">
                              <span className="text-[10px] font-mono font-black text-amber-900">
                                {paise(rec.price_paise)}
                              </span>
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded">
                                + Add
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 15. Guest Details (No forced registration) */}
                  <div className="pt-3 border-t border-stone-200">
                    <label className="text-xs font-black uppercase tracking-wider text-stone-900 block mb-1.5">
                      Guest Information (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name (e.g. Rahul)"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Mobile (+91...)"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-[11px] text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveCustomerDetails}
                        onChange={(e) => setSaveCustomerDetails(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Save my details for faster ordering</span>
                    </label>
                  </div>

                  {/* 14. Loyalty Banner */}
                  {customerPoints !== null && customerPoints > 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🎁</span>
                        <span className="font-black text-amber-900">Points Balance: {customerPoints}</span>
                      </div>
                      <span className="text-amber-800 font-bold text-[11px]">1 pt = ₹1</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2">
                      <span>🎁</span>
                      <span>Earn <strong>{Math.round(totalPaise / 1000)} reward points</strong> with this order!</span>
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  <div className="pt-3 border-t border-stone-200">
                    <label className="text-xs font-black uppercase tracking-wider text-stone-900 block mb-2">
                      Payment Option
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("counter")}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          paymentMethod === "counter"
                            ? "bg-amber-50 border-amber-400 font-bold shadow-2xs"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <span className="text-xs font-black block text-stone-900">💵 Pay at Counter</span>
                        <span className="text-[10px] text-stone-500">Settle cash/card after meal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("online")}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          paymentMethod === "online"
                            ? "bg-amber-50 border-amber-400 font-bold shadow-2xs"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <span className="text-xs font-black block text-stone-900">📱 Pay via UPI</span>
                        <span className="text-[10px] text-stone-500">GPay, PhonePe, Paytm QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Online UPI QR */}
                  {paymentMethod === "online" && upiPaymentUrl && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center text-center animate-fade-in">
                      <span className="text-xs font-black text-stone-900 mb-2">Scan & Pay via any UPI App</span>
                      <img
                        src={upiPaymentUrl}
                        alt="Store UPI QR Code"
                        className="w-36 h-36 bg-white p-2 rounded-xl border border-stone-200 shadow-sm"
                      />
                      <span className="text-xs font-mono font-bold text-amber-800 mt-2">
                        Exact Amount: {paise(totalPaise)}
                      </span>
                    </div>
                  )}

                  {orderError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      {orderError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Checkout Action */}
            {cartLines.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 shrink-0 pb-safe">
                <div className="flex items-center justify-between mb-3 text-sm font-black text-stone-900">
                  <span>Grand Total:</span>
                  <span className="text-lg font-mono text-stone-900">{paise(totalPaise)}</span>
                </div>

                <button
                  type="button"
                  disabled={orderSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-black disabled:opacity-50 text-white font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider min-h-[48px]"
                >
                  {orderSubmitting ? (
                    <span>Sending to Kitchen…</span>
                  ) : (
                    <>
                      <span>Confirm Order ({selectedTable ? `Table ${selectedTable.label}` : "Pick Table"})</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 8. Table Selector Modal ─── */}
      {isTableModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsTableModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-safe shadow-2xl border border-stone-200 animate-slide-in-bottom max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-2 mb-4 shrink-0" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900">Select Your Table</h3>
                <p className="text-xs text-stone-500">
                  {pendingItem
                    ? `Please choose your table to add ${pendingItem.name}:`
                    : "Choose your table to enable direct kitchen table service:"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-sm hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTable(t)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                    }`}
                  >
                    <span className="text-xs font-mono font-black">{t.label}</span>
                    <span className="text-[10px] opacity-75 mt-0.5">{t.seats || 2} Seats</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (tables[0]) {
                  handleSelectTable({ ...tables[0], label: "Takeaway" });
                } else {
                  setIsTableModalOpen(false);
                }
              }}
              className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
            >
              <span>🛍️</span>
              <span>Order for Counter / Takeaway</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Call Waiter / Service Requests Modal ─── */}
      {isServiceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsServiceModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-safe shadow-2xl border border-stone-200 animate-slide-in-bottom max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-2 mb-4 shrink-0" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-amber-600" />
                  <span>Call Waiter</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedTable ? `Table ${selectedTable.label}` : "Please select your table first"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-sm hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            {serviceMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs animate-fade-in">
                {serviceMessage}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("water")}
                  className="p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">💧</span>
                  <span className="text-xs font-black text-stone-900 block">Need Water</span>
                  <span className="text-[10px] text-stone-500">Fresh drinking water</span>
                </button>

                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("clean")}
                  className="p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">🧹</span>
                  <span className="text-xs font-black text-stone-900 block">Clean Table</span>
                  <span className="text-[10px] text-stone-500">Wipe & sanitize</span>
                </button>

                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("waiter")}
                  className="p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">🙋</span>
                  <span className="text-xs font-black text-stone-900 block">Call Server</span>
                  <span className="text-[10px] text-stone-500">Staff to table</span>
                </button>

                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("bill")}
                  className="p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">🧾</span>
                  <span className="text-xs font-black text-stone-900 block">Request Bill</span>
                  <span className="text-[10px] text-stone-500">Checkout slip</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Reservation Modal ─── */}
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowBookingModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-slide-in-bottom relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-lg font-black text-stone-900">Reserve a Table</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-sm hover:bg-stone-200"
              >
                ✕
              </button>
            </div>
            <BookingWidget slug={restaurant.slug} />
          </div>
        </div>
      )}

      {/* ─── 16. Warm Restaurant Footer ─── */}
      <footer className="mt-auto bg-white text-stone-600 py-10 px-4 text-center relative z-10 border-t border-stone-200/90 shadow-inner">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black text-xl mx-auto border border-amber-200 shadow-2xs">
            {restaurant.name.charAt(0)}
          </div>
          <h4 className="text-xl font-black text-stone-900">{restaurant.name}</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {restaurant.tagline || "Authentic food. Fresh ingredients. Made with love."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {restaurant.google_review_url && (restaurant.google_review_url.startsWith("https://") || restaurant.google_review_url.startsWith("http://")) && (
              <a
                href={restaurant.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold text-xs transition-all border border-stone-200 shadow-2xs"
              >
                <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Review on Google</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold text-xs transition-all border border-stone-200 shadow-2xs cursor-pointer"
            >
              <span>📅 Reserve Table</span>
            </button>
          </div>

          <div className="pt-6 border-t border-stone-200 text-[11px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</div>
            <div className="flex items-center gap-1.5">
              <span>Powered by</span>
              <a
                href="https://qrslice.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:opacity-80 transition-opacity"
              >
                <QrSliceLogo size="sm" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
