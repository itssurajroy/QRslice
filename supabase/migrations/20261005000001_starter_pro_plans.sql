-- Copyright (c) 2026 QRslice. All rights reserved.
-- Update Subscription Plans to Starter and Pro tiers

-- 1. Deactivate the old "complete" plans
UPDATE public.subscription_plans 
SET active = false 
WHERE slug IN ('complete_monthly', 'complete_yearly');

-- 2. Insert the new Starter and Pro plans
INSERT INTO public.subscription_plans (name, slug, price_paise, billing_cycle, features, active, sort_order)
VALUES
  (
    'Starter Monthly', 
    'starter_monthly', 
    99900, 
    'monthly',
    '["10 Tables Maximum", "50 Menu Items Maximum", "KDS Prep Workflow", "POS Register & Thermal Printing", "Live Order Dashboard"]'::jsonb,
    true, 
    1
  ),
  (
    'Pro Monthly', 
    'pro_monthly', 
    199900, 
    'monthly',
    '["Unlimited Tables", "Unlimited Menu Items", "Custom Branding", "Financial Analytics", "Multi-Location Support", "CRM & Loyalty Hub"]'::jsonb,
    true, 
    2
  )
ON CONFLICT (slug) DO UPDATE 
SET 
  price_paise = EXCLUDED.price_paise,
  features = EXCLUDED.features,
  active = true,
  sort_order = EXCLUDED.sort_order;

-- 3. Notify postgrest to reload the schema (optional but recommended)
NOTIFY pgrst, 'reload schema';
