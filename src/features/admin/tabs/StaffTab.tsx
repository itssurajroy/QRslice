// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from 'react';

export function StaffTab({
  restaurantId,
  userRole,
  flash,
}: {
  restaurantId: string;
  userRole?: string;
  flash?: (kind: "ok" | "err", msg: string) => void;
}) {
  const isOwner = userRole === "owner" || userRole === "super_admin";
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [pinModalUser, setPinModalUser] = useState<any | null>(null);
  const [pinModalValue, setPinModalValue] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [newPin, setNewPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadStaff() {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/admin/staff`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, [restaurantId]);

  const filteredStaff = staff.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return (
      s.display_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q)
    );
  });

  const handleToggleActive = async (user: any) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      if (res.ok) {
        setStaff((prev) =>
          prev.map((s) => (s.id === user.id ? { ...s, active: !user.active } : s))
        );
      }
    } catch (e) {
      console.error("Failed to toggle staff status", e);
    }
  };

  const handleSetPin = (user: any) => {
    setPinModalUser(user);
    setPinModalValue('');
  };

  const handleSavePinModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;
    if (!/^\d{4}$/.test(pinModalValue.trim())) {
      if (flash) flash("err", "PIN must be exactly 4 digits");
      else setErrorMsg("PIN must be exactly 4 digits");
      return;
    }
    setSavingPin(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pinModalUser.id, pin: pinModalValue.trim() }),
      });
      if (res.ok) {
        setStaff((prev) =>
          prev.map((s) => (s.id === pinModalUser.id ? { ...s, has_pin: true } : s))
        );
        if (flash) flash("ok", `PIN set for ${pinModalUser.display_name || pinModalUser.email}`);
        setPinModalUser(null);
      } else {
        const d = await res.json();
        if (flash) flash("err", d.error || "Failed to set PIN");
        else setErrorMsg(d.error || "Failed to set PIN");
      }
    } catch (e) {
      console.error("Failed to set PIN", e);
      if (flash) flash("err", "Failed to set PIN");
    } finally {
      setSavingPin(false);
    }
  };

  const handleClearPin = async (user: any) => {
    if (!confirm(`Clear the quick sign-in PIN for ${user.display_name || user.email || 'this member'}?`)) return;
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, pin: "" }),
      });
      if (res.ok) {
        setStaff((prev) =>
          prev.map((s) => (s.id === user.id ? { ...s, has_pin: false } : s))
        );
        if (flash) flash("ok", `PIN cleared for ${user.display_name || user.email}`);
      } else {
        const d = await res.json();
        if (flash) flash("err", d.error || "Failed to clear PIN");
        else setErrorMsg(d.error || "Failed to clear PIN");
      }
    } catch (e) {
      console.error("Failed to clear PIN", e);
      if (flash) flash("err", "Failed to clear PIN");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== id));
        if (flash) flash("ok", "Team member removed successfully");
      } else {
        const d = await res.json();
        if (flash) flash("err", d.error || "Failed to remove staff member");
        else setErrorMsg(d.error || "Failed to remove staff member");
      }
    } catch (e) {
      console.error("Failed to delete staff member", e);
      if (flash) flash("err", "Failed to remove staff member");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (newPin && !/^\d{4}$/.test(newPin.trim())) {
        throw new Error('PIN must be exactly 4 digits (or leave blank for no PIN).');
      }

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          ...(newPin.trim() ? { pin: newPin.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff');
      }

      setSuccessMsg('Staff member added successfully!');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
      setNewPin('');
      loadStaff();
      
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Team & Staff</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage users who have access to this café.</p>
        </div>
        {isOwner ? (
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Add Team Member
          </button>
        ) : (
          <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span>🛡️</span> Read-Only (Manager Mode)
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full sm:w-auto flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search team members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Name & Email</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Quick PIN</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Created</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {user.display_name || 'Unnamed Staff'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {user.email || '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        user.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                        user.role === 'admin' || user.role === 'manager' ? 'bg-brand-lavender text-brand-dark' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' ? 'manager' : user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {isOwner ? (
                        user.has_pin ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                              •••• Set
                            </span>
                            <button
                              type="button"
                              onClick={() => handleClearPin(user)}
                              className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Clear PIN"
                            >
                              Clear
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPin(user)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-lavender text-slate-600 hover:text-brand-dark text-[11px] font-bold transition-colors cursor-pointer"
                            title="Set 4-digit quick sign-in PIN"
                          >
                            + Set PIN
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">
                          {user.has_pin ? "•••• Set" : "—"}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          className="flex items-center gap-1.5 cursor-pointer group"
                        >
                          <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          <span className={`text-[11px] font-bold ${user.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 opacity-75">
                          <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          <span className={`text-[11px] font-bold ${user.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-500 font-mono text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '—'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(user.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic font-medium">Owner only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-lg text-slate-900">Add Team Member</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">{errorMsg}</div>}
              {successMsg && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">{successMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                <input 
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="text-[10px] text-slate-400 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                >
                  <option value="staff">Staff / Server</option>
                  <option value="admin">Manager / Admin</option>
                  <option value="waiter">Waiter (order-taking, PIN)</option>
                  <option value="kitchen">Kitchen Chef (KDS only, PIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quick Sign-in PIN <span className="font-medium text-slate-400">(optional, 4 digits)</span></label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand font-mono tracking-widest"
                  placeholder="••••"
                />
                <p className="text-[10px] text-slate-400 mt-1">Kitchen and waiter staff use this on shared terminals. Leave blank for no PIN.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set PIN Modal */}
      {pinModalUser && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setPinModalUser(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Set Quick Sign-in PIN</h3>
              <button
                type="button"
                onClick={() => setPinModalUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set 4-digit numeric PIN for <strong className="text-slate-900">{pinModalUser.display_name || pinModalUser.email}</strong> to quickly sign in on kitchen KDS or waiter handhelds.
            </p>

            <form onSubmit={handleSavePinModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4-Digit Numeric PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  autoFocus
                  value={pinModalValue}
                  onChange={(e) => setPinModalValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-widest text-slate-900 focus:outline-none focus:border-brand"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalUser(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPin || pinModalValue.length !== 4}
                  className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  {savingPin ? "Saving..." : "Save PIN ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
