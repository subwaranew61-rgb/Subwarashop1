import React, { useState, useEffect } from 'react';
import { Product, StockIn, StockInItem } from '../types';
import { dbService } from '../utils/db';
import { 
  PackagePlus, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  UserSquare, 
  FileText 
} from 'lucide-react';

export default function StockInComponent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  
  // Header form states
  const [company, setCompany] = useState('');
  const [supplier, setSupplier] = useState('');
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState('2026-07-04'); // default current date
  
  // Items array being received
  const [receivedItems, setReceivedItems] = useState<StockInItem[]>([]);
  
  // Single active item selectors
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(0);
  
  // Feedback
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const prods = await dbService.getProducts();
    const stIn = await dbService.getStockIns();
    setProducts(prods);
    setStockIns(stIn);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync selected product's cost price
  useEffect(() => {
    if (selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setItemCost(prod.cost_price);
      }
    }
  }, [selectedProductId, products]);

  // Add sub-item to list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || itemQty <= 0 || itemCost <= 0) {
      setError('กรุณาเลือกสินค้า ระบุจำนวน และต้นทุนที่เหมาะสม');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Check if product already exists in item lists
    const existingIndex = receivedItems.findIndex(item => item.product_id === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...receivedItems];
      updated[existingIndex].qty += Number(itemQty);
      // Average the cost or use the newer cost
      updated[existingIndex].cost_price = Number(itemCost);
      setReceivedItems(updated);
    } else {
      const newItem: StockInItem = {
        product_id: prod.id,
        product_name: prod.name,
        qty: Number(itemQty),
        unit: prod.unit,
        cost_price: Number(itemCost)
      };
      setReceivedItems([...receivedItems, newItem]);
    }

    // Reset selectors
    setSelectedProductId('');
    setItemQty(10);
    setItemCost(0);
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    setReceivedItems(receivedItems.filter((_, i) => i !== index));
  };

  // Submit complete invoice receipt
  const handleSubmitStockIn = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (receivedItems.length === 0) {
      setError('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการเพื่อรับของเข้าคลัง');
      return;
    }
    if (!company.trim() || !supplier.trim() || !billNo.trim()) {
      setError('กรุณากรอกข้อมูลบริษัทคู่ค้า ผู้จัดส่ง และเลขที่บิลให้ครบถ้วน');
      return;
    }

    const totalCost = receivedItems.reduce((sum, item) => sum + (item.cost_price * item.qty), 0);

    const newStockIn: StockIn = {
      id: `STIN-${Date.now()}`,
      date: date,
      company: company.trim(),
      supplier: supplier.trim(),
      bill_no: billNo.trim().toUpperCase(),
      items: receivedItems,
      total_cost: totalCost,
      created_at: new Date().toISOString()
    };

    try {
      await dbService.saveStockIn(newStockIn);
      setSuccess(`บันทึกการรับสินค้าเข้าคลังเลขที่ ${newStockIn.bill_no} สำเร็จ`);
      
      // Clear form
      setCompany('');
      setSupplier('');
      setBillNo('');
      setReceivedItems([]);
      
      // Reload lists
      loadData();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-brand-text">
      
      <div>
        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-brand-green" /> รับสินค้าและเพิ่มคลังสินค้า
        </h1>
        <p className="text-stone-500 text-xs">บันทึกประวัติการส่งมอบสินค้าจากโรงสีหรือซัพพลายเออร์หลัก ระบบจะปรับยอดบัญชีและคลังสินค้าทันทีเมื่อเสร็จสิ้น</p>
      </div>

      {success && (
        <div className="bg-brand-light/50 border-l-4 border-brand-green text-brand-green p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-green" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-orange-50/50 border-l-4 border-brand-brown text-brand-brown p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-brand-brown" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PO Bill Form Panel */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider border-b border-brand-border pb-2">
            1. ข้อมูลบิลและผู้ค้าส่ง
          </h2>

          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">วันที่รับของ *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 block w-full rounded-xl border border-brand-border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green text-brand-text"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">ชื่อบริษัท / โรงสีคู่ค้า *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="เช่น บจก. เจียเม้ง ค้าข้าว"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="pl-9 block w-full rounded-xl border border-brand-border py-2 px-3 text-xs focus:outline-none text-brand-text"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">ชื่อผู้ติดต่อ / พนักงานจัดส่ง *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <UserSquare className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณสมบัติ นำโชค"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="pl-9 block w-full rounded-xl border border-brand-border py-2 px-3 text-xs focus:outline-none text-brand-text"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">เลขที่ใบเสร็จรับเงิน / บิลรับของ *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <FileText className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="เช่น PO-20260704-001"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="pl-9 block w-full rounded-xl border border-brand-border py-2 px-3 text-xs focus:outline-none text-brand-text"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PO Items Builder and Invoice Review */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 lg:col-span-2 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider border-b border-brand-border pb-2">
              2. ระบุรายการสินค้าและบันทึกสต็อก
            </h2>

            {/* Sub form to add item */}
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-brand-light/20 p-3 rounded-xl border border-brand-border">
              <div className="sm:col-span-5">
                <label className="text-[10px] font-bold text-stone-500 block mb-1">เลือกสินค้าที่จะนำเข้า</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="block w-full rounded-xl border border-brand-border py-1.5 px-3 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                >
                  <option value="">-- กรุณาเลือกสินค้า --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-bold text-stone-500 block mb-1">จำนวนหน่วย</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                  className="block w-full rounded-xl border border-brand-border py-1.5 px-3 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-bold text-stone-500 block mb-1">ราคาทุนใหม่ต่อหน่วย (฿)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={itemCost}
                  onChange={(e) => setItemCost(Math.max(1, Number(e.target.value)))}
                  className="block w-full rounded-xl border border-brand-border py-1.5 px-3 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full h-[34px] bg-brand-green hover:bg-brand-green-hover text-white rounded-xl flex items-center justify-center cursor-pointer font-bold"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* List of currently building items */}
            <div className="overflow-x-auto border border-brand-border rounded-xl">
              <table className="min-w-full text-xs text-left divide-y divide-brand-border">
                <thead className="bg-brand-light/30 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">สินค้า</th>
                    <th className="py-2.5 px-3 text-center">จำนวนหน่วยที่รับ</th>
                    <th className="py-2.5 px-3 text-right">ราคาทุนใหม่</th>
                    <th className="py-2.5 px-3 text-right">มูลค่ารวม</th>
                    <th className="py-2.5 px-3 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-stone-700">
                  {receivedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-brand-light/10">
                      <td className="py-2.5 px-3 font-semibold text-brand-text">{item.product_name}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.qty} {item.unit}</td>
                      <td className="py-2.5 px-3 text-right text-stone-600 font-semibold">{item.cost_price.toLocaleString()} ฿</td>
                      <td className="py-2.5 px-3 text-right font-bold text-brand-text">{(item.cost_price * item.qty).toLocaleString()} ฿</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-brand-brown hover:text-brand-brown/80 hover:bg-orange-50/50 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {receivedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-stone-400 text-xs">
                        ยังไม่มีการระบุรายการสินค้าใดๆ ด้านบน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-brand-border pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <span className="text-xs text-stone-500">ยอดรวมต้นทุนค่าสินค้าทั้งสิ้น:</span>
              <h3 className="text-xl font-bold text-brand-green">
                {receivedItems.reduce((sum, item) => sum + (item.cost_price * item.qty), 0).toLocaleString()} ฿
              </h3>
            </div>

            <button
              onClick={handleSubmitStockIn}
              disabled={receivedItems.length === 0}
              className="py-2.5 px-5 bg-brand-green hover:bg-brand-green-hover disabled:bg-stone-200 text-white disabled:text-stone-400 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors"
            >
              บันทึกบิลรับของเข้าคลังและเริ่มหักจ่าย
            </button>
          </div>
        </div>
      </div>

      {/* History of recent stock ins */}
      <div className="bg-white border border-brand-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-4 border-b border-brand-border pb-2">
          ประวัติการบันทึกของเข้าคลังล่าสุด
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border text-left">
            <thead className="bg-brand-light/30 text-stone-500 font-bold text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-4">วันที่บิล</th>
                <th className="py-2.5 px-4">เลขที่บิล</th>
                <th className="py-2.5 px-4">บริษัทคู่ค้า</th>
                <th className="py-2.5 px-4">ผู้จัดส่ง</th>
                <th className="py-2.5 px-4">รายการสินค้าทั้งหมด</th>
                <th className="py-2.5 px-4 text-right">ยอดรวมจัดซื้อ (฿)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs text-stone-700">
              {stockIns.map((st) => (
                <tr key={st.id} className="hover:bg-brand-light/10">
                  <td className="py-3 px-4 font-mono text-stone-600">{st.date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-brand-green">{st.bill_no}</td>
                  <td className="py-3 px-4 font-bold text-brand-text">{st.company}</td>
                  <td className="py-3 px-4 text-stone-600">{st.supplier}</td>
                  <td className="py-3 px-4 text-stone-600">
                    <div className="max-w-[200px] truncate" title={st.items.map(i => `${i.product_name} x ${i.qty}`).join(', ')}>
                      {st.items.map(i => `${i.product_name} (${i.qty} ${i.unit})`).join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-text">{st.total_cost.toLocaleString()} ฿</td>
                </tr>
              ))}
              {stockIns.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">
                    ยังไม่มีข้อมูลประวัติการบันทึกใบรับสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
