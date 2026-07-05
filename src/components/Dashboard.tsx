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
  Wheat,
  HelpCircle,
  Info,
  Calendar,
  ArrowUpRight,
  FileText,
  Activity,
  Layers,
  CheckCircle2
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
  
  // Custom Analytics States for "Subwara Rice Model"
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'seven_days' | 'month' | 'all'>('today');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'interactive' | 'standard'>('interactive');

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
  // PERIOD-FILTERED ANALYTICS ("SUBWARA MODEL")
  // ==========================================
  
  const getPeriodFilteredData = () => {
    let filteredTxs = transactions;
    let filteredExps = expenses;

    const todayDate = new Date(TODAY_STR);

    if (analyticsPeriod === 'today') {
      filteredTxs = transactions.filter(t => t.created_at.startsWith(TODAY_STR));
      filteredExps = expenses.filter(e => e.date === TODAY_STR);
    } else if (analyticsPeriod === 'seven_days') {
      const sevenDaysAgo = new Date(todayDate);
      sevenDaysAgo.setDate(todayDate.getDate() - 6);
      
      filteredTxs = transactions.filter(t => {
        const tDate = new Date(t.created_at.substring(0, 10));
        return tDate >= sevenDaysAgo && tDate <= todayDate;
      });
      filteredExps = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= sevenDaysAgo && eDate <= todayDate;
      });
    } else if (analyticsPeriod === 'month') {
      const currentMonthStr = TODAY_STR.substring(0, 7); // '2026-07'
      filteredTxs = transactions.filter(t => t.created_at.startsWith(currentMonthStr));
      filteredExps = expenses.filter(e => e.date.substring(0, 7) === currentMonthStr);
    } else if (analyticsPeriod === 'all') {
      filteredTxs = transactions;
      filteredExps = expenses;
    }

    return { filteredTxs, filteredExps };
  };

  const { filteredTxs, filteredExps } = getPeriodFilteredData();

  // 1. Total POS Sales in Period
  const periodSalesAmount = filteredTxs.reduce((sum, t) => sum + t.total, 0);

  // 2. Rice sales and costs map in Period
  const riceSalesMap: { [prodId: string]: { name: string; totalKg: number; totalSales: number; totalCost: number } } = {};
  riceProducts.forEach(p => {
    riceSalesMap[p.id] = { name: p.name, totalKg: 0, totalSales: 0, totalCost: 0 };
  });

  filteredTxs.forEach(t => {
    t.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod && prod.is_rice) {
        if (!riceSalesMap[item.product_id]) {
          riceSalesMap[item.product_id] = { name: item.product_name, totalKg: 0, totalSales: 0, totalCost: 0 };
        }
        
        let itemWeightKg = item.qty;
        if (item.unit.includes('กระสอบ')) {
          itemWeightKg = item.qty * (prod.kg_per_bag || 45);
        } else if (item.unit.includes('ถัง')) {
          itemWeightKg = item.qty * 15;
        }
        
        riceSalesMap[item.product_id].totalKg += itemWeightKg;
        riceSalesMap[item.product_id].totalSales += item.total_price;
        riceSalesMap[item.product_id].totalCost += (item.cost * item.qty);
      }
    });
  });

  const totalRiceKgSoldInPeriod = Object.values(riceSalesMap).reduce((sum, r) => sum + r.totalKg, 0);
  const totalRiceSalesInPeriod = Object.values(riceSalesMap).reduce((sum, r) => sum + r.totalSales, 0);
  const totalRiceCostInPeriod = Object.values(riceSalesMap).reduce((sum, r) => sum + r.totalCost, 0);

  // 3. Non-rice sales and costs in Period
  let nonRiceSalesInPeriod = 0;
  let nonRiceCostInPeriod = 0;

  filteredTxs.forEach(t => {
    t.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod && !prod.is_rice) {
        nonRiceSalesInPeriod += item.total_price;
        nonRiceCostInPeriod += (item.cost * item.qty);
      }
    });
  });

  // Total COGS
  const totalCogsInPeriod = totalRiceCostInPeriod + nonRiceCostInPeriod;
  // Gross profit from Sales
  const grossProfitInPeriod = periodSalesAmount - totalCogsInPeriod;

  // Other Incomes (ledger category !== 'ขายสินค้า')
  const otherIncomeInPeriod = filteredExps
    .filter(e => e.type === 'income' && e.category !== 'ขายสินค้า')
    .reduce((sum, e) => sum + e.amount, 0);

  // General Operating Expenses (excl. Stock purchases 'ซื้อสินค้า')
  const opExpensesInPeriod = filteredExps
    .filter(e => e.type === 'expense' && e.category !== 'ซื้อสินค้า')
    .reduce((sum, e) => sum + e.amount, 0);

  // Stock Purchases expense
  const inventoryPurchasesInPeriod = filteredExps
    .filter(e => e.type === 'expense' && e.category === 'ซื้อสินค้า')
    .reduce((sum, e) => sum + e.amount, 0);

  // Real net profit
  const realNetProfitInPeriod = grossProfitInPeriod + otherIncomeInPeriod - opExpensesInPeriod;

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
            ระบบวิเคราะห์ข้อมูลขั้นสูง - ทรัพย์วราค้าข้าว
          </span>
          <h1 className="text-xl md:text-2xl font-bold mt-3 tracking-tight">
            แดชบอร์ดสรุปผลประกอบการและคลังสินค้าส่ง
          </h1>
          <p className="text-white/80 text-xs mt-1 max-w-xl">
            ระบุข้อมูลสต๊อกที่อัปเดตแบบเรียลไทม์ และบัญชีต้นทุนถัวเฉลี่ยต่อหน่วย เพื่อการวิเคราะห์กำไรสุทธิที่แท้จริง
          </p>
        </div>
      </div>

      {/* Tabs Navigation Workspace */}
      <div className="flex border-b border-brand-border gap-2 shrink-0">
        <button
          onClick={() => setActiveDashboardTab('interactive')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl cursor-pointer transition-all flex items-center gap-2 ${
            activeDashboardTab === 'interactive'
              ? 'bg-white border-t border-x border-brand-border text-brand-green'
              : 'text-stone-500 hover:text-brand-green'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>💡 แก้โจทย์ร้านค้าส่ง: เจาะลึกสต๊อกข้าว & กำไรสุทธิที่แท้จริง (5 คำถามหลัก)</span>
        </button>
        <button
          onClick={() => setActiveDashboardTab('standard')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl cursor-pointer transition-all flex items-center gap-2 ${
            activeDashboardTab === 'standard'
              ? 'bg-white border-t border-x border-brand-border text-brand-green'
              : 'text-stone-500 hover:text-brand-green'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>📊 สถิติร้านค้าทั่วไป & แผนภูมิวิเคราะห์</span>
        </button>
      </div>

      {activeDashboardTab === 'interactive' ? (
        // INTERACTIVE CONTROL CENTER - 5 CORE QUESTIONS SOLVED
        <div className="space-y-6">
          
          {/* Period selector */}
          <div className="bg-white border border-brand-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-brand-green" />
              <div>
                <h3 className="text-xs font-bold text-brand-text">เลือกช่วงเวลาวิเคราะห์กำไรจริง</h3>
                <p className="text-[10px] text-stone-500">ระบบจะดึงรายการบิลและรายจ่ายในคาบเวลานั้นมาคำนวณต้นทุนสะสมทันที</p>
              </div>
            </div>
            
            <div className="flex gap-1 bg-brand-light p-1 rounded-xl border border-brand-border">
              {(['today', 'seven_days', 'month', 'all'] as const).map((period) => {
                const label = period === 'today' ? 'วันนี้' : period === 'seven_days' ? '7 วันล่าสุด' : period === 'month' ? 'เดือนนี้' : 'ทั้งหมด';
                return (
                  <button
                    key={period}
                    onClick={() => setAnalyticsPeriod(period)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      analyticsPeriod === period
                        ? 'bg-brand-green text-white shadow-sm'
                        : 'text-stone-600 hover:text-brand-green'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Layout of the 5 Core Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1 & 2: Remaining bags & Remaining KG */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-brand-border pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-brand-green font-bold uppercase tracking-wider block">คำถามที่ 1 & 2</span>
                  <h3 className="text-xs font-black text-brand-text flex items-center gap-1.5">
                    <Wheat className="h-4 w-4 text-emerald-600" /> 1. เหลือข้าวกี่กระสอบ? &amp; 2. เหลือกี่กิโล?
                  </h3>
                </div>
                <span className="bg-emerald-50 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">เรียลไทม์</span>
              </div>

              <div className="divide-y divide-brand-border space-y-3.5">
                {riceProducts.map((p) => {
                  const kgPerBag = p.kg_per_bag || 45;
                  const bagsLeft = Math.floor(p.stock_qty / kgPerBag);
                  const looseKgLeft = p.stock_qty % kgPerBag;
                  const totalKg = p.stock_qty;

                  return (
                    <div key={p.id} className="pt-3 first:pt-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[11px] font-bold text-brand-text block">{p.name}</span>
                          <span className="text-[9px] text-stone-400">รหัสคลัง: {p.id} (กระสอบละ {kgPerBag} กก.)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700 block">{totalKg.toLocaleString()} กก.</span>
                          <span className="text-[9px] text-stone-400 block">คลังรวมทั้งหมด</span>
                        </div>
                      </div>

                      {/* Visual breakdowns */}
                      <div className="grid grid-cols-2 gap-3 mt-2.5">
                        <div className="bg-brand-light/40 border border-brand-border/40 p-2.5 rounded-xl text-center">
                          <span className="text-[9px] text-stone-500 font-bold block uppercase">กระสอบที่ปิดสนิท</span>
                          <span className="text-sm font-black text-brand-green">{bagsLeft} <span className="text-[10px] font-normal text-stone-500">กระสอบ</span></span>
                        </div>
                        <div className="bg-orange-50/40 border border-orange-100 p-2.5 rounded-xl text-center">
                          <span className="text-[9px] text-stone-500 font-bold block uppercase">เศษในถังตักหน้าร้าน</span>
                          <span className="text-sm font-black text-brand-brown">{looseKgLeft} <span className="text-[10px] font-normal text-stone-500">กก.</span></span>
                        </div>
                      </div>

                      {/* Educational Tip */}
                      {looseKgLeft > 0 && (
                        <div className="mt-2 bg-orange-50/30 border border-orange-100/50 rounded-lg p-2 text-[10px] text-brand-brown flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-brand-brown shrink-0" />
                          <span><strong>ข้อแนะนำ:</strong> ตักขายเศษ <strong>{looseKgLeft} กิโล</strong> ในถังตักนี้ให้หมดก่อนแกะกระสอบใหม่! เพื่อลดการเกิดข้าวก้นสต๊อก</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Total rice sold in KG */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-brand-border pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-green font-bold uppercase tracking-wider block">คำถามที่ 3</span>
                    <h3 className="text-xs font-black text-brand-text flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-emerald-600" /> 3. ขายข้าวไปแล้วทั้งหมดกี่กิโล?
                    </h3>
                  </div>
                  <span className="bg-brand-light text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-full border border-brand-border">คัดกรองตามงวด</span>
                </div>

                <div className="mt-5 text-center p-4 bg-brand-light/30 border border-brand-border rounded-2xl">
                  <Wheat className="h-10 w-10 text-brand-brown mx-auto mb-1 opacity-80" />
                  <span className="text-[10px] text-stone-500 block font-bold uppercase">ปริมาณน้ำหนักข้าวสารขายสะสมในงวดนี้</span>
                  <h4 className="text-3xl font-black text-brand-green mt-1">{totalRiceKgSoldInPeriod.toLocaleString()} กก.</h4>
                  <p className="text-[9px] text-stone-400 mt-1">แปลงยอดจากหน่วยขายย่อย ถัง และกระสอบรวมกัน</p>
                </div>

                <div className="mt-5 space-y-3">
                  <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block border-b border-stone-100 pb-1">น้ำหนักขายออกแยกรายสินค้า:</span>
                  {Object.entries(riceSalesMap).map(([id, item]) => (
                    <div key={id} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-stone-700 truncate max-w-[200px]">{item.name}</span>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 block">{item.totalKg.toLocaleString()} กก.</span>
                        <span className="text-[9px] text-stone-400">ยอดขายรวม: {item.totalSales.toLocaleString()} ฿</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(riceSalesMap).length === 0 && (
                    <p className="text-center text-stone-400 text-xs py-4">ไม่มีรายการข้าวสารขายออกในช่วงเวลานี้</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border mt-4 text-[10px] text-stone-400">
                <span>* 1 ถังแปลงน้ำหนักเฉลี่ยเท่ากับ 15 กิโลกรัม</span>
              </div>
            </div>

            {/* Card 4: COGS cost price */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-brand-border pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-green font-bold uppercase tracking-wider block">คำถามที่ 4</span>
                    <h3 className="text-xs font-black text-brand-text flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-emerald-600" /> 4. ต้นทุนของข้าวที่ขายไปเท่าไร? (COGS)
                    </h3>
                  </div>
                  <span className="bg-amber-50 text-brand-brown text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-100">บัญชีต้นทุนจริง</span>
                </div>

                <div className="mt-5 text-center p-4 bg-orange-50/20 border border-orange-100 rounded-2xl">
                  <TrendingDown className="h-10 w-10 text-brand-brown mx-auto mb-1 opacity-80" />
                  <span className="text-[10px] text-stone-500 block font-bold uppercase">ต้นทุนขายของสินค้าจริง (Cost of Goods Sold)</span>
                  <h4 className="text-3xl font-black text-brand-brown mt-1">{totalCogsInPeriod.toLocaleString()} ฿</h4>
                  <p className="text-[9px] text-stone-400 mt-1">คำนวณจากต้นทุนถัวเฉลี่ยต่อหน่วยตักจริง ไม่ใช่เงินตุนสต๊อก</p>
                </div>

                <div className="mt-5 space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-stone-100 pb-1.5">
                    <span className="text-stone-500 font-semibold">ต้นทุนเฉพาะสินค้ากลุ่มข้าวสาร:</span>
                    <span className="font-bold text-stone-900">{totalRiceCostInPeriod.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1.5">
                    <span className="text-stone-500 font-semibold">ต้นทุนสินค้าแห้งและอื่น ๆ:</span>
                    <span className="font-bold text-stone-900">{nonRiceCostInPeriod.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-stone-500 font-semibold">ต้นทุนขายสุทธิรวมทั้งร้าน:</span>
                    <span className="font-black text-brand-brown">{totalCogsInPeriod.toLocaleString()} ฿</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border mt-4 text-[10px] bg-stone-50 p-2.5 rounded-xl text-stone-500 space-y-1">
                <p><strong>ระบบบัญชีต้นทุนถัวเฉลี่ย:</strong></p>
                <p>ช่วยให้เจ้าของร้านทราบมูลค่าทุนที่สูญไปกับสินค้าตักออกอย่างแท้จริง สะท้อนอัตรากำไรขั้นต้นได้อย่างแม่นยำ</p>
              </div>
            </div>

            {/* Card 5: Real Net Profit today */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-brand-border pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-green font-bold uppercase tracking-wider block">คำถามที่ 5</span>
                    <h3 className="text-xs font-black text-brand-text flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-600" /> 5. วันนี้กำไรจริงเท่าไร? (Real Net Profit)
                    </h3>
                  </div>
                  <span className="bg-emerald-50 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">สูตรทรัพย์วราโมเดล</span>
                </div>

                <div className="mt-5 text-center p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
                  <TrendingUp className="h-10 w-10 text-brand-green mx-auto mb-1 opacity-80" />
                  <span className="text-[10px] text-stone-500 block font-bold uppercase">กำไรสุทธิที่แท้จริงจากการดำเนินงาน</span>
                  <h4 className={`text-3xl font-black mt-1 ${realNetProfitInPeriod >= 0 ? 'text-brand-green' : 'text-red-500'}`}>
                    {realNetProfitInPeriod.toLocaleString()} ฿
                  </h4>
                  <p className="text-[9px] text-stone-400 mt-1">กำไรหักลบต้นทุนของที่ปล่อยออกจริง และหักลบค่าใช้จ่ายรายวัน</p>
                </div>

                {/* Proof statement spreadsheet block */}
                <div className="mt-5 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-stone-600">
                    <span>ยอดขายหน้าร้าน (POS Sales)</span>
                    <span className="text-emerald-700 font-bold">+{periodSalesAmount.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>หัก ต้นทุนของจริงที่ตักขาย (COGS)</span>
                    <span className="text-brand-brown font-bold">-{totalCogsInPeriod.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-1.5 text-stone-800 font-bold">
                    <span>(=) กำไรขั้นต้นจากการขาย (Gross Profit)</span>
                    <span>={grossProfitInPeriod.toLocaleString()} ฿</span>
                  </div>
                  {otherIncomeInPeriod > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>บวก รายรับอื่น ๆ (Other Income)</span>
                      <span className="text-emerald-700">+{otherIncomeInPeriod.toLocaleString()} ฿</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>หัก ค่าใช้จ่ายดำเนินงานทั่วไป (Op Exps)</span>
                    <span className="text-red-500">-{opExpensesInPeriod.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-brand-green/30 pt-1.5 text-brand-green font-black text-sm">
                    <span>(=) กำไรสุทธิที่แท้จริง (Real Net Profit)</span>
                    <span>={realNetProfitInPeriod.toLocaleString()} ฿</span>
                  </div>
                </div>
              </div>

              {/* Warning explanation */}
              {inventoryPurchasesInPeriod > 0 && (
                <div className="mt-4 bg-emerald-50/50 border border-brand-green/20 rounded-xl p-3 text-[10px] text-stone-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-brand-green">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
                    <span>แจ้งเตือนผู้ประกอบการเรื่องเงินสด:</span>
                  </div>
                  <p>ในงวดนี้ มีกระแสเงินสดจ่ายซื้อข้าวสต็อกเพิ่มมูลค่า <strong>{inventoryPurchasesInPeriod.toLocaleString()} ฿</strong> ซึ่งเงินจำนวนนี้คือสินทรัพย์คงคลัง ไม่ถือเป็นรายจ่ายสูญเปล่า และไม่ถูกนำมาลบเพื่อลดตัวเลขกำไรแท้จริงของร้านค้า!</p>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        // STANDARD DASHBOARD METRICS AND VISUAL GRAPHS
        <div className="space-y-6">
          
          {/* Standard Primary financial metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm">
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

            <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm">
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

            <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm">
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

            <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm">
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
          <div className="bg-brand-light border border-brand-border rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2 mb-4">
              <Wheat className="h-4 w-4 text-brand-green" /> สถานะข้าวสารคงเหลือในคลังสากล
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
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
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

            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
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
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
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
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
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
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
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
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
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
      )}

    </div>
  );
}
