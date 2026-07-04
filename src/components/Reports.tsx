import React, { useState, useEffect } from 'react';
import { Transaction, ExpenseIncome, Product, Customer } from '../types';
import { dbService } from '../utils/db';
import { exportToCSV, exportToExcel, triggerPrint } from '../utils/reportExport';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Wheat, 
  UserCheck2 
} from 'lucide-react';

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseIncome[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Selected date parameters
  const [reportRange, setReportRange] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState('2026-07-04');
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    async function loadData() {
      const txs = await dbService.getTransactions();
      const exps = await dbService.getExpenseIncomes();
      const prods = await dbService.getProducts();
      const custs = await dbService.getCustomers();

      setTransactions(txs);
      setExpenses(exps);
      setProducts(prods);
      setCustomers(custs);
    }
    loadData();
  }, []);

  // Filter Transactions and Accounting entries based on selected range
  const getFilteredData = () => {
    let filteredTxs = transactions;
    let filteredExps = expenses;

    if (reportRange === 'daily') {
      filteredTxs = transactions.filter(t => t.created_at.startsWith(selectedDate));
      filteredExps = expenses.filter(e => e.date === selectedDate);
    } else if (reportRange === 'monthly') {
      filteredTxs = transactions.filter(t => t.created_at.startsWith(selectedMonth));
      filteredExps = expenses.filter(e => e.date.substring(0, 7) === selectedMonth);
    } else if (reportRange === 'yearly') {
      filteredTxs = transactions.filter(t => t.created_at.startsWith(selectedYear));
      filteredExps = expenses.filter(e => e.date.startsWith(selectedYear));
    }

    return { filteredTxs, filteredExps };
  };

  const { filteredTxs, filteredExps } = getFilteredData();

  // ==========================================
  // METRICS CALCULATIONS
  // ==========================================

  // Total POS Sales in this range
  const totalSales = filteredTxs.reduce((sum, t) => sum + t.total, 0);

  // Total Income (POS sales + other general incomes)
  const totalIncome = totalSales + filteredExps
    .filter(e => e.type === 'income' && e.category !== 'ขายสินค้า')
    .reduce((sum, e) => sum + e.amount, 0);

  // Total Expenses (buying inventory, utilities, rent, shipping etc)
  const totalExpense = filteredExps
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Profit
  const netProfit = totalIncome - totalExpense;

  // Best Selling Products calculations
  const getTopSellingProducts = () => {
    const map: { [key: string]: { name: string; qty: number; total: number; unit: string } } = {};
    
    filteredTxs.forEach(t => {
      t.items.forEach(item => {
        if (!map[item.product_id]) {
          map[item.product_id] = { name: item.product_name, qty: 0, total: 0, unit: item.unit };
        }
        map[item.product_id].qty += item.qty;
        map[item.product_id].total += item.total_price;
      });
    });

    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  };

  // Customers buying frequency rankings
  const getFrequentCustomers = () => {
    const map: { [key: string]: { name: string; phone: string; count: number; total: number } } = {};

    filteredTxs.forEach(t => {
      const customerId = t.customer_id || 'C-CASHIER';
      if (!map[customerId]) {
        map[customerId] = { 
          name: t.customer_name || 'ลูกค้าทั่วไป', 
          phone: customers.find(c => c.id === t.customer_id)?.phone || '-',
          count: 0, 
          total: 0 
        };
      }
      map[customerId].count += 1;
      map[customerId].total += t.total;
    });

    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const topProducts = getTopSellingProducts();
  const topCustomers = getFrequentCustomers();

  // ==========================================
  // EXPORTS
  // ==========================================

  const getReportTitle = () => {
    if (reportRange === 'daily') return `รายงานยอดขายรายวัน ประจำวันที่ ${selectedDate}`;
    if (reportRange === 'monthly') return `รายงานยอดขายรายเดือน ประจำเดือน ${selectedMonth}`;
    return `รายงานยอดขายรายปี ประจำปี ${selectedYear}`;
  };

  const handleExportCSV = () => {
    const title = getReportTitle();
    const headers = ['ประเภทธุรกรรม', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)', 'วันที่'];
    
    const rows = [
      // Totals summary first
      ['สรุปย่อ', 'รายได้รวมทั้งหมด', title, totalIncome.toString(), ''],
      ['สรุปย่อ', 'รายจ่ายรวมทั้งหมด', title, totalExpense.toString(), ''],
      ['สรุปย่อ', 'กำไรสุทธิรวม', title, netProfit.toString(), ''],
      ['', '', '', '', ''],
      ['ประเภท', 'หมวดหมู่', 'รายการ', 'จำนวนเงิน', 'วันที่ทำรายการ']
    ];

    // Add financial ledgers
    filteredExps.forEach(e => {
      rows.push([
        e.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        e.category,
        e.description,
        e.amount.toString(),
        e.date
      ]);
    });

    exportToCSV(`subwara-report-${reportRange}`, headers, rows);
  };

  const handleExportExcel = () => {
    const title = getReportTitle();
    const headers = ['ประเภทธุรกรรม', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)', 'วันที่'];
    const rows = [
      ['สรุปผลประกอบการ', 'รายได้รวม', title, totalIncome.toString(), ''],
      ['สรุปผลประกอบการ', 'รายจ่ายรวม', title, totalExpense.toString(), ''],
      ['สรุปผลประกอบการ', 'กำไรสุทธิ', title, netProfit.toString(), '']
    ];
    filteredExps.forEach(e => {
      rows.push([
        e.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        e.category,
        e.description,
        e.amount.toString(),
        e.date
      ]);
    });
    exportToExcel(`subwara-report-${reportRange}`, headers, rows);
  };

  const handlePrintPDF = () => {
    triggerPrint('printable-report-sheet');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600" /> ระบบรายงานผลและส่งออก
          </h1>
          <p className="text-stone-500 text-xs">ออกเอกสารงบดุล รายการสินค้าขายดีที่สุด สถิติกลุ่มลูกค้า และส่งออกข้อมูลนำเข้าสู่ Excel / PDF</p>
        </div>

        {/* Toolbar parameters */}
        <div className="flex flex-wrap gap-2">
          {['daily', 'monthly', 'yearly'].map((range) => (
            <button
              key={range}
              onClick={() => setReportRange(range as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                reportRange === range
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {range === 'daily' ? 'รายงานรายวัน' : range === 'monthly' ? 'รายงานรายเดือน' : 'รายงานรายปี'}
            </button>
          ))}
        </div>
      </div>

      {/* Selector input parameters based on Range */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5 shrink-0">
          <Calendar className="h-4 w-4 text-emerald-600" /> เลือกคาบเวลาที่ต้องการออกรายงาน:
        </span>

        {reportRange === 'daily' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block rounded-xl border border-stone-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-950 font-bold"
          />
        )}

        {reportRange === 'monthly' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block rounded-xl border border-stone-300 py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-955 font-bold"
          />
        )}

        {reportRange === 'yearly' && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block rounded-xl border border-stone-300 py-1.5 px-3 text-xs focus:outline-none text-stone-950 font-bold"
          >
            <option value="2026">ปี 2026</option>
            <option value="2025">ปี 2025</option>
            <option value="2024">ปี 2024</option>
          </select>
        )}

        {/* Export buttons block */}
        <div className="sm:ml-auto flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-amber-200" /> พิมพ์รายงาน (PDF)
          </button>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div 
        id="printable-report-sheet" 
        className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
      >
        {/* Document Header */}
        <div className="border-b-2 border-emerald-600 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Wheat className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-black text-stone-900">ทรัพย์วราค้าข้าว - รายงานผลประกอบการ</h2>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">คลังจัดเก็บและจัดจำหน่ายข้าวสารขายส่ง เลขประจำตัวผู้เสียภาษี: 0105569999121</p>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-xs font-bold text-emerald-700 block">{getReportTitle()}</span>
            <span className="text-[9px] text-stone-400 block mt-0.5">ออกรายงาน ณ วันที่ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* Core Financial Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
            <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider">ยอดขายและรายรับรวม</span>
            <span className="text-2xl font-black text-emerald-800">{totalIncome.toLocaleString()} ฿</span>
          </div>
          <div className="bg-red-50/30 border border-red-100 p-4 rounded-xl">
            <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider">ต้นทุนและรายจ่ายรวม</span>
            <span className="text-2xl font-black text-red-600">{totalExpense.toLocaleString()} ฿</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
            <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider">กำไรสุทธิรวม</span>
            <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-500'}`}>
              {netProfit.toLocaleString()} ฿
            </span>
          </div>
        </div>

        {/* Best sellers & loyal clients sideboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best selling */}
          <div className="border border-stone-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-1 flex items-center gap-1.5">
              <Wheat className="h-4 w-4 text-emerald-600" /> อันดับสินค้าขายดีที่สุดในรอบบัญชีนี้
            </h3>
            <div className="divide-y divide-stone-100 space-y-2">
              {topProducts.map((p, index) => (
                <div key={p.name} className="flex justify-between items-center pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-800 bg-emerald-50 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-stone-800">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{p.qty} {p.unit}</span>
                    <span className="text-[9px] text-stone-500">ยอดรวม: {p.total.toLocaleString()} ฿</span>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center py-6 text-stone-400 text-xs">ไม่มีสถิติขายในช่วงเวลาคัดกรองนี้</p>
              )}
            </div>
          </div>

          {/* Loyal customers */}
          <div className="border border-stone-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-1 flex items-center gap-1.5">
              <UserCheck2 className="h-4 w-4 text-emerald-600" /> 5 อันดับลูกค้าซื้อบ่อยที่สุด
            </h3>
            <div className="divide-y divide-stone-100 space-y-2">
              {topCustomers.map((c, index) => (
                <div key={c.name} className="flex justify-between items-center pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-800 bg-emerald-50 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-stone-800 block">{c.name}</span>
                      <span className="text-[9px] text-stone-400">โทร: {c.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">สั่งไป {c.count} ครั้ง</span>
                    <span className="text-[9px] text-stone-500">ยอดซื้อรวม: {c.total.toLocaleString()} ฿</span>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p className="text-center py-6 text-stone-400 text-xs">ไม่มีสถิติซื้อในช่วงเวลาคัดกรองนี้</p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Transactions breakdown */}
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-stone-50 py-2.5 px-4 border-b border-stone-200">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">บัญชีแยกประเภทรายรับ-จ่ายในรอบเวลา</h4>
          </div>
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
            <thead className="bg-stone-100 text-stone-500 font-bold">
              <tr>
                <th className="py-2.5 px-4">วันที่ทำรายการ</th>
                <th className="py-2.5 px-4">ประเภท</th>
                <th className="py-2.5 px-4">หมวดหมู่</th>
                <th className="py-2.5 px-4">รายการบัญชี</th>
                <th className="py-2.5 px-4 text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredExps.map((e) => (
                <tr key={e.id} className="hover:bg-stone-50">
                  <td className="py-2 px-4 font-mono">{e.date}</td>
                  <td className="py-2 px-4 font-semibold">{e.type === 'income' ? 'รายรับ (+)' : 'รายจ่าย (-)'}</td>
                  <td className="py-2 px-4">{e.category}</td>
                  <td className="py-2 px-4 max-w-[200px] truncate" title={e.description}>{e.description}</td>
                  <td className={`py-2 px-4 text-right font-bold ${e.type === 'income' ? 'text-emerald-700' : 'text-red-500'}`}>
                    {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()} ฿
                  </td>
                </tr>
              ))}
              {filteredExps.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-stone-400">ไม่มีข้อมูลธุรกรรมในช่วงเวลานี้</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
