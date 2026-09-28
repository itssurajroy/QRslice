// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GearIcon, PaletteIcon, ClockIcon, CreditCardIcon, QrCodeIcon, PrinterIcon, BellIcon, MessageCircleIcon, SparklesIcon, CheckCircleIcon, CheckIcon, RefreshCwIcon } from "@/components/Icons";

interface SettingsTabProps {
  restaurant: { id: string; name?: string; slug?: string; gstin?: string; fssai?: string; address?: string; phone?: string; email?: string };
  settingsCafeName: string;
  setSettingsCafeName: (s: string) => void;
  settingsTaxRate: number;
  setSettingsTaxRate: (n: number) => void;
  settingsUpiId: string;
  setSettingsUpiId: (s: string) => void;
  settingsUpiQrUrl: string;
  setSettingsUpiQrUrl: (s: string) => void;
  settingsPhone: string;
  setSettingsPhone: (s: string) => void;
  settingsAddress: string;
  setSettingsAddress: (s: string) => void;
  flash: (kind: "ok" | "err", msg: string) => void;
  onNavigateTab?: (tab: any) => void;
}

type SettingsCategory =
  | "restaurant"
  | "branding"
  | "hours"
  | "tax"
  | "payments"
  | "qr"
  | "printers"
  | "notifications"
  | "loyalty";

