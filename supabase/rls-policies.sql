-- Supabase RLS policy templates
-- Review and adapt these to your schema and roles before applying.

-- Enable RLS for bookings table
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

-- Allow admins (check email allowlist via a function or role) to full access
-- Replace `auth.uid()` checks or create a function `is_admin()` that checks email against allowlist.

-- Example: allow authenticated users to insert bookings
CREATE POLICY "allow_insert_bookings" ON bookings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() IS NOT NULL);

-- Restrict select/update/delete to admin role only (example)
CREATE POLICY "admin_manage_bookings" ON bookings
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'admin');

-- Repeat similarly for product_orders and catalog
ALTER TABLE IF EXISTS product_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_product_order_insert" ON product_orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_product_orders" ON product_orders
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'admin');

ALTER TABLE IF EXISTS catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_catalog" ON catalog
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'admin');

-- Notes:
-- Supabase uses JWT claims. You can map a custom claim like "role" for admin users,
-- or check the user's email against an allowlist in a SQL function.
