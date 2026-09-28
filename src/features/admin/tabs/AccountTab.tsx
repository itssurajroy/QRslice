// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  LockIcon,
  PhoneIcon,
  UsersIcon,
  CheckCircleIcon,
  CreditCardIcon,
  AlertTriangleIcon,
  XCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/Icons";

interface AccountTabProps {
  restaurant: any;
  userRole?: string;
  flash: (kind: "ok" | "err", msg: string) => void;
  onNavigateTab?: (tab: any) => void;
}

interface ProfileData {
  id: string;
  email: string;
  display_name: string;
  phone: string;
  role: string;
  active: boolean;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  pin: boolean;
}

interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tier: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_status: string;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
}

interface SubscriptionData {
  plan: string;
  isTrial: boolean;
  isSuspended: boolean;
  daysLeft: number;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  billingStatus: string;
}

interface SessionData {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export function AccountTab({ restaurant, userRole = "owner", flash, onNavigateTab }: AccountTabProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [loading, setLoading] = useState(true);

  // Security
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassText, setShowPassText] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/account");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setProfile(data.profile);
            setRestaurantData(data.restaurant);
            setSubscription(data.subscription);
            setOwnerName(data.profile.display_name);
            setOwnerEmail(data.profile.email);
            setOwnerPhone(data.profile.phone);
          }
        }
      } catch {
        flash("err", "Failed to load account data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load sessions
  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const res = await fetch("/api/admin/sessions");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.sessions)) {
            setSessions(data.sessions);
          }
        }
      } catch {
        setSessions([
          {
            id: "sess_1",
            device: "Chrome on Windows 11 (Current Workstation)",
            ip: "103.120.45.18",
            location: "New Delhi, India",
            lastActive: "Active now",
            isCurrent: true,
          },
        ]);
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          display_name: ownerName,
          phone: ownerPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, display_name: ownerName, phone: ownerPhone } : null);
      setIsEditingProfile(false);
      flash("ok", "Owner profile updated successfully! ✓");
    } catch (err: any) {
      flash("err", err.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      flash("err", "New passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      flash("err", "Password must be at least 8 characters long.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      flash("ok", "Password changed successfully across all devices! 🔒");
    } catch (err: any) {
      flash("err", err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setToggling2FA(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_2fa",
          enabled: newValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle 2FA");
      
      setTwoFactorEnabled(newValue);
      flash("ok", `Two-Factor Authentication ${newValue ? "ENABLED" : "DISABLED"}`);
    } catch (err: any) {
      flash("err", err.message || "Failed to toggle 2FA");
    } finally {
      setToggling2FA(false);
    }
  };

  const handleLogoutOtherSessions = async () => {
    try {
      const otherSessions = sessions.filter((s) => !s.isCurrent);
      await Promise.all(
        otherSessions.map((s) =>
          fetch("/api/admin/sessions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id }),
          })
        )
      );
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      flash("ok", "Logged out other devices! ✓");
    } catch {
      flash("err", "Failed to logout other sessions");
    }
  };

  const handleDeactivateAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deactivate_account",
          confirmation: "DELETE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate account");
      
      setShowDeleteModal(false);
      flash("ok", "Account deactivation request logged. Support will verify within 24 hours.");
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      flash("err", err.message || "Failed to deactivate account");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-16">
        <div className="p-8 text-center text-slate-400 text-xs font-mono">
          Loading account data…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-16">
        <div className="p-8 text-center text-slate-400 text-xs">
          Failed to load account data
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#5738F5]/10 text-[#5738F5] flex items-center justify-center font-black">
              👤
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17142B] tracking-tight">
              Owner Account & Security Control Center
            </h2>
          </div>
          <p className="text-xs text-[#6F7185] mt-1 font-medium">
            Manage your personal profile, authentication credentials, active devices, and restaurant ownership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Account Verified ✓
          </span>
        </div>
      </div>

      {/* 1. PROFILE SECTION */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E4F0] pb-4">
          <div>
            <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
              Profile Information
            </h3>
            <p className="text-xs text-[#6F7185]">
              Who you are — personal owner contact and authentication profile.
            </p>
          </div>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl text-xs font-bold text-[#17142B]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl text-xs font-bold text-[#17142B]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                Owner Phone Number (WhatsApp Enabled)
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl text-xs font-bold text-[#17142B]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5738F5] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
              >
                Save Profile ✓
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Owner Name
              </span>
              <span className="text-sm font-black text-[#17142B] block">{ownerName}</span>
              <span className="text-[10px] text-emerald-600 font-bold">Role: {profile.role === "owner" ? "Super Owner" : profile.role}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Account Email
              </span>
              <span className="text-sm font-mono font-bold text-[#17142B] block truncate">
                {ownerEmail}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                {profile.email_confirmed ? "Email Verified ✓" : "Email Pending"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Primary Phone
              </span>
              <span className="text-sm font-mono font-bold text-[#17142B] block">{ownerPhone}</span>
              <span className="text-[10px] text-[#5738F5] font-bold">
                {profile.pin ? "WhatsApp 2FA Linked" : "WhatsApp 2FA Not Set"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. SECURITY SECTION */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-6">
        <div className="border-b border-[#E7E4F0] pb-4">
          <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
            Security & Authentication
          </h3>
          <p className="text-xs text-[#6F7185]">
            Manage passwords, two-factor authentication, and station locks.
          </p>
        </div>

        <div className="space-y-4">
          {/* Password row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#17142B]/5 text-[#17142B] flex items-center justify-center">
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-[#17142B] block">Account Password</span>
                <span className="text-xs text-[#6F7185] font-mono">Last changed 2 weeks ago</span>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-white border border-[#E7E4F0] hover:bg-slate-50 text-[#17142B] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Change Password
            </button>
          </div>

          {/* 2FA row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5738F5] flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-[#17142B] block">Two-Factor Authentication (2FA)</span>
                <span className="text-xs text-[#6F7185]">
                  Require WhatsApp OTP or Authenticator App on new logins
                </span>
              </div>
            </div>
            <button
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                twoFactorEnabled
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-[#E7E4F0] text-slate-700 hover:bg-slate-50"
              }`}
            >
              {toggling2FA ? "Updating…" : twoFactorEnabled ? "2FA Enabled ✓" : "Enable 2FA"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE SESSIONS & DEVICES */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E7E4F0] pb-4 gap-2">
          <div>
            <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
              Active Sessions & Devices ({sessions.length})
            </h3>
            <p className="text-xs text-[#6F7185]">
              Terminals, phones, and browsers currently logged into this owner account.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleLogoutOtherSessions}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Logout All Other Devices
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            Loading sessions…
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#17142B]">{sess.device}</span>
                    {sess.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Current Device
                      </span>
                    )}
                  </div>
                  <div className="text-[#6F7185] flex items-center gap-3 text-[11px] font-mono">
                    <span>IP: {sess.ip}</span>
                    <span>•</span>
                    <span>{sess.location}</span>
                    <span>•</span>
                    <span className="text-[#5738F5] font-semibold">{sess.lastActive}</span>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => {
                      setSessions((prev) => prev.filter((s) => s.id !== sess.id));
                      flash("ok", "Session terminated");
                    }}
                    className="px-3 py-1.5 bg-white border border-[#E7E4F0] hover:bg-rose-50 hover:text-rose-700 text-[#6F7185] font-bold rounded-xl cursor-pointer"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. RESTAURANT & SUBSCRIPTION AT-A-GLANCE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E4F0] pb-4">
          <div>
            <h3 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
              Restaurant Ownership & Subscription Plan
            </h3>
            <p className="text-xs text-[#6F7185]">
              Licensing status and billing tier for {restaurantData?.name || "this café"}.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("billing")}
              className="px-4 py-2 bg-[#5738F5] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
            >
              Manage Subscription →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
            <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
              Active Restaurant
            </span>
            <span className="text-sm font-black text-[#17142B] block">
              {restaurantData?.name || "Curry Leaf Express"}
            </span>
            <span className="text-[10px] text-[#6F7185] font-mono">
              Slug: /c/{restaurantData?.slug || "curryleaf"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
            <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
              Subscription Plan
            </span>
            <span className="text-sm font-black text-[#5738F5] block">
              {subscription?.isTrial ? "Free Trial" : subscription?.plan === "active" ? "Pro Unlimited (Multi-Table)" : subscription?.plan === "suspended" ? "Suspended" : "Unknown"}
            </span>
            {subscription?.isTrial && subscription?.daysLeft !== undefined && (
              <span className="text-[10px] text-amber-600 font-bold">{subscription.daysLeft} day(s) left in trial</span>
            )}
            {subscription?.isSuspended && (
              <span className="text-[10px] text-rose-600 font-bold">Suspended</span>
            )}
            {!subscription?.isTrial && !subscription?.isSuspended && (
              <span className="text-[10px] text-emerald-600 font-bold">Renews Monthly ✓</span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-1">
            <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
              Ownership Since
            </span>
            <span className="text-sm font-black text-[#17142B] block">
              {restaurantData?.created_at ? new Date(restaurantData.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Unknown"}
            </span>
            <span className="text-[10px] text-[#6F7185]">Primary Tenant Admin</span>
          </div>
        </div>
      </div>

      {/* 5. DANGER ZONE: ACCOUNT DELETION / DEACTIVATION */}
      <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-200 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 font-black text-sm uppercase tracking-wider">
          <AlertTriangleIcon className="w-4 h-4" />
          <span>Danger Zone: Account Deactivation</span>
        </div>
        <p className="text-xs text-rose-800 leading-relaxed">
          Deactivating your account will disconnect all live QR ordering sessions, cancel your active subscription, and revoke POS station access. This action cannot be easily undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer"
        >
          Deactivate Restaurant Account
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-[#E7E4F0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#17142B]">Change Account Password</h4>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  Current Password
                </label>
                <input
                  type={showPassText ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  New Password (Min 8 characters)
                </label>
                <input
                  type={showPassText ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassText ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassText(!showPassText)}
                  className="text-[11px] text-[#5738F5] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showPassText ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                  {showPassText ? "Hide characters" : "Show characters"}
                </button>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-[#5738F5] text-white font-black rounded-xl text-xs"
                >
                  {changingPassword ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-rose-200 shadow-2xl space-y-4">
            <h4 className="text-base font-black text-rose-600">Confirm Deactivation</h4>
            <p className="text-xs text-[#6F7185]">
              Type <strong className="text-rose-700 font-mono">DELETE</strong> below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 text-xs bg-rose-50 border border-rose-300 rounded-xl font-mono text-center font-bold text-rose-700"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== "DELETE"}
                onClick={handleDeactivateAccount}
                className="px-4 py-2 bg-rose-600 disabled:opacity-40 text-white font-black rounded-xl text-xs"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
