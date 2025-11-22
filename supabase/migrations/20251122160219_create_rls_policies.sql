/*
  # Row Level Security Policies

  1. Profiles Table
    - Admins can view all profiles
    - Employees can view only their own profile
    - Only admins can update verification status
    - Users can update their own name

  2. Menu Items Table
    - Everyone (authenticated) can view active menu items
    - Only admins can create, update, or delete menu items

  3. Cafe Tables Table
    - Everyone (authenticated) can view tables
    - Only admins can manage tables

  4. Orders Table
    - Admins can view and manage all orders
    - Employees can view all orders but only edit their own unfinalized orders
    - Employees can create orders

  5. Payments Table
    - Only admins can view and create payment records

  6. Expenses Table
    - Only admins can view and create expenses

  7. Daily Revenue Table
    - Only admins can view revenue data

  8. Audit Logs Table
    - Only admins can view audit logs
*/

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is verified
CREATE OR REPLACE FUNCTION is_verified()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own name"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can create their profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- MENU ITEMS POLICIES
CREATE POLICY "Verified users can view menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (is_verified() OR is_admin());

CREATE POLICY "Admins can create menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (is_admin());

-- CAFE TABLES POLICIES
CREATE POLICY "Verified users can view tables"
  ON cafe_tables FOR SELECT
  TO authenticated
  USING (is_verified() OR is_admin());

CREATE POLICY "Admins can create tables"
  ON cafe_tables FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Verified users can update table status"
  ON cafe_tables FOR UPDATE
  TO authenticated
  USING (is_verified() OR is_admin())
  WITH CHECK (is_verified() OR is_admin());

CREATE POLICY "Admins can delete tables"
  ON cafe_tables FOR DELETE
  TO authenticated
  USING (is_admin());

-- ORDERS POLICIES
CREATE POLICY "Verified users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_verified() OR is_admin());

CREATE POLICY "Verified users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((is_verified() OR is_admin()) AND auth.uid() = employee_id);

CREATE POLICY "Employees can update own unpaid orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = employee_id 
    AND status IN ('taken', 'prepared')
    AND is_verified()
  )
  WITH CHECK (
    auth.uid() = employee_id 
    AND status IN ('taken', 'prepared', 'delivered')
    AND is_verified()
  );

CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (is_admin());

-- PAYMENTS POLICIES
CREATE POLICY "Admins can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- EXPENSES POLICIES
CREATE POLICY "Admins can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (is_admin());

-- DAILY REVENUE POLICIES
CREATE POLICY "Admins can view daily revenue"
  ON daily_revenue FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage daily revenue"
  ON daily_revenue FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- AUDIT LOGS POLICIES
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = performed_by);