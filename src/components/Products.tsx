import React, { useState, useEffect } from 'react';
import { Product, Unit, User } from '../types';
import { dbService } from '../utils/db';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  X, 
  Grid, 
  List, 
  Wheat, 
  Scale, 
  Tags,
  BadgeAlert
} from 'lucide-react';

interface ProductsProps {
  currentUser: User;
}

export default function Products({ currentUser }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  // Search and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [stockStatusFilter, setStockStatusFilter] = useState('ทั้งหมด');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Custom unit state
  const [newUnitName, setNewUnitName] = useState('');
  
  // Product Form states
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('ข้าวสาร');
  const [prodCost, setProdCost] = useState(0);
  const [prodSell, setProdSell] = useState(0);
  const [prodUnit, setProdUnit] = useState('กระสอบ');
  const [prodStock, setProdStock] = useState(0); // For rice, this represents total KG
  const [prodMinQty, setProdMinQty] = useState(0);
  const [prodIsRice, setProdIsRice] = useState(true);
  const [prodKgPerBag, setProdKgPerBag] = useState(45); // default 45kg per bag
  
  // Notification states
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const prods = await dbService.getProducts();
    const uns = await dbService.getUnits();
    setProducts(prods);
    setUnits(uns);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ทั้งหมด' || p.category === categoryFilter;
    
    let matchesStock = true;
    if (stockStatusFilter === 'ต่ำกว่าเกณฑ์') {
      matchesStock = p.stock_qty <= p.min_qty;
    } else if (stockStatusFilter === 'หมดคลัง') {
      matchesStock = p.stock_qty <= 0;
    } else if (stockStatusFilter === 'มีสินค้าปกติ') {
      matchesStock = p.stock_qty > p.min_qty;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    // Generate an automatic ID if empty
    setProdId(`P${String(products.length + 1).padStart(3, '0')}`);
    setProdName('');
    setProdCategory('ข้าวสาร');
    setProdCost(0);
    setProdSell(0);
    setProdUnit('กระสอบ');
    setProdStock(0);
    setProdMinQty(45);
    setProdIsRice(true);
    setProdKgPerBag(45);
    
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setProdId(product.id);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdCost(product.cost_price);
    setProdSell(product.selling_price);
    setProdUnit(product.unit);
    setProdStock(product.stock_qty);
    setProdMinQty(product.min_qty);
    setProdIsRice(product.is_rice);
    setProdKgPerBag(product.kg_per_bag || 45);
    
    setShowProductModal(true);
  };

  // Submit Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodId || !prodName || prodCost < 0 || prodSell < 0) {
      setError('กรุณากรอกข้อมูลสินค้าให้ถูกต้องและครบถ้วน');
      return;
    }

    const newProduct: Product = {
      id: prodId.trim(),
      name: prodName.trim(),
      category: prodCategory,
      cost_price: Number(prodCost),
      selling_price: Number(prodSell),
      unit: prodIsRice ? 'กระสอบ' : prodUnit, // Rice standard base unit is Bag
      stock_qty: Number(prodStock),
      min_qty: Number(prodMinQty),
      is_rice: prodIsRice,
      kg_per_bag: prodIsRice ? Number(prodKgPerBag) : undefined
    };

    try {
      await dbService.saveProduct(newProduct);
      setSuccess('บันทึกข้อมูลสินค้าเรียบร้อยแล้ว!');
      setShowProductModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('ไม่สามารถบันทึกสินค้าได้');
    }
  };

  // Handle Delete Product (Only Admin allowed)
  const handleDeleteProduct = async (id: string) => {
    if (currentUser.role !== 'admin') {
      setError('คุณไม่มีสิทธิ์ลบข้อมูลสินค้านี้');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (window.confirm('คุณแน่ใจว่าต้องการลบสินค้านี้ใช่หรือไม่? สต็อกและข้อมูลทั้งหมดจะหายไป')) {
      try {
        await dbService.deleteProduct(id);
        setSuccess('ลบสินค้าเรียบร้อยแล้ว!');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการลบสินค้า');
      }
    }
  };

  // Submit Custom Unit creation
  const handleSaveCustomUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    const unitExists = units.some(u => u.name === newUnitName.trim());
    if (unitExists) {
      setError('หน่วยนี้มีอยู่แล้วในระบบ');
      return;
    }

    const newUnit: Unit = {
      id: `un-custom-${Date.now()}`,
      name: newUnitName.trim(),
      is_custom: true
    };

    try {
      await dbService.saveUnit(newUnit);
      setNewUnitName('');
      setShowUnitModal(false);
      loadData();
      setSuccess(`สร้างหน่วยใหม่ "${newUnit.name}" สำเร็จ!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('ไม่สามารถบันทึกหน่วยสินค้าได้');
    }
  };

  // Rice metrics math builder
  const getRiceMetrics = (p: Product) => {
    if (!p.is_rice || !p.kg_per_bag) return null;
    const bags = Math.floor(p.stock_qty / p.kg_per_bag);
    const loose = p.stock_qty % p.kg_per_bag;
    return { bags, loose };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Wheat className="h-6 w-6 text-emerald-600" /> คลังสินค้า ทรัพย์วราค้าข้าว
          </h1>
          <p className="text-stone-500 text-xs">จัดการรายการสินค้า, อัตราส่วนผสมข้าวสาร และหน่วยสินค้าประเภทอาหารแห้ง</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnitModal(true)}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            + สร้างหน่วยสินค้าใหม่
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-600/10 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Notifications banner */}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหารหัส หรือชื่อสินค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 block w-full rounded-xl border border-stone-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-950 text-xs"
          />
        </div>

        {/* Category select */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full rounded-xl border border-stone-300 py-2 px-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ทั้งหมด">หมวดหมู่: ทั้งหมด</option>
            <option value="ข้าวสาร">หมวดหมู่: ข้าวสาร</option>
            <option value="อาหารแห้ง">หมวดหมู่: อาหารแห้ง</option>
          </select>
        </div>

        {/* Stock Status select */}
        <div>
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="block w-full rounded-xl border border-stone-300 py-2 px-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ทั้งหมด">สถานะสต็อก: ทั้งหมด</option>
            <option value="มีสินค้าปกติ">สถานะสต็อก: มีสินค้าปกติ</option>
            <option value="ต่ำกว่าเกณฑ์">สถานะสต็อก: ต่ำกว่าเกณฑ์เตือนภัย</option>
            <option value="หมดคลัง">สถานะสต็อก: หมดคลัง</option>
          </select>
        </div>
      </div>

      {/* Product list table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left">
            <thead className="bg-stone-50 text-stone-500 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">รหัส</th>
                <th className="py-3 px-4">ชื่อสินค้า</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4 text-right">ราคาทุน</th>
                <th className="py-3 px-4 text-right">ราคาขาย</th>
                <th className="py-3 px-4 text-center">หน่วยหลัก</th>
                <th className="py-3 px-4 text-center">ยอดสต็อกรวม</th>
                <th className="py-3 px-4 text-center">สัดส่วนกระสอบข้าว</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock_qty <= p.min_qty;
                const riceMetrics = getRiceMetrics(p);

                return (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-500">{p.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {p.is_rice && <Wheat className="h-4 w-4 text-amber-500 shrink-0" />}
                        <span className="font-bold text-stone-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-stone-600">{p.cost_price.toLocaleString()} ฿</td>
                    <td className="py-3 px-4 text-right font-bold text-stone-900">{p.selling_price.toLocaleString()} ฿</td>
                    <td className="py-3 px-4 text-center font-medium text-stone-600">{p.unit}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`inline-flex items-center gap-1 font-mono font-black ${isLowStock ? 'text-red-500' : 'text-stone-800'}`}>
                        {p.stock_qty.toLocaleString()} {p.is_rice ? 'กก.' : p.unit}
                        {isLowStock && <BadgeAlert className="h-4 w-4 text-red-500 animate-pulse shrink-0" />}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.is_rice && riceMetrics ? (
                        <div className="inline-block text-left text-[10px] bg-emerald-50 text-emerald-950 px-2 py-1 rounded-xl border border-emerald-100">
                          <span className="block font-bold">กระสอบ: {riceMetrics.bags}</span>
                          <span className="block opacity-75">กิโลย่อย: {riceMetrics.loose} กก.</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer transition-colors"
                          title="แก้ไขสินค้า"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-stone-400">
                    ไม่พบลักษณะสินค้าที่ตรงกับคำค้นหาของคุณ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-lg font-black text-stone-900 mb-4 flex items-center gap-1.5 border-b border-stone-100 pb-2">
              <Wheat className="h-5 w-5 text-emerald-600" />
              {selectedProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">รหัสสินค้า / SKU *</label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedProduct} // can't change SKU on edit
                    value={prodId}
                    onChange={(e) => setProdId(e.target.value.toUpperCase())}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">หมวดหมู่สินค้า *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => {
                      setProdCategory(e.target.value);
                      setProdIsRice(e.target.value === 'ข้าวสาร');
                    }}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  >
                    <option value="ข้าวสาร">ข้าวสาร</option>
                    <option value="อาหารแห้ง">อาหารแห้ง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">ชื่อสินค้า *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ข้าวหอมมะลิทรายทอง, ปลากระป๋อง..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                />
              </div>

              {/* Rice settings panel */}
              {prodIsRice ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-emerald-950 block">กำหนดคุณลักษณะข้าวสาร</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-800 block mb-1">กิโลต่อ 1 กระสอบ *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={prodKgPerBag}
                        onChange={(e) => setProdKgPerBag(Math.max(1, Number(e.target.value)))}
                        className="block w-full rounded-lg border border-emerald-300 bg-white py-1 px-2.5 text-xs text-stone-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="text-[9px] text-emerald-700 flex flex-col justify-center leading-normal">
                      <span>• มะลิทั่วไป: 1 กระสอบ = 45 กก.</span>
                      <span>• เหนียวทั่วไป: 1 กระสอบ = 50 กก.</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-emerald-800 leading-tight">
                    * เมื่อกรอกสต็อกสินค้าข้าวสาร ให้ระบุน้ำหนักเป็นกิโลกรัมโดยรวม ตัวอย่างเช่น ข้าวหอมมะลิ 10 กระสอบ (กระสอบละ 45 กก.) สต็อกรวมในระบบคือ <b>450 กิโลกรัม</b>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">หน่วยสินค้าหลัก</label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                    >
                      {units.filter(u => u.name !== 'กระสอบ').map((un) => (
                        <option key={un.id} value={un.name}>{un.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setShowUnitModal(true)}
                      className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-[10px] font-bold"
                    >
                      + เพิ่มหน่วยย่อยอื่น
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">ราคาทุนต่อหน่วยหลัก (฿) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodCost}
                    onChange={(e) => setProdCost(Math.max(0, Number(e.target.value)))}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">ราคาขายต่อหน่วยหลัก (฿) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodSell}
                    onChange={(e) => setProdSell(Math.max(0, Number(e.target.value)))}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    {prodIsRice ? 'จำนวนคงเหลือปัจจุบัน (กก.) *' : 'จำนวนคงเหลือในสต็อก *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Math.max(0, Number(e.target.value)))}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    {prodIsRice ? 'ขั้นต่ำแจ้งเตือน (กก.) *' : 'เกณฑ์สต็อกขั้นต่ำ *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodMinQty}
                    onChange={(e) => setProdMinQty(Math.max(0, Number(e.target.value)))}
                    className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  บันทึกข้อมูลสินค้า
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl relative">
            <button 
              onClick={() => setShowUnitModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-black text-stone-900 text-sm mb-3">สร้างหน่วยสินค้าใหม่</h3>
            <form onSubmit={handleSaveCustomUnit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">ชื่อหน่วยสินค้า (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กล่องใหญ่, แกลลอน, ลัง..."
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 py-1.5 px-3 text-xs text-stone-955 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  เพิ่มหน่วยสินค้า
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer text-center"
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
