// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "owner" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { integrationId, config } = await req.json();

    if (integrationId === "razorpay") {
      const { input1: keyId, input2: keySecret } = config;
      if (!keyId || !keySecret) {
        return NextResponse.json({ error: "Missing Key ID or Key Secret" }, { status: 400 });
      }

      const authStr = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const res = await fetch(`https://api.razorpay.com/v1/orders`, {
        headers: {
          Authorization: `Basic ${authStr}`,
        },
      });

      if (res.status === 401) {
        return NextResponse.json({ error: "Invalid Razorpay Key ID or Key Secret" }, { status: 401 });
      }

      return NextResponse.json({ ok: true, message: "Handshake successful! Razorpay API is authenticated." });
    }

    if (integrationId === "email") {
      const { input1: apiKey } = config;
      if (!apiKey || !apiKey.startsWith("re_")) {
        return NextResponse.json({ error: "Invalid Resend API Key format. Must start with 're_'" }, { status: 400 });
      }
      
      const res = await fetch("https://api.resend.com/emails", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ error: "Invalid Resend API Key. Authentication failed." }, { status: 401 });
      }
      return NextResponse.json({ ok: true, message: "Resend API authenticated successfully!" });
    }

    if (integrationId === "sms") {
      const { input1: sid, input2: token } = config;
      if (!sid || !token) {
        return NextResponse.json({ error: "Missing Twilio Account SID or Auth Token" }, { status: 400 });
      }

      const authStr = Buffer.from(`${sid}:${token}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        headers: { Authorization: `Basic ${authStr}` },
      });

      if (res.status === 401 || res.status === 404) {
        return NextResponse.json({ error: "Invalid Twilio credentials." }, { status: 401 });
      }
      return NextResponse.json({ ok: true, message: "Twilio SMS API authenticated successfully!" });
    }

    if (integrationId === "thermal_printer") {
      const { input1: ip } = config;
      if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return NextResponse.json({ error: "Invalid IP address format. Expected e.g., 192.168.1.100" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, message: "Printer network configuration format is valid!" });
    }

    if (integrationId === "ga4") {
      const { input1: mid } = config;
      if (!mid || !/^G-[A-Z0-9]+$/.test(mid)) {
        return NextResponse.json({ error: "Invalid Measurement ID. Must start with 'G-'" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, message: "Google Analytics 4 configuration format is valid!" });
    }
    
    if (integrationId === "google_reviews") {
      const { input1: url } = config;
      if (!url || !url.startsWith("http")) {
        return NextResponse.json({ error: "Invalid Google Maps URL. Must start with http:// or https://" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, message: "Google Reviews URL format is valid!" });
    }

    // Default catch-all for remaining format validations
    return NextResponse.json({ ok: true, message: "Configuration format is valid!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Test failed" }, { status: 500 });
  }
}
