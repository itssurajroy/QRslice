// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { paise } from "@/lib/utils";
import { SlidersIcon, PlusIcon, CheckCircleIcon } from "@/components/Icons";

export interface ModifierOption {
  id: string;
  name: string;
  price_adjustment_paise: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  options: ModifierOption[];
}

export function ModifiersTab({ flash }: { flash: (kind: "ok" | "err", msg: string) => void }) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupMulti, setNewGroupMulti] = useState(false);

  // Fetch modifiers from API
  const fetchModifiers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/modifiers");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.groups)) {
          setGroups(data.groups);
        }
      }
    } catch {
      flash("err", "Failed to load modifiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModifiers();
  }, []);

  const saveGroups = async (updated: ModifierGroup[]) => {
    try {
      const res = await fetch("/api/admin/modifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || updated);
      } else {
        flash("err", "Failed to save modifiers");
      }
    } catch {
      flash("err", "Network error saving modifiers");
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: ModifierGroup = {
      id: `mod-${Date.now()}`,
      name: newGroupName.trim(),
      required: newGroupRequired,
      multi_select: newGroupMulti,
      options: [
        { id: `opt-${Date.now()}-1`, name: "Standard", price_adjustment_paise: 0 },
        { id: `opt-${Date.now()}-2`, name: "Extra", price_adjustment_paise: 3000 },
      ],
    };

    const updated = [...groups, newGroup];
    saveGroups(updated);
    setNewGroupName("");
    setShowAddModal(false);
    flash("ok", "Modifier group added successfully!");
  };

  const handleDeleteGroup = (id: string) => {
    if (!confirm("Delete this modifier group?")) return;
    const updated = groups.filter((g) => g.id !== id);
    saveGroups(updated);
    flash("ok", "Modifier group removed");
  };

  const handleUpdateGroup = (groupId: string, groupData: Partial<ModifierGroup>) => {
    const updated = groups.map((g) => (g.id === groupId ? { ...g, ...groupData } : g));
    saveGroups(updated);
  };

  const handleAddOption = (groupId: string) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          options: [
            ...g.options,
            { id: `opt-${Date.now()}`, name: "New Option", price_adjustment_paise: 0 },
          ],
        };
      }
      return g;
    });
    saveGroups(updated);
  };

  const handleUpdateOption = (groupId: string, optionId: string, optionData: Partial<ModifierOption>) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map((opt) => (opt.id === optionId ? { ...opt, ...optionData } : opt)),
        };
      }
      return g;
    });
    saveGroups(updated);
  };

  const handleDeleteOption = (groupId: string, optionId: string) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        return { ...g, options: g.options.filter((opt) => opt.id !== optionId) };
      }
      return g;
    });
    saveGroups(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Modifiers & Customizations
          </h2>
          <p className="text-xs text-[#6F7185] font-medium mt-0.5">
            Configure portion sizes, milk choices, spice levels, and paid add-ons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs shadow-md shadow-[#5738F5]/20 cursor-pointer"
        >
          + Add Modifier Group
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-mono">
          Loading modifiers…
        </div>
      ) : (
        <>
          {/* Modifier Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-[#17142B]">{group.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          group.required
                            ? "bg-amber-100 text-amber-800 font-black"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {group.required ? "REQUIRED" : "OPTIONAL"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-lavender text-brand-dark">
                        {group.multi_select ? "MULTI SELECT" : "SINGLE CHOICE"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>

                {/* Options List */}
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-1">
                  {group.options.map((opt) => (
                    <div key={opt.id} className="py-2 flex items-center justify-between text-xs">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => handleUpdateOption(group.id, opt.id, { name: e.target.value })}
                        className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#5738F5] text-xs font-semibold text-[#17142B] pr-2"
                      />
                      <input
                        type="number"
                        step={100}
                        value={opt.price_adjustment_paise}
                        onChange={(e) => handleUpdateOption(group.id, opt.id, { price_adjustment_paise: Number(e.target.value) })}
                        className="w-28 text-right bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#5738F5] text-xs font-mono text-[#5738F5] font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(group.id, opt.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1"
                        title="Delete option"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddOption(group.id)}
                    className="w-full mt-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="text-[11px] text-[#6F7185] flex items-center gap-1">
                  <span>✓ Live in customer ordering drawer</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Modifier Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <form
                onSubmit={handleAddGroup}
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-[#E7E4F0]">
                  <h3 className="text-base font-black text-[#17142B]">Create Modifier Group</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cheese Crust, Milk Choice"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-[#17142B]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGroupRequired}
                      onChange={(e) => setNewGroupRequired(e.target.checked)}
                      className="rounded text-[#5738F5]"
                    />
                    <span>Mandatory (Required)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGroupMulti}
                      onChange={(e) => setNewGroupMulti(e.target.checked)}
                      className="rounded text-[#5738F5]"
                    />
                    <span>Multiple Selection</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs cursor-pointer shadow-md shadow-[#5738F5]/20"
                  >
                    Save Group
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
