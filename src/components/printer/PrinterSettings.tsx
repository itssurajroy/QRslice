// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";
import { usePrinter } from "@/components/printer/PrinterProvider";
import { PrinterIcon } from "@/components/Icons";

interface PrinterSettingsProps {
  onFlash: (type: "ok" | "err", message: string) => void;
}

export default function PrinterSettings({ onFlash }: PrinterSettingsProps) {
  const {
    isConnected,
    isConnecting,
    deviceName,
    status,
    error,
    paperWidth,
    autoPrintKOT,
    connect,
    disconnect,
    testPrint,
    setPaperWidth,
    setAutoPrintKOT,
  } = usePrinter();

  const [testPrinting, setTestPrinting] = useState(false);

  useEffect(() => {
    if (status) {
      onFlash(status.includes("failed") || status.includes("failed") ? "err" : "ok", status);
    }
  }, [status, onFlash]);

  useEffect(() => {
    if (error) {
      onFlash("err", error);
    }
  }, [error, onFlash]);

  const handleConnect = async () => {
    try {
      await connect();
      onFlash("ok", `Connected to ${deviceName}`);
    } catch (err) {
      onFlash("err", err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleTestPrint = async () => {
    if (!isConnected) return;
    setTestPrinting(true);
    try {
      await testPrint();
      onFlash("ok", "Test print sent!");
    } catch (err) {
      onFlash("err", err instanceof Error ? err.message : "Test print failed");
    } finally {
      setTestPrinting(false);
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
            <PrinterIcon className="w-4 h-4" />
            KOT & Bill Thermal Printer Setup (Bluetooth / USB)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure thermal roll size, ESC/POS protocol & auto-cut features for physical kitchen slips.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                Connected: {deviceName}
              </span>
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={testPrinting}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {testPrinting ? "Printing..." : "Test Print"}
              </button>
              <button
                type="button"
                onClick={disconnect}
                className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs cursor-pointer"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Printer"}
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Thermal Paper Width
            </label>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value as "58mm" | "80mm")}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="80mm">80mm Standard POS (3 Inches)</option>
              <option value="58mm">58mm Compact Mobile (2 Inches)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Auto-Print Behavior
            </label>
            <select
              value={autoPrintKOT ? "auto_kot" : "manual"}
              onChange={(e) => setAutoPrintKOT(e.target.value === "auto_kot")}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="auto_kot">Auto-Print KOT on New Order</option>
              <option value="manual">Manual Print Button Only</option>
              <option value="bill_only">Bill Print on Settlement</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Printer Interface
            </label>
            <div className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-500">
              Bluetooth (Web Bluetooth API)
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
        <p>• Works with any ESC/POS compatible thermal printer (Epson, Star, Bixolon, generic)</p>
        <p>• Requires Chrome/Edge on Android, ChromeOS, or Windows with Web Bluetooth</p>
        <p>• Pair printer in OS Bluetooth settings first, then connect here</p>
        <p>• 80mm = standard receipt width, 58mm = compact mobile printers</p>
      </div>
    </div>
  );
}
