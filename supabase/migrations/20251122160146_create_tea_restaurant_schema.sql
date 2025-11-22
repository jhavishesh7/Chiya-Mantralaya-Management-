/*
  # Tea Restaurant Management System - Complete Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, FK to auth.users) - User identifier
      - `name` (text) - User display name
      - `role` (text) - Either 'admin' or 'employee'
      - `verified` (boolean) - Employee verification status (default false)
      - `created_at` (timestamptz) - Account creation timestamp
    
    - `menu_items`
      - `id` (uuid, PK) - Menu item identifier
      - `name` (text) - Item name
      - `price` (numeric) - Item price (must be >= 0)
      - `category` (text) - Item category
      - `active` (boolean) - Whether item is available (default true)
      - `created_at` (timestamptz) - Creation timestamp
    
    - `cafe_tables`
      - `id` (uuid, PK) - Table identifier
      - `table_number` (int, unique) - Table number
      - `status` (text) - Table status: 'empty' or 'occupied'
    
    - `orders`
      - `id` (uuid, PK) - Order identifier
      - `table_id` (uuid, FK) - Associated table
      - `employee_id` (uuid, FK) - Employee who took the order
      - `items` (jsonb) - Order items array with item_id, name, qty, price
      - `status` (text) - Order status: taken/prepared/delivered/paid
      - `total_price` (numeric) - Total order amount (must be >= 0)
      - `payment_method` (text) - Payment method: cash/online (null until paid)
      - `created_at` (timestamptz) - Order creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `payments`
      - `id` (uuid, PK) - Payment identifier
      - `order_id` (uuid, FK) - Associated order
      - `method` (text) - Payment method: cash/online
      - `amount` (numeric) - Payment amount (must be >= 0)
      - `recorded_by` (uuid, FK) - Admin who confirmed payment
      - `created_at` (timestamptz) - Payment timestamp
    
    - `expenses`
      - `id` (uuid, PK) - Expense identifier
      - `title` (text) - Expense description
      - `amount` (numeric) - Expense amount (must be >= 0)
      - `recorded_by` (uuid, FK) - Admin who recorded expense
      - `created_at` (timestamptz) - Expense timestamp
    
    - `daily_revenue`
      - `id` (uuid, PK) - Record identifier
      - `date` (date, unique) - Revenue date
      - `cash_total` (numeric) - Total cash revenue
      - `online_total` (numeric) - Total online revenue
      - `total_revenue` (numeric, computed) - Sum of cash + online
    
    - `audit_logs`
      - `id` (uuid, PK) - Log identifier
      - `action` (text) - Action performed
      - `table_name` (text) - Affected table
      - `record_id` (uuid) - Affected record ID
      - `changes` (jsonb) - Change details
      - `performed_by` (uuid, FK) - User who performed action
      - `created_at` (timestamptz) - Log timestamp

  2. Security
    - Enable RLS on all tables
    - Policies will be added in next migration
*/

-- profiles (users + role + verification)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- cafe tables
CREATE TABLE IF NOT EXISTS cafe_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number int UNIQUE NOT NULL,
  status text DEFAULT 'empty' CHECK (status IN ('empty', 'occupied'))
);

ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES cafe_tables(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('taken', 'prepared', 'delivered', 'paid')),
  total_price numeric(12,2) NOT NULL CHECK (total_price >= 0),
  payment_method text CHECK (payment_method IN ('cash', 'online')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- payments: unified ledger and breakdown
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  method text NOT NULL CHECK (method IN ('cash', 'online')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- daily_revenue (aggregates)
CREATE TABLE IF NOT EXISTS daily_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  cash_total numeric(14,2) DEFAULT 0,
  online_total numeric(14,2) DEFAULT 0,
  total_revenue numeric(14,2) GENERATED ALWAYS AS (coalesce(cash_total, 0) + coalesce(online_total, 0)) STORED
);

ALTER TABLE daily_revenue ENABLE ROW LEVEL SECURITY;

-- audit_logs (track important actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  changes jsonb,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);