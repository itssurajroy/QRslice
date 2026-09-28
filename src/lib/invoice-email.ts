// Copyright (c) 2026 QRslice. All rights reserved.
import { Resend } from "resend";
import { InvoiceService } from "@/lib/invoice.service";

export interface InvoiceEmailResult {
  sent: boolean;
  skipped?: string;
  orderId: string;
  to: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email a tax-invoice PDF for an order via Resend.
 * Mirrors email.ts: unconfigured provider → soft skip (never throws to POS UI).
 */
export async function sendInvoiceEmail(opts: {
  orderId: string;
  to: string;
  restaurantName?: string;
}): Promise<InvoiceEmailResult> {
  const { orderId, to } = opts;
  const email = String(to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { sent: false, skipped: "invalid-email", orderId, to: email };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.log(
      `[invoice-email] skipped for ${orderId} → ${email} (RESEND_API_KEY/EMAIL_FROM not configured)`,
    );
    return { sent: false, skipped: "email-provider-unconfigured", orderId, to: email };
  }

  const { pdfBuffer, invoiceData } = await InvoiceService.generateInvoice(orderId);
  const restaurantName = opts.restaurantName || invoiceData.restaurant.name;
  const orderNumber = invoiceData.order.order_number;
  const totalRupees = (invoiceData.order.total_paise / 100).toFixed(2);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `Invoice #${orderNumber} — ${restaurantName}`,
    html: [
      `<h1 style="font-family:sans-serif;color:#0f172a;">${escapeHtml(restaurantName)}</h1>`,
      `<p style="font-family:sans-serif;">Thanks for your visit. Your tax invoice for order <strong>#${escapeHtml(String(orderNumber))}</strong> is attached.</p>`,
      `<p style="font-family:sans-serif;"><strong>Total: ₹${escapeHtml(totalRupees)}</strong></p>`,
      `<p style="color:#64748b;font-size:12px;">QRslice · Generated automatically<br><br>123 QRslice Blvd, Tech District, 94107<br><a href="https://qrslice.com/unsubscribe" style="color:#64748b;">Unsubscribe</a></p>`,
    ].join(""),
    attachments: [
      {
        filename: `TaxInvoice-${orderNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    console.error(`[invoice-email] ${orderId} → ${email} failed:`, error.message);
    return { sent: false, skipped: error.message, orderId, to: email };
  }

  return { sent: true, orderId, to: email };
}
