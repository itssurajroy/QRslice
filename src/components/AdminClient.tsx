"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { generateBeautifulQrDataUrl } from "@/lib/qr-designer";
import { printSingleStandCard, printBulkStandCards } from "@/lib/print-standee";
import { PrintStandCardModal } from "@/components/admin/PrintStandCardModal";
import Link from "next/link";
import { DashboardTab } from "@/features/admin/tabs/DashboardTab";
import { SettingsTab } from "@/features/admin/tabs/SettingsTab";
import { MenuTab } from "@/features/admin/tabs/MenuTab";
import { TablesTab } from "@/features/admin/tabs/TablesTab";
import { ReservationsTab } from "@/features/admin/tabs/ReservationsTab";
import { ReportSummary, FloorIntelligence } from "@/features/admin/tabs/AnalyticsTab";
import { BrandingTab } from "@/features/admin/tabs/BrandingTab";
import BillingClient from "@/components/BillingClient";

import { InventoryTab } from "@/features/admin/tabs/InventoryTab";
import { RecipesTab } from "@/features/admin/tabs/RecipesTab";
import { KdsTab } from "@/features/admin/tabs/KdsTab";
import { WebhooksTab } from "@/features/admin/tabs/WebhooksTab";
import { SupportTab } from "@/features/admin/tabs/SupportTab";
import { OrdersTab, type OrderData } from "@/features/admin/tabs/OrdersTab";
import { ModifiersTab } from "@/features/admin/tabs/ModifiersTab";
import { StaffTab } from "@/features/admin/tabs/StaffTab";
import { CrmTab } from "@/features/admin/tabs/CrmTab";
import { AccountTab } from "@/features/admin/tabs/AccountTab";
import { IntegrationsTab } from "@/features/admin/tabs/IntegrationsTab";
import { AdminAppShell, type AdminSectionId } from "@/components/shell/AdminAppShell";
import { MultiOutletModal } from "@/features/admin/MultiOutletModal";
import type { AdminTabId } from "@/features/admin/AdminTopNav";
import { PlatformAnnouncementBanner } from "@/components/notifications/PlatformAnnouncementBanner";
import type { Category, MenuItem as Item, Table } from "@/types";
import { speakHumanVoice } from "@/lib/tts";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { canAccessTab, getDefaultTabForRole } from "@/lib/role-permissions";
import { getTierLimits } from "@/lib/tier-limits";
import { UpgradeRequired } from "@/components/UpgradeRequired";

type Report = { orders: number; paid: number; revenue: number; avg: number };

interface RestaurantProps {
  id: string;
  name?: string;
  slug?: string;
  tax_rate?: number;
  upi_id?: string;
  upi_qr_url?: string;
  gst_number?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  tagline?: string;
  google_review_url?: string;
  accent_color?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  plan?: string;
  tier?: string;
  trial_ends_at?: string;
  api_key?: string;
  webhook_url?: string;
}

interface AnalyticsData {
  today?: { orders: number; revenue: number };
  recentOrders?: unknown[];
  [key: string]: unknown;
}

interface BulkImportItem {
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  description: string;
}

