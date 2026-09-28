// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function AdminHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-brand">
            QRslice
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/admin" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

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

export default function InventoryPage() {
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
    min_stock: 0,
    category: "",
  });
  const [transferData, setTransferData] = useState({
    from_location: "kitchen",
    to_location: "storage",
    quantity: 0,
  });
  const [purchaseData, setPurchaseData] = useState({
    location: "kitchen",
    quantity: 0,
    supplier: "",
    cost: 0,
  });

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, []);

  async function fetchInventory() {
    try {
      const res = await fetch("/api/inventory/stock");
      const data = await res.json();
      setIngredients(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/inventory/alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  }

  async function addIngredient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIngredient),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewIngredient({ name: "", unit: "kg", cost_per_unit: 0, min_stock: 0, category: "" });
        fetchInventory();
        fetchAlerts();
      }
    } catch (error) {
      console.error("Failed to add ingredient:", error);
    }
  }

  async function deleteIngredient(id: string) {
    if (!confirm("Delete this ingredient?")) return;
    try {
      const res = await fetch(`/api/inventory/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchInventory();
        fetchAlerts();
      }
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
    }
  }

  async function transferStock(e: React.FormEvent) {
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
        setShowTransferForm(false);
        setSelectedIngredient(null);
        setTransferData({ from_location: "kitchen", to_location: "storage", quantity: 0 });
        fetchInventory();
        fetchAlerts();
      }
    } catch (error) {
      console.error("Failed to transfer stock:", error);
    }
  }

  async function purchaseStock(e: React.FormEvent) {
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
        setShowPurchaseForm(false);
        setSelectedIngredient(null);
        setPurchaseData({ location: "kitchen", quantity: 0, supplier: "", cost: 0 });
        fetchInventory();
        fetchAlerts();
      }
    } catch (error) {
      console.error("Failed to purchase stock:", error);
    }
  }

  if (loading) {
    return (
      <div className="landing-page min-h-screen">
        <AdminHeader title="Inventory" />
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-slate-500">Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page min-h-screen">
      <AdminHeader title="Inventory" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
              <p className="text-sm text-slate-500">
                Track ingredients and stock levels
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Add Ingredient
            </button>
          </div>

          {/* Alerts */}
          {alerts && alerts.low_stock_count > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-amber-800">
                  {alerts.low_stock_count} item{alerts.low_stock_count !== 1 ? "s" : ""} low on stock
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {alerts.items.slice(0, 3).map((item) => (
                  <p key={item.id} className="text-sm text-amber-700">
                    {item.name}: {item.total_quantity} {item.unit} remaining (min: {item.min_stock})
                  </p>
                ))}
                {alerts.items.length > 3 && (
                  <p className="text-sm text-amber-600">
                    +{alerts.items.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Add Ingredient Form */}
          {showAddForm && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Ingredient</h2>
              <form onSubmit={addIngredient} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <input type="text" required value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Milk" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Unit</label>
                    <select value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="litre">Litre</option>
                      <option value="ml">Millilitre (ml)</option>
                      <option value="piece">Piece</option>
                      <option value="dozen">Dozen</option>
                      <option value="packet">Packet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cost per Unit ({"\u20B9"})</label>
                    <input type="number" step="0.01" value={newIngredient.cost_per_unit} onChange={(e) => setNewIngredient({ ...newIngredient, cost_per_unit: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Minimum Stock (reorder at)</label>
                    <input type="number" step="0.01" value={newIngredient.min_stock} onChange={(e) => setNewIngredient({ ...newIngredient, min_stock: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Category</label>
                    <input type="text" value={newIngredient.category} onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Dairy, Spices" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Add Ingredient</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Transfer Stock Modal */}
          {showTransferForm && selectedIngredient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Transfer Stock — {selectedIngredient.name}</h2>
                <form onSubmit={transferStock} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">From</label>
                      <select value={transferData.from_location} onChange={(e) => setTransferData({ ...transferData, from_location: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="kitchen">Kitchen</option>
                        <option value="storage">Storage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">To</label>
                      <select value={transferData.to_location} onChange={(e) => setTransferData({ ...transferData, to_location: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="storage">Storage</option>
                        <option value="kitchen">Kitchen</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Quantity ({selectedIngredient.unit})</label>
                    <input type="number" step="0.01" required value={transferData.quantity} onChange={(e) => setTransferData({ ...transferData, quantity: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Transfer</button>
                    <button type="button" onClick={() => { setShowTransferForm(false); setSelectedIngredient(null); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Purchase Stock Modal */}
          {showPurchaseForm && selectedIngredient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Purchase Stock — {selectedIngredient.name}</h2>
                <form onSubmit={purchaseStock} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Add to Location</label>
                    <select value={purchaseData.location} onChange={(e) => setPurchaseData({ ...purchaseData, location: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="kitchen">Kitchen</option>
                      <option value="storage">Storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Quantity ({selectedIngredient.unit})</label>
                    <input type="number" step="0.01" required value={purchaseData.quantity} onChange={(e) => setPurchaseData({ ...purchaseData, quantity: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Supplier (optional)</label>
                    <input type="text" value={purchaseData.supplier} onChange={(e) => setPurchaseData({ ...purchaseData, supplier: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Amul Distributor" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cost ({"\u20B9"})</label>
                    <input type="number" step="0.01" value={purchaseData.cost} onChange={(e) => setPurchaseData({ ...purchaseData, cost: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Record Purchase</button>
                    <button type="button" onClick={() => { setShowPurchaseForm(false); setSelectedIngredient(null); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Ingredients Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Ingredient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Kitchen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Storage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Min Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                      No ingredients yet. Add your first ingredient to get started.
                    </td>
                  </tr>
                ) : (
                  ingredients.map((item) => (
                    <tr key={item.id} className={item.is_low ? "bg-amber-50" : ""}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{item.name}</div>
                          {item.category && <div className="text-xs text-slate-500">{item.category}</div>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{item.kitchen_quantity} {item.unit}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{item.storage_quantity} {item.unit}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{item.total_quantity} {item.unit}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{item.min_stock} {item.unit}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {item.is_low ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">In Stock</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setSelectedIngredient(item); setShowTransferForm(true); }} className="text-brand hover:text-indigo-900">Transfer</button>
                          <button onClick={() => { setSelectedIngredient(item); setShowPurchaseForm(true); }} className="text-green-600 hover:text-green-900">Purchase</button>
                          <button onClick={() => deleteIngredient(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sub-nav */}
          <div className="flex gap-4 text-sm">
            <Link href="/admin/inventory/recipes" className="text-brand hover:text-indigo-800 font-medium">Recipe Management →</Link>
            <Link href="/admin/inventory/gravies" className="text-brand hover:text-indigo-800 font-medium">Gravy Recipes →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

