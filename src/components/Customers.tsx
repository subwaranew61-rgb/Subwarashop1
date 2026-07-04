import React, { useState, useEffect } from 'react';
import { Customer, Transaction } from '../types';
import { dbService } from '../utils/db';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Star, 
  History, 
  MapPin, 
  Phone,
  ArrowUpRight
} from 'lucide-react';

interface CustomersProps {
  currentUser: { role: string };
}

export default function Customers({ currentUser }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  
  // Feedback alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const custs = await dbService.getCustomers();
    const txs = await dbService.getTransactions();
    setCustomers(custs);
    setTransactions(txs);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter customer list
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  // Customer statistics calculations
  const getCustomerStats = (customerId: string) => {
    const customerTxs = transactions.filter(t => t.customer_id === customerId);
    const count = customerTxs.length;
    const totalSpent = customerTxs.reduce((sum, t) => sum + t.total, 0);
    
    let latestDate = '-';
    if (count > 0) {
      // Sort to find latest
      const sorted = [...customerTxs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      latestDate = new Date(sorted[0].created_at).toLocaleDateString('th-TH', { dateStyle: 'short' }) + ' ' + new Date(sorted[0].created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }

    return { count, totalSpent, latestDate, txs: customerTxs };
  };

  // Add new customer submission
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      setError('กรุณากรอกชื่อและเบอร์โทรศัพท์ของลูกค้า');
      return;
    }

    const newCustomer: Customer = {
      id: `C${String(customers.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim() || 'กรุงเทพฯ',
      created_at: new Date().toISOString()
    };

    try {
      await dbService.saveCustomer(newCustomer);
      setSuccess(`บันทึกข้อมูลลูกค้า "${newCustomer.name}" เรียบร้อยแล้ว`);
      
      // Clear
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      setShowAddModal(false);
      loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้า');
    }
  };

  // Delete customer (Admin Only)
  const handleDeleteCustomer = async (id: string) => {
    if (currentUser.role !== 'admin') {
      setError('คุณไม่มีสิทธิ์ลบลูกค้าจากระบบฐานข้อมูล');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (window.confirm('คุณแน่ใจว่าต้องการลบลูกค้ารายนี้หรือไม่? ประวัติการซื้อทั้งหมดจะถูกยกเลิกการเชื่อมต่อ')) {
      try {
        await dbService.deleteCustomer(id);
        setSuccess('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า');
      }
    }
  };

  const handleOpenHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-800">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" /> ข้อมูลลูกค้าร้านทรัพย์วรา
          </h1>
          <p className="text-stone-500 text-xs">ฐานข้อมูลประวัติสะสมยอดซื้อ สถิติการซื้อซ้ำ และข้อมูลจัดส่งสำหรับลูกค้าขายส่ง</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-600/10 flex items-center gap-1 shrink-0"
        >
          <Plus className="h-4 w-4" /> เพิ่มรายชื่อลูกค้าใหม่
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

      {/* Toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทรศัพท์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 block w-full rounded-xl border border-stone-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-955 text-xs"
          />
        </div>
      </div>

      {/* Grid of Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const stats = getCustomerStats(cust.id);
          const isLoyal = stats.count >= 2;
          const isVVip = stats.totalSpent >= 5000;

          return (
            <div 
              key={cust.id} 
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm">{cust.name}</h3>
                    <span className="text-[10px] text-stone-400 font-bold font-mono block mt-0.5">{cust.id}</span>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {isVVip && (
                      <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500 shrink-0" /> VVIP
                      </span>
                    )}
                    {isLoyal && (
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500 shrink-0" /> ซื้อซ้ำบ่อย
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-stone-600">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    <span>{cust.phone}</span>
                  </p>
                  <p className="flex items-start gap-2 leading-relaxed">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{cust.address}</span>
                  </p>
                </div>

                {/* Performance stats row */}
                <div className="grid grid-cols-3 gap-2 border-t border-stone-100 pt-3.5 mt-4 text-center">
                  <div className="bg-stone-50 p-2 rounded-xl">
                    <span className="text-[8px] font-bold text-stone-400 block uppercase">สั่งซื้อสะสม</span>
                    <span className="text-sm font-black text-stone-800">{stats.count} ครั้ง</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl">
                    <span className="text-[8px] font-bold text-stone-400 block uppercase">ยอดซื้อสะสม</span>
                    <span className="text-sm font-black text-emerald-700">{stats.totalSpent.toLocaleString()} ฿</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl">
                    <span className="text-[8px] font-bold text-stone-400 block uppercase">ซื้อล่าสุดเมื่อ</span>
                    <span className="text-[9px] font-bold text-stone-800 truncate block mt-1">{stats.latestDate.split(' ')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-stone-100 flex gap-2">
                <button
                  onClick={() => handleOpenHistory(cust)}
                  className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <History className="h-3.5 w-3.5" /> ประวัติการซื้อสินค้า
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteCustomer(cust.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"
                    title="ลบลูกค้ารายนี้"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white border border-stone-200 rounded-2xl text-stone-400">
            ไม่พบรายชื่อลูกค้ารายนี้ในระบบ สามารถเพิ่มรายชื่อได้ด้วยปุ่มด้านขวาบน
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-black text-stone-900 mb-4 border-b border-stone-100 pb-2">
              เพิ่มรายชื่อลูกค้าใหม่
            </h2>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">ชื่อ-นามสกุล / ชื่อร้านค้าขายส่ง *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ร้านป้าแดงส้มตำยกครก"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 py-2 px-3 text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                <input
                  type="tel"
                  required
                  placeholder="เช่น 0812345678"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 py-2 px-3 text-xs text-stone-955 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">ที่อยู่สำหรับการจัดส่งข้าวสาร</label>
                <textarea
                  placeholder="กรอกข้อมูลที่อยู่จัดส่งโดยละเอียด..."
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-stone-300 py-2 px-3 text-xs text-stone-950 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
                >
                  บันทึกข้อมูลลูกค้า
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

      {/* Customer Purchase History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col justify-between">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-stone-100 pb-3 shrink-0">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
                <History className="h-5 w-5 text-emerald-600" />
                ประวัติการสั่งซื้อ: {selectedCustomer.name}
              </h2>
              <p className="text-[10px] text-stone-400 font-bold font-mono">เบอร์โทรศัพท์: {selectedCustomer.phone}</p>
            </div>

            {/* List invoices */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {getCustomerStats(selectedCustomer.id).txs.map((tx) => (
                <div key={tx.id} className="border border-stone-200 rounded-xl p-3.5 bg-stone-50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-emerald-800">{tx.bill_no}</span>
                    <span className="text-stone-500">{new Date(tx.created_at).toLocaleString('th-TH')}</span>
                  </div>

                  <div className="divide-y divide-stone-200/60 text-xs">
                    {tx.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span className="text-stone-700 font-bold">{item.product_name}</span>
                        <span className="text-stone-500">{item.qty} {item.unit} x {item.price} ฿</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-stone-200 pt-2 flex justify-between items-center text-xs">
                    <span className="text-stone-500">วิธีจ่าย: <span className="font-bold text-stone-800 uppercase">{tx.payment_method}</span></span>
                    <span className="font-extrabold text-stone-950">ยอดชำระรวม: <span className="text-emerald-700 text-sm font-black">{tx.total.toLocaleString()} ฿</span></span>
                  </div>
                </div>
              ))}

              {getCustomerStats(selectedCustomer.id).txs.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-xs">
                  ยังไม่มีประวัติยอดการทำรายการขายของลูกค้ารายนี้ในระบบ
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-3 shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                ปิดหน้าจอประวัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