export default function AdminClient({
  restaurantId,
  restaurant,
  userRole,
  categories,
  items,
  tables,
  report,
}: {
  restaurantId: string;
  restaurant?: RestaurantProps;
  userRole?: string;
  categories: Category[];
  items: Item[];
  tables: Table[];
  report: Report;
}) {
  const activeRestaurant: RestaurantProps = restaurant || { id: restaurantId, name: "QRslice", slug: "cafe" };

  // Toast/Flash Alert
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const flash = useCallback((kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  }, []);

  const normalizeTab = (raw: string | null): AdminSectionId | AdminTabId => {
    if (!raw) return "dashboard";
    if (raw === "kds") return "kitchen";
    if (raw === "account") return "branding";
    if (raw === "webhooks") return "integrations";
    if (raw === "reservations") return "bookings";
    if (raw === "report") return "analytics";
    return raw as AdminSectionId | AdminTabId;
  };

  const [tab, setTab] = useState<AdminSectionId | AdminTabId>(() => {
    let initial = "dashboard";
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab) initial = normalizeTab(urlTab);
    }
    if (!canAccessTab(userRole, initial)) {
      return getDefaultTabForRole(userRole) as AdminSectionId | AdminTabId;
    }
    return initial as AdminSectionId | AdminTabId;
  });

  const tierLimits = getTierLimits(activeRestaurant.tier);

  useEffect(() => {
    const handlePopState = () => {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab) {
        const norm = normalizeTab(urlTab);
        if (canAccessTab(userRole, norm)) {
          setTab(norm);
        } else {
          const fallback = getDefaultTabForRole(userRole) as AdminSectionId | AdminTabId;
          setTab(fallback);
          flash("err", "Access restricted: Your role does not have permission to view this section.");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [userRole, flash]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab && !canAccessTab(userRole, normalizeTab(urlTab))) {
        flash("err", "Access restricted: Redirected to your authorized workspace.");
      }
    }
  }, [userRole, flash]);

  const handleSelectTab = (nextTab: AdminSectionId | AdminTabId) => {
    const normalized = normalizeTab(nextTab);
    if (!canAccessTab(userRole, normalized)) {
      const fallback = getDefaultTabForRole(userRole) as AdminSectionId | AdminTabId;
      setTab(fallback);
      flash("err", "Access restricted: Your role does not have permission to view this section.");
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", fallback);
        window.history.pushState(null, "", url.toString());
      }
      return;
    }
    setTab(normalized);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== nextTab) {
        url.searchParams.set("tab", nextTab);
        window.history.pushState(null, "", url.toString());
      }
    }
  };
  const [showMultiOutletModal, setShowMultiOutletModal] = useState(false);
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [itemList, setItemList] = useState<Item[]>(items);
  const [tableList, setTableList] = useState<Table[]>(tables);

  const [settingsCafeName, setSettingsCafeName] = useState(activeRestaurant.name || "");
  const [settingsTaxRate, setSettingsTaxRate] = useState(activeRestaurant.tax_rate || 5);
  const [settingsUpiId, setSettingsUpiId] = useState(activeRestaurant.upi_id || "");
  const [settingsUpiQrUrl, setSettingsUpiQrUrl] = useState(activeRestaurant.upi_qr_url || "");
  const [settingsPhone, setSettingsPhone] = useState(activeRestaurant.phone || "");
  const [settingsAddress, setSettingsAddress] = useState(activeRestaurant.address || "");

  // Tent Standee Config
  const wifiSsid = activeRestaurant.wifi_ssid || "Cafe_Guest_5G";
  const wifiPassword = activeRestaurant.wifi_password || "welcome123";

  // Modal / Form States
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCatId, setNewItemCatId] = useState(categories[0]?.id || "");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemBestseller, setNewItemBestseller] = useState(false);
  const [newItemSpiceIndex, setNewItemSpiceIndex] = useState(0);
  const [newItemTags, setNewItemTags] = useState("");
  const [newItemImageFile, setNewItemImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [isAddingTable, setIsAddingTable] = useState(false);

  // Branding Form State (Pro tier)
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(activeRestaurant.logo_url || "");
  const [brandingTagline, setBrandingTagline] = useState(activeRestaurant.tagline || "");
  const [brandingGoogleReviewUrl, setBrandingGoogleReviewUrl] = useState(activeRestaurant.google_review_url || "");
  const [brandingAccentColor, setBrandingAccentColor] = useState(activeRestaurant.accent_color || "#f59e0b");
  const [savingBranding, setSavingBranding] = useState(false);

  // Bulk Menu Import State
  const [showBulkMenuModal, setShowBulkMenuModal] = useState(false);
  const [bulkMenuText, setBulkMenuText] = useState("");
  const [parsedBulkItems, setParsedBulkItems] = useState<BulkImportItem[]>([]);
  const [isImportingMenu, setIsImportingMenu] = useState(false);

  // QR Modal States
  const [qrModal, setQrModal] = useState<{
    label: string;
    url: string;
    directUrl: string;
    seats: number;
  } | null>(null);

  const [bulkQrModal, setBulkQrModal] = useState(false);
  const [bulkQrList, setBulkQrList] = useState<
    { label: string; url: string; directUrl: string; seats: number }[]
  >([]);
  const [generatingBulk, setGeneratingBulk] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Live Revenue Ticker
  const [liveRevenue, setLiveRevenue] = useState<number>(report.revenue);
  const [liveOrders, setLiveOrders] = useState<number>(report.orders);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);

  // Bulk Menu Operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);

  // Drag-and-drop sort
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Checklist dismissal
  const [dismissChecklist, setDismissChecklist] = useState(false);


  const plan = restaurant?.plan || "trial";
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (864e5))) : 0;
  const isTrial = plan === "trial";
  const isSuspended = plan === "suspended" || (isTrial && daysLeft === 0);

  // Live ticker: refresh revenue + order feed every 30 seconds
  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const d = await res.json();
          if (d.today) {
            setLiveRevenue(d.today.revenue ?? report.revenue);
            setLiveOrders(d.today.orders ?? report.orders);
          }
          if (d.recentOrders) setRecentOrders(d.recentOrders);
        }
      } catch { /* network fail, keep last value */ }
    }
    fetchLive();
    const ticker = setInterval(fetchLive, 30000);
    return () => clearInterval(ticker);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bulk selection helpers
  function toggleSelectItem(id: string) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      setShowBulkBar(next.size > 0);
      return next;
    });
  }

  function selectAllItems() {
    const all = new Set(itemList.map(i => i.id));
    setSelectedItems(all);
    setShowBulkBar(true);
  }

  function clearSelection() {
    setSelectedItems(new Set());
    setShowBulkBar(false);
  }

  async function bulkToggleAvailability(available: boolean) {
    const ids = Array.from(selectedItems);
    try {
      await Promise.all(ids.map(id => fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "toggle_item_availability", itemId: id, available }),
      })));
      setItemList(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, available } : i));
      flash("ok", `${ids.length} items ${available ? "enabled" : "disabled"}`);
      clearSelection();
    } catch {
      flash("err", "Bulk update failed");
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedItems.size} items? This cannot be undone.`)) return;
    const ids = Array.from(selectedItems);
    try {
      await Promise.all(ids.map(id => fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_item", itemId: id }),
      })));
      setItemList(prev => prev.filter(i => !selectedItems.has(i.id)));
      flash("ok", `${ids.length} items deleted`);
      clearSelection();
    } catch {
      flash("err", "Bulk delete failed");
    }
  }

  // Drag-and-drop sort handlers
  function handleDragStart(id: string) { setDraggedItemId(id); }
  function handleDragEnd() { setDraggedItemId(null); }
  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;
    setItemList(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(i => i.id === draggedItemId);
      const toIdx = arr.findIndex(i => i.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  }

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      flash("err", "Failed to fetch analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [flash]);

  useEffect(() => {
    if (tab === "analytics" && !analytics) {
      let active = true;
      fetch("/api/analytics")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data) setAnalytics(data);
        })
        .catch(() => {
          if (active) flash("err", "Failed to fetch analytics");
        });
      return () => {
        active = false;
      };
    }
  }, [tab, analytics, flash]);

  async function handleToggleAvailable(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "toggle_item_availability",
          itemId: id,
          available: !current,
        }),
      });
      if (!res.ok) return flash("err", "Failed to update item availability");
      setItemList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, available: !current } : i)),
      );
      flash("ok", `Item marked ${!current ? "in stock" : "sold out"}`);
    } catch {
      flash("err", "Error updating availability");
    }
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(priceNum) || priceNum <= 0) {
      return flash("err", "Please provide a valid item name and price");
    }

    setIsUploading(true);
    let uploadedUrl = null;
    try {
      if (newItemImageFile) {
        const supabase = getSupabaseBrowserClient();
        const fileExt = newItemImageFile.name.split('.').pop();
        const fileName = `${restaurantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // TODO: Register a DMCA Designated Agent with the U.S. Copyright Office ($6 fee) to limit statutory damages.
        // Ensure upload flows reference copyright policies.
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, newItemImageFile);

        if (uploadError) {
          throw new Error("Failed to upload image: " + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("images")
          .getPublicUrl(fileName);
          
        uploadedUrl = publicUrl;
      }

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_item",
          categoryId: newItemCatId,
          name: newItemName.trim(),
          pricePaise: Math.round(priceNum * 100),
          description: newItemDesc.trim(),
          isVeg: newItemVeg,
          isBestseller: newItemBestseller,
          spiceIndex: newItemSpiceIndex,
          tags: newItemTags.split(',').map(t => t.trim()).filter(Boolean),
          imageUrl: uploadedUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) return flash("err", data.error || "Failed to create dish");
      setItemList((prev) => [...prev, data.item]);
      setNewItemName("");
      setNewItemPrice("");
      setNewItemDesc("");
      setNewItemImageFile(null);
      setNewItemBestseller(false);
      setNewItemSpiceIndex(0);
      setNewItemTags("");
      setShowItemModal(false);
      flash("ok", "Menu item added successfully!");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Error adding item");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_item", itemId }),
      });
      if (!res.ok) return flash("err", "Failed to delete item");
      setItemList((prev) => prev.filter((i) => i.id !== itemId));
      flash("ok", "Item deleted");
    } catch {
      flash("err", "Error deleting item");
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_category",
          name: newCatName.trim(),
          sortOrder: categoryList.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) return flash("err", data.error || "Failed to create category");
      setCategoryList((prev) => [...prev, data.category]);
      setNewCatName("");
      setShowCatModal(false);
      flash("ok", "Category created!");
    } catch {
      flash("err", "Error creating category");
    }
  }

  // Parse raw text or CSV content for bulk menu import
  function handleBulkParse(rawText: string) {
    setBulkMenuText(rawText);
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const items: BulkImportItem[] = [];

    lines.forEach((line) => {
      // Split by comma, tab, or pipe
      const parts = line.split(/[,|\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const price = parseFloat(parts[1].replace(/[^0-9.]/g, "")) || 0;
        const category = parts[2] || "General Menu";
        const isVeg = parts[3] ? !parts[3].toLowerCase().includes("non") : true;
        const description = parts[4] || "";

        if (name && price > 0) {
          items.push({ name, price, category, isVeg, description });
        }
      }
    });

    setParsedBulkItems(items);
  }

  async function handleBulkImportSubmit() {
    if (parsedBulkItems.length === 0) {
      return flash("err", "No valid items to import. Please check format.");
    }

    setIsImportingMenu(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bulk_import_items",
          items: parsedBulkItems,
        }),
      });
      const data = await res.json();
      setIsImportingMenu(false);
      if (!res.ok) return flash("err", data.error || "Failed to bulk import dishes");

      if (data.items) {
        setItemList((prev) => [...prev, ...data.items]);
      }
      setShowBulkMenuModal(false);
      setBulkMenuText("");
      setParsedBulkItems([]);
      flash("ok", `🎉 Successfully imported ${data.count || parsedBulkItems.length} dishes!`);
    } catch {
      setIsImportingMenu(false);
      flash("err", "Network error during bulk import");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm("Are you sure? This will delete the category and all items inside it.")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_category", categoryId }),
      });
      if (!res.ok) return flash("err", "Failed to delete category");
      setCategoryList((prev) => prev.filter((c) => c.id !== categoryId));
      setItemList((prev) => prev.filter((i) => i.category_id !== categoryId));
      flash("ok", "Category deleted");
    } catch {
      flash("err", "Error deleting category");
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableLabel.trim()) return;
    setIsAddingTable(true);

    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_table",
          label: newTableLabel.trim(),
          seats: newTableSeats,
        }),
      });
      const data = await res.json();
      setIsAddingTable(false);
      if (!res.ok) return flash("err", data.error || "Failed to add table");

      setTableList((prev) => [...prev, data.table]);
      setNewTableLabel("");
      flash("ok", `Table ${data.table.label} created!`);
    } catch {
      setIsAddingTable(false);
      flash("err", "Error adding table");
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm("Delete this table?")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_table", tableId }),
      });
      if (!res.ok) return flash("err", "Failed to delete table");
      setTableList((prev) => prev.filter((t) => t.id !== tableId));
      flash("ok", "Table removed");
    } catch {
      flash("err", "Error deleting table");
    }
  }

  async function handleUpdateTable(tableId: string, updates: { label?: string; seats?: number; active?: boolean }) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update_table", tableId, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash("err", data.error || "Failed to update table");
        return false;
      }
      setTableList((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...data.table } : t)));
      flash("ok", `Table ${data.table.label} updated!`);
      return true;
    } catch {
      flash("err", "Error updating table");
      return false;
    }
  }

  async function handleToggleTableActive(tableId: string, currentActive: boolean) {
    const nextActive = !currentActive;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "toggle_table_active", tableId, active: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash("err", data.error || "Failed to update table");
        return;
      }
      setTableList((prev) => prev.map((t) => (t.id === tableId ? { ...t, active: nextActive } : t)));
      flash("ok", nextActive ? "Table activated" : "Table marked out of service");
    } catch {
      flash("err", "Error toggling table status");
    }
  }

  async function handleRegenerateQr(tableId: string) {
    if (!confirm("Regenerate QR token for this table? Any existing printed QR for this table will stop working until replaced with the new one.")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "regenerate_qr", tableId }),
      });
      const data = await res.json();
      if (!res.ok) return flash("err", data.error || "Failed to regenerate QR");
      setTableList((prev) => prev.map((t) => (t.id === tableId ? { ...t, qr_token: data.qr_token } : t)));
      flash("ok", "New secure QR generated! Please print the updated standee.");
    } catch {
      flash("err", "Error regenerating QR");
    }
  }

  async function handleBulkCreateTables(params: { prefix: string; start: number; count: number; seats: number }) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bulk_create_tables", ...params }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash("err", data.error || "Failed to create tables");
        return false;
      }
      setTableList((prev) => [...prev, ...(data.tables || [])]);
      flash("ok", `Successfully added ${data.tables?.length || 0} tables!`);
      return true;
    } catch {
      flash("err", "Error creating tables");
      return false;
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_branding",
          logoUrl: brandingLogoUrl.trim() || null,
          tagline: brandingTagline.trim() || null,
          googleReviewUrl: brandingGoogleReviewUrl.trim() || null,
          accentColor: brandingAccentColor,
        }),
      });
      if (res.ok) {
        flash("ok", "Branding preferences saved!");
      } else {
        flash("err", "Failed to save branding");
      }
    } catch {
      flash("err", "Error saving branding settings");
    } finally {
      setSavingBranding(false);
    }
  }

  async function generateQrDataUrl(tableOrToken: Table | string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://qrslice.com";
    let url = "";
    if (typeof tableOrToken === "string") {
      url = `${origin}/t/${tableOrToken}`;
    } else {
      url = tableOrToken.qr_token
        ? `${origin}/t/${tableOrToken.qr_token}`
        : `${origin}/c/${restaurant?.slug || "cafe"}/t/${encodeURIComponent(tableOrToken.label)}`;
    }
    const dataUrl = generateBeautifulQrDataUrl({
      text: url,
      size: 600,
      theme: "violet",
      centerIcon: "utensils",
      dotShape: "dots",
    });
    return { dataUrl, url };
  }

  async function showQr(t: Table) {
    const { dataUrl, url } = await generateQrDataUrl(t);
    setQrModal({ label: t.label, url: dataUrl, directUrl: url, seats: t.seats });
  }

  async function showBulkQr() {
    setGeneratingBulk(true);
    const list = [];
    for (const t of tableList) {
      const { dataUrl, url } = await generateQrDataUrl(t);
      list.push({ label: t.label, url: dataUrl, directUrl: url, seats: t.seats });
    }
    setBulkQrList(list);
    setGeneratingBulk(false);
    setBulkQrModal(true);
  }

  const [hideTrialBanner, setHideTrialBanner] = useState(false);

  async function handleUpdateOrderStatus(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update order status");
    }
    flash("ok", "Order status updated");
    // Refresh live feed
    try {
      const aRes = await fetch("/api/analytics");
      if (aRes.ok) {
        const d = await aRes.json();
        if (d.recentOrders) setRecentOrders(d.recentOrders);
        if (d.today) {
          setLiveRevenue(d.today.revenue ?? liveRevenue);
          setLiveOrders(d.today.orders ?? liveOrders);
        }
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <AdminAppShell
      currentSection={tab as AdminSectionId}
      onSelectSection={(sec) => handleSelectTab(sec)}
      restaurantName={activeRestaurant.name || "QrSlice Cafe"}
      restaurantSlug={activeRestaurant.slug || "cafe"}
      userRole={userRole}
      liveRevenue={liveRevenue}
      liveOrders={liveOrders}
      onOpenSearch={() => handleSelectTab("orders")}
    >
      {/* Trial countdown — trial state only, dismissible per session */}
      {isTrial && !isSuspended && !hideTrialBanner && (
        <div className="bg-[#5738F5] text-white no-print rounded-2xl mb-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-3 text-xs font-bold">
            <span>
              {daysLeft > 0
                ? `Free trial · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left — full access, no card needed`
                : "Free trial ends today — upgrade to keep ordering live"}
            </span>
            <Link
              href="/admin/billing"
              className="px-2.5 py-1 rounded-lg bg-white text-[#5738F5] font-black hover:bg-slate-50 transition-colors shrink-0"
            >
              Upgrade now
            </Link>
            <button
              type="button"
              onClick={() => setHideTrialBanner(true)}
              aria-label="Dismiss trial banner"
              className="text-purple-200 hover:text-white font-bold shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 no-print flex-1 w-full">
        {/* Super Admin Platform Broadcast Announcement */}
        <PlatformAnnouncementBanner />

        {/* Onboarding Starter Checklist (Dismissible) */}
        {!dismissChecklist && (() => {
          const doneCount = (itemList.length > 0 ? 1 : 0) + (tableList.length > 0 ? 1 : 0);
          const pct = Math.round((doneCount / 2) * 100);
          return (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-indigo-50/60 border border-indigo-100 shadow-lg shadow-indigo-100/50 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center text-sm shadow-md shadow-brand/25">🚀</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Café Launch Checklist</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{doneCount === 2 ? "All set — you're live! 🎉" : `${doneCount} of 2 setup steps complete`}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissChecklist(true)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Dismiss ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-colors ${itemList.length > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${itemList.length > 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {itemList.length > 0 ? "✓" : "1"}
                  </span>
                  <span className="text-slate-700 font-semibold">Add Menu Dishes ({itemList.length})</span>
                </div>
                <div className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-colors ${tableList.length > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${tableList.length > 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {tableList.length > 0 ? "✓" : "2"}
                  </span>
                  <span className="text-slate-700 font-semibold">Generate Tables & QRs ({tableList.length})</span>
                </div>
                <Link href={restaurant?.slug ? `/c/${restaurant.slug}` : "/"} className="flex items-center gap-2.5 p-3 rounded-2xl bg-brand hover:bg-brand-dark border border-brand transition-colors group">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-black shrink-0">★</span>
                  <span className="text-white font-bold">
                    Test Guest Menu <span className="inline-block transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                  </span>
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Flash Message */}
        {msg && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-lg animate-in fade-in duration-200 ${
              msg.kind === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span>{msg.kind === "ok" ? "✓" : "⚠️"}</span>
            <span>{msg.text}</span>
          </div>
        )}

        {/* TAB 0: LIVE DASHBOARD */}
        {tab === "dashboard" && (
          <DashboardTab
            liveRevenue={liveRevenue}
            liveOrders={liveOrders}
            itemList={itemList}
            tableList={tableList}
            recentOrders={recentOrders}
            setTab={handleSelectTab}
            restaurant={restaurant}
            restaurantId={restaurantId}
          />
        )}

        {/* TAB: ORDERS MANAGEMENT */}
        {tab === "orders" && (
          <OrdersTab
            orders={recentOrders}
            onUpdateStatus={handleUpdateOrderStatus}
            flash={flash}
          />
        )}

        {/* TAB: MODIFIERS */}
        {tab === "modifiers" && (
          <ModifiersTab flash={flash} />
        )}

        {/* TAB: STAFF MANAGEMENT */}
        {tab === "staff" && (
          <StaffTab restaurantId={restaurantId} userRole={userRole} flash={flash} />
        )}

        {/* TAB: CRM & LOYALTY */}
        {tab === "crm" && (
          <div className="animate-fade-in-up space-y-6">
            {!tierLimits.crm ? (
              <UpgradeRequired featureName="Customer Engagement Hub" requiredTier="enterprise" />
            ) : (
              <CrmTab flash={flash} />
            )}
          </div>
        )}

        {/* TAB: COMMUNICATIONS (WhatsApp) Removed */}

        {/* TAB: INBOX (B3 handoff) */}
        

        {/* TAB 1: MENU & CATEGORY MANAGEMENT */}
        {(tab === "menu" || tab === "categories") && (
          <div className="animate-fade-in-up">
            <MenuTab
              itemList={itemList}
              categoryList={categoryList}
              selectedItems={selectedItems}
              showBulkBar={showBulkBar}
              draggedItemId={draggedItemId}
              setShowBulkMenuModal={setShowBulkMenuModal}
              setShowCatModal={setShowCatModal}
              setShowItemModal={setShowItemModal}
              selectAllItems={selectAllItems}
              clearSelection={clearSelection}
              bulkToggleAvailability={bulkToggleAvailability}
              bulkDelete={bulkDelete}
              handleDeleteCategory={handleDeleteCategory}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              toggleSelectItem={toggleSelectItem}
              handleToggleAvailable={handleToggleAvailable}
              handleDeleteItem={handleDeleteItem}
            />
          </div>
        )}

        {/* TAB 2: TABLES & QR CODE GENERATOR */}
        {tab === "tables" && (
          <div className="animate-fade-in-up">
            <TablesTab
              tableList={tableList}
              isAddingTable={isAddingTable}
              newTableLabel={newTableLabel}
              newTableSeats={newTableSeats}
              showQr={showQr}
              showBulkQr={showBulkQr}
              handleDeleteTable={handleDeleteTable}
              setNewTableLabel={setNewTableLabel}
              setNewTableSeats={setNewTableSeats}
              handleAddTable={handleAddTable}
              handleUpdateTable={handleUpdateTable}
              handleToggleTableActive={handleToggleTableActive}
              handleRegenerateQr={handleRegenerateQr}
              handleBulkCreateTables={handleBulkCreateTables}
              restaurantName={restaurant?.name}
              restaurantSlug={restaurant?.slug}
              recentOrders={recentOrders}
            />
          </div>
        )}

        {/* TAB: BOOKINGS & RESERVATIONS */}
        {(tab === "bookings" || (tab as string) === "reservations") && (
          <div className="animate-fade-in-up">
            <ReservationsTab />
          </div>
        )}

        {/* TAB 4: ADVANCED FLOOR INTELLIGENCE & ANALYTICS */}
        {(tab === "analytics" || tab === "report") && (
          <div className="animate-fade-in-up space-y-6">
            {!tierLimits.analytics ? (
              <UpgradeRequired featureName="Advanced Analytics" requiredTier="pro" />
            ) : (
              <>
                <FloorIntelligence
                  loadingAnalytics={loadingAnalytics}
                  analytics={analytics}
                  loadAnalytics={loadAnalytics}
                />
                <ReportSummary report={report} />
              </>
            )}
          </div>
        )}

        {/* TAB 5: CUSTOM BRANDING (PRO ONLY) */}
        {tab === "branding" && (
          <div className="animate-fade-in-up">
            {!tierLimits.branding ? (
              <UpgradeRequired featureName="Custom Branding" requiredTier="pro" />
            ) : (
              <BrandingTab
                brandingLogoUrl={brandingLogoUrl}
                brandingTagline={brandingTagline}
                brandingGoogleReviewUrl={brandingGoogleReviewUrl}
                brandingAccentColor={brandingAccentColor}
                savingBranding={savingBranding}
                setBrandingLogoUrl={setBrandingLogoUrl}
                setBrandingTagline={setBrandingTagline}
                setBrandingGoogleReviewUrl={setBrandingGoogleReviewUrl}
                setBrandingAccentColor={setBrandingAccentColor}
                handleSaveBranding={handleSaveBranding}
              />
            )}
          </div>
        )}


        {/* TAB: OWNER ACCOUNT CONTROL CENTER */}
        {tab === "account" && (
          <AccountTab
            restaurant={activeRestaurant}
            userRole={userRole}
            flash={flash}
            onNavigateTab={handleSelectTab}
          />
        )}

        {/* TAB: INTEGRATIONS HUB */}
        {tab === "integrations" && (
          <IntegrationsTab
            restaurant={activeRestaurant}
            flash={flash}
          />
        )}

        {/* TAB: KITCHEN DISPLAY SYSTEM */}
        {(tab === "kds" || tab === "kitchen") && (
          <KdsTab restaurantId={restaurantId} flash={flash} />
        )}

        {/* TAB: BILLING & SUBSCRIPTION */}
        {tab === "billing" && (
          <div className="animate-fade-in-up">
            <BillingClient restaurant={activeRestaurant} />
          </div>
        )}

        {/* TAB: WEBHOOKS */}
        {tab === "webhooks" && (
          <WebhooksTab restaurant={activeRestaurant} flash={flash} />
        )}

        {/* TAB: STOCK CONTROL & ALERTS */}
        {tab === "inventory" && (
          <InventoryTab flash={flash} />
        )}

        {/* TAB: GRAVY & RECIPE MGMT */}
        {tab === "recipes" && (
          <RecipesTab itemList={itemList} flash={flash} />
        )}

        {/* TAB: PRIORITY SUPPORT */}
        {tab === "support" && (
          <SupportTab restaurant={activeRestaurant} flash={flash} />
        )}

        {/* TAB 6: OWNER GOVERNANCE & DIAGNOSTIC MANUAL */}
        {tab === "help" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl max-w-4xl">
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">🏛️ Owner Governance &amp; Operating Manual</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subscription controls, multi-tenant governance, Google Review setup &amp; hardware diagnostics
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-brand text-slate-900">
                Operational Runbook
              </span>
            </div>

            {/* 1. INTERACTIVE 1-CLICK SYSTEM DIAGNOSTICS */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-amber-500/30 space-y-4 shadow-inner">
              <div>
                <h3 className="text-sm font-black text-brand uppercase tracking-wider flex items-center gap-2">
                  <span>🛠️ Live Floor &amp; Hardware Self-Diagnostics</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test your browser audio and tax calculations before operating live.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Test 1: Voice Synthesizer */}
                <button
                  type="button"
                  onClick={() => {
                    speakHumanVoice("Table 01 needs Water!");
                    flash("ok", "🔊 Human Voice Synth Test Triggered: 'Staff assistance needed! Table 1 has requested fresh water.'");
                  }}
                  className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">🔊</span>
                  <div className="text-xs font-bold text-white">Test Voice Call Bell</div>
                  <div className="text-xs text-slate-400 font-mono">Speak: Table 01 Call</div>
                </button>

                {/* WhatsApp test removed */}
                {/* Test 3: GST Tax Calculation */}
                <button
                  type="button"
                  onClick={() => {
                    const billAmt = 1000;
                    const taxRate = restaurant?.tax_rate || 5;
                    const taxable = Math.round((billAmt * 100) / (100 + taxRate));
                    const gstTotal = billAmt - taxable;
                    const cgst = (gstTotal / 2).toFixed(2);
                    const sgst = (gstTotal / 2).toFixed(2);
                    flash("ok", `🧮 GST Test (₹1,000 Bill): Taxable=₹${taxable}, CGST (${taxRate / 2}%)=₹${cgst}, SGST (${taxRate / 2}%)=₹${sgst}`);
                  }}
                  className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">🧮</span>
                  <div className="text-xs font-bold text-brand">Verify GST Math</div>
                  <div className="text-xs text-slate-400 font-mono">Compute 2.5% CGST/SGST</div>
                </button>

                {/* Test 4: Realtime WebSocket Ping */}
                <button
                  type="button"
                  onClick={async () => {
                    const start = Date.now();
                    try {
                      const res = await fetch("/api/analytics", { cache: "no-store" });
                      const lat = Date.now() - start;
                      if (res.ok) {
                        flash("ok", `⚡ Postgres Serverless Latency: ${lat}ms (Optimal)`);
                      } else {
                        flash("err", "Server check failed");
                      }
                    } catch {
                      flash("err", "Server unreachable");
                    }
                  }}
                  className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">⚡</span>
                  <div className="text-xs font-bold text-stone-200">Ping Server Latency</div>
                  <div className="text-xs text-slate-400 font-mono">Verify Edge connection</div>
                </button>
              </div>
            </div>

            {/* 2. GOVERNANCE MODULE A: SUBSCRIPTIONS & BILLING */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand flex items-center justify-center font-bold text-xs">
                  A
                </span>
                <h3 className="text-sm font-extrabold text-white">Subscription &amp; SaaS Billing Governance</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-slate-600 leading-relaxed">
                <p>
                  QRslice operates on a unified flat plan at <strong>₹999/month</strong> (₹9,999/year) with unlimited tables, dishes, KDS screens, and cash POS registers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-xs">
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 block">Subscription Status:</span>
                    <span className="text-emerald-600 font-bold uppercase">{plan}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 block">Trial Expiry / Renewal:</span>
                    <span className="text-brand font-bold">{trialEnds ? trialEnds.toLocaleDateString("en-IN") : "Active"}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/admin/billing"
                    className="inline-block px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-slate-900 font-black text-xs transition-all shadow-md cursor-pointer"
                  >
                    Manage Razorpay Subscription &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. GOVERNANCE MODULE B: MULTI-TENANT FLOOR DEPLOYMENT */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <h3 className="text-sm font-extrabold text-white">Floor Deployment &amp; Table QR Stands</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-slate-600 leading-relaxed">
                <p>
                  Each table has a permanent human-readable URL (e.g. <code>/c/{restaurant?.slug || "cafe"}/t/01</code>). In the <strong>Tables Tab</strong>, you can add tables and click <strong>&quot;Print All Tent Cards 🖨️&quot;</strong> to generate ready-to-fold acrylic table inserts.
                </p>
                <ul className="space-y-1 text-slate-500 list-disc pl-4 pt-1">
                  <li>Table QR stands never expire and work with any standard smartphone camera.</li>
                  <li>Chefs hear spoken announcements immediately on the Kitchen KDS (`/pos?view=kitchen`).</li>
                  <li>Cashiers can view all open tables simultaneously on the Cloud POS (`/pos`).</li>
                </ul>
              </div>
            </div>

            {/* 4. GOVERNANCE MODULE C: GOOGLE BUSINESS REVIEW AUTOMATION */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand flex items-center justify-center font-bold text-xs">
                  C
                </span>
                <h3 className="text-sm font-extrabold text-white">Google Business 5★ Review Capture Setup</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-slate-600 leading-relaxed">
                <p>
                  To maximize your restaurant&apos;s local Google Maps ranking, set your Google Place Review URL in the <strong>Branding Tab</strong>.
                </p>
                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-brand">
                  Current Review URL: {restaurant?.google_review_url || "Not configured yet (Add in Branding tab)"}
                </div>
                <p className="text-slate-500">
                  Whenever a guest rates their meal 4★ or 5★ on the live order tracker, they are 1-click routed directly to leave a 5-star Google review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS & CAFE GOVERNANCE */}
        {tab === "settings" && (
          <div className="animate-fade-in-up">
            <SettingsTab
              restaurant={activeRestaurant}
              settingsCafeName={settingsCafeName}
              setSettingsCafeName={setSettingsCafeName}
              settingsTaxRate={settingsTaxRate}
              setSettingsTaxRate={setSettingsTaxRate}
              settingsUpiId={settingsUpiId}
              setSettingsUpiId={setSettingsUpiId}
              settingsUpiQrUrl={settingsUpiQrUrl}
              setSettingsUpiQrUrl={setSettingsUpiQrUrl}
              settingsPhone={settingsPhone}
              setSettingsPhone={setSettingsPhone}
              settingsAddress={settingsAddress}
              setSettingsAddress={setSettingsAddress}
              flash={flash}
              onNavigateTab={handleSelectTab}
            />
          </div>
        )}
      </div>

      {/* SINGLE QR STAND MODAL */}
      {qrModal && (
        <PrintStandCardModal
          restaurantName={activeRestaurant.name || "QRslice"}
          tableLabel={qrModal.label}
          qrDataUrl={qrModal.url}
          directUrl={qrModal.directUrl}
          seats={qrModal.seats}
          wifiSsid={wifiSsid}
          wifiPassword={wifiPassword}
          allTables={tableList}
          restaurantSlug={restaurant?.slug || "cafe"}
          initialMode="single"
          onClose={() => setQrModal(null)}
        />
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowItemModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-white">Add Menu Dish</h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-500 hover:text-slate-900 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Dish Name</label>
                <input
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                  placeholder="e.g. Hazelnut Iced Latte"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                    placeholder="e.g. 240"
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                    value={newItemCatId}
                    onChange={(e) => setNewItemCatId(e.target.value)}
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description (Optional)</label>
                <input
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                  placeholder="Freshly brewed espresso with toasted hazelnut syrup"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Food Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setNewItemImageFile(e.target.files[0]);
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-lavender file:text-brand hover:file:bg-brand-lavender"
                />
                <p className="text-[10px] text-slate-400 mt-1">By uploading, you confirm you own the copyright to this image per our DMCA policy.</p>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newItemVeg}
                  onChange={(e) => setNewItemVeg(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>🌱 Vegetarian Item</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItemBestseller}
                  onChange={(e) => setNewItemBestseller(e.target.checked)}
                  className="w-4 h-4 accent-[#5738F5] rounded"
                />
                <span>👑 Mark as Bestseller / Chef's Pick</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Spice Level</label>
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                    value={newItemSpiceIndex}
                    onChange={(e) => setNewItemSpiceIndex(Number(e.target.value))}
                  >
                    <option value={0}>Mild (0)</option>
                    <option value={1}>Medium (1 🌶️)</option>
                    <option value={2}>Spicy (2 🌶️🌶️)</option>
                    <option value={3}>Extra Spicy (3 🌶️🌶️🌶️)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tags (Comma Sep)</label>
                  <input
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                    placeholder="e.g. Vegan, Gluten-Free"
                    value={newItemTags}
                    onChange={(e) => setNewItemTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-slate-900 font-black text-xs shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowCatModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-white">Create New Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-500 hover:text-slate-900 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category Name</label>
                <input
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 w-full focus:outline-none focus:border-brand"
                  placeholder="e.g. Artisanal Breads & Toasts"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-slate-900 font-black text-xs shadow-md shadow-brand/20 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK MENU CSV / TEXT IMPORT MODAL */}
      {showBulkMenuModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowBulkMenuModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-white">📥 Bulk Import Menu Dishes</h3>
                <p className="text-xs text-slate-500">
                  Paste raw spreadsheet text or CSV (Format: <code>Dish Name, Price, Category, Veg/Non-Veg, Description</code>)
                </p>
              </div>
              <button onClick={() => setShowBulkMenuModal(false)} className="text-slate-500 hover:text-slate-900 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Sample Preset Shortcut */}
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Raw CSV / Spreadsheet Text
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 
`Hazelnut Cold Brew, 220, Beverages, Veg, Slow steeped cold brew with toasted hazelnut
Caramel Macchiato, 240, Beverages, Veg, Fresh espresso with steamed milk & vanilla
Artisan Truffle Pizza, 380, Mains, Veg, Wood-fired sourdough crust with truffle oil
Pesto Genovese Pasta, 320, Mains, Veg, Fresh basil pesto with pine nuts & parmesan
Avocado Sourdough Toast, 240, Breakfast, Veg, Smashed hass avocado on artisan sourdough
Double Chocolate Brownie, 180, Desserts, Veg, Warm fudgy chocolate brownie with ganache`;
                    handleBulkParse(sample);
                  }}
                  className="text-xs text-brand font-bold hover:underline cursor-pointer"
                >
                  ⚡ Load 6 Sample Dishes
                </button>
              </div>

              <textarea
                rows={5}
                value={bulkMenuText}
                onChange={(e) => handleBulkParse(e.target.value)}
                placeholder="Hazelnut Cold Brew, 220, Coffee, Veg, Espresso and milk&#10;Truffle Pizza, 380, Food, Veg, Crispy sourdough pizza"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand"
              ></textarea>

              {/* Live Parsed Preview Table */}
              {parsedBulkItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                    ✓ Validated {parsedBulkItems.length} Dishes Ready to Import:
                  </span>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-2 space-y-1">
                    {parsedBulkItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded-lg hover:bg-white border-b border-slate-200/40">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-emerald-400" : "bg-red-400"}`}></span>
                          <span className="font-bold text-white">{item.name}</span>
                          <span className="text-xs text-slate-400 font-mono">({item.category})</span>
                        </div>
                        <span className="text-brand font-mono font-bold">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBulkMenuModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImportingMenu || parsedBulkItems.length === 0}
                onClick={handleBulkImportSubmit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isImportingMenu ? "Importing Dishes…" : `Import ${parsedBulkItems.length} Dishes →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READY-TO-FOLD 80mm TABLE TENT STANDS (BULK PRINT MODAL) */}
      {bulkQrModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setBulkQrModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 no-print">
              <div>
                <h3 className="text-base font-black text-slate-900">🖨️ Ready-to-Fold 80mm Table Tent Cards</h3>
                <p className="text-xs text-slate-500">
                  Formatted for standard A4 cardstock or 80mm tabletop acrylic stands
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    printBulkStandCards({
                      restaurantName: activeRestaurant.name || "QRslice",
                      tables: bulkQrList.map((t) => ({
                        label: t.label,
                        seats: t.seats,
                        qrDataUrl: t.url,
                        directUrl: t.directUrl,
                      })),
                      wifiSsid: wifiSsid || undefined,
                      wifiPassword: wifiPassword || undefined,
                    });
                  }}
                  disabled={generatingBulk}
                  className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {generatingBulk ? "Generating Cards..." : "Print All Stand Cards 🖨️"}
                </button>
                <button onClick={() => setBulkQrModal(false)} className="text-slate-500 hover:text-slate-900 text-xs px-2 cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Tent Stand Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {bulkQrList.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white text-slate-900 rounded-3xl p-5 border-2 border-dashed border-stone-300 text-center space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="border-b border-stone-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-600 block">
                      {restaurant?.name || "QRslice"}
                    </span>
                    <h4 className="text-2xl font-black tracking-tight text-stone-900 mt-0.5">
                      TABLE {t.label}
                    </h4>
                  </div>

                  <div className="p-2 bg-stone-50 rounded-2xl inline-block border border-stone-200 shadow-inner">
                    <Image src={t.url} alt={`QR for Table ${t.label}`} width={176} height={176} unoptimized className="w-44 h-44 mx-auto" />
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-700">
                    <p className="font-extrabold text-stone-900">📱 Scan with Camera to Order</p>
                    <p className="text-xs text-slate-400">1. Scan QR • 2. Select Food • 3. Pay Cash at Counter</p>
                  </div>

                  {/* WiFi Badge */}
                  <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-xs font-mono text-stone-800">
                    📶 WiFi: <strong>{wifiSsid}</strong> | Pass: <strong>{wifiPassword}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Multi-Outlet Switcher Dialog Modal */}
      {showMultiOutletModal && (
        <MultiOutletModal
          currentRestaurantId={restaurantId}
          currentRestaurantName={restaurant?.name || "Main Outlet"}
          onClose={() => setShowMultiOutletModal(false)}
        />
      )}
    </AdminAppShell>
  );
}

