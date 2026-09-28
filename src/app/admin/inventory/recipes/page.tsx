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

type MenuItem = {
  id: string;
  name: string;
  price_paise: number;
};

type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

type RecipeItem = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
  menu_items: { id: string; name: string };
  ingredients: { id: string; name: string; unit: string };
};

export default function RecipesPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [menuRes, ingredientRes, recipeRes] = await Promise.all([
        fetch("/api/admin/crud"),
        fetch("/api/inventory/ingredients"),
        fetch("/api/inventory/recipes"),
      ]);

      const menuData = await menuRes.json();
      const ingredientData = await ingredientRes.json();
      const recipeData = await recipeRes.json();

      setMenuItems(menuData.items || []);
      setIngredients(ingredientData);
      setRecipes(recipeData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMenuItem || !selectedIngredient || !quantity) return;

    try {
      const res = await fetch("/api/inventory/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_item_id: selectedMenuItem,
          ingredient_id: selectedIngredient,
          quantity,
        }),
      });

      if (res.ok) {
        setSelectedMenuItem("");
        setSelectedIngredient("");
        setQuantity(0);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add recipe:", error);
    }
  }

  async function deleteRecipe(id: string) {
    if (!confirm("Remove this ingredient from recipe?")) return;
    try {
      const res = await fetch(`/api/inventory/recipes?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  }

  if (loading) {
    return (
      <div className="landing-page min-h-screen">
        <AdminHeader title="Recipes" />
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-slate-500">Loading recipes...</div>
        </div>
      </div>
    );
  }

  // Group recipes by menu item
  const recipesByMenuItem = new Map<string, RecipeItem[]>();
  for (const recipe of recipes) {
    const existing = recipesByMenuItem.get(recipe.menu_item_id) || [];
    existing.push(recipe);
    recipesByMenuItem.set(recipe.menu_item_id, existing);
  }

  return (
    <div className="landing-page min-h-screen">
      <AdminHeader title="Recipes" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recipe Management</h1>
        <p className="text-sm text-slate-500">
          Link ingredients to menu items for automatic stock deduction
        </p>
      </div>

      {/* Add Recipe Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Add Ingredient to Recipe
        </h2>
        <form onSubmit={addRecipe} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Menu Item
              </label>
              <select
                required
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select menu item</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — ₹{(item.price_paise / 100).toFixed(0)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ingredient
              </label>
              <select
                required
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select ingredient</option>
                {ingredients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Quantity per Serving
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={quantity || ""}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g., 0.5"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Add to Recipe
          </button>
        </form>
      </div>

      {/* Recipes by Menu Item */}
      <div className="space-y-4">
        {menuItems.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              No menu items found. Create menu items first.
            </p>
          </div>
        ) : (
          menuItems.map((menuItem) => {
            const itemRecipes = recipesByMenuItem.get(menuItem.id) || [];
            return (
              <div
                key={menuItem.id}
                className="rounded-lg border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">{menuItem.name}</h3>
                  <p className="text-sm text-slate-500">
                    ₹{(menuItem.price_paise / 100).toFixed(0)} •{" "}
                    {itemRecipes.length} ingredient{itemRecipes.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {itemRecipes.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-slate-500">
                    No ingredients linked yet
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {itemRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <div>
                          <span className="font-medium text-slate-900">
                            {recipe.ingredients.name}
                          </span>
                          <span className="ml-2 text-sm text-slate-500">
                            {recipe.quantity} {recipe.ingredients.unit} per serving
                          </span>
                        </div>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
      </main>
    </div>
  );
}

