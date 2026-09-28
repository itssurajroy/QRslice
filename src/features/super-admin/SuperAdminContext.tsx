// Copyright (c) 2026 QRslice. All rights reserved.
"use client";
import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperClientProps, Cafe, SubscriptionPlan } from "./types";

export type SuperAdminContextType = any;

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

function normalizeTab(t: string | null | undefined): string {
  if (!t) return "dashboard";
  if (t === "analytics" || t === "funnel") return "dashboard";
  if (t === "tenants" || t === "cafes") return "restaurants";
  if (t === "health") return "system-health";
  if (t === "users") return "admins";
  if (t === "config" || t === "broadcast" || t === "announcements" || t === "api-keys" || t === "platform" || t === "content") return "settings";
  return t;
}

export function SuperAdminProvider({ children, initialData }: { children: React.ReactNode, initialData: SuperClientProps }) {
  const router = useRouter();
  
  const { cafes, totalCafes, page, pageSize, q: initialQ, planFilter: initialPlanFilter, staff, kpis, charts, config: initialConfig, recentAudit, initialTab, authUsers, subscriptionPlans } = initialData as any;
  
  const [tab, setTabState] = useState<string>(normalizeTab(initialTab));

  React.useEffect(() => {
    if (initialTab) {
      setTabState(normalizeTab(initialTab));
    }
  }, [initialTab]);

  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab) {
        setTabState(normalizeTab(urlTab));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setTab = (newTab: any) => {
    const normalized = normalizeTab(newTab);
    setTabState(normalized);
    try {
      router.push(`/super?tab=${normalized}`, { scroll: false });
    } catch {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", normalized);
        window.history.pushState({}, "", url.toString());
      }
    }
  };

  // Global Platform Broadcast Banner
  const [broadcastMsg, setBroadcastMsg] = useState(
    typeof window !== "undefined" ? localStorage.getItem("platform_broadcast") || "" : ""
  );
  const [broadcastInput, setBroadcastInput] = useState(broadcastMsg);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedPlan, setSelectedPlan] = useState(initialPlanFilter);

  // Mobile Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tenant Slide-Over Drawer State
  const [drawerCafeId, setDrawerCafeId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"overview" | "menu" | "tables" | "orders" | "billing" | "audit" | "danger">("overview");
  
  // New Café Modal
  const [showNewCafeModal, setShowNewCafeModal] = useState(false);
  const [newCafeName, setNewCafeName] = useState("");
  const [newCafeSlug, setNewCafeSlug] = useState("");
  const [newCafeTier, setNewCafeTier] = useState<"starter" | "pro" | "enterprise">("pro");
  const [newCafePlan, setNewCafePlan] = useState<"trial" | "active">("trial");
  const [newCafeTagline, setNewCafeTagline] = useState("");
  const [newCafePhone, setNewCafePhone] = useState("");
  const [newCafeAddress, setNewCafeAddress] = useState("");
  const [newCafeOwnerName, setNewCafeOwnerName] = useState("");
  const [newCafeOwnerEmail, setNewCafeOwnerEmail] = useState("");
  const [creatingCafe, setCreatingCafe] = useState(false);

  // Platform Config Edit State
  const [platformConfig, setPlatformConfig] = useState(initialConfig);
  const [savingConfigKey, setSavingConfigKey] = useState<string | null>(null);

  // Audit Tab Filter State
  const [auditRows, setAuditRows] = useState(recentAudit);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // Toast / Flash Notice
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const flash = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  // Trigger search / filter changes via Server URL Params
  function applyFilter(newQ: string, newPlan: string, newPage: number = 1) {
    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    if (newQ) params.set("q", newQ);
    if (newPlan) params.set("plan", newPlan);
    if (newPage > 1) params.set("page", String(newPage));
    router.push(`/super?${params.toString()}`);
  }

  // Load Drawer Data
  async function openDrawer(cafeId: string) {
    setDrawerCafeId(cafeId);
    setLoadingDrawer(true);
    setDrawerTab("overview");
    try {
      const res = await fetch(`/api/super/tenant?cafeId=${cafeId}`);
      if (res.ok) {
        const data = await res.json();
        setDrawerData(data);
      } else {
        flash("err", "Failed to load café snapshot");
        setDrawerCafeId(null);
      }
    } catch {
      flash("err", "Network error loading café snapshot");
      setDrawerCafeId(null);
    } finally {
      setLoadingDrawer(false);
    }
  }

  // Handle Billing Overrides from Drawer
  async function handleExtendTrial(days: number) {
    if (!drawerCafeId) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", id: drawerCafeId, days }),
      });
      if (res.ok) {
        flash("ok", `Extended trial by ${days} days`);
        openDrawer(drawerCafeId);
        router.refresh();
      } else {
        flash("err", "Failed to extend trial");
      }
    } catch {
      flash("err", "Error extending trial");
    }
  }

  async function handleMarkPaid() {
    if (!drawerCafeId || !confirm("Mark this café as paid for 1 full year?")) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", id: drawerCafeId }),
      });
      if (res.ok) {
        flash("ok", "Café marked as active/paid for 1 year");
        openDrawer(drawerCafeId);
        router.refresh();
      } else {
        flash("err", "Failed to mark paid");
      }
    } catch {
      flash("err", "Error marking paid");
    }
  }

  async function handleSetPlan(plan: "trial" | "active" | "suspended", tier?: "starter" | "pro" | "enterprise") {
    if (!drawerCafeId) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_plan", id: drawerCafeId, plan, tier }),
      });
      if (res.ok) {
        flash("ok", `Plan updated to ${plan.toUpperCase()}`);
        openDrawer(drawerCafeId);
        router.refresh();
      } else {
        flash("err", "Failed to update plan");
      }
    } catch {
      flash("err", "Error updating plan");
    }
  }

  async function handleAddRefundNote(note: string) {
    if (!drawerCafeId || !note.trim()) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_refund_note", id: drawerCafeId, note }),
      });
      if (res.ok) {
        flash("ok", "Refund note recorded in audit log");
        openDrawer(drawerCafeId);
      } else {
        flash("err", "Failed to record refund note");
      }
    } catch {
      flash("err", "Error recording refund note");
    }
  }

  // Export All Tenants to CSV
  function handleExportCSV() {
    if (!cafes || cafes.length === 0) {
      flash("err", "No cafés to export");
      return;
    }
    const headers = ["ID", "Name", "Slug", "Plan", "Tier", "Tax Rate (%)", "Created At", "Subscription Ends"];
    const rows = (cafes as any[]).map((c: any) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.slug,
      c.plan,
      c.tier || "pro",
      (c as any).tax_rate ?? 5,
      c.created_at,
      c.subscription_ends_at || c.trial_ends_at || "N/A",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qrslice-tenants-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flash("ok", `Exported ${cafes.length} café records to CSV!`);
  }

  // Handle Global Broadcast Save
  function handleSaveBroadcast() {
    setIsBroadcasting(true);
    try {
      localStorage.setItem("platform_broadcast", broadcastInput.trim());
      setBroadcastMsg(broadcastInput.trim());
      flash("ok", broadcastInput.trim() ? "📢 Broadcast message published!" : "Broadcast message cleared");
    } finally {
      setIsBroadcasting(false);
    }
  }

  // Handle Fast Row Actions (+14d Trial, Toggle Active/Suspend)
  async function handleFastExtendTrial(cafeId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", id: cafeId, days: 14 }),
      });
      if (res.ok) {
        flash("ok", "Added +14 Days Trial!");
        router.refresh();
      } else {
        flash("err", "Failed to extend trial");
      }
    } catch {
      flash("err", "Network error extending trial");
    }
  }

  async function handleFastToggleStatus(cafe: Cafe, e: React.MouseEvent) {
    e.stopPropagation();
    const newPlan = cafe.plan === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_plan", id: cafe.id, plan: newPlan }),
      });
      if (res.ok) {
        flash("ok", `Status toggled to ${newPlan.toUpperCase()}`);
        router.refresh();
      } else {
        flash("err", "Failed to toggle status");
      }
    } catch {
      flash("err", "Network error toggling status");
    }
  }

  async function handleDeleteCafe(id: string) {
    if (!confirm("Are you sure you want to permanently delete this café? All tables, menu items, and records will be purged.")) {
      return;
    }
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_cafe", id }),
      });
      if (res.ok) {
        flash("ok", "Café deleted permanently");
        setDrawerCafeId(null);
        router.refresh();
      } else {
        flash("err", "Failed to delete café");
      }
    } catch {
      flash("err", "Error deleting café");
    }
  }

  async function handleSaveConfig(key: string, value: any) {
    setSavingConfigKey(key);
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", key, value }),
      });
      if (res.ok) {
        flash("ok", `Updated ${key} setting`);
        setPlatformConfig((prev: any) => ({ ...prev, [key]: value }));
      } else {
        flash("err", "Failed to save configuration");
      }
    } catch {
      flash("err", "Error saving config");
    } finally {
      setSavingConfigKey(null);
    }
  }

  async function handleCreateCafeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ownerEmailTrimmed = newCafeOwnerEmail.trim();
    if (ownerEmailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmailTrimmed)) {
      flash("err", "Owner email looks invalid");
      return;
    }
    setCreatingCafe(true);
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_cafe",
          name: newCafeName.trim(),
          slug: newCafeSlug.trim().toLowerCase(),
          tier: newCafeTier,
          plan: newCafePlan,
          tagline: newCafeTagline.trim() || undefined,
          phone: newCafePhone.trim() || undefined,
          address: newCafeAddress.trim() || undefined,
          ownerName: newCafeOwnerName.trim() || undefined,
          ownerEmail: ownerEmailTrimmed || undefined,
        }),
      });
      if (res.ok) {
        flash("ok", `Provisioned café "${newCafeName}"`);
        setShowNewCafeModal(false);
        setNewCafeName("");
        setNewCafeSlug("");
        setNewCafeOwnerName("");
        setNewCafeOwnerEmail("");
        router.refresh();
      } else {
        const data = await res.json();
        flash("err", data.error || "Failed to create café");
      }
    } catch {
      flash("err", "Error creating café");
    } finally {
      setCreatingCafe(false);
    }
  }

  async function loadFilteredAudit(action: string) {
    setAuditActionFilter(action);
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/super/audit?action=${action}`);
      if (res.ok) {
        const data = await res.json();
        setAuditRows(data.rows || []);
      }
    } catch {
      flash("err", "Error loading audit records");
    } finally {
      setAuditLoading(false);
    }
  }

  const totalPages = Math.ceil(totalCafes / pageSize) || 1;


  const value = {
    cafes, totalCafes, page, pageSize, initialQ, initialPlanFilter, staff, kpis, charts, initialConfig, recentAudit, authUsers,
    subscriptionPlans,
    tab, setTab, mobileMenuOpen, setMobileMenuOpen, broadcastInput, setBroadcastInput, isBroadcasting, setIsBroadcasting, searchQuery, setSearchQuery, selectedPlan, setSelectedPlan, drawerCafeId, setDrawerCafeId, drawerData, setDrawerData, loadingDrawer, setLoadingDrawer, drawerTab, setDrawerTab,
    showNewCafeModal, setShowNewCafeModal, newCafeName, setNewCafeName, newCafeSlug, setNewCafeSlug, newCafeTier, setNewCafeTier, newCafePlan, setNewCafePlan, newCafeTagline, setNewCafeTagline, newCafePhone, setNewCafePhone, newCafeAddress, setNewCafeAddress, newCafeOwnerName, setNewCafeOwnerName, newCafeOwnerEmail, setNewCafeOwnerEmail, creatingCafe, setCreatingCafe, platformConfig, setPlatformConfig, savingConfigKey, setSavingConfigKey, auditRows, setAuditRows, auditLoading, setAuditLoading, auditActionFilter, setAuditActionFilter, toast, setToast,
    handleExtendTrial, handleMarkPaid, handleSetPlan, handleAddRefundNote, handleExportCSV, handleSaveBroadcast, handleFastExtendTrial, handleFastToggleStatus, handleDeleteCafe, handleSaveConfig, handleCreateCafeSubmit, loadFilteredAudit, openDrawer, applyFilter, totalPages, flash
  };

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error("Missing SuperAdminProvider");
  return ctx;
}
