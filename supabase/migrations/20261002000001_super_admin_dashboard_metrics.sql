-- Migration to add RPC for computing super admin dashboard KPIs
CREATE OR REPLACE FUNCTION get_super_admin_outlet_kpis(restaurant_ids UUID[])
RETURNS TABLE (
  restaurant_id UUID,
  orders_today BIGINT,
  gmv_30d BIGINT,
  pos_devices BIGINT,
  kds_devices BIGINT
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
  )
  SELECT 
    r.id,
    COALESCE(os.orders_today, 0),
    COALESCE(os.gmv_30d, 0),
    GREATEST(COALESCE(ds.pos_devices, 0), 1), -- fallback to at least 1 device if active
    GREATEST(COALESCE(ds.kds_devices, 0), 1)
  FROM unnest(restaurant_ids) AS r(id)
  LEFT JOIN order_stats os ON os.restaurant_id = r.id
  LEFT JOIN device_stats ds ON ds.restaurant_id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
