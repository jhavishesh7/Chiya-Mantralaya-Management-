import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string | null;
  role: 'admin' | 'employee';
  verified: boolean;
  created_at: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  active: boolean;
  created_at: string;
};

export type CafeTable = {
  id: string;
  table_number: number;
  status: 'empty' | 'occupied';
};

export type OrderItem = {
  item_id: string;
  name: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  table_id: string | null;
  employee_id: string | null;
  items: OrderItem[];
  status: 'taken' | 'prepared' | 'delivered' | 'paid';
  total_price: number;
  payment_method: 'cash' | 'online' | 'split' | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  order_id: string | null;
  method: 'cash' | 'online';
  amount: number;
  recorded_by: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  recorded_by: string | null;
  created_at: string;
};

export type DailyRevenue = {
  id: string;
  date: string;
  cash_total: number;
  online_total: number;
  total_revenue: number;
};
