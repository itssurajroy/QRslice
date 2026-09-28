// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const onboardingSchema = z.object({
  cafeName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  logoUrl: z.string().optional(),
  accentColor: z.string().optional(),
  tagline: z.string().max(120).optional(),
  gstin: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  upiId: z.string().max(60).optional(),
  googleReviewUrl: z.string().url("Please enter a valid Google review URL").optional().or(z.literal("")),
  taxRate: z.number().min(0).max(100).optional(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  tableCount: z.number().int().min(1).max(50).default(6),
  preset: z.enum(["coffee", "indian", "bistro", "fastfood", "pizza", "bar", "custom"]).default("coffee"),
  firstCategory: z.string().min(1).max(80).optional(),
  firstItem: z
    .object({
      name: z.string().min(1).max(100),
      price: z.number().min(0),
      desc: z.string().max(300).optional(),
      veg: z.boolean().default(true),
    })
    .optional(),
  ageVerified: z.boolean().refine(val => val === true, "Age verification is required"),
});

type PresetCategory = {
  name: string;
  sort: number;
  items: Array<{
    name: string;
    price: number;
    desc: string;
    veg: boolean;
  }>;
};

const PRESETS: Record<string, { categories: PresetCategory[] }> = {
  coffee: {
    categories: [
      {
        name: "Artisanal Coffee & Espresso",
        sort: 1,
        items: [
          { name: "Espresso Shot", price: 14000, desc: "Rich double shot of arabica blend", veg: true },
          { name: "Cappuccino", price: 18000, desc: "Fresh espresso with silky steamed milk and microfoam", veg: true },
          { name: "Vanilla Cold Brew", price: 21000, desc: "Steeped for 18 hours with Madagascar vanilla", veg: true },
          { name: "Caramel Macchiato", price: 23000, desc: "Layered espresso with salted caramel drizzle", veg: true },
        ],
      },
      {
        name: "Fresh Bakes & Bites",
        sort: 2,
        items: [
          { name: "Butter Croissant", price: 15000, desc: "Flaky golden French pastry baked fresh", veg: true },
          { name: "Avocado Sourdough Toast", price: 26000, desc: "Smashed avocado, cherry tomatoes and seeds on sourdough", veg: true },
          { name: "Blueberry Cheesecake", price: 24000, desc: "Classic New York style with wild berry compote", veg: true },
        ],
      },
    ],
  },
  indian: {
    categories: [
      {
        name: "Starters & Tandoor",
        sort: 1,
        items: [
          { name: "Paneer Tikka Special", price: 24000, desc: "Charcoal grilled cottage cheese marinated in hung curd and spices", veg: true },
          { name: "Murgh Malai Tikka", price: 29000, desc: "Tender chicken morsels with cream, cheese, and mild spices", veg: false },
          { name: "Crispy Corn Pepper Salt", price: 19000, desc: "Sweet corn tossed with scallions and crushed black pepper", veg: true },
        ],
      },
      {
        name: "Mains & Biryani",
        sort: 2,
        items: [
          { name: "Dal Makhani 24-Hour", price: 26000, desc: "Slow-simmered black lentils with butter and rich cream", veg: true },
          { name: "Butter Chicken Delhi Style", price: 34000, desc: "Boneless tandoori chicken in velvety tomato-butter gravy", veg: false },
          { name: "Hyderabadi Dum Biryani", price: 31000, desc: "Fragrant basmati rice layered with spiced marinated meat", veg: false },
          { name: "Garlic Butter Naan", price: 6000, desc: "Clay oven baked flatbread with roasted garlic", veg: true },
        ],
      },
    ],
  },
  bistro: {
    categories: [
      {
        name: "Starters & Salads",
        sort: 1,
        items: [
          { name: "Bruschetta Pomodoro", price: 19000, desc: "Toasted baguette with heirloom tomatoes and fresh basil", veg: true },
          { name: "Caesar Salad with Herb Croutons", price: 24000, desc: "Crisp romaine, shaved parmesan, garlic dressing", veg: true },
          { name: "Crispy Calamari", price: 29000, desc: "Lightly battered squid rings with lemon garlic aioli", veg: false },
        ],
      },
      {
        name: "Pastas & European Mains",
        sort: 2,
        items: [
          { name: "Truffle Mushroom Fettuccine", price: 34000, desc: "Creamy wild mushroom ragu with shaved parmesan", veg: true },
          { name: "Grilled Herb Chicken Breast", price: 38000, desc: "Sous-vide chicken with rosemary roasted baby potatoes", veg: false },
        ],
      },
    ],
  },
  fastfood: {
    categories: [
      {
        name: "Gourmet Burgers",
        sort: 1,
        items: [
          { name: "Classic Double Smash Cheeseburger", price: 22000, desc: "Double patty, aged cheddar, dill pickles and secret sauce", veg: false },
          { name: "Crispy Spiced Paneer Burger", price: 19000, desc: "Spiced paneer patty with mint mayo and crisp lettuce", veg: true },
          { name: "Smoky BBQ Bacon Burger", price: 26000, desc: "Beef patty, crispy bacon, caramelized onion and bbq sauce", veg: false },
        ],
      },
      {
        name: "Loaded Fries & Shakes",
        sort: 2,
        items: [
          { name: "Peri-Peri Cheesy Fries", price: 14000, desc: "Crisp golden fries dusted with peri-peri and melted cheese sauce", veg: true },
          { name: "Thick Belgian Chocolate Shake", price: 18000, desc: "Rich double chocolate shake with whipped cream", veg: true },
        ],
      },
    ],
  },
  pizza: {
    categories: [
      {
        name: "Wood-Fired Pizzas",
        sort: 1,
        items: [
          { name: "Margherita di Bufala", price: 32000, desc: "San Marzano tomato sauce, fresh buffalo mozzarella and sweet basil", veg: true },
          { name: "Spicy Pepperoni Rustica", price: 39000, desc: "Imported pepperoni, hot honey, mozzarella and oregano", veg: false },
          { name: "Farmhouse Veggie Supreme", price: 34000, desc: "Bell peppers, mushrooms, red onion, olives and jalapenos", veg: true },
        ],
      },
      {
        name: "Garlic Breads & Coolers",
        sort: 2,
        items: [
          { name: "Cheesy Garlic Pull-Apart", price: 18000, desc: "Fresh dough baked with roasted garlic herb butter and mozzarella", veg: true },
          { name: "Peach Basil Iced Tea", price: 15000, desc: "Brewed black tea infused with peach puree and fresh basil", veg: true },
        ],
      },
    ],
  },
  bar: {
    categories: [
      {
        name: "Bar Bites & Platters",
        sort: 1,
        items: [
          { name: "Loaded Nachos Supreme", price: 26000, desc: "Corn chips, pico de gallo, cheese sauce, sour cream and jalapenos", veg: true },
          { name: "Crispy Buffalo Chicken Wings", price: 29000, desc: "Tossed in spicy buffalo glaze with blue cheese dip", veg: false },
          { name: "Chilli Paneer Dry", price: 23000, desc: "Wok-tossed cottage cheese with bell peppers and dark soy", veg: true },
        ],
      },
      {
        name: "Signatures & Mocktails",
        sort: 2,
        items: [
          { name: "Classic Mint Mojito", price: 18000, desc: "Crushed mint, fresh lime, simple syrup and sparkling soda", veg: true },
          { name: "Electric Blue Lagoon", price: 19000, desc: "Blue curacao, lemon juice, sprite and a slice of orange", veg: true },
        ],
      },
    ],
  },
  custom: {
    categories: [
      {
        name: "Chef Specials",
        sort: 1,
        items: [
          { name: "Signature Dish", price: 20000, desc: "Chef special specialty item prepared fresh", veg: true },
        ],
      },
    ],
  },
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const admin = createSupabaseAdmin();

  // 1. Check if slug already exists
  const { data: existingSlug } = await admin
    .from("restaurants")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (existingSlug) {
    return NextResponse.json(
      { error: `Café URL slug "/c/${input.slug}" is already taken. Please choose another.` },
      { status: 409 },
    );
  }

  // 1.5 Prevent account hijacking: check if email already exists
  const emailLower = input.ownerEmail.toLowerCase().trim();
  const { data: existingUsersData } = await admin.auth.admin.listUsers();
  if (existingUsersData?.users?.some((u) => u.email === emailLower)) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in to create or register new cafés." },
      { status: 409 },
    );
  }

  // 2. Create the Restaurant Tenant (single plan + 14-day full-access trial)
  const { data: restaurant, error: restErr } = await admin
    .from("restaurants")
    .insert({
      name: input.cafeName,
      slug: input.slug,
      currency: input.currency,
      timezone: input.timezone,
      logo_url: input.logoUrl || null,
      accent_color: input.accentColor || "#5738F5",
      tagline: input.tagline ? input.tagline.trim() : null,
      gstin: input.gstin ? input.gstin.trim().toUpperCase() : null,
      address: input.address ? input.address.trim() : null,
      phone: input.phone ? input.phone.trim() : null,
      upi_id: input.upiId ? input.upiId.trim() : null,
      google_review_url: input.googleReviewUrl ? input.googleReviewUrl.trim() : null,
      tax_rate: input.taxRate !== undefined ? input.taxRate : 5,
      plan: "trial",
      tier: "pro",
      trial_starts_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (restErr || !restaurant) {
    return NextResponse.json(
      { error: restErr?.message || "Failed to create restaurant tenant" },
      { status: 500 },
    );
  }

  // 3. Create Owner Account
  const { data: newUser, error: userErr } = await admin.auth.admin.createUser({
    email: emailLower,
    password: input.ownerPassword,
    email_confirm: true,
  });
  if (userErr || !newUser?.user) {
    // rollback restaurant
    await admin.from("restaurants").delete().eq("id", restaurant.id);
    return NextResponse.json(
      { error: userErr?.message || "Failed to create owner account" },
      { status: 500 },
    );
  }
  const user = newUser.user;

  // 4. Create cafe_profiles record
  const { error: profErr } = await admin.from("cafe_profiles").upsert({
    id: user.id,
    restaurant_id: restaurant.id,
    role: "owner",
    display_name: input.ownerName,
    active: true,
  });

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  // 5. Generate Initial Tables with standard QR tokens
  const tableInserts = [];
  for (let t = 1; t <= input.tableCount; t++) {
    const label = `T${t < 10 ? "0" + t : t}`;
    tableInserts.push({
      restaurant_id: restaurant.id,
      label,
      seats: t % 2 === 0 ? 4 : 2,
      active: true,
    });
  }
  await admin.from("restaurant_tables").insert(tableInserts);

  // 6. Populate Menu (User's custom category & item + complementary starter items)
  let initialCategoryId: string | null = null;

  // Insert user's customized category and item as Priority #1
  if (input.firstCategory && input.firstCategory.trim()) {
    const { data: userCat } = await admin
      .from("menu_categories")
      .insert({
        restaurant_id: restaurant.id,
        name: input.firstCategory.trim(),
        sort_order: 1,
      })
      .select()
      .single();

    if (userCat) {
      initialCategoryId = userCat.id;
      if (input.firstItem && input.firstItem.name.trim()) {
        await admin.from("menu_items").insert({
          restaurant_id: restaurant.id,
          category_id: userCat.id,
          name: input.firstItem.name.trim(),
          description: input.firstItem.desc ? input.firstItem.desc.trim() : null,
          price_paise: Math.round(Number(input.firstItem.price) * 100),
          is_veg: Boolean(input.firstItem.veg),
          available: true,
          sort_order: 1,
        });
      }
    }
  }

  // Populate complementary preset items so the restaurant has a complete, working menu
  const presetData = PRESETS[input.preset] || PRESETS.coffee;
  let nextSortOrder = initialCategoryId ? 2 : 1;

  for (const cat of presetData.categories) {
    // If the preset has the same category name as user's category, append preset items to it
    if (
      input.firstCategory &&
      cat.name.toLowerCase() === input.firstCategory.trim().toLowerCase()
    ) {
      if (initialCategoryId) {
        const itemRows = cat.items.map((it, idx) => ({
          restaurant_id: restaurant.id,
          category_id: initialCategoryId!,
          name: it.name,
          description: it.desc,
          price_paise: it.price,
          is_veg: it.veg,
          available: true,
          sort_order: idx + 2,
        }));
        await admin.from("menu_items").insert(itemRows);
      }
      continue;
    }

    const { data: createdCat } = await admin
      .from("menu_categories")
      .insert({
        restaurant_id: restaurant.id,
        name: cat.name,
        sort_order: nextSortOrder++,
      })
      .select()
      .single();

    if (createdCat) {
      const itemRows = cat.items.map((it, idx) => ({
        restaurant_id: restaurant.id,
        category_id: createdCat.id,
        name: it.name,
        description: it.desc,
        price_paise: it.price,
        is_veg: it.veg,
        available: true,
        sort_order: idx + 1,
      }));
      await admin.from("menu_items").insert(itemRows);
    }
  }

  // 7. Record Audit event
  await admin.from("audit_events").insert({
    restaurant_id: restaurant.id,
    actor_id: user.id,
    entity: "tenant",
    entity_id: restaurant.id,
    action: "self_onboarding",
    metadata: {
      cafe: input.cafeName,
      slug: input.slug,
      tables: input.tableCount,
      preset: input.preset,
      firstCategory: input.firstCategory,
      firstItem: input.firstItem?.name,
    },
  });

  return NextResponse.json({
    ok: true,
    restaurant_id: restaurant.id,
    slug: restaurant.slug,
    owner_email: input.ownerEmail,
    message: "Restaurant provisioned successfully with personalized digital menu and QR tables!",
  });
}
