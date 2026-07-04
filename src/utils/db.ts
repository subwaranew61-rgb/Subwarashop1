import { createClient } from '@supabase/supabase-js';
import { Product, Customer, Transaction, StockIn, ExpenseIncome, User, Unit } from '../types';

// Detect Supabase config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'MY_SUPABASE_URL';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// SEED DATA FOR LOCAL FALLBACK
// ==========================================

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'คุณวราภรณ์ (แอดมิน)', role: 'admin' },
  { id: 'u2', username: 'employee', name: 'สมชาย ค้าดี (พนักงาน)', role: 'employee' }
];

const DEFAULT_UNITS: Unit[] = [
  { id: 'un1', name: 'กิโล', is_custom: false },
  { id: 'un2', name: 'กระสอบ', is_custom: false },
  { id: 'un3', name: 'ลิตร', is_custom: false },
  { id: 'un4', name: 'แพ็ค', is_custom: false },
  { id: 'un5', name: 'ขวด', is_custom: false },
  { id: 'un6', name: 'ฟอง', is_custom: false },
  { id: 'un7', name: 'แผง', is_custom: false },
  { id: 'un8', name: 'ถุง', is_custom: false },
  { id: 'un9', name: 'กล่อง', is_custom: false },
  { id: 'un10', name: 'ชิ้น', is_custom: false }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'ข้าวหอมมะลิ 105 (เกรดส่งออก)',
    category: 'ข้าวสาร',
    cost_price: 1100, // ต่อกระสอบ (45 กิโล) -> ตกกิโลละ 24.44 บาท
    selling_price: 1450, // ต่อกระสอบ
    unit: 'กระสอบ',
    stock_qty: 900, // 900 กิโล = 20 กระสอบ
    min_qty: 180, // ขั้นต่ำ 4 กระสอบ
    is_rice: true,
    kg_per_bag: 45
  },
  {
    id: 'P002',
    name: 'ข้าวเหนียวเขี้ยวงู กข6',
    category: 'ข้าวสาร',
    cost_price: 950, // ต่อกระสอบ (50 กิโล) -> ตกกิโลละ 19 บาท
    selling_price: 1250, // ต่อกระสอบ
    unit: 'กระสอบ',
    stock_qty: 1000, // 1000 กิโล = 20 กระสอบ
    min_qty: 200, // ขั้นต่ำ 4 กระสอบ
    is_rice: true,
    kg_per_bag: 50
  },
  {
    id: 'P003',
    name: 'ข้าวหอมปทุมธานี',
    category: 'ข้าวสาร',
    cost_price: 800, // ต่อกระสอบ (45 กิโล) -> ตกกิโลละ 17.77 บาท
    selling_price: 1050, // ต่อกระสอบ
    unit: 'กระสอบ',
    stock_qty: 450, // 450 กิโล = 10 กระสอบ
    min_qty: 135,
    is_rice: true,
    kg_per_bag: 45
  },
  {
    id: 'P004',
    name: 'น้ำมันพืช ตราองุ่น (1 ลิตร)',
    category: 'อาหารแห้ง',
    cost_price: 42,
    selling_price: 52,
    unit: 'ขวด',
    stock_qty: 120,
    min_qty: 24,
    is_rice: false
  },
  {
    id: 'P005',
    name: 'น้ำตาลทรายขาว ตรามิตรผล (1 กิโล)',
    category: 'อาหารแห้ง',
    cost_price: 21,
    selling_price: 26,
    unit: 'ถุง',
    stock_qty: 250,
    min_qty: 50,
    is_rice: false
  },
  {
    id: 'P006',
    name: 'ปลากระป๋องสามแม่ครัว (แพ็ค 10 กระป๋อง)',
    category: 'อาหารแห้ง',
    cost_price: 155,
    selling_price: 185,
    unit: 'แพ็ค',
    stock_qty: 60,
    min_qty: 15,
    is_rice: false
  },
  {
    id: 'P007',
    name: 'บะหมี่กึ่งสำเร็จรูป มาม่าหมูสับ (กล่อง 30 ซอง)',
    category: 'อาหารแห้ง',
    cost_price: 165,
    selling_price: 195,
    unit: 'กล่อง',
    stock_qty: 45,
    min_qty: 10,
    is_rice: false
  },
  {
    id: 'P008',
    name: 'ไข่ไก่เบอร์ 3 (แผง 30 ฟอง)',
    category: 'อาหารแห้ง',
    cost_price: 105,
    selling_price: 125,
    unit: 'แผง',
    stock_qty: 35,
    min_qty: 8,
    is_rice: false
  }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'C001',
    name: 'ร้านป้าศรีส้มตำไก่ย่าง',
    phone: '0812345678',
    address: '12/4 ซอยสุขุมวิท 23 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ',
    created_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'C002',
    name: 'คุณหญิง บัวทอง (ลูกค้าทั่วไป)',
    phone: '0898765432',
    address: '88/1 หมู่ 4 ตำบลบางแม่นาง อำเภอบางใหญ่ นนทบุรี',
    created_at: '2026-06-15T14:30:00Z'
  },
  {
    id: 'C003',
    name: 'ร้านข้าวแกงเจ๊จิตร',
    phone: '0855551234',
    address: '505 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ',
    created_at: '2026-06-20T08:15:00Z'
  }
];

