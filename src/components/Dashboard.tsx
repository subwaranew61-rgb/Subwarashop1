import { useEffect, useState } from 'react';
import { Product, Customer, Transaction, ExpenseIncome } from '../types';
import { dbService } from '../utils/db';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  AlertTriangle, 
  ShoppingBag, 
  Scale, 
  TrendingUpIcon,
  Wheat
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseIncome[]>([]);

  // Base date from metadata: 2026-07-04
  const TODAY_STR = '2026-07-04';

  useEffect(() => {
    async function loadData() {
      const prods = await dbService.getProducts();
      const custs = await dbService.getCustomers();
      const txs = await dbService.getTransactions();
      const exps = await dbService.getExpenseIncomes();
      
      setProducts(prods);
      setCustomers(custs);
      setTransactions(txs);
      setExpenses(exps);
    }
    loadData();
  }, []);

  // ==========================================
  // METRICS CALCULATIONS
  // ==========================================

  // Filter for today's transactions and accounting entries
  const todayTransactions = transactions.filter(t => t.created_at.startsWith(TODAY_STR));
  const todayAccounting = expenses.filter(e => e.date === TODAY_STR);

  // 1. Today's POS sales (ยอดขายวันนี้)
  const todaySalesAmount = todayTransactions.reduce((sum, t) => sum + t.total, 0);

  // 2. Today's General Revenue (รายได้วันนี้ - POS sales + other income)
  const todayRevenue = todaySalesAmount + todayAccounting
    .filter(e => e.type === 'income' && e.category !== 'ขายสินค้า')
    .reduce((sum, e) => sum + e.amount, 0);

  // 3. Today's General Expenses (รายจ่ายวันนี้)
  const todayExpenses = todayAccounting
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  // 4. Today's Net Profit (กำไรสุทธิวันนี้ = รายได้ - รายจ่าย)
  // Let's also include transaction profitability (price - cost) minus expenses
  const todaySalesCost = todayTransactions.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, item) => itemSum + (item.cost * item.qty), 0);
  }, 0);
  const todayNetProfit = todayRevenue - todayExpenses;

  // 5. Customer counts
  const totalCustomers = customers.length;
  // Let's determine loyal/repeat customers: >= 2 purchases
  const loyalCustomersCount = customers.filter(c => {
    const purchaseCount = transactions.filter(t => t.customer_id === c.id).length;
    return purchaseCount >= 2;
  }).length;
  const newCustomersCount = totalCustomers - loyalCustomersCount;

  // 6. Product Stock statistics
  const totalProductsCount = products.length;
  const lowStockCount = products.filter(p => p.stock_qty <= p.min_qty).length;

  // 7. Rice specific inventory metrics (Bags vs Kg)
  const riceProducts = products.filter(p => p.is_rice);
  const totalRiceBags = riceProducts.reduce((sum, p) => {
    const bags = Math.floor(p.stock_qty / (p.kg_per_bag || 45));
    return sum + bags;
  }, 0);

  const totalRiceLooseKg = riceProducts.reduce((sum, p) => {
    const loose = p.stock_qty % (p.kg_per_bag || 45);
    return sum + loose;
  }, 0);

  const totalRiceWeight = riceProducts.reduce((sum, p) => sum + p.stock_qty, 0);

  // ==========================================
  // CHART DATA PREPARATION
  // ==========================================

  // Daily Sales Chart (past 5 days including today)
  const getDailySalesData = () => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(TODAY_STR);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().substring(0, 10));
    }

    return dates.map(date => {
      const dayTxs = transactions.filter(t => t.created_at.startsWith(date));
      const sales = dayTxs.reduce((sum, t) => sum + t.total, 0);
      
      const dayExps = expenses.filter(e => e.date === date && e.type === 'expense');
      const spent = dayExps.reduce((sum, e) => sum + e.amount, 0);

      // Simple formatted label for Thai
      const dateParts = date.split('-');
      const label = `${dateParts[2]}/${dateParts[1]}`;

      return {
        name: label,
        ยอดขาย: sales,
        รายจ่าย: spent,
        กำไรสุทธิ: Math.max(0, sales - spent)
      };
    });
  };

  // Monthly Sales Chart (simulate June & July 2026 based on seed)
  const getMonthlyData = () => {
    return [
      { name: 'ม.ค.', ยอดขาย: 45000, รายจ่าย: 12000, กำไร: 33000 },
      { name: 'ก.พ.', ยอดขาย: 52000, รายจ่าย: 15000, กำไร: 37000 },
      { name: 'มี.ค.', ยอดขาย: 61000, รายจ่าย: 18000, กำไร: 43000 },
      { name: 'เม.ย.', ยอดขาย: 58000, รายจ่าย: 14000, กำไร: 44000 },
      { name: 'พ.ค.', ยอดขาย: 70000, รายจ่าย: 22000, กำไร: 48000 },
      { name: 'มิ.ย.', ยอดขาย: 78000, รายจ่าย: 25000, กำไร: 53000 },
      { name: 'ก.ค.', ยอดขาย: 10800, รายจ่าย: 10690, กำไร: 110 } // Current month July up to today
    ];
  };

  // Yearly Sales Chart (Simulated past 3 years)
  const getYearlyData = () => {
    return [
      { name: '2024', ยอดขาย: 680000, รายจ่าย: 240000, กำไร: 440000 },
      { name: '2025', ยอดขาย: 820000, รายจ่าย: 280000, กำไร: 540000 },
      { name: '2026 (YTD)', ยอดขาย: 374800, รายจ่าย: 116690, กำไร: 258110 }
    ];
  };

  // Best Selling Products (Derived from transactions)
  const getBestSellers = () => {
    const salesMap: { [key: string]: { name: string; qty: number; total: number } } = {};
    
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!salesMap[item.product_id]) {
          salesMap[item.product_id] = { name: item.product_name, qty: 0, total: 0 };
        }
        salesMap[item.product_id].qty += item.qty;
        salesMap[item.product_id].total += item.total_price;
      });
    });

    return Object.values(salesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  const bestSellers = getBestSellers();
  const dailySales = getDailySalesData();
  const monthlySales = getMonthlyData();
  const yearlySales = getYearlyData();

  // Color palette for charts
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-brand-text">
      
      {/* Header Banner */}
      <div className="bg-brand-green rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Wheat className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <span className="bg-white/10 text-brand-yellow text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            ทรัพย์วราค้าข้าว แดชบอร์ด
          </span>
          <h1 className="text-xl md:text-2xl font-bold mt-3 tracking-tight">
            สรุปผลประกอบการร้านค้าวันนี้
          </h1>
          <p className="text-white/80 text-xs mt-1 max-w-xl">
            ยินดีต้อนรับสู่แดชบอร์ดสรุปยอดขาย การรับจ่ายคลังสินค้า และสถิติลายวัน ประจำวันที่ {new Date(TODAY_STR).toLocaleDateString('th-TH', { dateStyle: 'long' })}
          </p>
        </div>
      </div>

      {/* Primary financial metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales Card */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider">ยอดขายสินค้าวันนี้</span>
            <div className="h-9 w-9 bg-brand-light rounded-xl flex items-center justify-center text-brand-green">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-brand-text">{todaySalesAmount.toLocaleString()} ฿</h3>
            <p className="text-xs text-stone-500 mt-1">
              จากตู้ POS ทั้งหมด <span className="font-semibold text-brand-green">{todayTransactions.length} บิล</span>
            </p>
          </div>
        </div>

        {/* Today Revenue Card */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider">รายได้รวมวันนี้</span>
            <div className="h-9 w-9 bg-brand-light rounded-xl flex items-center justify-center text-brand-green">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-brand-text">{todayRevenue.toLocaleString()} ฿</h3>
            <p className="text-xs text-stone-500 mt-1">
              รวมรายรับและยอดโอนขายส่ง
            </p>
          </div>
        </div>

        {/* Today Expense Card */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider">รายจ่ายรวมวันนี้</span>
            <div className="h-9 w-9 bg-orange-50 rounded-xl flex items-center justify-center text-brand-brown">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-brand-brown">{todayExpenses.toLocaleString()} ฿</h3>
            <p className="text-xs text-stone-500 mt-1">
              รวมค่าเช่า ค่าน้ำมัน และซื้อของ
            </p>
          </div>
        </div>

        {/* Today Net Profit Card */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider">กำไรสุทธิวันนี้</span>
            <div className="h-9 w-9 bg-brand-light rounded-xl flex items-center justify-center text-brand-yellow">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold ${todayNetProfit >= 0 ? 'text-brand-green' : 'text-brand-brown'}`}>
              {todayNetProfit.toLocaleString()} ฿
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {todayNetProfit >= 0 ? 'ผลประกอบการเป็นบวก' : 'ผลประกอบการติดลบ'}
            </p>
          </div>
        </div>
      </div>

      {/* Rice Specific Stock Visual Widgets */}
      <div className="bg-brand-light border border-brand-border rounded-2xl p-5">
        <h2 className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2 mb-4">
          <Wheat className="h-4 w-4 text-brand-green" /> สถานะข้าวสารคงเหลือในคลัง
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-brand-border flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-brown shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-stone-500 text-xs font-medium">กระสอบข้าวที่ปิดอยู่</p>
              <h4 className="text-lg font-bold text-brand-text">{totalRiceBags} <span className="text-xs text-stone-500 font-normal">กระสอบ</span></h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-brand-border flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-brown shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-stone-500 text-xs font-medium">ข้าวเปิดกระสอบขายย่อย</p>
              <h4 className="text-lg font-bold text-brand-text">{totalRiceLooseKg.toLocaleString()} <span className="text-xs text-stone-500 font-normal">กิโล</span></h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-brand-border flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-green shrink-0">
              <TrendingUpIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-stone-500 text-xs font-medium">น้ำหนักรวมข้าวทั้งหมด</p>
              <h4 className="text-lg font-bold text-brand-green">{totalRiceWeight.toLocaleString()} <span className="text-xs text-stone-500 font-normal">กก.</span></h4>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Product statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Base Info */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-brand-green" /> วิเคราะห์ฐานลูกค้า
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-brand-light/50 rounded-xl border border-brand-border">
              <span className="text-[10px] text-stone-500 font-semibold block uppercase">ลูกค้าทั้งหมด</span>
              <span className="text-xl font-bold text-brand-text">{totalCustomers}</span>
            </div>
            <div className="p-3 bg-brand-light/50 rounded-xl border border-brand-border">
              <span className="text-[10px] text-brand-green font-semibold block uppercase">ลูกค้าขาประจำ</span>
              <span className="text-xl font-bold text-brand-green">{loyalCustomersCount}</span>
            </div>
            <div className="p-3 bg-brand-light/50 rounded-xl border border-brand-border">
              <span className="text-[10px] text-brand-brown font-semibold block uppercase">ลูกค้าใหม่</span>
              <span className="text-xl font-bold text-brand-brown">{newCustomersCount}</span>
            </div>
          </div>
        </div>

        {/* Product Inventory Info */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-brand-green" /> ตรวจสอบคลังสินค้า
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-brand-light/50 rounded-xl border border-brand-border">
              <span className="text-[10px] text-stone-500 font-semibold block uppercase">สินค้าทั้งหมด (SKU)</span>
              <span className="text-xl font-bold text-brand-text">{totalProductsCount}</span>
            </div>
            <div className={`p-3 rounded-xl border ${lowStockCount > 0 ? 'bg-orange-50 border-orange-100 text-brand-brown' : 'bg-brand-light/50 border-brand-border'}`}>
              <span className="text-[10px] font-semibold block uppercase">สินค้าใกล้หมด / ต่ำกว่าเกณฑ์</span>
              <span className="text-xl font-bold">{lowStockCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Sales Chart */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">เปรียบเทียบ ยอดขาย และ รายจ่ายรายวัน</h3>
            <p className="text-[10px] text-stone-500">รายงานข้อมูลย้อนหลัง 5 วันล่าสุด</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} style={{ fontSize: 11 }} />
                <YAxis tickLine={false} style={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="ยอดขาย" fill="#2D5A27" radius={[4, 4, 0, 0]} />
                <Bar dataKey="รายจ่าย" fill="#A67C52" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">สรุปรายรับรายเดือน (2026)</h3>
            <p className="text-[10px] text-stone-500">ผลประกอบการรายปีสะสมแยกตามเดือน</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5A27" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2D5A27" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} style={{ fontSize: 11 }} />
                <YAxis tickLine={false} style={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="ยอดขาย" stroke="#2D5A27" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Growth comparison */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">อัตราเติบโตรายปี (Year-Over-Year)</h3>
            <p className="text-[10px] text-stone-500">สรุปกำไร ยอดขาย และต้นทุนรายปี</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} style={{ fontSize: 11 }} />
                <YAxis tickLine={false} style={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="ยอดขาย" fill="#2D5A27" radius={[4, 4, 0, 0]} />
                <Bar dataKey="กำไร" fill="#E9C46A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Sellers Board */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-3">5 อันดับสินค้าขายดีที่สุด (แยกตามยอดขาย)</h3>
            <div className="space-y-3 mt-4">
              {bestSellers.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between border-b border-brand-border pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-xs text-brand-green bg-brand-light h-6 w-6 rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-brand-text truncate max-w-[160px] sm:max-w-[240px]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-brand-text block">{item.total.toLocaleString()} ฿</span>
                    <span className="text-[10px] text-stone-500 block">ขายไปแล้ว {item.qty} ชิ้น/กระสอบ</span>
                  </div>
                </div>
              ))}
              {bestSellers.length === 0 && (
                <div className="text-center py-10 text-stone-400 text-xs">
                  ยังไม่มีประวัติการขายสินค้าในระบบ
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-brand-border mt-4 text-center">
            <span className="text-[10px] text-stone-500 block">สถิตินี้คำนวณจากทุกบิลที่มีการออกใบเสร็จ</span>
          </div>
        </div>

      </div>

    </div>
  );
}
