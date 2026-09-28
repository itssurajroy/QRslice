// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export interface CommunicationMessage {
  id: string;
  order_id: string | null;
  order_number?: number | null;
  message_type: string;
  recipient_phone: string | null;
  status: string;
  sent_at?: string | null;
  created_at?: string | null;
  error_message?: string | null;
  latest_event?: { event_type: string; created_at: string } | null;
}

type ChannelFilter = "all" | "email" | "sms";

const CHANNEL_TABS: { id: ChannelFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
];

const STATUS_OPTIONS = ["all", "pending", "sent", "delivered", "read", "failed"] as const;

function formatStatus(status: string): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadge(status: string): string {
  switch (status) {
    case "delivered":
    case "read":
    case "sent":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "failed":
    case "bounced":
      return "bg-red-100 text-red-700 border-red-200";
    case "pending":
    case "queued":
    case "sending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function CommunicationsTab({
  flash,
  userRole,
}: {
  flash?: (kind: "ok" | "err", msg: string) => void;
  userRole?: string;
}) {
  const canResend = userRole === "owner" || userRole === "super_admin";
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const notify = useCallback(
    (kind: "ok" | "err", msg: string) => {
      if (flash) flash(kind, msg);
    },
    [flash],
  );

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("type", channel);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/admin/communications?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load communication history");
      setMessages(data.messages || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load communication history";
      setError(msg);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channel, statusFilter]);

  useEffect(() => {
    loadMessages();
  }, [channel, loadMessages]);

  async function handleResend(msg: CommunicationMessage) {
    if (!msg.order_id) {
      notify("err", "Cannot resend: message has no linked order");
      return;
    }
    setResendingId(msg.id);
    try {
      // Generic resend — uses the admin communications API
      const res = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: msg.order_id,
          phone: msg.recipient_phone,
          type: channel === "email" ? "email" : "sms",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      notify("ok", data.idempotent ? "Message already sent — showing existing record" : "Message re-queued for delivery");
      loadMessages();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Resend failed");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Communication History</h2>
          <p className="text-xs text-slate-500 font-medium">
            Communication delivery history and resend status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Channel filter">
            {CHANNEL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={channel === t.id}
                onClick={() => setChannel(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  channel === t.id
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : formatStatus(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(channel === "email" || channel === "sms") && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <p className="text-2xl">{channel === "email" ? "📧" : "💬"}</p>
          <p className="text-sm font-bold text-slate-700">
            {channel === "email" ? "Email" : "SMS"} communications coming soon
          </p>
          <p className="text-xs text-slate-500">
            Communication history will appear here after messages are sent.
          </p>
        </div>
      )}

      {channel !== "email" && channel !== "sms" && (
        <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <p className="p-6 text-xs text-slate-500 font-medium">Loading messages…</p>
          ) : error ? (
            <p className="p-6 text-xs text-red-600 font-bold">{error}</p>
          ) : messages.length === 0 ? (
            <p className="p-6 text-xs text-slate-500 font-medium">
              No messages yet. Communication will appear here after the first send.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="text-left px-4 py-3 font-black">Order</th>
                    <th className="text-left px-4 py-3 font-black">Customer</th>
                    <th className="text-left px-4 py-3 font-black">Type</th>
                    <th className="text-left px-4 py-3 font-black">Status</th>
                    <th className="text-left px-4 py-3 font-black">Sent</th>
                    <th className="text-left px-4 py-3 font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <React.Fragment key={m.id}>
                      <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {m.order_number != null ? `Order #${m.order_number}` : "Order —"}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {m.recipient_phone || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {m.message_type === "bill_receipt" ? "Bill Receipt" : m.message_type}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge(m.status)}`}
                          >
                            {formatStatus(m.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {m.sent_at ? formatDate(m.sent_at) : m.created_at ? formatDate(m.created_at) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                            >
                              View
                            </button>
                            {canResend && (
                              <button
                                type="button"
                                disabled={resendingId === m.id}
                                onClick={() => handleResend(m)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-colors"
                              >
                                {resendingId === m.id ? "Sending…" : "Resend"}
                              </button>
                            )}
                          </div>
                          </td>
                        </tr>
                        {expandedId === m.id && (
                          <tr className="border-t border-slate-100 bg-slate-50/70">
                            <td colSpan={6} className="px-4 py-3">
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-600">
                                <div className="flex gap-2">
                                  <dt className="font-bold text-slate-500">Message ID:</dt>
                                  <dd className="font-mono break-all">{m.id}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="font-bold text-slate-500">Latest event:</dt>
                                  <dd>
                                    {m.latest_event
                                      ? `${formatStatus(m.latest_event.event_type)} · ${formatDate(m.latest_event.created_at)}`
                                      : "—"}
                                  </dd>
                                </div>
                                {m.error_message && (
                                  <div className="flex gap-2 sm:col-span-2">
                                    <dt className="font-bold text-red-500">Error:</dt>
                                    <dd className="text-red-600">{m.error_message}</dd>
                                  </div>
                                )}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}