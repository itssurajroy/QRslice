// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeIn, VIEWPORT_ONCE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";

export function Footer() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion;

  const variants = noMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeIn;

  return (
    <motion.footer
      className="bg-white border-t border-slate-200/80 pt-16 pb-12"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <QrSliceLogo size="md" variant="full" className="group-hover:scale-105 transition-transform" />
            </Link>
            <p className="text-sm font-semibold text-slate-700">
              Restaurant management, simplified.
            </p>
            <div className="space-y-1.5 text-xs text-slate-500 font-medium">
              <p className="flex items-center gap-1.5 flex-wrap">
                <span>QR Ordering</span>
                <span>•</span>
                <span>Digital Menu</span>
                <span>•</span>
                <span>KDS</span>
                <span>•</span>
                <span>Tables</span>
              </p>
              <p className="flex items-center gap-1.5 flex-wrap">
                <span>Inventory</span>
                <span>•</span>
                <span>Loyalty</span>
                <span>•</span>
                <span>Analytics</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/terms" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Refund &amp; Cancellation
                </Link>
              </li>
              <li>
                <Link href="/legal/shipping-delivery" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/grievance" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@qrslice.com"
                  className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors"
                >
                  support@qrslice.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918595101297"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <Link href="/faq" className="text-sm font-semibold text-slate-500 hover:text-[#5738F5] transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-400">
            © 2026 QrSlice. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span>Built in India</span>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#5738F5] transition-colors">
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
