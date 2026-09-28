// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useBluetoothPrinter } from "@/lib/bluetooth-printer";
import { generateKOT, generateBill, generateTestPrint, KOTData, BillData } from "@/lib/thermal-printer";

interface PrinterContextType {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string;
  status: string;
  error: string | null;
  paperWidth: "58mm" | "80mm";
  autoPrintKOT: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  printKOT: (data: KOTData) => Promise<void>;
  printBill: (data: BillData) => Promise<void>;
  testPrint: () => Promise<void>;
  setPaperWidth: (width: "58mm" | "80mm") => void;
  setAutoPrintKOT: (enabled: boolean) => void;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export function PrinterProvider({ children }: { children: ReactNode }) {
  const {
    connect,
    disconnect,
    print,
    testPrint,
    isConnecting,
    isConnected,
    deviceName,
    status,
    error,
    setPaperWidth,
  } = useBluetoothPrinter();

  const [paperWidth, setPaperWidthState] = useState<"58mm" | "80mm">("80mm");
  const [autoPrintKOT, setAutoPrintKOT] = useState(false);

  // Persist settings
  useEffect(() => {
    const saved = localStorage.getItem("printer-settings");
    if (saved) {
      try {
        const { paperWidth: pw, autoPrintKOT: ap } = JSON.parse(saved);
        if (pw) setPaperWidthState(pw);
        if (ap !== undefined) setAutoPrintKOT(ap);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "printer-settings",
      JSON.stringify({ paperWidth, autoPrintKOT })
    );
  }, [paperWidth, autoPrintKOT]);

  const handleSetPaperWidth = useCallback((width: "58mm" | "80mm") => {
    setPaperWidthState(width);
    setPaperWidth(width);
  }, [setPaperWidth]);

  const printKOT = useCallback(
    async (data: KOTData) => {
      if (!isConnected) throw new Error("Printer not connected");
      const escpos = generateKOT(data, { paperWidth });
      await print(escpos.build());
    },
    [isConnected, paperWidth, print]
  );

  const printBill = useCallback(
    async (data: BillData) => {
      if (!isConnected) throw new Error("Printer not connected");
      const escpos = generateBill(data, { paperWidth });
      await print(escpos.build());
    },
    [isConnected, paperWidth, print]
  );

  return (
    <PrinterContext.Provider
      value={{
        isConnected,
        isConnecting,
        deviceName,
        status,
        error,
        paperWidth,
        autoPrintKOT,
        connect,
        disconnect,
        printKOT,
        printBill,
        testPrint,
        setPaperWidth: handleSetPaperWidth,
        setAutoPrintKOT,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error("usePrinter must be used within PrinterProvider");
  return ctx;
}
