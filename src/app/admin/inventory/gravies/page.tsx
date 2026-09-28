// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
          <Link href="/admin/inventory" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
            Inventory
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">{title}</span>
        </div>
      </div>
    </header>
  );
}

type Ingredient = { id: string; name: string; unit: string; cost_per_unit: number };
type GravyIngredient = { id: string; quantity: number; ingredients: Ingredient };
type Gravy = {
  id: string;
  name: string;
  instructions: string | null;
  yield_quantity: number;
  yield_unit: string;
  total_cost: number;
  cost_per_yield: number;
  gravy_ingredients: GravyIngredient[];
};

export default function GraviesPage() {
  const [gravies, setGravies] = useState<Gravy[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGravy, setSelectedGravy] = useState<Gravy | null>(null);
  const [newGravy, setNewGravy] = useState({ name: "", instructions: "", yield_quantity: 1, yield_unit: "portion" });
  const [newGravyIngredient, setNewGravyIngredient] = useState({ ingredient_id: "", quantity: 0 });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [graviesRes, ingredientsRes] = await Promise.all([
        fetch("/api/inventory/gravies"),
        fetch("/api/inventory/ingredients"),
      ]);
      setGravies(await graviesRes.json());
      setIngredients(await ingredientsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function addGravy(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/inventory/gravies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGravy),
    });
    if (res.ok) {
      setShowAddForm(false);
      setNewGravy({ name: "", instructions: "", yield_quantity: 1, yield_unit: "portion" });
      fetchData();
    }
  }

  async function deleteGravy(id: string) {
    if (!confirm("Delete this gravy recipe?")) return;
    await fetch(`/api/inventory/gravies/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function addGravyIngredient(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGravy) return;
    await fetch("/api/inventory/gravies/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gravy_recipe_id: selectedGravy.id, ...newGravyIngredient }),
    });
    setNewGravyIngredient({ ingredient_id: "", quantity: 0 });
    fetchData();
    // Refresh selected gravy
    const updated = gravies.find(g => g.id === selectedGravy.id);
    if (updated) setSelectedGravy(updated);
  }

  async function removeGravyIngredient(id: string) {
    await fetch(`/api/inventory/gravies/ingredients?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) return (
    <div className="landing-page min-h-screen">
      <AdminHeader title="Gravies" />
      <div className="flex h-64 items-center justify-center"><p className="text-sm text-slate-500">Loading gravies...</p></div>
    </div>
  );

  return (
    <div className="landing-page min-h-screen">
      <AdminHeader title="Gravies" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gravy & Recipe Management</h1>
          <p className="text-sm text-slate-500">Create gravy mixes and link them to menu items</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          Create Gravy Recipe
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">New Gravy Recipe</h2>
          <form onSubmit={addGravy} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input type="text" required value={newGravy.name} onChange={e => setNewGravy({ ...newGravy, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Butter Masala Gravy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Yield</label>
                <div className="flex gap-2">
                  <input type="number" step="0.1" value={newGravy.yield_quantity} onChange={e => setNewGravy({ ...newGravy, yield_quantity: parseFloat(e.target.value) || 1 })}
                    className="mt-1 block w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  <select value={newGravy.yield_unit} onChange={e => setNewGravy({ ...newGravy, yield_unit: e.target.value })}
                    className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="portion">Portions</option>
                    <option value="kg">Kg</option>
                    <option value="litre">Litres</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Instructions</label>
              <textarea rows={3} value={newGravy.instructions} onChange={e => setNewGravy({ ...newGravy, instructions: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Step-by-step preparation instructions..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Create</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gravies.length === 0 ? (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">No gravy recipes yet. Create your first gravy recipe.</p>
          </div>
        ) : gravies.map(gravy => (
          <div key={gravy.id} className={`rounded-lg border bg-white p-5 transition-all ${selectedGravy?.id === gravy.id ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{gravy.name}</h3>
                <p className="text-sm text-slate-500">{gravy.yield_quantity} {gravy.yield_unit} • ₹{gravy.cost_per_yield.toFixed(2)}/unit</p>
              </div>
              <button onClick={() => setSelectedGravy(selectedGravy?.id === gravy.id ? null : gravy)} className="text-brand hover:text-indigo-900 text-sm font-medium">
                {selectedGravy?.id === gravy.id ? "Close" : "Edit"}
              </button>
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 uppercase">Ingredients ({gravy.gravy_ingredients?.length || 0})</p>
              {gravy.gravy_ingredients?.length ? (
                <ul className="mt-1 space-y-1">
                  {gravy.gravy_ingredients.map(gi => (
                    <li key={gi.id} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{gi.ingredients.name} — {gi.quantity} {gi.ingredients.unit}</span>
                      <span className="text-slate-400">₹{(gi.ingredients.cost_per_unit * gi.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 mt-1">No ingredients added</p>
              )}
            </div>
            {gravy.instructions && (
              <div className="mt-3 rounded bg-slate-50 p-2">
                <p className="text-xs text-slate-600">{gravy.instructions}</p>
              </div>
            )}
            {selectedGravy?.id === gravy.id && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Add Ingredient</h4>
                <form onSubmit={addGravyIngredient} className="flex gap-2">
                  <select required value={newGravyIngredient.ingredient_id} onChange={e => setNewGravyIngredient({ ...newGravyIngredient, ingredient_id: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                    <option value="">Select</option>
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input type="number" step="0.01" required placeholder="Qty" value={newGravyIngredient.quantity || ""} onChange={e => setNewGravyIngredient({ ...newGravyIngredient, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                  <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">Add</button>
                </form>
                {gravy.gravy_ingredients?.length ? (
                  <div className="mt-2 space-y-1">
                    {gravy.gravy_ingredients.map(gi => (
                      <div key={gi.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{gi.ingredients.name} — {gi.quantity} {gi.ingredients.unit}</span>
                        <button onClick={() => removeGravyIngredient(gi.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button onClick={() => deleteGravy(gravy.id)} className="mt-3 text-sm text-red-600 hover:text-red-900">Delete Recipe</button>
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
      </main>
    </div>
  );
}

