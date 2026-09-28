// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { generateBeautifulQrDataUrl } from "@/lib/qr-designer";

export type Ticket = {
  code: string; name: string; party_size: number;
  starts_at: string; ends_at: string; status: string;
  table_labels: string[];
  table_qr?: string | null;
  restaurants: { name: string; slug: string } | { name: string; slug: string }[];
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const cafe = Array.isArray(ticket.restaurants) ? ticket.restaurants[0] : ticket.restaurants;
  const [qr, setQr] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = typeof window !== "undefined" ? `${window.location.origin}/bookings/${ticket.code}` : "";

  useEffect(() => {
    if (!url) return;
    try {
      const dataUrl = generateBeautifulQrDataUrl({
        text: url,
        size: 260,
        theme: "violet",
        centerIcon: "sparkles",
        dotShape: "dots",
      });
      setQr(dataUrl);
    } catch {
      QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setQr).catch(() => {});
    }
  }, [url]);

  function downloadJpeg() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/jpeg", 0.92);
    a.download = `booking-${ticket.code}.jpg`;
    a.click();
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !qr) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 640, 760);
      ctx.fillStyle = "#4f46e5";
      ctx.fillRect(0, 0, 640, 120);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText(cafe?.name ?? "Café", 32, 70);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 30px sans-serif";
      const slot = `${new Date(ticket.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(ticket.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
      ctx.fillText(`Tables: ${ticket.table_labels.join(", ")}`, 32, 180);
      ctx.fillText(slot, 32, 225);
      ctx.fillText(`${ticket.party_size} guests • ${ticket.name}`, 32, 270);
      ctx.font = "bold 44px monospace";
      ctx.fillText(ticket.code, 32, 330);
      ctx.drawImage(img, 200, 380, 240, 240);
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Show this at the counter", 32, 680);
    };
    img.src = qr;
  }, [qr, ticket, cafe]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4 text-center">
      <p className="text-xs font-bold text-brand uppercase tracking-widest">Table Reservation</p>
      <h1 className="text-2xl font-bold text-slate-900">{cafe?.name}</h1>
      <p className="text-sm text-slate-600">Tables {ticket.table_labels.join(", ")} • {ticket.party_size} guests</p>
      <p className="text-sm text-slate-600">
        {new Date(ticket.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} –{" "}
        {new Date(ticket.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-3xl font-black font-mono tracking-widest text-slate-900">{ticket.code}</p>
      {qr && <img src={qr} alt="Booking QR" className="w-44 h-44 mx-auto rounded-xl border border-slate-200" />}
      <canvas ref={canvasRef} width={640} height={760} className="hidden" />
      {ticket.table_qr && (
        <a href={`/t/${ticket.table_qr}?booking=${ticket.code}`}
          className="block w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm text-center cursor-pointer">
          Open My Table Menu →
        </a>
      )}
      <button type="button" onClick={downloadJpeg} disabled={!qr}
        className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-black text-sm cursor-pointer">
        Download Ticket (JPEG)
      </button>
      <button type="button" onClick={() => window.print()} className="w-full py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs cursor-pointer">Print Instead</button>
      <p className="text-xs text-slate-500">Status: {ticket.status}</p>
    </div>
  );
}