// Helper to get past dates relative to current date 2026-07-04
const getPastDateStr = (daysAgo: number, timeStr: string = '12:00:00') => {
  const d = new Date('2026-07-04T' + timeStr);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'T001',
    bill_no: 'INV-20260701-001',
    customer_id: 'C001',
    customer_name: 'ร้านป้าศรีส้มตำไก่ย่าง',
    items: [
      {
        product_id: 'P002',
        product_name: 'ข้าวเหนียวเขี้ยวงู กข6',
        unit: 'กระสอบ',
        qty: 2,
        price: 1250,
        cost: 950,
        total_price: 2500,
        total_weight_kg: 100
      },
      {
        product_id: 'P004',
        product_name: 'น้ำมันพืช ตราองุ่น (1 ลิตร)',
        unit: 'ขวด',
        qty: 12,
        price: 52,
        cost: 42,
        total_price: 624
      }
    ],
    subtotal: 3124,
    discount: 24,
    total: 3100,
    payment_method: 'transfer',
    created_by: 'admin',
    created_at: getPastDateStr(3, '09:30:00')
  },
  {
    id: 'T002',
    bill_no: 'INV-20260702-001',
    customer_id: 'C003',
    customer_name: 'ร้านข้าวแกงเจ๊จิตร',
    items: [
      {
        product_id: 'P001',
        product_name: 'ข้าวหอมมะลิ 105 (เกรดส่งออก)',
        unit: 'กระสอบ',
        qty: 3,
        price: 1450,
        cost: 1100,
        total_price: 4350,
        total_weight_kg: 135
      },
      {
        product_id: 'P005',
        product_name: 'น้ำตาลทรายขาว ตรามิตรผล (1 กิโล)',
        unit: 'ถุง',
        qty: 10,
        price: 26,
        cost: 21,
        total_price: 260
      }
    ],
    subtotal: 4610,
    discount: 110,
    total: 4500,
    payment_method: 'cash',
    cash_received: 5000,
    change: 500,
    created_by: 'employee',
    created_at: getPastDateStr(2, '11:15:00')
  },
  {
    id: 'T003',
    bill_no: 'INV-20260703-001',
    customer_id: 'C002',
    customer_name: 'คุณหญิง บัวทอง (ลูกค้าทั่วไป)',
    items: [
      {
        product_id: 'P001',
        product_name: 'ข้าวหอมมะลิ 105 (เกรดส่งออก)',
        unit: 'กิโล',
        qty: 10, // ขาย 10 กิโล
        price: 36, // ตกกิโลละ 36 บาท
        cost: 25,
        total_price: 360,
        total_weight_kg: 10
      },
      {
        product_id: 'P008',
        product_name: 'ไข่ไก่เบอร์ 3 (แผง 30 ฟอง)',
        unit: 'แผง',
        qty: 2,
        price: 125,
        cost: 105,
        total_price: 250
      }
    ],
    subtotal: 610,
    discount: 10,
    total: 600,
    payment_method: 'qr',
    created_by: 'employee',
    created_at: getPastDateStr(1, '15:45:00')
  },
  {
    id: 'T004',
    bill_no: 'INV-20260704-001',
    customer_id: 'C001',
    customer_name: 'ร้านป้าศรีส้มตำไก่ย่าง',
    items: [
      {
        product_id: 'P002',
        product_name: 'ข้าวเหนียวเขี้ยวงู กข6',
        unit: 'กิโล',
        qty: 15,
        price: 28,
        cost: 19,
        total_price: 420,
        total_weight_kg: 15
      },
      {
        product_id: 'P006',
        product_name: 'ปลากระป๋องสามแม่ครัว (แพ็ค 10 กระป๋อง)',
        unit: 'แพ็ค',
        qty: 5,
        price: 185,
        cost: 155,
        total_price: 925
      }
    ],
    subtotal: 1345,
    discount: 45,
    total: 1300,
    payment_method: 'qr',
    created_by: 'employee',
    created_at: getPastDateStr(0, '09:15:00') // Today
  },
  {
    id: 'T005',
    bill_no: 'INV-20260704-002',
    customer_id: 'C003',
    customer_name: 'ร้านข้าวแกงเจ๊จิตร',
    items: [
      {
        product_id: 'P001',
        product_name: 'ข้าวหอมมะลิ 105 (เกรดส่งออก)',
        unit: 'กระสอบ',
        qty: 1,
        price: 1450,
        cost: 1100,
        total_price: 1450,
        total_weight_kg: 45
      }
    ],
    subtotal: 1450,
    discount: 50,
    total: 1400,
    payment_method: 'transfer',
    created_by: 'admin',
    created_at: getPastDateStr(0, '11:00:00') // Today
  }
];

