// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";

interface WebhooksTabProps {
  restaurant: { api_key?: string; webhook_url?: string; webhook_secret?: string };
  flash: (kind: "ok" | "err", msg: string) => void;
}

export function WebhooksTab({ restaurant, flash }: WebhooksTabProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [webhookSecret, setWebhookSecret] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load from API on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setApiKey(data.api_key || restaurant?.api_key || "");
            setWebhookUrl(data.webhook_url || restaurant?.webhook_url || "");
            setWebhookSecret(data.webhook_secret || restaurant?.webhook_secret || "");
          }
        }
      } catch {
        // fallback to props
        setApiKey(restaurant?.api_key || "");
        setWebhookUrl(restaurant?.webhook_url || "");
        setWebhookSecret(restaurant?.webhook_secret || "");
      }
    }
    loadSettings();
  }, [restaurant]);

  async function handleSaveWebhooks(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_settings",
          api_key: apiKey.trim(),
          webhook_url: webhookUrl.trim(),
          webhook_secret: webhookSecret.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      flash("ok", "API & Webhook settings saved successfully!");
    } catch (err: any) {
      flash("err", err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestWebhook() {
    if (!webhookUrl) return flash("err", "Please enter a valid Webhook URL first");
    setIsTesting(true);
    try {
      const res = await fetch("/api/admin/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl, secret: webhookSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test failed");
      flash("ok", "⚡ Test ping dispatched successfully! Received HTTP 200 OK.");
    } catch (err: any) {
      flash("err", err.message || "Test webhook failed");
    } finally {
      setIsTesting(false);
    }
  }

  function handleGenerateApiKey() {
    const newKey = `qrslice_live_pk_${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    flash("ok", "New API Secret Key generated! Make sure to save settings.");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>⚡ Menu Sync & API / Webhooks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect third-party POS systems, Zomato / Swiggy menu sync & real-time webhook event dispatchers.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-lavender text-brand border border-brand-lavender">
          Pro & Enterprise API
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleSaveWebhooks} className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Café API Authorization Key
              </label>
              <button
                type="button"
                onClick={handleGenerateApiKey}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                ↻ Generate New Key
              </button>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-800"
                value={apiKey}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  flash("ok", "API Key copied to clipboard!");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
              >
                Copy
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Pass this key as <code className="bg-slate-100 px-1 py-0.5 rounded text-brand">Bearer {"<"}key{">"}</code> header to authenticate with <code className="font-mono">/api/orders</code> or <code className="font-mono">/api/menu</code>.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Webhook URL Section */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Outgoing Webhook Endpoint URL
            </label>
            <input
              type="url"
              placeholder="https://your-server.com/api/qrslice-webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              We send signed JSON payloads for events like <code className="font-mono text-slate-600">order.placed</code>, <code className="font-mono text-slate-600">order.settled</code>, and <code className="font-mono text-slate-600">payment.confirmed</code>.
            </p>
          </div>

          {/* Webhook Secret Signature */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Webhook HMAC Secret
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono text-slate-600"
                value={webhookSecret}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webhookSecret);
                  flash("ok", "Webhook secret copied!");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
              >
                Copy
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Verify incoming requests using header <code className="font-mono text-slate-600">X-QRslice-Signature: sha256=...</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-black text-xs rounded-xl shadow-md shadow-brand/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving Settings..." : "Save Webhook Configuration"}
            </button>
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting}
              className="px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-300 cursor-pointer transition-all"
            >
              {isTesting ? "Sending Ping..." : "⚡ Send Test Webhook Ping"}
            </button>
          </div>
        </form>
      </div>

      {/* Payload Example */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-3 font-mono text-xs shadow-xl">
        <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
          <span>Sample Webhook Payload: order.placed</span>
          <span className="text-emerald-400 text-[10px] font-bold uppercase">POST JSON</span>
        </div>
        <pre className="text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
{`{
  "event": "order.placed",
  "created_at": "${new Date().toISOString()}",
  "data": {
    "order_id": "ord_9182ab912e",
    "order_number": 42,
    "table": "T04",
    "total_paise": 62000,
    "payment_status": "paid",
    "items": [
      { "name": "Cold Brew Hazelnut", "quantity": 2, "price_paise": 22000 },
      { "name": "Classic Margherita Pizza", "quantity": 1, "price_paise": 40000 }
    ]
  }
}`}
        </pre>
      </div>
    </div>
  );
}
