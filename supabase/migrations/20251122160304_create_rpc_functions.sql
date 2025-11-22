/*
  # Server-side RPC Functions

  1. verify_employee
    - Allows admins to verify employees
    - Creates audit log entry
    - Returns success status

  2. confirm_payment
    - Atomic payment processing
    - Updates order status to paid
    - Creates payment record
    - Updates daily revenue
    - Frees the table
    - Validates order state

  3. edit_order
    - Validates user permissions
    - Validates order status (not delivered/paid)
    - Updates order details
    - Recalculates total price
    - Creates audit log

  4. add_expense
    - Validates admin role
    - Creates expense record
    - Returns expense details

  5. get_daily_summary
    - Calculates daily revenue and expenses
    - Returns profit calculation
*/

-- Function to verify an employee (admin only)
CREATE OR REPLACE FUNCTION verify_employee(
  user_id uuid,
  verified_status boolean
)
RETURNS json AS $$
DECLARE
  result json;
  admin_id uuid;
BEGIN
  admin_id := auth.uid();
  
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can verify employees';
  END IF;
  
  -- Check if target user exists and is employee
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'employee') THEN
    RAISE EXCEPTION 'User not found or not an employee';
  END IF;
  
  -- Update verification status
  UPDATE profiles
  SET verified = verified_status
  WHERE id = user_id;
  
  -- Create audit log
  INSERT INTO audit_logs (action, table_name, record_id, changes, performed_by)
  VALUES (
    'verify_employee',
    'profiles',
    user_id,
    json_build_object('verified', verified_status, 'verified_by', admin_id),
    admin_id
  );
  
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'verified', verified_status
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm payment (admin only, atomic transaction)
CREATE OR REPLACE FUNCTION confirm_payment(
  p_order_id uuid,
  p_method text
)
RETURNS json AS $$
DECLARE
  result json;
  admin_id uuid;
  order_record orders%ROWTYPE;
  order_table_id uuid;
  order_total numeric;
  revenue_date date;
BEGIN
  admin_id := auth.uid();
  revenue_date := CURRENT_DATE;
  
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can confirm payments';
  END IF;
  
  -- Validate payment method
  IF p_method NOT IN ('cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment method. Must be cash or online';
  END IF;
  
  -- Get order details and lock row
  SELECT * INTO order_record
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Validate order status
  IF order_record.status = 'paid' THEN
    RAISE EXCEPTION 'Order already paid';
  END IF;
  
  IF order_record.status != 'delivered' THEN
    RAISE EXCEPTION 'Order must be delivered before payment';
  END IF;
  
  order_total := order_record.total_price;
  order_table_id := order_record.table_id;
  
  -- Create payment record
  INSERT INTO payments (order_id, method, amount, recorded_by)
  VALUES (p_order_id, p_method, order_total, admin_id);
  
  -- Update order status
  UPDATE orders
  SET 
    status = 'paid',
    payment_method = p_method,
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Update or create daily revenue record
  INSERT INTO daily_revenue (date, cash_total, online_total)
  VALUES (
    revenue_date,
    CASE WHEN p_method = 'cash' THEN order_total ELSE 0 END,
    CASE WHEN p_method = 'online' THEN order_total ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    cash_total = daily_revenue.cash_total + CASE WHEN p_method = 'cash' THEN order_total ELSE 0 END,
    online_total = daily_revenue.online_total + CASE WHEN p_method = 'online' THEN order_total ELSE 0 END;
  
  -- Free the table if it exists
  IF order_table_id IS NOT NULL THEN
    UPDATE cafe_tables
    SET status = 'empty'
    WHERE id = order_table_id;
  END IF;
  
  -- Create audit log
  INSERT INTO audit_logs (action, table_name, record_id, changes, performed_by)
  VALUES (
    'confirm_payment',
    'orders',
    p_order_id,
    json_build_object('method', p_method, 'amount', order_total),
    admin_id
  );
  
  result := json_build_object(
    'success', true,
    'order_id', p_order_id,
    'amount', order_total,
    'method', p_method
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to edit order (with permissions check)
CREATE OR REPLACE FUNCTION edit_order(
  p_order_id uuid,
  p_items jsonb,
  p_total_price numeric,
  p_status text DEFAULT NULL,
  p_table_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
  user_id uuid;
  user_role text;
  order_record orders%ROWTYPE;
BEGIN
  user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Check if order is editable
  IF order_record.status IN ('paid') THEN
    RAISE EXCEPTION 'Cannot edit paid orders';
  END IF;
  
  -- Check permissions
  IF user_role = 'employee' THEN
    -- Employees can only edit their own orders and only if not delivered
    IF order_record.employee_id != user_id THEN
      RAISE EXCEPTION 'You can only edit your own orders';
    END IF;
    IF order_record.status = 'delivered' THEN
      RAISE EXCEPTION 'Cannot edit delivered orders';
    END IF;
  END IF;
  
  -- Validate total price
  IF p_total_price < 0 THEN
    RAISE EXCEPTION 'Total price cannot be negative';
  END IF;
  
  -- Update order
  UPDATE orders
  SET 
    items = p_items,
    total_price = p_total_price,
    status = COALESCE(p_status, status),
    table_id = COALESCE(p_table_id, table_id),
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Create audit log
  INSERT INTO audit_logs (action, table_name, record_id, changes, performed_by)
  VALUES (
    'edit_order',
    'orders',
    p_order_id,
    json_build_object(
      'items', p_items,
      'total_price', p_total_price,
      'status', COALESCE(p_status, order_record.status)
    ),
    user_id
  );
  
  result := json_build_object(
    'success', true,
    'order_id', p_order_id
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add expense (admin only)
CREATE OR REPLACE FUNCTION add_expense(
  p_title text,
  p_amount numeric
)
RETURNS json AS $$
DECLARE
  result json;
  admin_id uuid;
  expense_id uuid;
BEGIN
  admin_id := auth.uid();
  
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can add expenses';
  END IF;
  
  -- Validate amount
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Expense amount cannot be negative';
  END IF;
  
  -- Create expense
  INSERT INTO expenses (title, amount, recorded_by)
  VALUES (p_title, p_amount, admin_id)
  RETURNING id INTO expense_id;
  
  result := json_build_object(
    'success', true,
    'expense_id', expense_id,
    'title', p_title,
    'amount', p_amount
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily summary (admin only)
CREATE OR REPLACE FUNCTION get_daily_summary(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS json AS $$
DECLARE
  result json;
  admin_id uuid;
  total_revenue numeric;
  cash_revenue numeric;
  online_revenue numeric;
  total_expenses numeric;
  net_profit numeric;
  order_count int;
BEGIN
  admin_id := auth.uid();
  
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can view daily summary';
  END IF;
  
  -- Get revenue from payments
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(CASE WHEN method = 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN method = 'online' THEN amount ELSE 0 END), 0),
    COUNT(DISTINCT order_id)
  INTO total_revenue, cash_revenue, online_revenue, order_count
  FROM payments
  WHERE DATE(created_at) = p_date;
  
  -- Get total expenses
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses
  FROM expenses
  WHERE DATE(created_at) = p_date;
  
  -- Calculate net profit
  net_profit := total_revenue - total_expenses;
  
  result := json_build_object(
    'date', p_date,
    'total_revenue', total_revenue,
    'cash_revenue', cash_revenue,
    'online_revenue', online_revenue,
    'total_expenses', total_expenses,
    'net_profit', net_profit,
    'order_count', order_count
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;