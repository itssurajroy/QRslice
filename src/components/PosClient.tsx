// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { RegisterView } from "@/features/pos/RegisterView";
import { KitchenView } from "@/features/pos/KitchenView";
import { VisualFloorGrid } from "@/features/pos/VisualFloorGrid";
import { generateBeautifulBillPdf } from "@/lib/bill-pdf";
import { api } from "@/lib/api";
import { getWaLink, isValidIndianPhone, normalizeWaPhone } from "@/lib/utils";
import { speakHumanVoice } from "@/lib/tts";
import { useToast } from "@/components/ToastProvider";
import { usePrinter } from "@/components/printer/PrinterProvider";
import { submitOrderOnlineFirst } from "@/lib/offline-queue";
import OfflineQueueStatus from "@/components/printer/OfflineQueueStatus";
import type { Category, MenuItem as Item, CartLine, Table } from "@/types";

interface RestaurantProps {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  fssai?: string;
  currency_symbol?: string;
}

interface ParkedTab {
  id: string;
  time: string;
  customer: string;
  cart: CartLine[];
}

interface BillItemSnapshot {
  item?: { name: string; price_paise: number };
  item_name?: string;
  quantity: number;
  unit_price_paise?: number;
}

interface BillData {
  id?: string;
  order_number?: string;
  orderNumber?: string;
  total_paise?: number;
  subtotal_paise?: number;
  discount_paise?: number;
  finalTotalPaise?: number;
  subtotalPaise?: number;
  discountPaise?: number;
  payment_status: "paid" | "unpaid" | "verification_pending";
  payment_method?: string;
  paymentMethod?: string;
  table_label?: string;
  customer_phone?: string;
  status_token?: string;
  itemsSnapshot?: CartLine[];
  order_items?: BillItemSnapshot[];
  items?: any[];
}

interface PosOrder {
  id: string;
  order_number: string;
  restaurant_id: string;
  table_label?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  priority?: boolean;
  split_cash_paise?: number;
  split_upi_paise?: number;
  total_paise: number;
  created_at: string;
  items?: BillItemSnapshot[];
}

