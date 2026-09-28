-- Add professional guest ordering tags and cross-sell fields to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS spice_index INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
ADD COLUMN IF NOT EXISTS cross_sell_items TEXT[] DEFAULT '{}'::TEXT[] NOT NULL;
