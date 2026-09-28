-- Migration to add printers hardware tracking table
CREATE TABLE IF NOT EXISTS hardware_printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update the super admin RPC to include printers count
DROP FUNCTION IF EXISTS get_super_admin_outlet_kpis(UUID[]);
CREATE OR REPLACE FUNCTION get_super_admin_outlet_kpis(restaurant_ids UUID[])
RETURNS TABLE (
  restaurant_id UUID,
  orders_today BIGINT,
  gmv_30d BIGINT,
  pos_devices BIGINT,
  kds_devices BIGINT,
  printers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      o.restaurant_id,
      COUNT(o.id) FILTER (WHERE o.created_at >= CURRENT_DATE) AS orders_today,
      COALESCE(SUM(o.total_paise) FILTER (
        WHERE o.created_at >= (CURRENT_DATE - INTERVAL '30 days')
        AND o.status NOT IN ('cancelled', 'rejected')
      ), 0) AS gmv_30d
    FROM orders o
    WHERE o.restaurant_id = ANY(restaurant_ids)
    GROUP BY o.restaurant_id
  ),
  device_stats AS (
    SELECT 
      cp.restaurant_id,
      COUNT(cp.id) FILTER (WHERE cp.role = 'staff') AS pos_devices,
      COUNT(cp.id) FILTER (WHERE cp.role = 'staff') AS kds_devices
    FROM cafe_profiles cp
    WHERE cp.restaurant_id = ANY(restaurant_ids)
    GROUP BY cp.restaurant_id
  ),
  printer_stats AS (
    SELECT 
      hp.restaurant_id,
      COUNT(hp.id) AS printers
    FROM hardware_printers hp
    WHERE hp.restaurant_id = ANY(restaurant_ids)
    GROUP BY hp.restaurant_id
  )
  SELECT 
    r.id,
    COALESCE(os.orders_today, 0),
    COALESCE(os.gmv_30d, 0),
    GREATEST(COALESCE(ds.pos_devices, 0), 1),
    GREATEST(COALESCE(ds.kds_devices, 0), 1),
    GREATEST(COALESCE(ps.printers, 0), 1) -- default to at least 1 for display if missing
  FROM unnest(restaurant_ids) AS r(id)
  LEFT JOIN order_stats os ON os.restaurant_id = r.id
  LEFT JOIN device_stats ds ON ds.restaurant_id = r.id
  LEFT JOIN printer_stats ps ON ps.restaurant_id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