export default function PosClient({
  restaurant,
  categories,
  items,
  tables,
  reservations,
  userRole,
  userName = "Cashier",
}: {
  restaurant: RestaurantProps;
  categories: Category[];
  items: Item[];
  tables: Table[];
  reservations: {
    table_ids: string[];
    starts_at: string;
    ends_at: string;
    status: string;
    id?: string;
    code?: string;
    name?: string;
    phone?: string;
    party_size?: number;
  }[];
  userRole?: string;
  userName?: string;
}) {
  // Kitchen role is KDS-only: locked to the kitchen view (no billing/floor).
  const isKitchenLocked = userRole === "kitchen";
  // PAY / settle is owner, manager, or super_admin only (mirrors server POS_SETTLE_ROLES).
  const canSettlePay =
    userRole === "owner" || userRole === "manager" || userRole === "super_admin";
  const printer = usePrinter();
  const [reservationList, setReservationList] = useState(reservations);
  useEffect(() => {
    setReservationList(reservations);
  }, [reservations]);

  // Deep-linkable view: /pos?view=kitchen lands straight on the KDS.
  // Kitchen role is locked to KDS-only (PIN quick sign-in).
  const [viewMode, setViewMode] = useState<"catalog" | "kitchen" | "live_tables">(() => {
    if (isKitchenLocked) return "kitchen";
    if (typeof window === "undefined") return "catalog";
    const v = new URLSearchParams(window.location.search).get("view");
    return v === "kitchen" || v === "live_tables" ? v : "catalog";
  });

  useEffect(() => {
    if (isKitchenLocked && viewMode !== "kitchen") {
      setViewMode("kitchen");
    }
  }, [isKitchenLocked, viewMode]);

  // Station Connectivity & Health Diagnostics
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);

  // Workstation Quick Lock (PIN security)
  const [isPosLocked, setIsPosLocked] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Live Station Clock
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [selectedTable, setSelectedTable] = useState<Table | null>(tables[0] || null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [flatDiscountRupees, setFlatDiscountRupees] = useState<string>("");

  const [parkedTabs, setParkedTabs] = useState<ParkedTab[]>([]);

  const [isSplitTender, setIsSplitTender] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [splitUpiAmount, setSplitUpiAmount] = useState<string>("");

  // Customer & Loyalty State
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [rushPriority, setRushPriority] = useState(false);
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [isCheckingPoints, setIsCheckingPoints] = useState(false);

  const handleCheckPoints = useCallback(async () => {
    if (customerPhone.length < 10) return;
    setIsCheckingPoints(true);
    try {
      const res = await fetch(`/api/pos/customer-balance?phone=${customerPhone}`);
      const data = await res.json();
      if (res.ok) setCustomerPoints(data.points || 0);
    } catch {
      // ignore
    } finally {
      setIsCheckingPoints(false);
    }
  }, [customerPhone]);

  const [liveOrders, setLiveOrders] = useState<PosOrder[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "mixed">("cash");
  const [isSettling, setIsSettling] = useState(false);
  // B2: orders with a settle PATCH in flight — ignore re-clicks / disable PAY.
  const [settlingOrderIds, setSettlingOrderIds] = useState<ReadonlySet<string>>(new Set());
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [openingFloat, setOpeningFloat] = useState<string>("2000");
  const [payoutsAmount, setPayoutsAmount] = useState<string>("0");
  const [actualCashCount, setActualCashCount] = useState<string>("");
  const [showZReportModal, setShowZReportModal] = useState(false);

  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemIsVeg, setCustomItemIsVeg] = useState(true);

  const [lastBill, setLastBill] = useState<BillData | null>(null);
  const [showBill, setShowBill] = useState(false);

  const [waModal, setWaModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
    customerPhone: string;
    totalPaise: number;
    statusToken: string;
    tableLabel?: string;
    paymentMethod?: string;
  } | null>(null);

  const [waSettings, setWaSettings] = useState<{ message_template?: string; enabled?: boolean } | null>(null);
  const [recentPhones, setRecentPhones] = useState<string[]>([]);
  const [blockedWaUrl, setBlockedWaUrl] = useState<string | null>(null);
  const [isSendingWa, setIsSendingWa] = useState(false);

  useEffect(() => {
    async function loadWaSettings() {
      try {
        const res = await fetch("/api/whatsapp/settings");
        if (res.ok) {
          const data = await res.json();
          setWaSettings(data);
        }
      } catch {
        // ignore
      }
    }
    loadWaSettings();
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  const flash = useCallback((kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  }, []);

  const handleSendWhatsApp = useCallback(
    async (
      phoneToSend: string,
      orderDetails: {
        orderId: string;
        orderNumber: string;
        totalPaise: number;
        statusToken: string;
        tableLabel?: string;
        paymentMethod?: string;
      }
    ) => {
      const cleanPhone = phoneToSend.trim();
      if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
        flash("err", "Please enter a valid 10-digit mobile number");
        return;
      }
    },
    [restaurant.id, flash]
  );

  const openWhatsAppModal = useCallback(
    async (bill: {
      orderId: string;
      orderNumber: string;
      customerPhone: string;
      totalPaise: number;
      statusToken: string;
      tableLabel?: string;
      paymentMethod?: string;
    }) => {
      setBlockedWaUrl(null);
      let prefilledPhone = bill.customerPhone ? bill.customerPhone.trim() : "";

      try {
        const { data } = await supabase
          .from("orders")
          .select("customer_phone")
          .eq("restaurant_id", restaurant.id)
          .not("customer_phone", "is", null)
          .order("created_at", { ascending: false })
          .limit(12);

        const unique = Array.from(
          new Set(
            (data || [])
              .map((r: any) => r.customer_phone?.trim())
              .filter((p: string) => p && isValidIndianPhone(p))
          )
        ).slice(0, 5) as string[];

        setRecentPhones(unique);

        if (!prefilledPhone && unique.length === 1) {
          prefilledPhone = unique[0];
        }
      } catch {
        // ignore
      }

      setWaModal({
        isOpen: true,
        orderId: bill.orderId,
        orderNumber: bill.orderNumber,
        customerPhone: prefilledPhone,
        totalPaise: bill.totalPaise,
        statusToken: bill.statusToken,
        tableLabel: bill.tableLabel || "Counter",
        paymentMethod: bill.paymentMethod || "paid",
      });
    },
    [restaurant.id, supabase]
  );

  const speakVoice = useCallback(
    (text: string) => {
      if (!soundEnabled) return;
      speakHumanVoice(text);
    },
    [soundEnabled]
  );

  const fetchLiveOrders = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("restaurant_id", restaurant.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLiveOrders(data || []);
      setLastSyncTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.error("LiveOrders Fetch Error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [restaurant.id, supabase]);

  useEffect(() => {
    fetchLiveOrders();
    let channel: any = null;

    try {
      channel = supabase
        .channel("live-orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=${restaurant.id}` },
          () => {
            fetchLiveOrders();
            speakVoice("New order received");
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=${restaurant.id}` },
          () => {
            fetchLiveOrders();
          }
        )
        .subscribe((status: string, err?: Error) => {
          if (err) console.warn("Supabase Realtime:", err);
        });
    } catch (err) {
      console.warn("Realtime WebSocket unavailable, falling back to polling", err);
    }

    const poll = setInterval(fetchLiveOrders, 5000);

    return () => {
      clearInterval(poll);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [restaurant.id, supabase, fetchLiveOrders, speakVoice]);

  const addToCart = (it: Item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === it.id);
      if (existing) {
        return prev.map((c) => (c.item.id === it.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item: it, quantity: 1, notes: "" }];
    });
  };

  const handleAddCustomItem = () => {
    const err =
      !customItemName.trim() || !customItemPrice || Number.isNaN(Number(customItemPrice)) || Number(customItemPrice) <= 0
        ? "Please enter valid item name and price"
        : customItemName.trim().length > 80
          ? "Item name too long (max 80)"
          : Number(customItemPrice) > 100000
            ? "Price too high (max ₹100000)"
            : null;
    if (err) {
      flash("err", err);
      return;
    }
    const newItem: Item = {
      id: `custom-${Date.now()}`,
      restaurant_id: restaurant.id,
      category_id: categories[0]?.id || "custom",
      name: customItemName.trim().slice(0, 80),
      price_paise: Math.round(Number(customItemPrice) * 100),
      is_veg: customItemIsVeg,
      available: true,
    };
    addToCart(newItem);
    setCustomItemName("");
    setCustomItemPrice("");
    setShowCustomItemModal(false);
    flash("ok", `Added open item: ${newItem.name}`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => (c.item.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)).filter((c) => c.quantity > 0)
    );
  };

  const setItemNotes = (id: string, note: string) => {
    setCart((prev) => prev.map((c) => (c.item.id === id ? { ...c, notes: note } : c)));
  };

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setFlatDiscountRupees("");
    setSplitCashAmount("");
    setSplitUpiAmount("");
    setAmountReceived("");
  }, []);

  const totalItemCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const subtotalPaise = cart.reduce((acc, c) => acc + c.item.price_paise * c.quantity, 0);

  let discountPaise = 0;
  if (flatDiscountRupees && Number(flatDiscountRupees) > 0) {
    discountPaise = Math.min(Number(flatDiscountRupees) * 100, subtotalPaise);
  } else if (discountPercent > 0) {
    discountPaise = Math.round((subtotalPaise * discountPercent) / 100);
  }

  const finalTotalPaise = Math.max(0, subtotalPaise - discountPaise);

  const handleParkTab = useCallback(() => {
    if (cart.length === 0) return;
    setParkedTabs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        customer: selectedTable?.label ? `Table ${selectedTable.label}` : "Walk-in",
        cart,
      },
    ]);
    clearCart();
    flash("ok", "Tab Parked (Hold)");
  }, [cart, selectedTable, clearCart, flash]);

  const handleRecallTab = (tab: ParkedTab) => {
    setCart(tab.cart);
    setParkedTabs((prev) => prev.filter((pt) => pt.id !== tab.id));
    flash("ok", "Tab Recalled");
  };

  const handleSettle = useCallback(
    async (status: "paid" | "unpaid") => {
      if (status === "paid" && !canSettlePay) {
        flash("err", "Only managers and owners can settle payments");
        return;
      }
      if (cart.length === 0 || isSettling) return;
      setIsSettling(true);
      try {
        const splitCashPaise = isSplitTender && splitCashAmount ? Math.round(Number(splitCashAmount) * 100) : 0;
        const splitUpiPaise = isSplitTender && splitUpiAmount ? Math.round(Number(splitUpiAmount) * 100) : 0;

        const res = await fetch("/api/pos/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: selectedTable?.id || null,
            order_type: orderType,
            customer_name: "Walk-in Guest",
            customer_phone: customerPhone,
            items: cart.map((c) => ({
              id: c.item.id,
              quantity: c.quantity,
              notes: c.notes || "",
              ...(c.item.id.startsWith("custom-")
                ? { name: c.item.name, price_paise: c.item.price_paise }
                : {}),
            })),
            discount_paise: discountPaise || 0,
            redeem_points: redeemPoints || 0,
            payment_method: paymentMethod || "cash",
            payment_status: status,
            split_cash_paise: splitCashPaise,
            split_upi_paise: splitUpiPaise,
            customer_gstin: customerGstin || undefined,
            priority: rushPriority,
            idempotency_key: crypto.randomUUID(),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Order failed");
        const billData = json.order || {
          id: json.id,
          order_number: `POS-${Date.now()}`,
          total_paise: finalTotalPaise,
          subtotal_paise: subtotalPaise,
          discount_paise: discountPaise,
          items: cart,
          payment_status: status,
          payment_method: paymentMethod,
          table_label: selectedTable?.label || "Counter",
        };
        const savedBill: BillData = {
          ...billData,
          id: billData.id || json.id || json.order?.id,
          payment_status: status,
          table_label: selectedTable?.label || "Counter",
          itemsSnapshot: [...cart],
          finalTotalPaise: Number(billData.total_paise) || finalTotalPaise,
          subtotalPaise: Number(billData.subtotal_paise) || subtotalPaise,
          discountPaise: Number(billData.discount_paise) || discountPaise,
          paymentMethod,
        };
        setLastBill(savedBill);
        setShowBill(true);
        flash("ok", status === "paid" ? "Bill Settled ✓ — PAID" : "KOT Generated — UNPAID (Sent to kitchen)");
        if (status === "unpaid") {
          speakVoice(`K O T sent to kitchen for table ${selectedTable?.label || "Counter"}`);
          if (printer?.isConnected) {
            try {
              printer.printKOT({
                orderNumber: billData.order_number,
                tableLabel: selectedTable?.label || "Counter",
                orderType,
                items: cart.map((c) => ({
                  name: c.item.name,
                  qty: c.quantity,
                  notes: c.notes || "",
                })),
                timestamp: new Date(),
              });
            } catch (pe) {
              console.warn("Thermal KOT print error:", pe);
            }
          }
        } else if (status === "paid" && printer?.isConnected) {
          try {
            printer.printBill({
              restaurantName: restaurant.name || "QRslice",
              address: restaurant.address,
              phone: restaurant.phone,
              gstin: restaurant.gstin,
              orderNumber: billData.order_number,
              tableLabel: selectedTable?.label || "Counter",
              items: cart.map((c) => ({
                name: c.item.name,
                qty: c.quantity,
                price: c.item.price_paise,
                total: c.item.price_paise * c.quantity,
              })),
              subtotal: savedBill.subtotalPaise ?? 0,
              discount: savedBill.discountPaise ?? 0,
              tax: Number(billData.tax_paise) || 0,
              total: savedBill.finalTotalPaise ?? 0,
              paymentMethod: paymentMethod || "cash",
              timestamp: new Date(),
            });
          } catch (pe) {
            console.warn("Thermal receipt print error:", pe);
          }
        }
        clearCart();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to settle order";
        flash("err", message.includes("No active table") ? "Add a table first: Admin → Tables, then retry." : message);
      } finally {
        setIsSettling(false);
      }
    },
    [
      cart,
      isSettling,
      isSplitTender,
      splitCashAmount,
      splitUpiAmount,
      selectedTable,
      orderType,
      discountPaise,
      paymentMethod,
      finalTotalPaise,
      subtotalPaise,
      printer,
      restaurant,
      flash,
      speakVoice,
      clearCart,
      canSettlePay,
    ]
  );

  const handleUnlockPin = useCallback(
    async (pinToTest?: string) => {
      const pin = pinToTest !== undefined ? pinToTest : enteredPin;
      if (!/^\d{4}$/.test(pin)) {
        setPinError("Enter a 4-digit PIN");
        setTimeout(() => setPinError(""), 2500);
        return;
      }
      try {
        const res = await fetch("/api/pos/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        const data: { error?: string; needsPassword?: boolean } = await res.json().catch(() => ({}));
        if (res.ok) {
          setIsPosLocked(false);
          setEnteredPin("");
          setPinError("");
          flash("ok", `Station Unlocked — Welcome back, ${userName}`);
        } else if (data.needsPassword) {
          setPinError(data.error || "No staff PIN set. Switch user to unlock.");
          setTimeout(() => setPinError(""), 4000);
        } else {
          setPinError(data.error || "Invalid PIN");
          setEnteredPin("");
          setTimeout(() => setPinError(""), 2500);
        }
      } catch {
        setPinError("Unlock failed — check connection");
        setEnteredPin("");
        setTimeout(() => setPinError(""), 2500);
      }
    },
    [enteredPin, userName, flash]
  );

  // Full POS Station Keyboard Shortcuts (F2-F9, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPosLocked) {
        // Only accept number keys when locked
        if (/^[0-9]$/.test(e.key)) {
          setEnteredPin((prev) => {
            const next = (prev + e.key).slice(0, 4);
            if (next.length === 4) {
              setTimeout(() => handleUnlockPin(next), 100);
            }
            return next;
          });
        } else if (e.key === "Backspace") {
          setEnteredPin((prev) => prev.slice(0, -1));
        }
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        const searchInput = (document.getElementById("pos-search-input") ||
          document.querySelector('input[placeholder*="Search"]')) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === "F3") {
        e.preventDefault();
        if (cart.length > 0) {
          if (window.confirm("Start New Order? Current ticket will be cleared.")) {
            clearCart();
            flash("ok", "Cart cleared — New Order started (F3)");
          }
        } else {
          flash("ok", "Ready for New Order");
        }
      } else if (e.key === "F4") {
        e.preventDefault();
        setViewMode((prev) => (prev === "live_tables" ? "catalog" : "live_tables"));
      } else if (e.key === "F5") {
        e.preventDefault();
        handleParkTab();
      } else if (e.key === "F6") {
        e.preventDefault();
        if (cart.length > 0 && !isSettling) {
          handleSettle("unpaid");
        } else if (cart.length === 0) {
          flash("err", "Cart is empty — add dishes before sending KOT (F6)");
        }
      } else if (e.key === "F7") {
        e.preventDefault();
        if (!canSettlePay) {
          flash("err", "Only managers and owners can settle payments (F7)");
        } else if (cart.length > 0 && !isSettling) {
          handleSettle("paid");
        } else if (cart.length === 0) {
          flash("err", "Cart is empty — add dishes before settling bill (F7)");
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        setViewMode((prev) => (prev === "kitchen" ? "catalog" : "kitchen"));
      } else if (e.key === "F9") {
        e.preventDefault();
        setShowZReportModal((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowDiagnosticsModal(false);
        setShowCustomItemModal(false);
        setShowZReportModal(false);
        setShowBill(false);
        setWaModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPosLocked,
    cart,
    isSettling,
    handleSettle,
    handleParkTab,
    clearCart,
    flash,
    handleUnlockPin,
    canSettlePay,
  ]);

  const tableOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveOrders.forEach((o) => {
      if (o.status !== "served" && o.table_label) {
        const t = tables.find((tbl) => tbl.label === o.table_label);
        if (t) {
          counts[t.id] = (counts[t.id] || 0) + 1;
        }
      }
    });
    return counts;
  }, [liveOrders, tables]);

  const handleUpdateOrderStatus = async (id: string, status: string, orderNumber: string, _tableLabel: string) => {
    // Snapshot for revert, then move the ticket instantly (optimistic UI).
    const prevStatus = liveOrders.find((o) => o.id === id)?.status;
    setLiveOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update order status");
      speakVoice(`Order ${orderNumber} is ${status}`);
    } catch (err: unknown) {
      // Revert to the previous column on failure.
      if (prevStatus !== undefined) {
        setLiveOrders((list) => list.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
      }
      toast.error(err instanceof Error ? err.message : "Network Error: Ticket not updated");
      flash("err", err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  const handleSettleExistingOrder = async (orderId: string, table: Table, method: string = "cash") => {
    // B2: ignore re-clicks while this order's settle is in flight.
    if (!canSettlePay) {
      flash("err", "Only managers and owners can settle payments");
      return;
    }
    if (settlingOrderIds.has(orderId)) return;
    setSettlingOrderIds((prev) => new Set(prev).add(orderId));
    try {
      const res = await fetch("/api/pos/active-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payment_status: "paid",
          payment_method: method,
          status: "completed",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Settlement failed");
      if (data.alreadySettled) {
        toast.info?.("Bill was already settled");
      } else {
        toast.success(`Table #${table.label} settled and paid!`);
        flash("ok", `Table #${table.label} bill settled ✓`);
        speakVoice(`Table ${table.label} payment received`);
      }
      fetchLiveOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to settle table";
      toast.error(message);
      flash("err", message);
    } finally {
      setSettlingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleActionReservation = async (
    id: string,
    action: "accept" | "seat" | "cancel" | "no_show",
    tableLabel?: string,
  ) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reservation update failed");

      setReservationList((prev) =>
        prev.map((r: any) =>
          r.id === id
            ? {
                ...r,
                status:
                  action === "accept"
                    ? "confirmed"
                    : action === "seat"
                      ? "seated"
                      : action === "cancel"
                        ? "cancelled"
                        : "no_show",
              }
            : r,
        ),
      );

      const actionText =
        action === "accept"
          ? "Confirmed"
          : action === "seat"
            ? "Seated"
            : action === "cancel"
              ? "Cancelled"
              : "Marked No-Show";

      toast.success(
        tableLabel
          ? `Table #${tableLabel} reservation ${actionText}!`
          : `Reservation ${actionText}!`,
      );
      flash("ok", `Booking ${actionText} ✓`);
      speakVoice(`Booking ${actionText}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update booking";
      toast.error(message);
      flash("err", message);
    }
  };

  const handleTransferTable = async (
    sourceTable: Table,
    destinationTable: Table,
    activeOrders: any[]
  ) => {
    try {
      const orderIds = activeOrders
        .map((ord) => String(ord.id || ""))
        .filter((id) => id.length > 0);
      if (orderIds.length === 0) {
        toast.error("No orders to transfer");
        return;
      }
      const res = await fetch("/api/pos/transfer-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_ids: orderIds,
          destination_table_id: destinationTable.id,
          destination_table_label: destinationTable.label,
        }),
      });
      const data: { error?: string; transferred?: number } = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to transfer table orders");
      }
      toast.success(
        `Table #${sourceTable.label} orders transferred to Table #${destinationTable.label}!`
      );
      flash(
        "ok",
        `Table #${sourceTable.label} transferred to #${destinationTable.label} ✓`
      );
      speakVoice(
        `Table ${sourceTable.label} transferred to table ${destinationTable.label}`
      );
      fetchLiveOrders();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to transfer table orders";
      toast.error(message);
      flash("err", message);
    }
  };

  // Shift Z-Report calculations
  const zReport = useMemo(() => {
    const paidOrders = liveOrders.filter((o) => o.payment_status === "paid" && o.status !== "cancelled");
    const cashSalesPaise = paidOrders
      .filter((o) => o.payment_method === "cash" || (o.split_cash_paise && o.split_cash_paise > 0))
      .reduce((sum, o) => sum + (o.split_cash_paise && o.split_cash_paise > 0 ? o.split_cash_paise : o.total_paise || 0), 0);

    const upiSalesPaise = paidOrders
      .filter((o) => o.payment_method === "upi" || (o.split_upi_paise && o.split_upi_paise > 0))
      .reduce((sum, o) => sum + (o.split_upi_paise && o.split_upi_paise > 0 ? o.split_upi_paise : o.total_paise || 0), 0);

    const cardSalesPaise = paidOrders
      .filter((o) => o.payment_method === "card")
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);

    const totalRevenuePaise = cashSalesPaise + upiSalesPaise + cardSalesPaise;

    const openFloatPaise = (Number(openingFloat) || 0) * 100;
    const payoutsPaise = (Number(payoutsAmount) || 0) * 100;
    const expectedDrawerCashPaise = openFloatPaise + cashSalesPaise - payoutsPaise;

    const actualCountPaise = actualCashCount !== "" ? Number(actualCashCount) * 100 : expectedDrawerCashPaise;
    const cashVariancePaise = actualCountPaise - expectedDrawerCashPaise;

    return {
      orderCount: paidOrders.length,
      cashSalesPaise,
      upiSalesPaise,
      cardSalesPaise,
      totalRevenuePaise,
      openFloatPaise,
      payoutsPaise,
      expectedDrawerCashPaise,
      actualCountPaise,
      cashVariancePaise,
    };
  }, [liveOrders, openingFloat, payoutsAmount, actualCashCount]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-brand-lavender0 selection:text-white">
      {/* POS HEADER / TOP MISSION-CRITICAL WORKSTATION BAR */}
      <header className="h-14 bg-[#F5F5F7]/90 backdrop-blur-xl border-b border-black/[0.06] px-3 sm:px-4 flex items-center justify-between shadow-xs shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 group" title="Return to Admin Overview">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white font-black text-sm flex items-center justify-center shadow-sm shadow-[#007AFF]/25 transition-all duration-200 group-hover:scale-105">
              Q
            </div>
            <div className="hidden lg:block leading-tight">
              <span className="font-extrabold text-xs tracking-tight text-slate-900 group-hover:text-[#007AFF] transition-colors block">
                {restaurant.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">POS Terminal</span>
            </div>
          </Link>
          <div className="h-4 w-px bg-black/[0.08]" />

          {/* Apple Segmented Control (hidden for KDS-only kitchen role) */}
          {isKitchenLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 border border-orange-200 text-orange-800 text-xs font-black">
              👨‍🍳 Kitchen Display Only
            </span>
          ) : (
            <div className="flex items-center p-1 rounded-2xl bg-black/[0.05] border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setViewMode("catalog")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[30px] flex items-center gap-1 ${
                  viewMode === "catalog"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Billing</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("live_tables")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[30px] flex items-center gap-1.5 ${
                  viewMode === "live_tables"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Visual Floor</span>
                <span className="text-[9px] px-1 py-0.2 bg-black/[0.06] rounded font-mono text-slate-500">F4</span>
                {liveOrders.filter((o) => (o.status === "served" || o.status === "ready") && o.payment_status === "unpaid").length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[9px] animate-pulse" title="Bills pending">
                    {liveOrders.filter((o) => (o.status === "served" || o.status === "ready") && o.payment_status === "unpaid").length} Bill
                  </span>
                ) : tables.length > 0 ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("kitchen")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[30px] flex items-center gap-1.5 ${
                  viewMode === "kitchen"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Kitchen (KDS)</span>
                <span className="text-[9px] px-1 py-0.2 bg-black/[0.06] rounded font-mono text-slate-500">F8</span>
                {liveOrders.filter((o) => o.status === "placed" || o.status === "preparing").length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FF9500] text-white font-mono font-bold text-[10px]">
                    {liveOrders.filter((o) => o.status === "placed" || o.status === "preparing").length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Center Station Status & Clock */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDiagnosticsModal(true)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
              !isOnline
                ? "bg-rose-50 border-rose-200 text-rose-800 animate-pulse"
                : isSyncing
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200/90 text-emerald-800 hover:bg-emerald-100"
            }`}
            title="Click to view Station Connection Diagnostics"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isOnline ? "bg-rose-500" : isSyncing ? "bg-amber-500 animate-spin" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span>{!isOnline ? "Offline Mode" : isSyncing ? "Syncing..." : "Station Online"}</span>
          </button>

          {currentTime && (
            <div className="px-2.5 py-1 rounded-xl bg-black/[0.04] text-[11px] font-mono font-semibold text-slate-600 flex items-center gap-1">
              <span>🕒</span> {currentTime}
            </div>
          )}
        </div>

        {/* Right Action & Cashier Lock */}
        <div className="flex items-center gap-2">
          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              flash("ok", !soundEnabled ? "Audio Alerts Enabled 🔔" : "Audio Muted 🔕");
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[34px] flex items-center gap-1 active:scale-95 ${
              soundEnabled
                ? "bg-white border-black/[0.08] text-[#007AFF] shadow-xs"
                : "bg-black/[0.03] border-transparent text-slate-500"
            }`}
            title="Toggle Voice Alerts"
          >
            <span>{soundEnabled ? "🔔" : "🔕"}</span>
          </button>

          {/* Open Custom Item Modal */}
          <button
            type="button"
            onClick={() => setShowCustomItemModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 min-h-[34px] bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 hidden sm:inline-flex items-center"
          >
            ＋ Custom Item
          </button>

          {/* Parked Tabs Button */}
          {parkedTabs.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-[#FF9500] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[34px]"
              >
                <span>Hold</span>
                <span className="w-4 h-4 rounded-full bg-white text-[#FF9500] font-mono text-[10px] flex items-center justify-center font-bold">
                  {parkedTabs.length}
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-black/20 rounded font-mono font-normal">F5</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-black/[0.08] rounded-2xl p-2 shadow-xl hidden group-hover:block z-50 animate-in fade-in">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-black/[0.05] mb-1">
                  Parked Orders (F5 to Hold)
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {parkedTabs.map((pt) => (
                    <div
                      key={pt.id}
                      onClick={() => handleRecallTab(pt)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-[#007AFF]/10 border border-black/[0.04] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{pt.customer}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{pt.time} • {pt.cart.length} items</div>
                      </div>
                      <span className="text-xs font-bold text-[#007AFF]">Recall &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shift / Z-Report Button */}
          <button
            type="button"
            onClick={() => setShowZReportModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer min-h-[34px] bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 flex items-center gap-1"
          >
            <span>Shift</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/[0.05] rounded font-mono text-slate-500">F9</span>
          </button>

          {/* Staff Session & Workstation Lock Button */}
          <div className="flex items-center gap-1.5 bg-black/[0.04] p-1 rounded-xl border border-black/[0.05]">
            <span className="text-xs font-bold text-slate-800 px-1.5 flex items-center gap-1">
              <span className="text-slate-400">👤</span>
              <span className="max-w-[70px] truncate">{userName}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsPosLocked(true);
                setEnteredPin("");
                setPinError("");
              }}
              className="px-2 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs border border-black/[0.08] flex items-center gap-1 cursor-pointer transition-all active:scale-95 min-h-[28px]"
              title="Lock workstation (Fast PIN unlock)"
            >
              <span>🔒</span>
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* VERIFICATION PENDING BANNER (UPI) */}
      {liveOrders.filter(o => o.payment_status === "verification_pending").map(order => (
        <div key={`verify-${order.id}`} className="bg-amber-100 border-b-2 border-amber-300 px-4 py-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top z-20 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl text-white flex items-center justify-center font-black animate-pulse shadow-sm">
              ₹
            </div>
            <div>
              <h3 className="text-amber-950 font-black text-sm uppercase tracking-wider">
                Verify UPI Payment
              </h3>
              <p className="text-amber-800 text-xs font-semibold">
                Table {order.table_label || "Counter"} • Order #{order.order_number} • ₹{(order.total_paise / 100).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/pos/active-orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.id, payment_status: "unpaid" }),
                  });
                  if (!res.ok) throw new Error("Failed to reject");
                  toast.error("Payment rejected");
                  fetchLiveOrders();
                } catch (err) {}
              }}
              className="px-4 py-2 bg-white text-rose-600 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-50 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Reject (Not Received)
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/pos/active-orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.id, payment_status: "paid", payment_method: "upi" }),
                  });
                  if (!res.ok) throw new Error("Failed to verify");
                  toast.success("Payment verified!");
                  flash("ok", "UPI Payment Verified ✓");
                  speakVoice("UPI Payment Received");
                  fetchLiveOrders();
                } catch (err) {}
              }}
              className="px-4 py-2 bg-[#29A05C] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:bg-[#22874d] active:scale-95 transition-all cursor-pointer"
            >
              Approve (Money Received)
            </button>
          </div>
        </div>
      ))}

      {/* POS MAIN WORKSPACE AREA */}
      {viewMode === "catalog" && (
        <RegisterView
          restaurant={restaurant}
          categories={categories}
          items={items}
          tables={tables}
          orderType={orderType}
          setOrderType={setOrderType}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          cart={cart}
          addToCart={addToCart}
          updateQty={updateQty}
          setItemNotes={setItemNotes}
          clearCart={clearCart}
          handleParkTab={handleParkTab}
          parkedTabs={parkedTabs}
          handleRecallTab={handleRecallTab}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          flatDiscountRupees={flatDiscountRupees}
          setFlatDiscountRupees={setFlatDiscountRupees}
          isSplitTender={isSplitTender}
          setIsSplitTender={setIsSplitTender}
          splitCashAmount={splitCashAmount}
          setSplitCashAmount={setSplitCashAmount}
          splitUpiAmount={splitUpiAmount}
          setSplitUpiAmount={setSplitUpiAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          isSettling={isSettling}
          handleSettle={handleSettle}
          canSettlePay={canSettlePay}

          msg={msg}
          totalItemCount={totalItemCount}
          subtotalPaise={subtotalPaise}
          discountPaise={discountPaise}
          finalTotalPaise={finalTotalPaise}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerGstin={customerGstin}
          setCustomerGstin={setCustomerGstin}
          rushPriority={rushPriority}
          setRushPriority={setRushPriority}
          customerPoints={customerPoints}
          redeemPoints={redeemPoints}
          setRedeemPoints={setRedeemPoints}
          handleCheckPoints={handleCheckPoints}
          isCheckingPoints={isCheckingPoints}
          liveOrders={liveOrders as any}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          onOpenWaModal={(ord) => setWaModal({
            isOpen: true,
            orderId: ord.id,
            orderNumber: ord.order_number,
            customerPhone: ord.customer_phone || "",
            totalPaise: ord.total_paise || 0,
            statusToken: ord.status_token || ord.id,
          })}
          tableOrderCounts={tableOrderCounts}
          mobileCartOpen={mobileCartOpen}
          setMobileCartOpen={setMobileCartOpen}
          reservations={reservationList}
        />
      )}

      {viewMode === "kitchen" && (
        <KitchenView
          liveOrders={liveOrders as any}
          fetchLiveOrders={fetchLiveOrders}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          restaurant={restaurant as any}
        />
      )}

      {viewMode === "live_tables" && (
        <VisualFloorGrid
          tables={tables}
          orders={liveOrders}
          reservations={reservationList}
          unsettledIds={settlingOrderIds}
          onSelectTable={(tbl) => {
            setSelectedTable(tbl);
          }}
          onOpenRegister={(tbl) => {
            setSelectedTable(tbl);
            setViewMode("catalog");
          }}
          onSettleOrder={
            canSettlePay
              ? (orderId, tbl) => {
                  handleSettleExistingOrder(orderId, tbl, "cash");
                }
              : undefined
          }
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onActionReservation={handleActionReservation}
          onTransferTable={handleTransferTable}
          onPrintBill={(ord) => {
            setLastBill({
              id: ord.id,
              order_number: ord.order_number,
              total_paise: ord.total_paise,
              subtotal_paise: ord.subtotal_paise || ord.total_paise,
              payment_status: ord.payment_status || "unpaid",
              payment_method: ord.payment_method || "cash",
              table_label: ord.table_label || "Table",
              items: ord.items || ord.order_items || [],
            });
            setShowBill(true);
          }}
        />
      )}

      {/* OPEN / CUSTOM ITEM MODAL (Apple Sheet Style) */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-black/[0.08] space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Add Open Custom Item</h3>
              <p className="text-xs text-slate-500 mt-0.5">For unlisted specials, modifications, or open pricing</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Extra Cheese Slice / Chef Special"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#007AFF] focus:bg-white font-medium min-h-[44px] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  placeholder="50"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#007AFF] focus:bg-white font-mono min-h-[44px] transition-all"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCustomItemIsVeg(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] transition-all cursor-pointer ${
                    customItemIsVeg
                      ? "bg-[#34C759]/10 border-[#34C759]/40 text-[#34C759] font-bold"
                      : "bg-white border-black/[0.08] text-slate-600"
                  }`}
                >
                  🟢 Pure Veg
                </button>
                <button
                  type="button"
                  onClick={() => setCustomItemIsVeg(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] transition-all cursor-pointer ${
                    !customItemIsVeg
                      ? "bg-[#FF3B30]/10 border-[#FF3B30]/40 text-[#FF3B30] font-bold"
                      : "bg-white border-black/[0.08] text-slate-600"
                  }`}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-slate-700 font-semibold text-xs hover:bg-slate-50 min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs shadow-sm min-h-[44px] cursor-pointer active:scale-95 transition-transform"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT Z-REPORT MODAL (Apple Light Bento Card) */}
      {showZReportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/[0.08] space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Shift Z-Report & Cash Drawer</h3>
                <p className="text-xs text-slate-500 mt-0.5">Terminal 1 Shift Closing & Cash Reconciliation</p>
              </div>
              <button
                onClick={() => setShowZReportModal(false)}
                className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Shift Sales</div>
                <div className="text-base font-bold font-mono text-[#34C759] mt-0.5">₹{(zReport.totalRevenuePaise / 100).toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{zReport.orderCount} Settled Orders</div>
              </div>
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cash Sales</div>
                <div className="text-base font-bold font-mono text-[#FF9500] mt-0.5">₹{(zReport.cashSalesPaise / 100).toFixed(2)}</div>
              </div>
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">UPI Sales</div>
                <div className="text-base font-bold font-mono text-[#007AFF] mt-0.5">₹{(zReport.upiSalesPaise / 100).toFixed(2)}</div>
              </div>
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Card Sales</div>
                <div className="text-base font-bold font-mono text-[#5856D6] mt-0.5">₹{(zReport.cardSalesPaise / 100).toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-black/[0.06] text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#007AFF] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Paid Out Expenses / Vendor Petty Cash (₹)</label>
                <input
                  type="number"
                  value={payoutsAmount}
                  onChange={(e) => setPayoutsAmount(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#007AFF] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Actual Physical Cash Count (₹)</label>
                <input
                  type="number"
                  placeholder={`Expected: ₹${(zReport.expectedDrawerCashPaise / 100).toFixed(2)}`}
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#007AFF] focus:bg-white transition-colors"
                />
              </div>

              <div className="p-3 bg-[#F5F5F7] rounded-2xl border border-black/[0.04] space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Expected Drawer Cash:</span>
                  <span className="font-mono font-medium text-slate-800">₹{(zReport.expectedDrawerCashPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">Cash Variance:</span>
                  <span className={`font-mono ${zReport.cashVariancePaise < 0 ? "text-[#FF3B30]" : zReport.cashVariancePaise > 0 ? "text-[#34C759]" : "text-slate-600"}`}>
                    {zReport.cashVariancePaise === 0 ? "₹0.00 (Balanced ✓)" : `${zReport.cashVariancePaise > 0 ? "+" : ""}₹${(zReport.cashVariancePaise / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  flash("ok", "Printing Z-Report slip...");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-transform"
              >
                🖨️ Print Shift Z-Report
              </button>
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="py-2.5 px-4 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL SETTLEMENT MODAL (Apple Clean Receipt Style) */}
      {showBill && lastBill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowBill(false)}>
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-black/[0.08] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className={`p-3.5 text-center font-black text-xs tracking-wider flex items-center justify-center gap-2 ${lastBill.payment_status === "paid" ? "bg-[#34C759] text-white" : "bg-[#FF9500] text-white"}`}>
              <span>{lastBill.payment_status === "paid" ? "✓ PAYMENT SUCCESSFUL" : "⚠️ PAYMENT PENDING"}</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center border-b border-black/[0.06] pb-3">
                <h3 className="font-black text-lg text-slate-900">{restaurant.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{restaurant.address || ""} {restaurant.phone ? `• ${restaurant.phone}` : ""}</p>
                <div className="flex items-center justify-center gap-2 mt-1 font-mono text-xs font-bold text-[#5738F5]">
                  <span>Order #{lastBill.order_number || lastBill.orderNumber}</span>
                  <span>•</span>
                  <span>Table {lastBill.table_label}</span>
                  <span>•</span>
                  <span>₹{(((lastBill.finalTotalPaise ?? lastBill.total_paise ?? 0)) / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                {(lastBill.itemsSnapshot || lastBill.order_items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{it.item?.name || it.item_name} × {it.quantity}</span>
                    <span className="font-mono font-semibold text-slate-900">₹{(((it.item?.price_paise || it.unit_price_paise || 0) * it.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/[0.06] pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-slate-800">₹{(lastBill.subtotalPaise || lastBill.subtotal_paise || 0) / 100}</span>
                </div>
                {(lastBill.discountPaise || lastBill.discount_paise || 0) > 0 && (
                  <div className="flex justify-between text-[#34C759]">
                    <span>Discount</span>
                    <span className="font-mono font-medium">-₹{(lastBill.discountPaise || lastBill.discount_paise || 0) / 100}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base text-slate-900 pt-1">
                  <span>Total Due</span>
                  <span className="font-mono text-[#5738F5]">₹{(((lastBill.finalTotalPaise ?? lastBill.total_paise ?? 0)) / 100).toFixed(2)}</span>
                </div>
                <div className={`p-2.5 rounded-xl text-center text-xs font-semibold mt-1 ${lastBill.payment_status === "paid" ? "bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20" : "bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20"}`}>
                  {lastBill.payment_status === "paid" ? `✓ Settled via ${(lastBill.paymentMethod || "CASH").toUpperCase()}` : `⚠️ Please collect ₹${(((lastBill.finalTotalPaise ?? lastBill.total_paise ?? 0)) / 100).toFixed(2)} at counter`}
                </div>
              </div>

              {/* 5 POS FLOW ACTION BUTTONS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    flash("ok", "Printing bill receipt...");
                  }}
                  className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️ Print Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsAppModal({
                      orderId: lastBill.id || "",
                      orderNumber: lastBill.order_number || lastBill.orderNumber || "",
                      customerPhone: lastBill.customer_phone || customerPhone || "",
                      totalPaise: lastBill.finalTotalPaise ?? lastBill.total_paise ?? 0,
                      statusToken: lastBill.status_token || lastBill.id || "",
                      tableLabel: lastBill.table_label,
                      paymentMethod: lastBill.paymentMethod || lastBill.payment_method,
                    })
                  }
                  className="py-2 px-2.5 rounded-xl bg-[#34C759] hover:bg-[#2EB84E] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>💬 WhatsApp</span>
                </button>

                {/* WhatsApp button removed */}

                <button
                  type="button"
                  onClick={async () => {
                    const doc = await generateBeautifulBillPdf({
                      restaurant: {
                        name: restaurant.name || "QRslice",
                        address: restaurant.address || "",
                        phone: restaurant.phone || "",
                        email: restaurant.email || "",
                        gstin: restaurant.gstin || "",
                        fssai: restaurant.fssai || "",
                      },
                      order: {
                        order_number: lastBill.order_number || lastBill.orderNumber || "POS-BILL",
                        table_label: lastBill.table_label || "Counter",
                        total_paise: lastBill.finalTotalPaise ?? lastBill.total_paise ?? 0,
                        subtotal_paise: lastBill.subtotalPaise ?? lastBill.subtotal_paise ?? 0,
                        discount_paise: lastBill.discountPaise ?? lastBill.discount_paise ?? 0,
                        payment_status: lastBill.payment_status || "paid",
                        payment_method: lastBill.paymentMethod || lastBill.payment_method || "cash",
                        cashier_name: "Terminal 1",
                        created_at: new Date().toISOString(),
                      },
                      items: (lastBill.itemsSnapshot || lastBill.order_items || lastBill.items || []).map((it: any) => ({
                        item_name: it.item?.name || it.item_name || it.name || "Item",
                        quantity: it.quantity || 1,
                        unit_price_paise: it.item?.price_paise ?? it.unit_price_paise ?? it.price_paise ?? it.unitPricePaise ?? 0,
                        notes: it.notes || "",
                      })),
                    });
                    doc.save(`TaxInvoice-${lastBill.order_number || lastBill.orderNumber}.pdf`);
                    flash("ok", "Tax Invoice PDF downloaded! 📄");
                  }}
                  className="py-2 px-2.5 rounded-xl bg-[#5738F5]/10 hover:bg-[#5738F5]/20 text-[#5738F5] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📄 PDF Bill</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const email = prompt("Enter guest email address to send invoice:");
                    if (!email || !email.includes("@")) {
                      if (email) flash("err", "Invalid email address");
                      return;
                    }
                    if (!lastBill.id) {
                      flash("err", "No order id — cannot email invoice");
                      return;
                    }
                    try {
                      const res = await fetch("/api/invoice-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          order_id: lastBill.id,
                          email: email.trim(),
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(data.error || `Request failed (${res.status})`);
                      }
                      flash("ok", `Invoice emailed to ${email} ✓`);
                    } catch (err) {
                      flash(
                        "err",
                        err instanceof Error ? err.message : "Failed to email invoice",
                      );
                    }
                  }}
                  className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✉️ Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowBill(false);
                    clearCart();
                    flash("ok", "Ready for next order! Station reset.");
                  }}
                  className="col-span-2 sm:col-span-2 py-2 px-2.5 rounded-xl bg-[#17142B] hover:bg-[#2A273A] text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>＋ New Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP BILL MODAL (First-Class Receipt System) */}
      {waModal?.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/[0.08] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600">💬</span> Send WhatsApp Bill
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order #{waModal.orderNumber} • ₹{(waModal.totalPaise / 100).toFixed(2)}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                WhatsApp ✓ Available
              </span>
            </div>

            {/* Quick Customer Phone Chips */}
            {recentPhones.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Diners (1-Click)</span>
                <div className="flex flex-wrap gap-1.5">
                  {recentPhones.map((phone) => (
                    <button
                      key={phone}
                      type="button"
                      onClick={() => setWaModal({ ...waModal, customerPhone: phone })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        waModal.customerPhone === phone
                          ? "bg-[#34C759] text-white font-bold shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      +91 {phone.slice(-10)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Recipient WhatsApp Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={waModal.customerPhone}
                onChange={(e) => setWaModal({ ...waModal, customerPhone: e.target.value })}
                className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#34C759] focus:bg-white font-mono min-h-[44px] transition-all font-bold"
              />
            </div>

            <div className="p-3 bg-[#F8F7FC] rounded-2xl border border-slate-200 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#34C759]" />
                <span>Attachment: ✓ PDF Tax Invoice Included</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#34C759]" />
                <span>Include &ldquo;Order Again&rdquo; &amp; Google 5★ Review Link</span>
              </label>
              <div className="pt-1 text-[11px] font-mono text-[#5738F5]">
                Delivery Tracking: Sent ✓ • Delivered ✓ • Read ✓
              </div>
            </div>

            {/* Browser Popup Blocker Fallback */}
            {blockedWaUrl && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-800 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span> Pop-up blocked by your browser
                </div>
                <p className="text-[11px] leading-relaxed">
                  Browser prevented WhatsApp from opening automatically. Copy link or open directly:
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(blockedWaUrl);
                      flash("ok", "WhatsApp link copied to clipboard! 📋");
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    📋 Copy Link
                  </button>
                  <a
                    href={blockedWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-lg hover:bg-amber-100 flex items-center gap-1"
                  >
                    Open ↗
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setWaModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-slate-700 font-semibold text-xs hover:bg-slate-50 min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingWa}
                onClick={() => handleSendWhatsApp(waModal.customerPhone, waModal)}
                className="flex-1 py-2.5 rounded-xl bg-[#34C759] hover:bg-[#2EB84E] disabled:opacity-50 text-white font-black text-xs shadow-sm min-h-[44px] cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                {isSendingWa ? "Sending..." : "Send WhatsApp Bill ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATION CONNECTION & HEALTH DIAGNOSTICS MODAL */}
      {showDiagnosticsModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDiagnosticsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/[0.08] space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <span>Station Connection Status</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time health of workstation data feeds & peripherals</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-black/[0.05] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Internet Connection</span>
                <span className={`font-mono font-bold flex items-center gap-1.5 ${isOnline ? "text-emerald-700" : "text-rose-600"}`}>
                  <span>{isOnline ? "✓ Connected" : "✕ Offline"}</span>
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Cloud Database (Supabase)</span>
                <span className="font-mono font-bold text-emerald-700">✓ Connected</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Realtime WebSocket Sync</span>
                <span className="font-mono font-bold text-emerald-700">✓ Active Stream</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Thermal KOT Printer</span>
                <span className={`font-mono font-bold ${printer?.isConnected ? "text-emerald-700" : "text-slate-500"}`}>
                  {printer?.isConnected ? `✓ Connected (${printer.deviceName || "Thermal POS"})` : "○ Disconnected (ESC/POS)"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Thermal Receipt Printer</span>
                <span className={`font-mono font-bold ${printer?.isConnected ? "text-emerald-700" : "text-slate-500"}`}>
                  {printer?.isConnected ? "✓ Ready for 80mm/58mm" : "○ Disconnected (ESC/POS)"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Offline Order Queue</span>
                <span className="font-mono font-bold text-emerald-700">✓ Synced (0 pending)</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Last Live Data Sync</span>
                <span className="font-mono font-semibold text-slate-800">{lastSyncTime || "Just now"}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  fetchLiveOrders();
                  flash("ok", "Refreshed live orders from cloud database ⟳");
                }}
                className="flex-1 py-2.5 bg-black/[0.04] hover:bg-black/[0.08] text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⟳ Sync Now</span>
              </button>
              {printer?.isConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    printer.testPrint();
                    flash("ok", "Sent test print to thermal printer 🖨️");
                  }}
                  className="flex-1 py-2.5 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  🖨️ Test Print
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    printer?.connect?.();
                  }}
                  className="flex-1 py-2.5 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  ⚡ Connect Printer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WORKSTATION PIN SECURITY LOCK OVERLAY */}
      {isPosLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-black/[0.08] text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mx-auto mb-2 shadow-xs">
                🔒
              </div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">Workstation Locked</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Active: <span className="font-bold text-slate-800">{userName}</span> ({userRole || "Cashier"})
              </p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = enteredPin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? "bg-[#007AFF] scale-110 shadow-xs shadow-[#007AFF]/50"
                        : "bg-slate-200 border border-black/[0.08]"
                    }`}
                  />
                );
              })}
            </div>

            {pinError ? (
              <p className="text-xs text-rose-600 font-bold animate-shake">{pinError}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Enter 4-digit PIN to resume workstation</p>
            )}

            {/* 3x4 Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const next = (enteredPin + num).slice(0, 4);
                    setEnteredPin(next);
                    if (next.length === 4) {
                      setTimeout(() => handleUnlockPin(next), 100);
                    }
                  }}
                  className="h-12 rounded-2xl bg-[#F5F5F7] hover:bg-slate-200/80 active:bg-slate-300 text-slate-900 font-bold text-base transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEnteredPin((prev) => prev.slice(0, -1))}
                className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                ⌫ Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = (enteredPin + "0").slice(0, 4);
                  setEnteredPin(next);
                  if (next.length === 4) {
                    setTimeout(() => handleUnlockPin(next), 100);
                  }
                }}
                className="h-12 rounded-2xl bg-[#F5F5F7] hover:bg-slate-200/80 active:bg-slate-300 text-slate-900 font-bold text-base transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleUnlockPin()}
                className="h-12 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 active:bg-[#007AFF] text-white font-bold text-xs transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
              >
                Unlock
              </button>
            </div>

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">Staff PIN required</span>
              <Link
                href="/login"
                className="text-xs font-semibold text-[#007AFF] hover:underline"
              >
                Switch User / Log out &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
