import React, { useState, useEffect } from 'react';
import { ExpenseIncome, User } from '../types';
import { dbService } from '../utils/db';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Calendar, 
  PlusCircle, 
  MinusCircle, 
  X 
} from 'lucide-react';

interface AccountingProps {
  currentUser: User;
}

export default function Accounting({ currentUser }: AccountingProps) {
  const [entries, setEntries] = useState<ExpenseIncome[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states
  const [entryDate, setEntryDate] = useState('2026-07-04'); // default current from metadata
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [entryCategory, setEntryCategory] = useState('ซื้อสินค้า');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryAmount, setEntryAmount] = useState(0);
  const [entryNote, setEntryNote] = useState('');
  
  // Notifications
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const data = await dbService.getExpenseIncomes();
    setEntries(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync category dropdown based on Type selection
  useEffect(() => {
    if (entryType === 'income') {
      setEntryCategory('ขายสินค้า');
    } else {
      setEntryCategory('ซื้อสินค้า');
    }
  }, [entryType]);

  // Categories lists
  const expenseCategories = [
    'ซื้อสินค้า',
    'ค่าเช่า',
    'ค่าไฟ',
    'ค่าน้ำ',
    'ค่าแรง',
    'ค่าน้ำมัน',
    'ค่าขนส่ง',
    'ค่าใช้จ่ายอื่น'
  ];
  
  const incomeCategories = [
    'ขายสินค้า',
    'รายรับอื่น'
  ];

  // Filter ledger list
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.note || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'ทั้งหมด' || e.type === typeFilter;
    const matchesCategory = categoryFilter === 'ทั้งหมด' || e.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate high level financials
  const totalRevenue = filteredEntries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = filteredEntries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalRevenue - totalExpense;

  // Save new entry
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDescription.trim() || entryAmount <= 0) {
      setError('กรุณาระบุคำอธิบายรายการและจำนวนเงินที่ถูกต้อง');
      return;
    }

    const newEntry: ExpenseIncome = {
      id: `ACC-${Date.now()}`,
      date: entryDate,
      type: entryType,
      category: entryCategory,
      description: entryDescription.trim(),
      amount: Number(entryAmount),
      note: entryNote.trim() || undefined,
      created_at: new Date().toISOString()
    };

    try {
      await dbService.saveExpenseIncome(newEntry);
      setSuccess('บันทึกข้อมูลรายการบัญชีสำเร็จ!');
      
      // Reset
      setEntryDescription('');
      setEntryAmount(0);
      setEntryNote('');
      setShowAddModal(false);
      loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('ไม่สามารถบันทึกรายการบัญชีได้');
    }
  };

  // Delete entry (Admin only)
  const handleDeleteEntry = async (id: string) => {
    if (currentUser.role !== 'admin') {
      setError('คุณไม่มีสิทธิ์ในการลบรายการบัญชี');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (window.confirm('คุณแน่ใจว่าต้องการลบรายการธุรกรรมบัญชีนี้ใช่หรือไม่? การคำนวณกำไรจะถูกปรับเปลี่ยน')) {
      try {
        await dbService.deleteExpenseIncome(id);
        setSuccess('ลบรายการบัญชีสำเร็จ');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการลบรายการบัญชี');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-800">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-emerald-600" /> บัญชีรายรับ-รายจ่าย ทรัพย์วรา
          </h1>
          <p className="text-stone-500 text-xs">จัดเก็บบันทึกการเงินรายวัน งบกำไรขาดทุนสะสม และค่าใช้จ่ายสาธารณูปโภคภายในร้านค้า</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-600/10 flex items-center gap-1 shrink-0"
        >
          <Plus className="h-4 w-4" /> บันทึกธุรกรรมการเงิน
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial high level dashboard summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold block uppercase">รายได้รวมคัดกรอง</span>
            <h4 className="text-xl font-extrabold text-stone-900">{totalRevenue.toLocaleString()} ฿</h4>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold block uppercase">รายจ่ายรวมคัดกรอง</span>
            <h4 className="text-xl font-extrabold text-red-600">{totalExpense.toLocaleString()} ฿</h4>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${netProfit >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-bold block uppercase">กำไรสุทธิรวมคัดกรอง</span>
            <h4 className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-500'}`}>
              {netProfit.toLocaleString()} ฿
            </h4>
          </div>
        </div>
      </div>

      {/* Filter and Search toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative col-span-1 sm:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหารายการ คำอธิบาย หมายเหตุ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 block w-full rounded-xl border border-stone-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-955 text-xs"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="block w-full rounded-xl border border-stone-300 py-2 px-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
            <option value="income">ประเภท: รายรับ (+)</option>
            <option value="expense">ประเภท: รายจ่าย (-)</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full rounded-xl border border-stone-300 py-2 px-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ทั้งหมด">หมวดหมู่: ทั้งหมด</option>
            <option value="ซื้อสินค้า">หมวดหมู่: ซื้อสินค้า</option>
            <option value="ขายสินค้า">หมวดหมู่: ขายสินค้า</option>
            <option value="ค่าเช่า">หมวดหมู่: ค่าเช่า</option>
            <option value="ค่าไฟ">หมวดหมู่: ค่าไฟ</option>
            <option value="ค่าน้ำ">หมวดหมู่: ค่าน้ำ</option>
            <option value="ค่าแรง">หมวดหมู่: ค่าแรง</option>
            <option value="ค่าน้ำมัน">หมวดหมู่: ค่าน้ำมัน</option>
            <option value="ค่าขนส่ง">หมวดหมู่: ค่าขนส่ง</option>
            <option value="ค่าใช้จ่ายอื่น">หมวดหมู่: ค่าใช้จ่ายอื่น</option>
          </select>
        </div>
      </div>

      {/* Ledger lists tables */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left">
            <thead className="bg-stone-50 text-stone-500 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">วันที่ทำรายการ</th>
                <th className="py-3 px-4">ประเภทธุรกรรม</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">คำอธิบายรายการ</th>
                <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                <th className="py-3 px-4">หมายเหตุย่อย</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4 font-mono">{e.date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      e.type === 'income' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                        : 'bg-red-50 text-red-700 border border-red-150'
                    }`}>
                      {e.type === 'income' ? <PlusCircle className="h-3 w-3 shrink-0" /> : <MinusCircle className="h-3 w-3 shrink-0" />}
                      {e.type === 'income' ? 'รายรับ (+)' : 'รายจ่าย (-)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">{e.category}</td>
                  <td className="py-3 px-4 max-w-xs truncate" title={e.description}>{e.description}</td>
                  <td className={`py-3 px-4 text-right font-black text-sm ${e.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()} ฿
                  </td>
                  <td className="py-3 px-4 text-stone-500 italic truncate max-w-[120px]" title={e.note || ''}>
                    {e.note || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {currentUser.role === 'admin' ? (
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                        title="ลบรายการธุรกรรม"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-stone-400">
                    ไม่พบบันทึกธุรกรรมการเงินที่ตรงตามเงื่อนไขของคุณ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-black text-stone-900 mb-4 border-b border-stone-100 pb-2 flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-emerald-600" />
              บันทึกธุรกรรมบัญชีใหม่
            </h2>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">วันที่ธุรกรรม *</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">ประเภทบัญชี *</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-955 focus:outline-none"
                  >
                    <option value="expense">รายจ่าย (-)</option>
                    <option value="income">รายรับ (+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">หมวดหมู่ธุรกรรม *</label>
                  <select
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  >
                    {entryType === 'income' 
                      ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    }
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">จำนวนเงิน (บาท) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(Math.max(1, Number(e.target.value)))}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">คำอธิบายธุรกรรม *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าไฟประจำเดือนกรกฎาคม, จ่ายซื้อข้าวสารเพิ่ม"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="รายละเอียดปลีกย่อย..."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-955 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
                >
                  บันทึกธุรกรรมบัญชี
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
