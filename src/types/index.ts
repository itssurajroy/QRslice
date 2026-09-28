// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice — Shared Domain Types
 * Single source of truth for all data shapes used across the app.
 * Import from "@/types" in any component, hook, or API route.
 */

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled"
  | "rejected";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type PaymentMethod = "counter" | "cash" | "upi" | "card" | "online";

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
  notes?: string | null;
  spice_level?: string | null;
  size_variant?: string | null;
  selected_modifiers?: {
    id?: string;
    option_name: string;
    price_delta_paise: number;
  }[];
};

export type Order = {
  id: string;
  order_number: string | number;
  restaurant_id: string;
  table_id?: string | null;
  table_label?: string | null;
  qr_token?: string | null;
  subtotal_paise?: number;
  total_paise: number;
  tax_paise?: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod | null;
  status: OrderStatus;
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  status_token?: string | null;
  google_review_url?: string | null;
  restaurant_name?: string | null;
  created_at: string;
  updated_at?: string | null;
  items?: OrderItem[];
};

// ─── Menu ─────────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  restaurant_id: string;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price_paise: number;
  image_url?: string | null;
  is_veg: boolean;
  available: boolean;
  hsn?: string | null;
  restaurant_id: string;
  sort_order?: number;
  is_bestseller?: boolean;
  spice_index?: number;
  tags?: string[];
  cross_sell_items?: string[];
  modifier_groups?: ModifierGroup[];
};

export type ModifierOption = {
  id: string;
  modifier_group_id: string;
  name: string;
  price_delta_paise: number;
  active: boolean;
};

export type ModifierGroup = {
  id: string;
  restaurant_id: string;
  name: string;
  min_select: number;
  max_select: number;
  required: boolean;
  options?: ModifierOption[];
};

export type CartLine = {
  item: MenuItem;
  quantity: number;
  notes: string;
  spiceLevel?: string;
  sizeVariant?: string;
  selectedModifiers?: ModifierOption[];
};

// ─── Tables ───────────────────────────────────────────────────────────────────

export type Table = {
  id: string;
  label: string;
  seats: number;
  qr_token: string;
  active: boolean;
  restaurant_id: string;
  sort_order?: number;
};

// ─── Restaurant ───────────────────────────────────────────────────────────────

export type RestaurantPlan = "trial" | "active" | "suspended" | "cancelled";
export type RestaurantTier = "enterprise" | "pro" | "starter";

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  currency?: string;
  logo_url?: string | null;
  accent_color?: string | null;
  tagline?: string | null;
  google_review_url?: string | null;
  address?: string | null;
  phone?: string | null;
  gstin?: string | null;
  tax_rate?: number | null;
  plan: RestaurantPlan;
  tier?: RestaurantTier;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  billing_status?: string | null;
  upi_id?: string | null;
  upi_qr_url?: string | null;
  created_at?: string;
};

export type TierLimits = {
  maxTables: number | null;
  maxItems: number | null;
  kds: boolean;
  branding: boolean;
  analytics: boolean;
  multiLocation: boolean;
};

// ─── Reports & Analytics ──────────────────────────────────────────────────────

export type DailyReport = {
  revenue: number; // paise
  orders: number;
  avg_ticket?: number;
  top_items?: Array<{ name: string; count: number; revenue: number }>;
};

export type Report = DailyReport & {
  date?: string;
  cash_total?: number;
  upi_total?: number;
  card_total?: number;
  tax_collected?: number;
  orders_by_hour?: Array<{ hour: number; count: number; revenue: number }>;
};

export type AnalyticsData = {
  today?: DailyReport;
  week?: DailyReport;
  month?: DailyReport;
  recentOrders?: Partial<Order>[];
  hourly?: Array<{ hour: number; count: number; revenue: number }>;
  topItems?: Array<{ name: string; count: number; revenue: number }>;
  categoryBreakdown?: Array<{ category: string; count: number; revenue: number }>;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  data: T;
  error?: never;
};

export type ApiErrorShape = {
  data?: never;
  error: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorShape;

/** Type guard to check if an API response is an error */
export function isApiError<T>(res: ApiResponse<T>): res is ApiErrorShape {
  return "error" in res && typeof res.error === "string";
}