const DEFAULT_STOCK_INS: StockIn[] = [
  {
    id: 'S001',
    date: getPastDateStr(10, '09:00:00').substring(0, 10),
    company: 'เจียเม้ง ค้าข้าว จำกัด',
    supplier: 'คุณเกียรติศักดิ์',
    bill_no: 'PO-20260624-01',
    items: [
      {
        product_id: 'P001',
        product_name: 'ข้าวหอมมะลิ 105 (เกรดส่งออก)',
        qty: 10, // 10 กระสอบ = 450 กิโล
        unit: 'กระสอบ',
        cost_price: 1100
      },
      {
        product_id: 'P002',
        product_name: 'ข้าวเหนียวเขี้ยวงู กข6',
        qty: 10, // 10 กระสอบ = 500 กิโล
        unit: 'กระสอบ',
        cost_price: 950
      }
    ],
    total_cost: 20500,
    created_at: getPastDateStr(10, '09:00:00')
  }
];

const DEFAULT_EXPENSE_INCOMES: ExpenseIncome[] = [
  {
    id: 'E001',
    date: getPastDateStr(4, '17:00:00').substring(0, 10),
    type: 'expense',
    category: 'ค่าเช่า',
    description: 'จ่ายค่าเช่าร้าน ประจำเดือน กรกฎาคม 2026',
    amount: 8000,
    note: 'จ่ายให้คุณพิชัย เจ้าของตึก',
    created_at: getPastDateStr(4, '17:00:00')
  },
  {
    id: 'E002',
    date: getPastDateStr(2, '18:00:00').substring(0, 10),
    type: 'expense',
    category: 'ค่าไฟ',
    description: 'ค่าไฟฟ้าร้านค้าข้าวสาร',
    amount: 1540,
    note: 'การไฟฟ้านครหลวง',
    created_at: getPastDateStr(2, '18:00:00')
  },
  {
    id: 'E003',
    date: getPastDateStr(0, '10:00:00').substring(0, 10),
    type: 'expense',
    category: 'ค่าน้ำมัน',
    description: 'เติมน้ำมันรถกระบะส่งของ',
    amount: 800,
    note: 'ปั๊ม ปตท. สาขาใกล้เคียง',
    created_at: getPastDateStr(0, '10:00:00') // Today
  },
  {
    id: 'E004',
    date: getPastDateStr(0, '11:30:00').substring(0, 10),
    type: 'expense',
    category: 'ค่าขนส่ง',
    description: 'ค่าส่งข้าวสารด่วนให้ลูกค้าประตูนํ้า',
    amount: 350,
    note: 'จ้างวินมอเตอร์ไซค์/Lalamove',
    created_at: getPastDateStr(0, '11:30:00') // Today
  }
];

