-- =========================================================
-- DATABASE SCHEMA & SEED DATA: ทรัพย์วราค้าข้าว (Subwara Rice Store)
-- paste this script into Supabase > SQL Editor and run it.
-- =========================================================

-- Enable UUID generation extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create CUSTOMERS Table
CREATE TABLE public.customers (
    id text PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read customers" ON public.customers
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to insert customers" ON public.customers
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anyone to update customers" ON public.customers
    FOR UPDATE TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow admin to delete customers" ON public.customers
    FOR DELETE TO authenticated USING (true);


-- 2. Create PRODUCTS Table
CREATE TABLE public.products (
    id text PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    cost_price numeric NOT NULL,
    selling_price numeric NOT NULL,
    unit text NOT NULL,
    stock_qty numeric NOT NULL DEFAULT 0,
    min_qty numeric NOT NULL DEFAULT 0,
    is_rice boolean DEFAULT false NOT NULL,
    kg_per_bag numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read products" ON public.products
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to update/insert products" ON public.products
    FOR ALL TO anon, authenticated USING (true);


-- 3. Create TRANSACTIONS Table
CREATE TABLE public.transactions (
    id text PRIMARY KEY,
    bill_no text NOT NULL UNIQUE,
    customer_id text REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name text DEFAULT 'ลูกค้าทั่วไป'::text NOT NULL,
    items jsonb NOT NULL,
    subtotal numeric NOT NULL,
    discount numeric DEFAULT 0 NOT NULL,
    total numeric NOT NULL,
    payment_method text NOT NULL,
    cash_received numeric,
    change numeric,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to select transactions" ON public.transactions
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to insert transactions" ON public.transactions
    FOR INSERT TO anon, authenticated WITH CHECK (true);


-- 4. Create STOCK_INS Table
CREATE TABLE public.stock_ins (
    id text PRIMARY KEY,
    date text NOT NULL,
    company text NOT NULL,
    supplier text NOT NULL,
    bill_no text NOT NULL,
    items jsonb NOT NULL,
    total_cost numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Stock-ins
ALTER TABLE public.stock_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read stock_ins" ON public.stock_ins
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to insert stock_ins" ON public.stock_ins
    FOR INSERT TO anon, authenticated WITH CHECK (true);


-- 5. Create ACCOUNTING Table (Revenues & Expenses Ledger)
CREATE TABLE public.accounting (
    id text PRIMARY KEY,
    date text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    category text NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Accounting ledger
ALTER TABLE public.accounting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read accounting" ON public.accounting
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to insert accounting" ON public.accounting
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow admin to delete accounting" ON public.accounting
    FOR DELETE TO authenticated USING (true);


-- 6. Create UNITS Table (Custom Units)
CREATE TABLE public.units (
    id text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_custom boolean DEFAULT false NOT NULL
);

-- Enable RLS on Units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read units" ON public.units
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to insert units" ON public.units
    FOR INSERT TO anon, authenticated WITH CHECK (true);


-- =========================================================
-- SEED DATA
-- =========================================================

-- Seed Units
INSERT INTO public.units (id, name, is_custom) VALUES
('un1', 'กิโล', false),
('un2', 'กระสอบ', false),
('un3', 'ลิตร', false),
('un4', 'แพ็ค', false),
('un5', 'ขวด', false),
('un6', 'ฟอง', false),
('un7', 'แผง', false),
('un8', 'ถุง', false),
('un9', 'กล่อง', false),
('un10', 'ชิ้น', false)
ON CONFLICT (name) DO NOTHING;

-- Seed Products
INSERT INTO public.products (id, name, category, cost_price, selling_price, unit, stock_qty, min_qty, is_rice, kg_per_bag) VALUES
('P001', 'ข้าวหอมมะลิ 105 (เกรดส่งออก)', 'ข้าวสาร', 1100, 1450, 'กระสอบ', 900, 180, true, 45),
('P002', 'ข้าวเหนียวเขี้ยวงู กข6', 'ข้าวสาร', 950, 1250, 'กระสอบ', 1000, 200, true, 50),
('P003', 'ข้าวหอมปทุมธานี', 'ข้าวสาร', 800, 1050, 'กระสอบ', 450, 135, true, 45),
('P004', 'น้ำมันพืช ตราองุ่น (1 ลิตร)', 'อาหารแห้ง', 42, 52, 'ขวด', 120, 24, false, NULL),
('P005', 'น้ำตาลทรายขาว ตรามิตรผล (1 กิโล)', 'อาหารแห้ง', 21, 26, 'ถุง', 250, 50, false, NULL),
('P006', 'ปลากระป๋องสามแม่ครัว (แพ็ค 10 กระป๋อง)', 'อาหารแห้ง', 155, 185, 'แพ็ค', 60, 15, false, NULL),
('P007', 'บะหมี่กึ่งสำเร็จรูป มาม่าหมูสับ (กล่อง 30 ซอง)', 'อาหารแห้ง', 165, 195, 'กล่อง', 45, 10, false, NULL),
('P008', 'ไข่ไก่เบอร์ 3 (แผง 30 ฟอง)', 'อาหารแห้ง', 105, 125, 'แผง', 35, 8, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Customers
INSERT INTO public.customers (id, name, phone, address) VALUES
('C001', 'ร้านป้าศรีส้มตำไก่ย่าง', '0812345678', '12/4 ซอยสุขุมวิท 23 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ'),
('C002', 'คุณหญิง บัวทอง (ลูกค้าทั่วไป)', '0898765432', '88/1 หมู่ 4 ตำบลบางแม่นาง อำเภอบางใหญ่ นนทบุรี'),
('C003', 'ร้านข้าวแกงเจ๊จิตร', '0855551234', '505 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Accounting Entries
INSERT INTO public.accounting (id, date, type, category, description, amount, note) VALUES
('E001', '2026-06-30', 'expense', 'ค่าเช่า', 'จ่ายค่าเช่าร้าน ประจำเดือน กรกฎาคม 2026', 8000, 'จ่ายให้คุณพิชัย เจ้าของตึก'),
('E002', '2026-07-02', 'expense', 'ค่าไฟ', 'ค่าไฟฟ้าร้านค้าข้าวสาร', 1540, 'การไฟฟ้านครหลวง'),
('E003', '2026-07-04', 'expense', 'ค่าน้ำมัน', 'เติมน้ำมันรถกระบะส่งของ', 800, 'ปั๊ม ปตท. สาขาใกล้เคียง'),
('E004', '2026-07-04', 'expense', 'ค่าขนส่ง', 'ค่าส่งข้าวสารด่วนให้ลูกค้าประตูนํ้า', 350, 'จ้างวินมอเตอร์ไซค์/Lalamove')
ON CONFLICT (id) DO NOTHING;
