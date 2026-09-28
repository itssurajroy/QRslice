// Copyright (c) 2026 QRslice. All rights reserved.
import { Resend } from "resend";

export type TrialEmailDay = 0 | 7 | 12 | 14;

interface TrialEmailContext {
  cafeName: string;
  daysLeft: number;
  ordersCount?: number;
  revenuePaise?: number;
  billingUrl: string;
}

const SUBJECTS: Record<TrialEmailDay, string> = {
  0: "Welcome to QRslice — your 14-day trial has started 🎉",
  7: "You're halfway through your QRslice trial",
  12: "2 days left — keep your kitchen running",
  14: "Your QRslice trial has ended — upgrade to restore ordering",
};

function template(day: TrialEmailDay, ctx: TrialEmailContext): string {
  const head = `<h1 style="font-family:sans-serif;color:#0f172a;">${ctx.cafeName} × QRslice</h1>`;
  const cta = `<a href="${ctx.billingUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">${day === 14 ? "Restore full access" : "Upgrade now"}</a>`;
  const foot = `<p style="color:#64748b;font-size:12px;">QRslice · ₹999/month per outlet · GST extra · Cancel anytime<br><br>123 QRslice Blvd, Tech District, 94107<br><a href="https://qrslice.com/unsubscribe" style="color:#64748b;">Unsubscribe</a></p>`;

  switch (day) {
    case 0:
      return `${head}<p>Your <strong>14-day full-access trial</strong> is live — QR ordering, KDS, stock, POS, everything. No credit card needed.</p><p>Get set up in 30 minutes: add your menu, print table QRs, and take your first order.</p>${cta}${foot}`;
    case 7: {
      const stats =
        ctx.ordersCount !== undefined
          ? `<p>So far: <strong>${ctx.ordersCount} orders</strong>${ctx.revenuePaise !== undefined ? ` · <strong>₹${(ctx.revenuePaise / 100).toLocaleString("en-IN")}</strong> revenue` : ""} through QRslice.</p>`
          : "";
      return `${head}<p>You're halfway through your trial — <strong>7 days left</strong>.</p>${stats}<p>Everything stays unlocked until day 14.</p>${cta}${foot}`;
    }
    case 12:
      return `${head}<p><strong>2 days left</strong> on your trial${ctx.daysLeft > 0 ? ` (${ctx.daysLeft} days remaining)` : ""}. Upgrade now so ordering never pauses during service.</p>${cta}${foot}`;
    case 14:
      return `${head}<p>Your trial has ended — customer ordering is paused, but <strong>nothing is deleted</strong>. Your menu, tables, and history are safe.</p><p>Upgrade to ₹999/month and you're live again instantly.</p>${cta}${foot}`;
  }
}

export async function sendTrialEmail(
  to: string,
  day: TrialEmailDay,
  ctx: TrialEmailContext,
): Promise<{ sent: boolean; skipped?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.log(`[email] skipped day${day} to ${to} (RESEND_API_KEY/EMAIL_FROM not configured)`);
    return { sent: false, skipped: "email-provider-unconfigured" };
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: SUBJECTS[day],
    html: template(day, ctx),
  });
  if (error) {
    console.error(`[email] day${day} to ${to} failed:`, error.message);
    return { sent: false, skipped: error.message };
  }
  return { sent: true };
}