// Helper to initialize LocalStorage database
const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(`subwara_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`subwara_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing localStorage', e);
  }
};

// Initialize if empty
if (!localStorage.getItem('subwara_products')) {
  setLocalData('products', DEFAULT_PRODUCTS);
  setLocalData('customers', DEFAULT_CUSTOMERS);
  setLocalData('transactions', DEFAULT_TRANSACTIONS);
  setLocalData('stock_ins', DEFAULT_STOCK_INS);
  setLocalData('expenses', DEFAULT_EXPENSE_INCOMES);
  setLocalData('units', DEFAULT_UNITS);
  setLocalData('users', DEFAULT_USERS);
}

// ==========================================
// DB SERVICE METHODS (Dual Mode support)
// ==========================================

export const dbService = {
  // PRODUCTS
  getProducts: async (): Promise<Product[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (!error && data) return data as Product[];
      console.warn('Supabase query failed, falling back to local storage', error);
    }
    return getLocalData<Product[]>('products', DEFAULT_PRODUCTS);
  },

  saveProduct: async (product: Product): Promise<Product> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').upsert(product).select().single();
      if (!error && data) return data as Product;
      console.warn('Supabase save failed, falling back to local storage', error);
    }
    const products = getLocalData<Product[]>('products', DEFAULT_PRODUCTS);
    const existingIndex = products.findIndex((p) => p.id === product.id);
    if (existingIndex > -1) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    setLocalData('products', products);
    return product;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) return true;
      console.warn('Supabase delete failed, falling back to local storage', error);
    }
    const products = getLocalData<Product[]>('products', DEFAULT_PRODUCTS);
    const updated = products.filter((p) => p.id !== id);
    setLocalData('products', updated);
    return true;
  },

  // CUSTOMERS
  getCustomers: async (): Promise<Customer[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
      if (!error && data) return data as Customer[];
      console.warn('Supabase query failed, falling back to local storage', error);
    }
    return getLocalData<Customer[]>('customers', DEFAULT_CUSTOMERS);
  },

  saveCustomer: async (customer: Customer): Promise<Customer> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('customers').upsert(customer).select().single();
      if (!error && data) return data as Customer;
      console.warn('Supabase save failed, falling back to local storage', error);
    }
    const customers = getLocalData<Customer[]>('customers', DEFAULT_CUSTOMERS);
    const existingIndex = customers.findIndex((c) => c.id === customer.id);
    if (existingIndex > -1) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    setLocalData('customers', customers);
    return customer;
  },

  deleteCustomer: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) return true;
      console.warn('Supabase delete failed, falling back to local storage', error);
    }
    const customers = getLocalData<Customer[]>('customers', DEFAULT_CUSTOMERS);
    const updated = customers.filter((c) => c.id !== id);
    setLocalData('customers', updated);
    return true;
  },

  // TRANSACTIONS
  getTransactions: async (): Promise<Transaction[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Transaction[];
      console.warn('Supabase query failed, falling back to local storage', error);
    }
    return getLocalData<Transaction[]>('transactions', DEFAULT_TRANSACTIONS);
  },

  saveTransaction: async (transaction: Transaction): Promise<Transaction> => {
    // 1. Save Transaction record
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('transactions').insert(transaction).select().single();
      if (!error && data) {
        // Also reduce stock of products in Supabase
        for (const item of transaction.items) {
          const { data: p } = await supabase.from('products').select('stock_qty, is_rice, kg_per_bag').eq('id', item.product_id).single();
          if (p) {
            let deductQty = item.qty;
            if (p.is_rice && item.unit === 'กระสอบ') {
              deductQty = item.qty * (p.kg_per_bag || 45);
            }
            await supabase.from('products').update({ stock_qty: p.stock_qty - deductQty }).eq('id', item.product_id);
          }
        }
        return data as Transaction;
      }
      console.warn('Supabase save failed, falling back to local storage', error);
    }

    // 2. Local Fallback - Save transaction
    const transactions = getLocalData<Transaction[]>('transactions', DEFAULT_TRANSACTIONS);
    transactions.push(transaction);
    setLocalData('transactions', transactions);

    // 3. Local Fallback - Deduct Stock
    const products = getLocalData<Product[]>('products', DEFAULT_PRODUCTS);
    for (const item of transaction.items) {
      const pIndex = products.findIndex((p) => p.id === item.product_id);
      if (pIndex > -1) {
        const product = products[pIndex];
        let deductWeight = item.qty;
        if (product.is_rice && item.unit === 'กระสอบ') {
          deductWeight = item.qty * (product.kg_per_bag || 45);
        }
        products[pIndex].stock_qty = Math.max(0, product.stock_qty - deductWeight);
      }
    }
    setLocalData('products', products);

    // 4. Local Fallback - Automatically record transaction as Income record in accounting
    const expenses = getLocalData<ExpenseIncome[]>('expenses', DEFAULT_EXPENSE_INCOMES);
    expenses.push({
      id: `ACC-INC-${Date.now()}`,
      date: transaction.created_at.substring(0, 10),
      type: 'income',
      category: 'ขายสินค้า',
      description: `ยอดขายบิลเลขที่ ${transaction.bill_no} (${transaction.customer_name || 'ลูกค้าทั่วไป'})`,
      amount: transaction.total,
      created_at: transaction.created_at
    });
    setLocalData('expenses', expenses);

    return transaction;
  },

  // STOCK INS (RECV)
  getStockIns: async (): Promise<StockIn[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('stock_ins').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as StockIn[];
      console.warn('Supabase query failed, falling back to local storage', error);
    }
    return getLocalData<StockIn[]>('stock_ins', DEFAULT_STOCK_INS);
  },

  saveStockIn: async (stockIn: StockIn): Promise<StockIn> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('stock_ins').insert(stockIn).select().single();
      if (!error && data) {
        // Update product stock in Supabase
        for (const item of stockIn.items) {
          const { data: p } = await supabase.from('products').select('stock_qty, is_rice, kg_per_bag').eq('id', item.product_id).single();
          if (p) {
            let addWeight = item.qty;
            if (p.is_rice && item.unit === 'กระสอบ') {
              addWeight = item.qty * (p.kg_per_bag || 45);
            }
            await supabase.from('products').update({ stock_qty: p.stock_qty + addWeight }).eq('id', item.product_id);
          }
        }
        return data as StockIn;
      }
      console.warn('Supabase save failed, falling back to local storage', error);
    }

    // 2. Local Fallback - Save stock in record
    const stockIns = getLocalData<StockIn[]>('stock_ins', DEFAULT_STOCK_INS);
    stockIns.push(stockIn);
    setLocalData('stock_ins', stockIns);

    // 3. Local Fallback - Increase stock qty
    const products = getLocalData<Product[]>('products', DEFAULT_PRODUCTS);
    for (const item of stockIn.items) {
      const pIndex = products.findIndex((p) => p.id === item.product_id);
      if (pIndex > -1) {
        const product = products[pIndex];
        let addWeight = item.qty;
        if (product.is_rice && item.unit === 'กระสอบ') {
          addWeight = item.qty * (product.kg_per_bag || 45);
        }
        products[pIndex].stock_qty = product.stock_qty + addWeight;
      }
    }
    setLocalData('products', products);

    // 4. Local Fallback - Automatically record as Expense in accounting
    const expenses = getLocalData<ExpenseIncome[]>('expenses', DEFAULT_EXPENSE_INCOMES);
    expenses.push({
      id: `ACC-EXP-${Date.now()}`,
      date: stockIn.date,
      type: 'expense',
      category: 'ซื้อสินค้า',
      description: `บิลรับของเลขที่ ${stockIn.bill_no} - ${stockIn.supplier} (${stockIn.company})`,
      amount: stockIn.total_cost,
      created_at: new Date().toISOString()
    });
    setLocalData('expenses', expenses);

    return stockIn;
  },

  // EXPENSES / INCOMES
  getExpenseIncomes: async (): Promise<ExpenseIncome[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('accounting').select('*').order('date', { ascending: false });
      if (!error && data) return data as ExpenseIncome[];
      console.warn('Supabase query failed, falling back to local storage', error);
    }
    return getLocalData<ExpenseIncome[]>('expenses', DEFAULT_EXPENSE_INCOMES);
  },

  saveExpenseIncome: async (entry: ExpenseIncome): Promise<ExpenseIncome> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('accounting').upsert(entry).select().single();
      if (!error && data) return data as ExpenseIncome;
      console.warn('Supabase save failed, falling back to local storage', error);
    }
    const entries = getLocalData<ExpenseIncome[]>('expenses', DEFAULT_EXPENSE_INCOMES);
    const existingIndex = entries.findIndex((e) => e.id === entry.id);
    if (existingIndex > -1) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    setLocalData('expenses', entries);
    return entry;
  },

  deleteExpenseIncome: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('accounting').delete().eq('id', id);
      if (!error) return true;
      console.warn('Supabase delete failed, falling back to local storage', error);
    }
    const entries = getLocalData<ExpenseIncome[]>('expenses', DEFAULT_EXPENSE_INCOMES);
    const updated = entries.filter((e) => e.id !== id);
    setLocalData('expenses', updated);
    return true;
  },

  // UNITS
  getUnits: async (): Promise<Unit[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('units').select('*').order('name', { ascending: true });
      if (!error && data) return data as Unit[];
      console.warn('Supabase query failed, falling back to local storage', error);
    }
    return getLocalData<Unit[]>('units', DEFAULT_UNITS);
  },

  saveUnit: async (unit: Unit): Promise<Unit> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('units').insert(unit).select().single();
      if (!error && data) return data as Unit;
      console.warn('Supabase save failed, falling back to local storage', error);
    }
    const units = getLocalData<Unit[]>('units', DEFAULT_UNITS);
    units.push(unit);
    setLocalData('units', units);
    return unit;
  },

  deleteUnit: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (!error) return true;
      console.warn('Supabase delete failed, falling back to local storage', error);
    }
    const units = getLocalData<Unit[]>('units', DEFAULT_UNITS);
    const updated = units.filter((u) => u.id !== id);
    setLocalData('units', updated);
    return true;
  },

  // USERS / AUTH
  getUsers: async (): Promise<User[]> => {
    return DEFAULT_USERS; // Keep roles local or simple for this applet
  }
};
