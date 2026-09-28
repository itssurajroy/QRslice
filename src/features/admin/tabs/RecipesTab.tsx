// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState } from "react";

type Gravy = {
  id: string;
  name: string;
  quantity_prepared: number;
  unit: string;
  prepared_at: string;
  shelf_life_hours: number;
};

type Recipe = {
  id: string;
  item_name: string;
  ingredient_name: string;
  quantity_required: number;
  unit: string;
};

interface MenuItemProps {
  id: string;
  name: string;
  price_paise: number;
}

export function RecipesTab({
  itemList = [],
  flash,
}: {
  itemList?: MenuItemProps[];
  flash: (kind: "ok" | "err", msg: string) => void;
}) {
  const [gravies, setGravies] = useState<Gravy[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [subTab, setSubTab] = useState<"gravies" | "recipes">("gravies");

  const [showGravyForm, setShowGravyForm] = useState(false);
  const [newGravy, setNewGravy] = useState({
    name: "",
    quantity: 5,
    unit: "liters",
    shelf_life_hours: 24,
  });

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    menu_item_id: itemList[0]?.id || "",
    ingredient_name: "",
    quantity_required: 100,
    unit: "grams",
  });

  useEffect(() => {
    fetchGravies();
    fetchRecipes();
  }, []);

  async function fetchGravies() {
    try {
      const res = await fetch("/api/inventory/gravies");
      if (res.ok) {
        const data = await res.json();
        setGravies(data || []);
      }
    } catch {
      /* ignore */
    }
  }

  async function fetchRecipes() {
    try {
      const res = await fetch("/api/inventory/recipes");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data || []);
      }
    } catch {
      /* ignore */
    }
  }

  async function handleAddGravy(e: React.FormEvent) {
    e.preventDefault();
    if (!newGravy.name.trim()) return flash("err", "Gravy batch name is required");
    try {
      const res = await fetch("/api/inventory/gravies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGravy.name.trim(),
          quantity_prepared: Number(newGravy.quantity),
          unit: newGravy.unit,
          shelf_life_hours: Number(newGravy.shelf_life_hours),
        }),
      });
      if (res.ok) {
        flash("ok", `Logged fresh batch: ${newGravy.name}`);
        setNewGravy({ name: "", quantity: 5, unit: "liters", shelf_life_hours: 24 });
        setShowGravyForm(false);
        fetchGravies();
      } else {
        flash("err", "Failed to log gravy batch");
      }
    } catch {
      flash("err", "Network error logging gravy");
    }
  }

  async function handleAddRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!newRecipe.ingredient_name.trim()) return flash("err", "Ingredient name is required");
    try {
      const res = await fetch("/api/inventory/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_item_id: newRecipe.menu_item_id || itemList[0]?.id,
          ingredient_name: newRecipe.ingredient_name.trim(),
          quantity_required: Number(newRecipe.quantity_required),
          unit: newRecipe.unit,
        }),
      });
      if (res.ok) {
        flash("ok", "Added recipe ingredient mapping!");
        setNewRecipe({ menu_item_id: itemList[0]?.id || "", ingredient_name: "", quantity_required: 100, unit: "grams" });
        setShowRecipeForm(false);
        fetchRecipes();
      } else {
        flash("err", "Failed to save recipe mapping");
      }
    } catch {
      flash("err", "Network error saving recipe");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>🍛 Gravy & Recipe Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track base gravy batches, shelf lives, and menu dish ingredient BOM recipes.
          </p>
        </div>

        {/* SubTab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSubTab("gravies")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === "gravies" ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🥘 Base Gravies
          </button>
          <button
            type="button"
            onClick={() => setSubTab("recipes")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === "recipes" ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            📖 Recipe BOM Mappings
          </button>
        </div>
      </div>

      {/* SubTab 1: Gravy Batches */}
      {subTab === "gravies" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Active Gravy Prep Batches
            </h3>
            <button
              type="button"
              onClick={() => setShowGravyForm(!showGravyForm)}
              className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {showGravyForm ? "Cancel" : "+ Log Fresh Batch"}
            </button>
          </div>

          {showGravyForm && (
            <form onSubmit={handleAddGravy} className="p-4 bg-slate-50 border border-indigo-100 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-indigo-900 uppercase">Log Fresh Gravy Batch</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Gravy Name</label>
                  <input
                    required
                    placeholder="e.g. Makhani Gravy"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newGravy.name}
                    onChange={(e) => setNewGravy({ ...newGravy, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newGravy.quantity}
                    onChange={(e) => setNewGravy({ ...newGravy, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Unit</label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newGravy.unit}
                    onChange={(e) => setNewGravy({ ...newGravy, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Shelf Life (Hours)</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newGravy.shelf_life_hours}
                    onChange={(e) => setNewGravy({ ...newGravy, shelf_life_hours: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Save Batch
              </button>
            </form>
          )}

          {gravies.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-2xl">🥘</span>
              <p className="text-xs font-bold text-slate-600">No gravy batches logged today.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Log fresh Makhani, Yellow Dal, or Tomato Gravy batches to track kitchen prep capacity.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gravies.map((g) => (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900">{g.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-[10px] uppercase">
                      Fresh Batch
                    </span>
                  </div>
                  <div className="text-xs font-mono text-brand font-bold">
                    {g.quantity_prepared} {g.unit || "Liters"} Prepared
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prep: {new Date(g.prepared_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • Shelf: {g.shelf_life_hours || 24}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Recipe BOM Mappings */}
      {subTab === "recipes" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Menu Item Ingredient BOM Mappings
            </h3>
            <button
              type="button"
              onClick={() => setShowRecipeForm(!showRecipeForm)}
              className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {showRecipeForm ? "Cancel" : "+ Add Recipe Mapping"}
            </button>
          </div>

          {showRecipeForm && (
            <form onSubmit={handleAddRecipe} className="p-4 bg-slate-50 border border-indigo-100 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-indigo-900 uppercase">New Recipe Ingredient Link</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Menu Dish</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newRecipe.menu_item_id}
                    onChange={(e) => setNewRecipe({ ...newRecipe, menu_item_id: e.target.value })}
                  >
                    {itemList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (₹{(item.price_paise / 100).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Raw Ingredient Name</label>
                  <input
                    required
                    placeholder="e.g. Fresh Cream / Cottage Cheese"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    value={newRecipe.ingredient_name}
                    onChange={(e) => setNewRecipe({ ...newRecipe, ingredient_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quantity / Serving</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      value={newRecipe.quantity_required}
                      onChange={(e) => setNewRecipe({ ...newRecipe, quantity_required: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Unit</label>
                    <input
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      value={newRecipe.unit}
                      onChange={(e) => setNewRecipe({ ...newRecipe, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Save Recipe BOM
              </button>
            </form>
          )}

          {recipes.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-2xl">📖</span>
              <p className="text-xs font-bold text-slate-600">No dish recipe BOM mappings defined yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Map menu dishes (e.g. Paneer Butter Masala) to ingredients (200g Paneer, 50ml Makhani Gravy) for automated inventory deduction.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Menu Dish</th>
                    <th className="px-4 py-3">Raw Ingredient</th>
                    <th className="px-4 py-3">Serving Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recipes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{r.item_name || "Paneer Tikka"}</td>
                      <td className="px-4 py-3 text-slate-700">{r.ingredient_name || "Paneer"}</td>
                      <td className="px-4 py-3 font-mono font-bold text-brand">
                        {r.quantity_required} {r.unit || "g"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