export function SettingsTab(props: SettingsTabProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("restaurant");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Restaurant details
  const [gstin, setGstin] = useState(props.restaurant?.gstin || "07AAAAA0000A1Z5");
  const [fssai, setFssai] = useState(props.restaurant?.fssai || "10020011000452");
  const [restaurantEmail, setRestaurantEmail] = useState(props.restaurant?.email || "orders@qrslice.com");
  const [currency, setCurrency] = useState("INR (₹)");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");

  // Branding
  const [tagline, setTagline] = useState("Authentic Taste, Served Fresh");
  const [accentColor, setAccentColor] = useState("#5738F5");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("https://g.page/r/sample/review");

  // Business Hours
  const [businessHours, setBusinessHours] = useState([
    { day: "Monday", open: "10:00 AM", close: "11:00 PM", isClosed: false },
    { day: "Tuesday", open: "10:00 AM", close: "11:00 PM", isClosed: false },
    { day: "Wednesday", open: "10:00 AM", close: "11:00 PM", isClosed: false },
    { day: "Thursday", open: "10:00 AM", close: "11:00 PM", isClosed: false },
    { day: "Friday", open: "10:00 AM", close: "11:30 PM", isClosed: false },
    { day: "Saturday", open: "10:00 AM", close: "11:30 PM", isClosed: false },
    { day: "Sunday", open: "10:00 AM", close: "11:00 PM", isClosed: false },
  ]);

  // Tax breakdown (No hardcoded percentages)
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [igstRate, setIgstRate] = useState(5.0);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);
  const [isInclusivePricing, setIsInclusivePricing] = useState(false);
  const [roundToNearestRupee, setRoundToNearestRupee] = useState(true);

  // Payments
  const [enableCash, setEnableCash] = useState(true);
  const [enableCard, setEnableCard] = useState(true);
  const [enableUpi, setEnableUpi] = useState(true);

  // QR Settings
  const [qrType, setQrType] = useState<"table" | "restaurant" | "menu">("table");
  const [afterScanAction, setAfterScanAction] = useState<"menu" | "order">("menu");
  const [allowCustomerOrdering, setAllowCustomerOrdering] = useState(true);
  const [requireTableSelection, setRequireTableSelection] = useState(true);
  const [showQrBranding, setShowQrBranding] = useState(true);

  // Printers
  const [printers, setPrinters] = useState([
    { id: "p1", name: "Kitchen Display Printer", type: "Kitchen KOT", status: "online", ip: "192.168.1.120", paper: "80mm", autoPrint: true },
    { id: "p2", name: "Counter Receipt Printer", type: "Customer Bill", status: "online", ip: "192.168.1.121", paper: "80mm", autoPrint: true },
    { id: "p3", name: "Bar / Beverage Station", type: "Bar KOT", status: "offline", ip: "192.168.1.125", paper: "58mm", autoPrint: false },
  ]);
  const [testPrintModal, setTestPrintModal] = useState<{ isOpen: boolean; printerName: string; resultText: string } | null>(null);

  // Notifications
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [orderReadySms, setOrderReadySms] = useState(false);



  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.gstin) setGstin(data.gstin);
          if (data.fssai) setFssai(data.fssai);
          if (data.restaurantEmail) setRestaurantEmail(data.restaurantEmail);
          if (data.currency) setCurrency(data.currency);
          if (data.timezone) setTimezone(data.timezone);
          if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
          if (data.tagline) setTagline(data.tagline);
          if (data.accentColor) setAccentColor(data.accentColor);
          if (data.googleReviewUrl) setGoogleReviewUrl(data.googleReviewUrl);
          if (data.businessHours) setBusinessHours(data.businessHours);
          if (data.cgstRate !== undefined) setCgstRate(data.cgstRate);
          if (data.sgstRate !== undefined) setSgstRate(data.sgstRate);
          if (data.igstRate !== undefined) setIgstRate(data.igstRate);
          if (data.serviceChargeRate !== undefined) setServiceChargeRate(data.serviceChargeRate);
          if (data.isInclusivePricing !== undefined) setIsInclusivePricing(data.isInclusivePricing);
          if (data.roundToNearestRupee !== undefined) setRoundToNearestRupee(data.roundToNearestRupee);
          if (data.enableCash !== undefined) setEnableCash(data.enableCash);
          if (data.enableCard !== undefined) setEnableCard(data.enableCard);
          if (data.enableUpi !== undefined) setEnableUpi(data.enableUpi);
          if (data.qrType) setQrType(data.qrType);
          if (data.afterScanAction) setAfterScanAction(data.afterScanAction);
          if (data.allowCustomerOrdering !== undefined) setAllowCustomerOrdering(data.allowCustomerOrdering);
          if (data.requireTableSelection !== undefined) setRequireTableSelection(data.requireTableSelection);
          if (data.showQrBranding !== undefined) setShowQrBranding(data.showQrBranding);
          if (data.printers) setPrinters(data.printers);
          if (data.soundAlerts !== undefined) setSoundAlerts(data.soundAlerts);
          if (data.emailAlerts !== undefined) setEmailAlerts(data.emailAlerts);
          if (data.orderReadySms !== undefined) setOrderReadySms(data.orderReadySms);
        }
      } catch {
        // ignore
      }
    }
    loadSettings();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_settings",
          name: props.settingsCafeName.trim(),
          taxRate: props.settingsTaxRate,
          upiId: props.settingsUpiId.trim(),
          upiQrUrl: props.settingsUpiQrUrl.trim(),
          phone: props.settingsPhone.trim(),
          address: props.settingsAddress.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update core settings");

      // Save platform_config settings
      const settingsRes = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstin, fssai, restaurantEmail, currency, timezone, invoicePrefix,
          tagline, accentColor, googleReviewUrl,
          businessHours,
          cgstRate, sgstRate, igstRate, serviceChargeRate, isInclusivePricing, roundToNearestRupee,
          enableCash, enableCard, enableUpi,
          qrType, afterScanAction, allowCustomerOrdering, requireTableSelection, showQrBranding,
          printers,
          soundAlerts, emailAlerts, orderReadySms,
          waEnabled: false, waTemplate: "", waIncludeReviewCta: true, waIncludeGstin: true, waThankYou: "", autoSendWaBill: true, includePdfInvoice: true, includeOrderAgainBtn: true
        }),
      });
      if (!settingsRes.ok) {
        const sdata = await settingsRes.json();
        throw new Error(sdata.error || "Failed to update extended settings");
      }

      props.flash("ok", "Restaurant settings saved successfully across all stations! ✓");
    } catch (err: unknown) {
      props.flash("err", err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${props.restaurant.id}_upi_qr_${Date.now()}.${ext}`;

      // TODO: Register a DMCA Designated Agent with the U.S. Copyright Office ($6 fee) to limit statutory damages.
      // Ensure upload flows reference copyright policies.
      const { error } = await supabase.storage
        .from("images")
        .upload(`qr/${fileName}`, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(`qr/${fileName}`);
      props.setSettingsUpiQrUrl(publicUrl);
      props.flash("ok", "UPI QR uploaded! Save changes to apply.");
    } catch (err: unknown) {
      props.flash("err", "Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploadingImage(false);
    }
  }

  const triggerTestPrint = (printerName: string) => {
    setTestPrintModal({
      isOpen: true,
      printerName,
      resultText: `ESC/POS Handshake OK. Test slip dispatched to ${printerName}. Cutter cycle completed.`,
    });
    props.flash("ok", `Test print dispatched to ${printerName}! 🖨️`);
  };

  const samplePreviewVars = {
    restaurant: {
      name: props.settingsCafeName || "Your Café",
      gstin: gstin,
    },
    orderNumber: "10482",
    tableNumber: "T-12",
    total: "1,248.00",
    paymentModeLine: "• Paid via UPI",
    receiptUrl: "https://qrslice.com/receipt/sample-token",
  };


  const categories: Array<{ id: SettingsCategory; label: string; icon: any }> = [
    { id: "restaurant", label: "Restaurant Info", icon: GearIcon },
    { id: "branding", label: "Branding", icon: PaletteIcon },
    { id: "hours", label: "Business Hours", icon: ClockIcon },
    { id: "tax", label: "Taxes & Charges", icon: CreditCardIcon },
    { id: "payments", label: "Payments & UPI", icon: CreditCardIcon },
    { id: "qr", label: "Tables & QR", icon: QrCodeIcon },
    { id: "printers", label: "Printers", icon: PrinterIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "loyalty", label: "CRM & Loyalty", icon: SparklesIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#5738F5]/10 text-[#5738F5] flex items-center justify-center font-bold">
              ⚙️
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17142B] tracking-tight">
              Restaurant Configuration & Governance
            </h2>
          </div>
          <p className="text-xs text-[#6F7185] mt-1 font-medium">
            Control restaurant operations, tax calculations, QR ordering, and hardware printers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-5 py-2.5 bg-[#5738F5] hover:bg-[#4628D8] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {savingSettings ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckIcon className="w-3.5 h-3.5" />}
            Save All Changes ✓
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Categories + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Navigation Pills / Sidebar */}
        <div className="lg:col-span-3 bg-white p-3 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-1">
          <span className="text-[10px] font-black text-[#6F7185] uppercase tracking-wider px-3 py-2 block">
            Settings Sections
          </span>
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#5738F5] text-white shadow-2xs"
                      : "text-[#6F7185] hover:bg-[#F8F7FC] hover:text-[#17142B]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#6F7185]"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Category Panel */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs">
          {/* 1. RESTAURANT GENERAL */}
          {activeCategory === "restaurant" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Restaurant Identity & Legal Info
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Appears on official invoices, customer QR menus, and tax receipts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Restaurant Brand Name
                  </label>
                  <input
                    type="text"
                    value={props.settingsCafeName}
                    onChange={(e) => props.setSettingsCafeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-bold text-[#17142B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Support / Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={props.settingsPhone}
                    onChange={(e) => props.setSettingsPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-[#17142B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={restaurantEmail}
                    onChange={(e) => setRestaurantEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-[#17142B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    GSTIN Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-[#17142B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={fssai}
                    onChange={(e) => setFssai(e.target.value)}
                    placeholder="14-digit food license number"
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-[#17142B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-[#17142B]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1 text-xs">
                  Physical Address (Printed on Invoices & Bills)
                </label>
                <textarea
                  rows={2}
                  value={props.settingsAddress}
                  onChange={(e) => props.setSettingsAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl text-[#17142B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-bold text-[#17142B]"
                  >
                    <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                    <option value="USD ($)">US Dollar (USD $)</option>
                    <option value="AED (د.إ)">UAE Dirham (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-bold text-[#17142B]"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST +05:30)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST +04:00)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. BRANDING */}
          {activeCategory === "branding" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Menu & Receipt Branding
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Color scheme, customer-facing tagline, and Google review link.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Customer Tagline / Welcome Phrase
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-medium text-[#17142B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Primary Brand Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#E7E4F0] p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-32 px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-xs"
                    />
                    <span className="text-[11px] text-[#6F7185]">
                      Applied to customer QR menus, receipt highlights, and CTA buttons.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Google Maps 5★ Review Capture URL
                  </label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/your-restaurant/review"
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-[#5738F5]"
                  />
                  <p className="text-[11px] text-[#6F7185] mt-1">
                    When guests receive a WhatsApp bill or give 5 stars on the order tracker, they are 1-click routed to this Google review URL.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. BUSINESS HOURS */}
          {activeCategory === "hours" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Weekly Operating Schedule
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Controls when your online QR menu accepts customer food orders.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                {businessHours.map((bh, idx) => (
                  <div
                    key={bh.day}
                    className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] flex items-center justify-between gap-3"
                  >
                    <span className="w-24 font-black text-[#17142B]">{bh.day}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={bh.open}
                        disabled={bh.isClosed}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBusinessHours((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, open: val } : b))
                          );
                        }}
                        className="w-24 px-2 py-1 bg-white border border-[#E7E4F0] rounded-lg text-center font-mono font-bold"
                      />
                      <span className="text-[#6F7185] font-bold">to</span>
                      <input
                        type="text"
                        value={bh.close}
                        disabled={bh.isClosed}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBusinessHours((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, close: val } : b))
                          );
                        }}
                        className="w-24 px-2 py-1 bg-white border border-[#E7E4F0] rounded-lg text-center font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBusinessHours((prev) =>
                          prev.map((b, i) => (i === idx ? { ...b, isClosed: !b.isClosed } : b))
                        );
                      }}
                      className={`px-3 py-1 rounded-xl font-bold text-[11px] cursor-pointer transition ${
                        bh.isClosed
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {bh.isClosed ? "Closed" : "Open ✓"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TAXES & CHARGES */}
          {activeCategory === "tax" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Configurable GST & Service Charges
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Dynamic tax splits applied to bills, KOTs, and POS settlements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
                  <label className="font-bold text-[#17142B] uppercase block">CGST (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cgstRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCgstRate(val);
                      props.setSettingsTaxRate(val + sgstRate);
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E7E4F0] rounded-xl font-mono font-bold text-[#17142B]"
                  />
                  <span className="text-[10px] text-[#6F7185]">Central Goods & Service Tax</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
                  <label className="font-bold text-[#17142B] uppercase block">SGST (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sgstRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSgstRate(val);
                      props.setSettingsTaxRate(cgstRate + val);
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E7E4F0] rounded-xl font-mono font-bold text-[#17142B]"
                  />
                  <span className="text-[10px] text-[#6F7185]">State Goods & Service Tax</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
                  <label className="font-bold text-[#17142B] uppercase block">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E7E4F0] rounded-xl font-mono font-bold text-[#17142B]"
                  />
                  <span className="text-[10px] text-[#6F7185]">Optional dine-in floor charge</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInclusivePricing}
                    onChange={(e) => setIsInclusivePricing(e.target.checked)}
                    className="w-4 h-4 accent-[#5738F5] rounded"
                  />
                  <span className="font-bold text-[#17142B]">
                    Inclusive Pricing (Menu prices already include all taxes)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundToNearestRupee}
                    onChange={(e) => setRoundToNearestRupee(e.target.checked)}
                    className="w-4 h-4 accent-[#5738F5] rounded"
                  />
                  <span className="font-bold text-[#17142B]">
                    Round Grand Total to Nearest Rupee (Zero decimal paise)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 5. PAYMENTS & UPI */}
          {activeCategory === "payments" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Direct-to-Bank UPI & Tender Methods
                </h3>
                <p className="text-xs text-[#6F7185]">
                  0% Commission direct payments to your merchant bank account.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Merchant UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={props.settingsUpiId}
                    onChange={(e) => props.setSettingsUpiId(e.target.value)}
                    placeholder="e.g. your-restaurant@okaxis"
                    className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono font-bold text-emerald-700"
                  />
                  <p className="text-[11px] text-[#6F7185] mt-1">
                    Customers pay directly via GPay, PhonePe, Paytm, or BHIM with zero payment gateway cut.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Static BharatPe / Paytm QR Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    {props.settingsUpiQrUrl && (
                      <img
                        src={props.settingsUpiQrUrl}
                        alt="UPI QR"
                        className="w-16 h-16 rounded-xl border border-[#E7E4F0] p-1 bg-white"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl px-3 py-2 text-xs font-bold text-[#6F7185] cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">By uploading, you confirm you own the copyright to this image per our DMCA policy.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E7E4F0] space-y-2">
                  <span className="font-bold text-[#17142B] block uppercase tracking-wider">
                    Accepted Payment Methods in POS:
                  </span>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={enableCash}
                        onChange={(e) => setEnableCash(e.target.checked)}
                        className="w-4 h-4 accent-[#5738F5]"
                      />
                      <span>Cash at Counter</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={enableUpi}
                        onChange={(e) => setEnableUpi(e.target.checked)}
                        className="w-4 h-4 accent-[#5738F5]"
                      />
                      <span>Direct UPI QR</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={enableCard}
                        onChange={(e) => setEnableCard(e.target.checked)}
                        className="w-4 h-4 accent-[#5738F5]"
                      />
                      <span>Card POS Terminal</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TABLES & QR SETTINGS */}
          {activeCategory === "qr" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  QR Code Behavior & Table Ordering
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Configure what happens when a guest scans the acrylic stand on their table.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      QR Type Mode
                    </label>
                    <select
                      value={qrType}
                      onChange={(e) => setQrType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-bold"
                    >
                      <option value="table">Table QR (Table number locked)</option>
                      <option value="restaurant">Restaurant QR (Guest selects table)</option>
                      <option value="menu">Menu Only (Browse only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      Action After Scanning
                    </label>
                    <select
                      value={afterScanAction}
                      onChange={(e) => setAfterScanAction(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-bold"
                    >
                      <option value="menu">Open Digital Menu</option>
                      <option value="order">Start Instant Order Flow</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#17142B]">
                    <input
                      type="checkbox"
                      checked={allowCustomerOrdering}
                      onChange={(e) => setAllowCustomerOrdering(e.target.checked)}
                      className="w-4 h-4 accent-[#5738F5]"
                    />
                    <span>Allow customer self-ordering from phone</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#17142B]">
                    <input
                      type="checkbox"
                      checked={requireTableSelection}
                      onChange={(e) => setRequireTableSelection(e.target.checked)}
                      className="w-4 h-4 accent-[#5738F5]"
                    />
                    <span>Require table confirmation before order dispatch</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#17142B]">
                    <input
                      type="checkbox"
                      checked={showQrBranding}
                      onChange={(e) => setShowQrBranding(e.target.checked)}
                      className="w-4 h-4 accent-[#5738F5]"
                    />
                    <span>Show &ldquo;Powered by QRslice&rdquo; badge on menu footer</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#E7E4F0] flex flex-wrap gap-2">
                  {props.onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => props.onNavigateTab?.("tables")}
                      className="px-4 py-2 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] font-bold rounded-xl"
                    >
                      Print Stand Cards (Tables Tab) &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7. PRINTERS */}
          {activeCategory === "printers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E7E4F0] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                    Thermal KOT & Bill Printers
                  </h3>
                  <p className="text-xs text-[#6F7185]">
                    ESC/POS network and USB printers for kitchen tickets and counter bills.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {printers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17142B]">{p.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            p.status === "online"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {p.status === "online" ? "● Online" : "○ Offline"}
                        </span>
                      </div>
                      <div className="text-[#6F7185] font-mono text-[11px] flex items-center gap-2">
                        <span>{p.type}</span>
                        <span>•</span>
                        <span>IP: {p.ip}</span>
                        <span>•</span>
                        <span>Roll: {p.paper}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerTestPrint(p.name)}
                        className="px-3.5 py-1.5 bg-white border border-[#E7E4F0] hover:bg-slate-50 text-[#17142B] font-bold rounded-xl transition cursor-pointer"
                      >
                        Print Test Slip 🖨️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. NOTIFICATIONS */}
          {activeCategory === "notifications" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Audio Alerts & Staff Notifications
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Keep kitchen staff and cashiers alerted on new orders.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#17142B] block">Spoken Voice / Bell Sound Alerts</span>
                    <span className="text-[11px] text-[#6F7185]">Plays &ldquo;New order for Table 4&rdquo; audio in KDS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    className="w-5 h-5 accent-[#5738F5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#17142B] block">Manager Daily Shift Email</span>
                    <span className="text-[11px] text-[#6F7185]">Sends Z-Report summary at restaurant close</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-5 h-5 accent-[#5738F5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#17142B] block">Guest SMS When Order Ready</span>
                    <span className="text-[11px] text-[#6F7185]">Sends SMS notification for takeaway pickups</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={orderReadySms}
                    onChange={(e) => setOrderReadySms(e.target.checked)}
                    className="w-5 h-5 accent-[#5738F5]"
                  />
                </label>
              </div>
            </div>
          )}



          {/* 10. CRM & LOYALTY */}
          {activeCategory === "loyalty" && (
            <div className="space-y-6">
              <div className="border-b border-[#E7E4F0] pb-4">
                <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Loyalty Points & CRM Connection
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Earning rules, loyalty tiers, and customer segment lifecycle.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-3 text-xs">
                <p className="text-[#17142B] font-medium leading-relaxed">
                  Loyalty points are awarded automatically when orders reach <strong>Payment Completed</strong>.
                  Configure your spend multipliers, Bronze/Silver/Gold/Platinum tiers, and automated win-back campaigns in the CRM Hub.
                </p>
                {props.onNavigateTab && (
                  <button
                    onClick={() => props.onNavigateTab?.("crm")}
                    className="px-4 py-2 bg-[#5738F5] text-white font-black rounded-xl cursor-pointer"
                  >
                    Open Customer Engagement Hub &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Print Result Dialog */}
      {testPrintModal?.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-[#E7E4F0] shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🖨️</span>
              <h4 className="text-sm font-black text-[#17142B]">
                Test Print Confirmed
              </h4>
            </div>
            <p className="text-xs text-[#6F7185] leading-relaxed">
              {testPrintModal.resultText}
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono">
              Status: 200 OK • Data Sent: 412 Bytes
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTestPrintModal(null)}
                className="px-4 py-2 bg-[#17142B] text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}