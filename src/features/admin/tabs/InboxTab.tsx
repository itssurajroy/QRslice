// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";

export function InboxTab({ flash }: { flash?: (kind: "ok" | "err", msg: string) => void }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-black text-slate-900">WhatsApp</h2>
      <p className="text-slate-500 mt-2">
        Use <a href="https://wa.me" className="text-brand blue underline" target="_blank" rel="noreferrer">wa.me</a> to start a WhatsApp conversation.
      </p>
      <p className="text-slate-400 mt-4 text-sm">
        Baileys integration removed — whiskeysockets no longer used.
      </p>
    </div>
  );
}