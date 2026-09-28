// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlugIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PrinterIcon,
  CreditCardIcon,
  MessageCircleIcon,
  XCircleIcon,
  SparklesIcon,
  SearchIcon,
  RefreshCwIcon,
} from "@/components/Icons";

export type IntegrationStatus = "connected" | "not_connected" | "connecting" | "action_required" | "error" | "disabled";

export interface IntegrationItem {
  id: string;
  name: string;
  category: "communication" | "payment" | "hardware" | "marketing" | "accounting" | "logistics";
  status: IntegrationStatus;
  description: string;
  connectedSince?: string;
  icon: string;
  docsUrl?: string;
}

interface IntegrationsTabProps {
  restaurant: any;
  flash: (kind: "ok" | "err", msg: string) => void;
}

export function IntegrationsTab({ restaurant, flash }: IntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<IntegrationItem | null>(null);
  const [modalInput1, setModalInput1] = useState("");
  const [modalInput2, setModalInput2] = useState("");
  const [modalInput3, setModalInput3] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Fetch integrations from API
  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.integrations)) {
          setIntegrations(data.integrations);
        }
      }
    } catch {
      flash("err", "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const connectedList = integrations.filter((i) => i.status === "connected");
  const availableList = integrations.filter((i) => i.status !== "connected");

  const openConfigModal = (item: IntegrationItem) => {
    setActiveModal(item);
    setTestResult(null);
    setTestError(null);
    if (item.id === "razorpay") {
      setModalInput1("rzp_live_...");
      setModalInput2("secret_...");
      setModalInput3("");
    } else if (item.id === "email") {
      setModalInput1("re_...");
      setModalInput2("");
      setModalInput3("");
    } else if (item.id === "sms") {
      setModalInput1("AC...");
      setModalInput2("token_...");
      setModalInput3("+1234567890");
    } else if (item.id === "ga4") {
      setModalInput1("G-XXXXXXXXXX");
      setModalInput2("");
      setModalInput3("");
    } else if (item.id === "google_reviews") {
      setModalInput1("https://g.page/r/...");
      setModalInput2("");
      setModalInput3("");
    } else if (item.id === "thermal_printer") {
      setModalInput1("192.168.1.120");
      setModalInput2("80mm Standard ESC/POS");
      setModalInput3("");
    } else {
      setModalInput1("");
      setModalInput2("");
      setModalInput3("");
    }
  };

  const handleTestConnection = async () => {
    if (!activeModal) return;
    setTestingConnection(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: activeModal.id,
          config: { input1: modalInput1, input2: modalInput2, input3: modalInput3 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to validate connection");
      
      setTestResult(data.message || "Connection test passed!");
      flash("ok", `Connection verified for ${activeModal.name}!`);
    } catch (err: any) {
      setTestError(err.message);
      flash("err", err.message);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!activeModal) return;
    
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: activeModal.id,
          status: "connected",
          config: { input1: modalInput1, input2: modalInput2, input3: modalInput3 },
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save integration");
      
      // Update local state
      setIntegrations((prev) =>
        prev.map((i) => (i.id === activeModal.id ? { ...i, status: "connected" } : i))
      );
      setActiveModal(null);
      flash("ok", `${activeModal.name} configured and activated successfully!`);
    } catch {
      flash("err", "Failed to activate integration");
    }
  };

  const renderStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
            Connected
          </span>
        );
      case "action_required":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3 text-amber-600" />
            Action Required
          </span>
        );
      case "connecting":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5738F5] border border-purple-200">
            Connecting...
          </span>
        );
      case "error":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600">
            Available
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#5738F5]/10 text-[#5738F5] flex items-center justify-center font-bold">
              <PlugIcon className="w-4 h-4 text-[#5738F5]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17142B] tracking-tight">
              Integrations & Extensions Hub
            </h2>
          </div>
          <p className="text-xs text-[#6F7185] mt-1 font-medium">
            Connect QRslice with the tools and hardware your restaurant already relies on.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-[#E6F8F3] text-emerald-800 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            {connectedList.length} Active Integrations
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-mono">
          Loading integrations…
        </div>
      ) : (
        <>
          {/* 1. CONNECTED INTEGRATIONS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#17142B] uppercase tracking-wider">
                Connected Services ({connectedList.length})
              </h3>
              <span className="text-xs text-[#6F7185]">Operational and synchronized with POS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#5738F5]/40 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      {renderStatusBadge(item.status)}
                    </div>
                    <h4 className="text-sm font-black text-[#17142B]">{item.name}</h4>
                    <p className="text-xs text-[#6F7185] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-[#6F7185]">
                      Status: <strong className="text-emerald-700">Healthy</strong>
                    </span>
                    <button
                      onClick={() => openConfigModal(item)}
                      className="px-3 py-1.5 bg-[#F1EFF7] hover:bg-[#5738F5] hover:text-white text-[#17142B] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Manage &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. AVAILABLE INTEGRATIONS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#17142B] uppercase tracking-wider">
                Available Integrations ({availableList.length})
              </h3>
              <span className="text-xs text-[#6F7185]">1-Click add-ons for billing, inventory, and logistics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      {renderStatusBadge(item.status)}
                    </div>
                    <h4 className="text-sm font-black text-[#17142B]">{item.name}</h4>
                    <p className="text-xs text-[#6F7185] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#6F7185]">Ready to setup</span>
                    <button
                      onClick={() => openConfigModal(item)}
                      className="px-3.5 py-1.5 bg-[#5738F5] hover:bg-[#4628D8] text-white text-xs font-black rounded-xl transition shadow-2xs cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Setup / Management Modal */}
          {activeModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-[#E7E4F0] shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E4F0] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeModal.icon}</span>
                    <h4 className="text-sm font-black text-[#17142B]">
                      Configure {activeModal.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-[#6F7185]">{activeModal.description}</p>

                  <div>
                    <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      {activeModal.id === "thermal_printer" ? "Printer IP Address or Port" 
                        : activeModal.id === "razorpay" ? "Key ID" 
                        : activeModal.id === "sms" ? "Twilio Account SID"
                        : activeModal.id === "ga4" ? "Measurement ID"
                        : activeModal.id === "google_reviews" ? "Google Maps URL"
                        : "API Key"}
                    </label>
                    <input
                      type="text"
                      value={modalInput1}
                      onChange={(e) => setModalInput1(e.target.value)}
                      placeholder={activeModal.id === "razorpay" ? "e.g. rzp_live_..." : "e.g. 192.168.1.100 or key_..."}
                      className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-xs"
                    />
                  </div>

                  {activeModal.id !== "ga4" && activeModal.id !== "google_reviews" && activeModal.id !== "email" && (
                  <div>
                    <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      {activeModal.id === "thermal_printer" ? "Paper Width & Protocol" 
                        : activeModal.id === "sms" ? "Auth Token"
                        : "Key Secret"}
                    </label>
                    <input
                      type="password"
                      value={modalInput2}
                      onChange={(e) => setModalInput2(e.target.value)}
                      placeholder={activeModal.id === "thermal_printer" ? "e.g. 80mm Standard" : "e.g. secret_..."}
                      className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-xs"
                    />
                  </div>
                  )}

                  {activeModal.id === "sms" && (
                    <div>
                      <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                        Twilio Phone Number
                      </label>
                      <input
                        type="text"
                        value={modalInput3}
                        onChange={(e) => setModalInput3(e.target.value)}
                        placeholder="e.g. +1234567890"
                        className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-xs"
                      />
                    </div>
                  )}

                  {testResult && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                      ✓ {testResult}
                    </div>
                  )}
                  
                  {testError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                      ⚠ {testError}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3.5 py-2 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {testingConnection ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : "⚡"}
                    Test Connection
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveIntegration}
                      className="px-4 py-2 bg-[#5738F5] text-white font-black rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Save & Activate ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
