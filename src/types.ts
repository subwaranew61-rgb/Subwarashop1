export interface Product {
  id: string; // SKU / Product Code
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  unit: string;
  image_url?: string;
  stock_qty: number; // For rice, this is the total weight in kg
  min_qty: number;
  is_rice: boolean;
  kg_per_bag?: number; // E.g., 45 for Jasmine, 50 for Sticky Rice
  created_at?: string;

  // Selling prices per Kilogram (ราคาขาย ต่อกิโลกรัม)
  price_retail_kg?: number;
  price_wholesale_kg?: number;
  price_shop_kg?: number;

  // Selling prices per Thang (ราคาขาย ต่อถัง - 15 กิโลกรัม)
  price_retail_thang?: number;
  price_wholesale_thang?: number;
  price_shop_thang?: number;

  // Selling prices per Bag (ราคาขาย ต่อกระสอบ)
  price_retail_bag?: number;
  price_wholesale_bag?: number;
  price_shop_bag?: number;
}

export interface Unit {
  id: string;
  name: string;
  is_custom: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface TransactionItem {
  product_id: string;
  product_name: string;
  unit: string; // 'กิโล', 'กระสอบ', or other units
  qty: number; // quantity sold in this unit
  price: number; // selling price per this unit
  cost: number; // cost price per this unit
  total_price: number;
  total_weight_kg?: number; // weight converted to kg (if rice)
}

export interface Transaction {
  id: string;
  bill_no: string;
  customer_id?: string;
  customer_name?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'qr' | 'transfer' | 'card';
  cash_received?: number;
  change?: number;
  created_by: string; // 'admin' | 'employee'
  created_at: string;
}

export interface StockInItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit: string;
  cost_price: number;
}

export interface StockIn {
  id: string;
  date: string;
  company: string;
  supplier: string;
  bill_no: string;
  items: StockInItem[];
  total_cost: number;
  created_at: string;
}

export interface ExpenseIncome {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string; // 'ซื้อสินค้า' | 'ค่าเช่า' | 'ค่าไฟ' | 'ค่าน้ำ' | 'ค่าแรง' | 'ค่าน้ำมัน' | 'ค่าขนส่ง' | 'ค่าใช้จ่ายอื่น' | 'ขายสินค้า' | 'รายรับอื่น'
  description: string;
  amount: number;
  note?: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'employee';
}
