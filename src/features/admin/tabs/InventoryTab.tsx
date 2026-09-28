// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState, useCallback } from "react";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  min_stock: number;
  cost_per_unit: number;
  category: string | null;
  kitchen_quantity: number;
  storage_quantity: number;
  total_quantity: number;
  is_low: boolean;
};

type Alert = {
  total_ingredients: number;
  low_stock_count: number;
  items: Ingredient[];
};

export function InventoryTab({ flash }: { flash: (kind: "ok" | "err", msg: string) => void }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [alerts, setAlerts] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "kg",
    cost_per_unit: 0,
    min_stock: 5,
    category: "General",
  });

  const [transferData, setTransferData] = useState({
    from_location: "storage",
    to_location: "kitchen",
    quantity: 1,
  });

  const [purchaseData, setPurchaseData] = useState({
    location: "storage",
    quantity: 10,
    supplier: "",
    cost: 0,
  });

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/stock");
      if (res.ok) {
        const data = await res.json();
        setIngredients(data || []);
      }
    } catch {
      flash("err", "Failed to load inventory stock");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch {
      /* ignore alert error */
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, [fetchInventory, fetchAlerts]);

  async function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault();
    if (!newIngredient.name.trim()) return flash("err", "Ingredient name is required");
    try {
      const res = await fetch("/api/inventory/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIngredient),
      });
      if (res.ok) {
        flash("ok", `Ingredient "${newIngredient.name}" added to stock control!`);
        setShowAddForm(false);
        setNewIngredient({ name: "", unit: "kg", cost_per_unit: 0, min_stock: 5, category: "General" });
        fetchInventory();
        fetchAlerts();
      } else {
        flash("err", "Failed to add ingredient");
      }
    } catch {
      flash("err", "Network error adding ingredient");
    }
  }

  async function handleDeleteIngredient(id: string, name: string) {
    if (!confirm(`Delete ingredient "${name}"?`)) return;
    try {
      const res = await fetch(`/api/inventory/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        flash("ok", `Deleted ${name}`);
        fetchInventory();
        fetchAlerts();
      } else {
        flash("err", "Failed to delete ingredient");
      }
    } catch {
      flash("err", "Network error");
    }
  }

  async function handleTransferStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIngredient) return;
    try {
      const res = await fetch("/api/inventory/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id: selectedIngredient.id,
          ...transferData,
        }),
      });
      if (res.ok) {
        flash("ok", `Stock transferred for ${selectedIngredient.name}`);
        setShowTransferForm(false);
        setSelectedIngredient(null);
        fetchInventory();
        fetchAlerts();
      } else {
        flash("err", "Failed to transfer stock");
      }
    } catch {
      flash("err", "Error submitting transfer");
    }
  }

  async function handleRecordPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIngredient) return;
    try {
      const res = await fetch("/api/inventory/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id: selectedIngredient.id,
          ...purchaseData,
        }),
      });
      if (res.ok) {
        flash("ok", `Restock purchase logged for ${selectedIngredient.name}`);
        setShowPurchaseForm(false);
        setSelectedIngredient(null);
        fetchInventory();
        fetchAlerts();
      } else {
        flash("err", "Failed to record purchase");
      }
    } catch {
      flash("err", "Error recording purchase");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>📦 Stock Control & Low-Stock Alerts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time raw ingredient tracking, threshold alerts & automatic dish recipe deduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            + Add Ingredient
          </button>
          <button
            type="button"
            onClick={() => { fetchInventory(); fetchAlerts(); }}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            🔄 Refresh Stock
          </button>
        </div>
      </div>

      {/* Low Stock Alert Header Summary */}
      {alerts && alerts.low_stock_count > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h3 className="font-bold text-sm text-amber-900">
              Low Stock Warning: {alerts.low_stock_count} item(s) below threshold!
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            WhatsApp alerts have been sent to the café manager. Please reorder raw ingredients to prevent kitchen delays.
          </p>
        </div>
      )}

      {/* Stock Levels Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            Loading stock levels & ingredients…
          </div>
        ) : ingredients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-lavender text-brand flex items-center justify-center mx-auto text-xl font-bold">
              📦
            </div>
            <p className="text-sm font-bold text-slate-700">No ingredients registered yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your raw inventory items (e.g. Milk, Coffee Beans, Pizza Cheese, Flour) to start automatic recipe tracking.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-brand text-white font-bold text-xs cursor-pointer"
            >
              + Create First Ingredient
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Ingredient</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Kitchen Stock</th>
                  <th className="px-6 py-3">Storage Stock</th>
                  <th className="px-6 py-3">Total Quantity</th>
                  <th className="px-6 py-3">Min Threshold</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className={ing.is_low ? "bg-amber-500/5" : "hover:bg-slate-50/50"}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{ing.name}</span>
                        {ing.is_low && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-extrabold text-[10px] uppercase">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">₹{ing.cost_per_unit} / {ing.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{ing.category || "General"}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {ing.kitchen_quantity} {ing.unit}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {ing.storage_quantity} {ing.unit}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand">
                      {ing.total_quantity} {ing.unit}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {ing.min_stock} {ing.unit}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedIngredient(ing); setShowTransferForm(true); }}
                        className="px-2.5 py-1.5 rounded-lg bg-brand-lavender text-brand font-bold hover:bg-brand-lavender transition-colors cursor-pointer min-h-[36px]"
                      >
                        🔄 Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedIngredient(ing); setShowPurchaseForm(true); }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer min-h-[36px]"
                      >
                        ➕ Restock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                        className="px-2 py-1.5 text-slate-400 hover:text-red-600 font-bold cursor-pointer min-h-[36px]"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Ingredient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Add New Raw Ingredient</h3>
            <form onSubmit={handleAddIngredient} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ingredient Name</label>
                <input
                  required
                  placeholder="e.g. Arabica Coffee Beans"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Unit</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="grams">Grams (g)</option>
                    <option value="liters">Liters (L)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="units">Units / Pieces</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newIngredient.min_stock}
                    onChange={(e) => setNewIngredient({ ...newIngredient, min_stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand text-white font-black text-xs cursor-pointer"
                >
                  Add Ingredient ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferForm && selectedIngredient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Transfer Stock: {selectedIngredient.name}</h3>
            <form onSubmit={handleTransferStock} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">From</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={transferData.from_location}
                    onChange={(e) => setTransferData({ ...transferData, from_location: e.target.value })}
                  >
                    <option value="storage">Storage Pantry</option>
                    <option value="kitchen">Kitchen Counter</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">To</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={transferData.to_location}
                    onChange={(e) => setTransferData({ ...transferData, to_location: e.target.value })}
                  >
                    <option value="kitchen">Kitchen Counter</option>
                    <option value="storage">Storage Pantry</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quantity ({selectedIngredient.unit})</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand text-white font-black text-xs cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {showPurchaseForm && selectedIngredient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Restock Purchase: {selectedIngredient.name}</h3>
            <form onSubmit={handleRecordPurchase} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Restock Quantity ({selectedIngredient.unit})</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  value={purchaseData.quantity}
                  onChange={(e) => setPurchaseData({ ...purchaseData, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Supplier Name (Optional)</label>
                <input
                  placeholder="e.g. Metro Wholesale / Dairy Vendor"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  value={purchaseData.supplier}
                  onChange={(e) => setPurchaseData({ ...purchaseData, supplier: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs cursor-pointer"
                >
                  Save Purchase ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

