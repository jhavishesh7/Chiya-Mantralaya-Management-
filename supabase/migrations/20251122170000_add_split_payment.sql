-- Migration to add split payment support

-- Update orders table to allow 'split' as payment_method
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash', 'online', 'split'));

-- Function to confirm split payment (admin only, atomic transaction)
CREATE OR REPLACE FUNCTION confirm_split_payment(
  p_order_id uuid,
  p_cash_amount numeric,
  p_online_amount numeric
)
RETURNS json AS $$
DECLARE
  result json;
  admin_id uuid;
  order_record orders%ROWTYPE;
  order_table_id uuid;
  total_amount numeric;
  revenue_date date;
BEGIN
  admin_id := auth.uid();
  revenue_date := CURRENT_DATE;
  
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can confirm payments';
  END IF;
  
  -- Validate amounts
  IF p_cash_amount < 0 OR p_online_amount < 0 THEN
    RAISE EXCEPTION 'Payment amounts cannot be negative';
  END IF;
  
  total_amount := p_cash_amount + p_online_amount;
  
  IF total_amount <= 0 THEN
    RAISE EXCEPTION 'Total payment amount must be greater than zero';
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
  
  -- Validate total matches order total (allow small rounding differences)
  IF ABS(total_amount - order_record.total_price) > 0.01 THEN
    RAISE EXCEPTION 'Total payment amount (₹%s) does not match order total (₹%s)', 
      total_amount, order_record.total_price;
  END IF;
  
  order_table_id := order_record.table_id;
  
  -- Create payment records for cash and online
  IF p_cash_amount > 0 THEN
    INSERT INTO payments (order_id, method, amount, recorded_by)
    VALUES (p_order_id, 'cash', p_cash_amount, admin_id);
  END IF;
  
  IF p_online_amount > 0 THEN
    INSERT INTO payments (order_id, method, amount, recorded_by)
    VALUES (p_order_id, 'online', p_online_amount, admin_id);
  END IF;
  
  -- Update order status
  UPDATE orders
  SET 
    status = 'paid',
    payment_method = 'split',
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Update or create daily revenue record
  INSERT INTO daily_revenue (date, cash_total, online_total)
  VALUES (
    revenue_date,
    p_cash_amount,
    p_online_amount
  )
  ON CONFLICT (date) DO UPDATE SET
    cash_total = daily_revenue.cash_total + p_cash_amount,
    online_total = daily_revenue.online_total + p_online_amount;
  
  -- Free the table if it exists
  IF order_table_id IS NOT NULL THEN
    UPDATE cafe_tables
    SET status = 'empty'
    WHERE id = order_table_id;
  END IF;
  
  -- Create audit log
  INSERT INTO audit_logs (action, table_name, record_id, changes, performed_by)
  VALUES (
    'confirm_split_payment',
    'orders',
    p_order_id,
    json_build_object(
      'method', 'split',
      'cash_amount', p_cash_amount,
      'online_amount', p_online_amount,
      'total_amount', total_amount
    ),
    admin_id
  );
  
  result := json_build_object(
    'success', true,
    'order_id', p_order_id,
    'cash_amount', p_cash_amount,
    'online_amount', p_online_amount,
    'total_amount', total_amount
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

