import React, { useState, useEffect } from 'react';
import { Product, Customer, Transaction, TransactionItem, User } from '../types';
import { dbService } from '../utils/db';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Coins, 
  Users, 
  Plus, 
  Minus, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Percent,
  Wheat,
  Scale,
  X
} from 'lucide-react';

interface POSProps {
  currentUser: User;
}

export default function POS({ currentUser }: POSProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  
  // Cart state
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  
  // Checkout & Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'transfer' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Receipt popup state
  const [lastSavedInvoice, setLastSavedInvoice] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Rice selection modal state for choosing unit and tier
  const [showRiceModal, setShowRiceModal] = useState(false);
  const [selectedRiceProduct, setSelectedRiceProduct] = useState<Product | null>(null);
  const [selectedRiceUnit, setSelectedRiceUnit] = useState<'กิโล' | 'ถัง' | 'กระสอบ'>('กิโล');
  const [selectedRiceTier, setSelectedRiceTier] = useState<'retail' | 'shop' | 'wholesale'>('shop');
  const [selectedRiceQty, setSelectedRiceQty] = useState<number>(1);

  // PromptPay configuration states with localStorage persistence
  const [promptPayId, setPromptPayId] = useState<string>(() => localStorage.getItem('promptpay_id') || '0812345678');
  const [promptPayName, setPromptPayName] = useState<string>(() => localStorage.getItem('promptpay_name') || 'ทรัพย์วราค้าข้าว');
  const [isEditingPromptPay, setIsEditingPromptPay] = useState<boolean>(false);
  const [tempPromptPayId, setTempPromptPayId] = useState<string>('');
  const [tempPromptPayName, setTempPromptPayName] = useState<string>('');

  const handleSavePromptPay = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = tempPromptPayId.trim();
    const nameSanitized = tempPromptPayName.trim();
    if (!sanitized) {
      setErrorMessage('กรุณากรอกเบอร์พร้อมเพย์ หรือเลขประจำตัวผู้เสียภาษี');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    setPromptPayId(sanitized);
    setPromptPayName(nameSanitized || 'ทรัพย์วราค้าข้าว');
    localStorage.setItem('promptpay_id', sanitized);
    localStorage.setItem('promptpay_name', nameSanitized || 'ทรัพย์วราค้าข้าว');
    setIsEditingPromptPay(false);
  };

  const startEditingPromptPay = () => {
    setTempPromptPayId(promptPayId);
    setTempPromptPayName(promptPayName);
    setIsEditingPromptPay(true);
  };

  useEffect(() => {
    async function loadData() {
      const prods = await dbService.getProducts();
      const custs = await dbService.getCustomers();
      setProducts(prods);
      setCustomers(custs);
    }
    loadData();
  }, []);

  const categories = ['ทั้งหมด', 'ข้าวสาร', 'อาหารแห้ง'];

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get product price dynamically depending on selected unit and pricing tier
  const getProductPriceByUnitAndTier = (product: Product, unit: string, tier: string): number => {
    if (!product.is_rice) return product.selling_price;
    
    const kgPerBag = product.kg_per_bag || 45;
    
    if (unit === 'กิโล') {
      const fallbackShopKg = Math.round(product.selling_price / kgPerBag) || 30;
      const shopPrice = product.price_shop_kg || fallbackShopKg;
      if (tier === 'retail') return product.price_retail_kg || Math.round(shopPrice * 1.15);
      if (tier === 'wholesale') return product.price_wholesale_kg || Math.round(shopPrice * 0.95);
      return shopPrice;
    }
    
    if (unit === 'ถัง') {
      const fallbackShopThang = Math.round((product.selling_price / kgPerBag) * 15) || 450;
      const shopPrice = product.price_shop_thang || fallbackShopThang;
      if (tier === 'retail') return product.price_retail_thang || Math.round(shopPrice * 1.1);
      if (tier === 'wholesale') return product.price_wholesale_thang || Math.round(shopPrice * 0.95);
      return shopPrice;
    }
    
    // กระสอบ
    const shopPrice = product.price_shop_bag || product.selling_price || 1300;
    if (tier === 'retail') return product.price_retail_bag || Math.round(shopPrice * 1.05);
    if (tier === 'wholesale') return product.price_wholesale_bag || Math.round(shopPrice * 0.95);
    return shopPrice;
  };

  // Calculate loose rice price and remaining details
  const getRiceDetails = (product: Product) => {
    if (!product.is_rice || !product.kg_per_bag) return null;
    const bags = Math.floor(product.stock_qty / product.kg_per_bag);
    const loose = product.stock_qty % product.kg_per_bag;
    const thangs = Math.floor(product.stock_qty / 15);
    
    // Default storefront prices as a guide
    const pricePerKg = product.price_shop_kg || Math.round(product.selling_price / (product.kg_per_bag || 45)) || 30;
    const costPerKg = Math.round(product.cost_price / (product.kg_per_bag || 45));
    
    return { bags, loose, thangs, pricePerKg, costPerKg };
  };

  // Add Item to Cart
  const addToCart = (product: Product, preferredUnit?: string, preferredTier?: string, preferredQty?: number) => {
    const isRice = product.is_rice;
    const unit = preferredUnit || product.unit; // Default unit (e.g. 'กระสอบ' or 'ขวด')
    const tier = preferredTier || 'shop'; // Default to shop/storefront
    const addQty = preferredQty !== undefined ? preferredQty : 1;

    let price = product.selling_price;
    let cost = product.cost_price;
    
    if (isRice) {
      price = getProductPriceByUnitAndTier(product, unit, tier);
      const kg_per_bag = product.kg_per_bag || 45;
      if (unit === 'กิโล') {
        cost = Math.round(product.cost_price / kg_per_bag);
      } else if (unit === 'ถัง') {
        cost = Math.round((product.cost_price / kg_per_bag) * 15);
      } else {
        cost = product.cost_price;
      }
    }

    // Check stock limit before adding
    let maxAvailable = product.stock_qty; // in kg for rice, items for others
    if (isRice) {
      if (unit === 'กระสอบ') {
        maxAvailable = Math.floor(product.stock_qty / (product.kg_per_bag || 45));
      } else if (unit === 'ถัง') {
        maxAvailable = Math.floor(product.stock_qty / 15);
      }
    }

    const displayNameOfUnit = isRice 
      ? `${unit} (${tier === 'retail' ? 'ปลีก' : tier === 'wholesale' ? 'ส่ง' : 'หน้าร้าน'})` 
      : unit;

    const existingCartItemIndex = cart.findIndex(
      item => item.product_id === product.id && item.unit === displayNameOfUnit
    );

    if (existingCartItemIndex > -1) {
      const existingItem = cart[existingCartItemIndex];
      if (existingItem.qty + addQty > maxAvailable) {
        setErrorMessage(`สินค้ามีไม่เพียงพอในสต็อก (มีเหลือ ${maxAvailable} ${unit})`);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingCartItemIndex].qty += addQty;
      updatedCart[existingCartItemIndex].total_price = updatedCart[existingCartItemIndex].qty * price;
      setCart(updatedCart);
    } else {
      if (maxAvailable < addQty) {
        setErrorMessage(`สินค้ามีไม่เพียงพอในสต็อก (มีเหลือ ${maxAvailable} ${unit})`);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      const newItem: TransactionItem = {
        product_id: product.id,
        product_name: product.name,
        unit: displayNameOfUnit,
        qty: addQty,
        price: price,
        cost: cost,
        total_price: price * addQty,
        total_weight_kg: isRice ? (unit === 'กระสอบ' ? (product.kg_per_bag || 45) : unit === 'ถัง' ? 15 : 1) : undefined
      };
      setCart([...cart, newItem]);
    }
  };

  // Update Cart Quantity
  const updateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      const updatedCart = cart.filter((_, i) => i !== index);
      setCart(updatedCart);
      return;
    }

    const item = cart[index];
    const product = products.find(p => p.id === item.product_id);
    if (!product) return;

    let maxAvailable = product.stock_qty;
    if (product.is_rice) {
      if (item.unit.includes('กระสอบ')) {
        maxAvailable = Math.floor(product.stock_qty / (product.kg_per_bag || 45));
      } else if (item.unit.includes('ถัง')) {
        maxAvailable = Math.floor(product.stock_qty / 15);
      }
    }

    if (newQty > maxAvailable) {
      setErrorMessage(`ไม่สามารถปรับจำนวนได้: สินค้าคงเหลือเพียง ${maxAvailable} ${item.unit}`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].qty = newQty;
    updatedCart[index].total_price = newQty * item.price;
    setCart(updatedCart);
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setCashReceived('');
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const total = Math.max(0, subtotal - discount);
  const changeValue = cashReceived && Number(cashReceived) >= total 
    ? Number(cashReceived) - total 
    : 0;

  // Handle Checkout Action
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage('กรุณาเลือกสินค้าลงตะกร้าก่อนคิดเงิน');
      return;
    }

    if (paymentMethod === 'cash') {
      if (!cashReceived || Number(cashReceived) < total) {
        setErrorMessage('กรุณากรอกเงินสดที่ได้รับให้ครบถ้วน');
        return;
      }
    }

    try {
      const timestamp = new Date();
      // Generate standard Bill Ref format: INV-YYYYMMDD-XXXX
      const dateCode = timestamp.toISOString().substring(0, 10).replace(/-/g, '');
      const billNo = `INV-${dateCode}-${Math.floor(1000 + Math.random() * 9000)}`;

      const transaction: Transaction = {
        id: `TX-${Date.now()}`,
        bill_no: billNo,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name || 'ลูกค้าทั่วไป',
        items: cart,
        subtotal: subtotal,
        discount: discount,
        total: total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? Number(cashReceived) : undefined,
        change: paymentMethod === 'cash' ? changeValue : undefined,
        created_by: currentUser.role,
        created_at: timestamp.toISOString()
      };

      const savedTx = await dbService.saveTransaction(transaction);
      
      // Reload products to reflect stock updates
      const updatedProds = await dbService.getProducts();
      setProducts(updatedProds);
      
      setLastSavedInvoice(savedTx);
      setShowReceiptModal(true);
      setSuccessMessage('บันทึกยอดขายและหักสต็อกเรียบร้อยแล้ว!');
      clearCart();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกยอดขาย');
    }
  };

  const handlePrintInvoice = () => {
    const printArea = document.getElementById('printable-invoice');
    if (!printArea) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `
      <html>
        <head>
          <title>ทรัพย์วราค้าข้าว - ใบเสร็จรับเงิน</title>
          <style>
            body { font-family: 'Sarabun', 'Inter', sans-serif; padding: 25px; line-height: 1.4; color: #000; background: #fff; }
            .receipt-container { max-width: 400px; margin: 0 auto; border: 1px dashed #ccc; padding: 15px; }
            .header { text-align: center; margin-bottom: 15px; }
            .title { font-size: 18px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 11px; color: #555; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .item-table th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; }
            .item-table td { padding: 4px 0; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; font-size: 13px; }
            .footer { text-align: center; font-size: 11px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${printArea.innerHTML}
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] lg:h-screen max-w-7xl mx-auto gap-4 p-2 sm:p-4 text-brand-text font-sans">
      
      {/* Product Selection Catalog Block */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-brand-border rounded-2xl p-4 h-full">
        
        {/* Search, Categories Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-brand-border pb-4 shrink-0">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหารหัส หรือชื่อสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 block w-full rounded-xl border border-brand-border py-2 px-3 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green text-brand-text text-xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand-green text-white'
                    : 'bg-brand-light text-stone-600 hover:bg-brand-light/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {errorMessages(errorMessage, successMessage)}

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const details = getRiceDetails(product);
              const isOutOfStock = product.stock_qty <= 0;
              const isLowStock = product.stock_qty <= product.min_qty;

              return (
                <div 
                  key={product.id}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all relative ${
                    isOutOfStock 
                      ? 'bg-stone-50 border-brand-border opacity-60' 
                      : 'bg-white border-brand-border hover:border-brand-green/50'
                  }`}
                >
                  {/* Category tag */}
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-stone-400 border border-brand-border px-1.5 py-0.5 rounded-full uppercase bg-brand-light/30">
                    {product.category}
                  </span>

                  <div>
                    {/* Visual Asset Thumbnail */}
                    <div className="h-16 w-full rounded-lg bg-brand-light/20 border border-brand-border flex items-center justify-center mb-2.5">
                      {product.is_rice ? (
                        <Wheat className="h-8 w-8 text-brand-brown" />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-brand-green/30" />
                      )}
                    </div>

                    <div className="text-[10px] text-stone-400 font-bold mb-0.5">{product.id}</div>
                    <h4 className="text-xs font-semibold text-brand-text line-clamp-2 leading-tight min-h-[32px]">
                      {product.name}
                    </h4>

                    {/* Stock quantities summary */}
                    <div className="mt-2 text-[10px]">
                      {product.is_rice && details ? (
                        <div className="grid grid-cols-3 gap-1 bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                          <div className="text-center">
                            <span className="text-stone-400 block text-[8px] font-bold uppercase">กระสอบ</span>
                            <span className="font-bold text-stone-800">{details.bags}</span>
                          </div>
                          <div className="text-center border-x border-stone-200">
                            <span className="text-stone-400 block text-[8px] font-bold uppercase">ถัง (15kg)</span>
                            <span className="font-bold text-stone-800">{details.thangs}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-stone-400 block text-[8px] font-bold uppercase">กิโลย่อย</span>
                            <span className="font-bold text-emerald-700">{details.loose} กก.</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-500 block">
                          คงเหลือ: <span className={`font-bold ${isOutOfStock ? 'text-brand-brown' : 'text-brand-text'}`}>
                            {product.stock_qty} {product.unit}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add action triggers */}
                  <div className="mt-3.5 pt-2 border-t border-brand-border">
                    {product.is_rice && details ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedRiceProduct(product);
                            setSelectedRiceUnit('กิโล');
                            setSelectedRiceTier('shop');
                            setSelectedRiceQty(1);
                            setShowRiceModal(true);
                          }}
                          className="w-full col-span-2 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all border border-emerald-200"
                        >
                          <Wheat className="h-3.5 w-3.5" />
                          <span>เลือกหน่วย & ตารางราคา</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className="w-full py-1.5 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:bg-stone-200 disabled:text-stone-400"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{product.selling_price} ฿</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shopping Cart & Invoice Checkout Block */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-brand-border rounded-2xl p-4 h-full shrink-0">
        <div className="flex items-center gap-2 border-b border-brand-border pb-3 shrink-0">
          <ShoppingCart className="h-5 w-5 text-brand-green" />
          <h2 className="font-bold text-sm text-brand-text">ตะกร้าสินค้า ({cart.length})</h2>
          {cart.length > 0 && (
            <button 
              onClick={clearCart}
              className="ml-auto text-[10px] text-brand-brown hover:text-brand-brown/80 font-bold hover:underline cursor-pointer"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        {/* Cart Item list */}
        <div className="flex-1 overflow-y-auto py-2 divide-y divide-brand-border">
          {cart.map((item, index) => (
            <div key={`${item.product_id}-${item.unit}`} className="py-2.5 flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-brand-text leading-tight truncate">{item.product_name}</h5>
                <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
                  ราคาต่อหน่วย: {item.price} ฿ / {item.unit}
                </span>
              </div>
              
              {/* Stepper controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateCartQty(index, item.qty - 1)}
                  className="p-0.5 border border-brand-border rounded-md hover:bg-brand-light text-stone-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-bold w-6 text-center text-brand-text">{item.qty}</span>
                <button
                  onClick={() => updateCartQty(index, item.qty + 1)}
                  className="p-0.5 border border-brand-border rounded-md hover:bg-brand-light text-stone-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <div className="text-right shrink-0 w-16">
                <span className="text-xs font-bold block text-brand-text">{item.total_price.toLocaleString()} ฿</span>
                <button 
                  onClick={() => updateCartQty(index, 0)}
                  className="text-stone-400 hover:text-brand-brown p-0.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <ShoppingCart className="h-10 w-10 text-brand-light mb-2" />
              <p className="text-xs">ไม่มีสินค้าในตะกร้า</p>
              <p className="text-[10px] mt-1 text-stone-400 text-center px-6">คลิกปุ่มราคาสินค้าทางซ้ายเพื่อเพิ่มลงตะกร้า</p>
            </div>
          )}
        </div>

        {/* POS Details and Checkout Controls */}
        <form onSubmit={handleCheckout} className="border-t border-brand-border pt-3 space-y-3 shrink-0">
          
          {/* Customer Selection dropdown */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              เลือกลูกค้า (ประวัติและการสะสมแต้ม)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(customer || null);
                }}
                className="block w-full rounded-xl border border-brand-border py-1.5 px-2.5 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
              >
                <option value="">-- ลูกค้าทั่วไป (General Cashier) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Discount input */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex justify-between">
              <span>ส่วนลดพิเศษ (฿)</span>
              {discount > 0 && <span className="text-brand-green font-bold">หักออก {discount} ฿</span>}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Percent className="h-3.5 w-3.5" />
              </span>
              <input
                type="number"
                min="0"
                max={subtotal}
                placeholder="จำนวนส่วนลดเงินสด..."
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                className="pl-9 block w-full rounded-xl border border-brand-border py-1.5 px-2.5 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              ช่องทางการชำระเงิน
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'เงินสด', icon: Coins },
                { id: 'qr', label: 'QR Code', icon: QrCode },
                { id: 'transfer', label: 'โอนเงิน', icon: CreditCard },
                { id: 'card', label: 'บัตรเครดิต', icon: CreditCard }
              ].map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.id as any);
                      if (pm.id !== 'cash') setCashReceived('');
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 border rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
                      paymentMethod === pm.id
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-brand-light/30 text-stone-600 border-brand-border hover:bg-brand-light/60'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1 shrink-0" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash received calculator for Cash payment */}
          {paymentMethod === 'cash' && (
            <div className="bg-brand-light/30 border border-brand-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600">รับเงินมา (฿):</span>
                <input
                  type="number"
                  required
                  min={total}
                  placeholder="จำนวนเงิน..."
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="block w-28 text-right rounded-lg border border-brand-border py-1 px-2 text-xs font-bold text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
              </div>
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="text-stone-700">เงินทอน:</span>
                <span className="text-brand-green text-sm">{changeValue.toLocaleString()} ฿</span>
              </div>
            </div>
          )}

          {/* Payment method summary labels with dynamic QR Code */}
          {paymentMethod === 'qr' && (
            <div className="bg-emerald-50/50 border border-brand-green/20 text-brand-green rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
              {isEditingPromptPay ? (
                <div className="w-full text-left space-y-2.5 text-stone-700">
                  <span className="text-xs font-bold text-brand-green block">ตั้งค่าข้อมูลผู้รับเงิน (PromptPay)</span>
                  <div>
                    <label className="text-[9px] font-bold text-stone-500 block mb-0.5">เบอร์โทรศัพท์ / เลขประจำตัวผู้เสียภาษี *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 0812345678"
                      value={tempPromptPayId}
                      onChange={(e) => setTempPromptPayId(e.target.value)}
                      className="block w-full rounded-lg border border-brand-border bg-white py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-500 block mb-0.5">ชื่อบัญชีผู้รับเงิน</label>
                    <input
                      type="text"
                      placeholder="เช่น ร้านทรัพย์วราค้าข้าว"
                      value={tempPromptPayName}
                      onChange={(e) => setTempPromptPayName(e.target.value)}
                      className="block w-full rounded-lg border border-brand-border bg-white py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={handleSavePromptPay}
                      className="flex-1 py-1 bg-brand-green text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-brand-green-hover"
                    >
                      บันทึกข้อมูล
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPromptPay(false)}
                      className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-stone-300"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-emerald-800">ระบบสร้าง QR Code พร้อมเพย์</span>
                    <button
                      type="button"
                      onClick={startEditingPromptPay}
                      className="text-[9px] text-brand-green hover:underline font-bold cursor-pointer"
                    >
                      [ตั้งค่าบัญชี]
                    </button>
                  </div>
                  
                  {/* Real Dynamic QR Code Image */}
                  <div className="relative bg-white p-2 rounded-xl border border-brand-green/20 shadow-sm w-36 h-36 flex items-center justify-center">
                    <img 
                      src={`https://promptpay.io/${promptPayId.replace(/[^0-9]/g, '')}/${total}.png`}
                      alt="PromptPay QR Code"
                      className="w-32 h-32 mx-auto object-contain"
                      onError={(e) => {
                        // fallback if promptpay.io is down
                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${promptPayId}`;
                      }}
                    />
                  </div>

                  <div className="text-[10px] text-emerald-950 font-semibold space-y-0.5">
                    <p className="font-bold text-xs text-brand-green">ยอดสแกนจ่าย: {total.toLocaleString()} ฿</p>
                    <p className="truncate">บัญชี: {promptPayName}</p>
                    <p className="font-mono text-stone-500">เบอร์: {promptPayId}</p>
                  </div>
                  
                  <p className="text-[9px] text-stone-400">สแกนด้วยแอปพลิเคชันธนาคารเพื่อโอนเงินทันที</p>
                </>
              )}
            </div>
          )}

          {/* Checkout Totals */}
          <div className="space-y-1.5 pt-1.5">
            <div className="flex justify-between text-xs text-stone-600">
              <span>ยอดรวมสินค้า:</span>
              <span>{subtotal.toLocaleString()} ฿</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-brand-brown">
                <span>ส่วนลด:</span>
                <span>-{discount.toLocaleString()} ฿</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-brand-text border-t border-brand-border pt-2">
              <span>ยอดรวมสุทธิ:</span>
              <span className="text-brand-green">{total.toLocaleString()} ฿</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={cart.length === 0}
            className="w-full py-3 bg-brand-green hover:bg-brand-green-hover disabled:bg-stone-200 text-white disabled:text-stone-400 font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all"
          >
            พิมพ์และบันทึกรายการขาย (฿{total.toLocaleString()})
          </button>
        </form>
      </div>

      {/* Rice Option Selection Modal */}
      {showRiceModal && selectedRiceProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRiceModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Wheat className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-stone-900">
                เลือกหน่วยขายและตารางราคา
              </h3>
            </div>

            <div className="mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <p className="text-xs font-bold text-stone-800">{selectedRiceProduct.name}</p>
              <p className="text-[10px] text-stone-500 mt-1">รหัสสินค้า: {selectedRiceProduct.id}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-stone-200 text-[11px]">
                <div>
                  <span className="text-stone-400 block text-[9px]">กระสอบพร้อมขาย</span>
                  <span className="font-bold text-stone-700">
                    {Math.floor(selectedRiceProduct.stock_qty / (selectedRiceProduct.kg_per_bag || 45))} กระสอบ
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9px]">ถังพร้อมขาย (15kg)</span>
                  <span className="font-bold text-stone-700">
                    {Math.floor(selectedRiceProduct.stock_qty / 15)} ถัง
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9px]">กก. คงเหลือรวม</span>
                  <span className="font-bold text-emerald-700">
                    {selectedRiceProduct.stock_qty.toLocaleString()} กก.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1: Select Unit */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                1. เลือกหน่วยขาย
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['กิโล', 'ถัง', 'กระสอบ'] as const).map((unit) => {
                  const isAvailable = unit === 'กิโล' 
                    ? selectedRiceProduct.stock_qty >= 1
                    : unit === 'ถัง'
                    ? selectedRiceProduct.stock_qty >= 15
                    : selectedRiceProduct.stock_qty >= (selectedRiceProduct.kg_per_bag || 45);

                  return (
                    <button
                      key={unit}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedRiceUnit(unit)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                        selectedRiceUnit === unit
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600/20'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      } ${!isAvailable ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <span>{unit === 'กิโล' ? '1 กิโลกรัม' : unit === 'ถัง' ? '1 ถัง (15 กก.)' : '1 กระสอบ'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Price Tier */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                2. เลือกประเภทราคาขาย
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['shop', 'retail', 'wholesale'] as const).map((tier) => {
                  const price = getProductPriceByUnitAndTier(selectedRiceProduct, selectedRiceUnit, tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedRiceTier(tier)}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                        selectedRiceTier === tier
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-[10px] text-stone-400">
                        {tier === 'shop' ? 'หน้าร้าน' : tier === 'retail' ? 'ราคาปลีก' : 'ราคาส่ง'}
                      </span>
                      <span className="text-sm font-black mt-0.5">{price} ฿</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Choose Quantity & Quick Presets */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                3. เลือกจำนวนสินค้า
              </label>
              
              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {selectedRiceUnit === 'กิโล' && [1, 2, 3, 5, 10, 15, 20, 30].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedRiceQty(q)}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedRiceQty === q
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold ring-2 ring-emerald-600/10'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {q} กก.
                  </button>
                ))}
                {selectedRiceUnit === 'ถัง' && [1, 2, 3, 4, 5, 6, 8, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedRiceQty(q)}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedRiceQty === q
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold ring-2 ring-emerald-600/10'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {q} ถัง
                  </button>
                ))}
                {selectedRiceUnit === 'กระสอบ' && [1, 2, 3, 4, 5, 10, 15, 20].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedRiceQty(q)}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedRiceQty === q
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold ring-2 ring-emerald-600/10'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {q} กระสอบ
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-500 whitespace-nowrap">
                  ระบุจำนวนอื่นๆ:
                </span>
                <input
                  type="number"
                  min="1"
                  value={selectedRiceQty || ''}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setSelectedRiceQty(val);
                  }}
                  className="w-full bg-white border border-stone-300 rounded-lg py-1 px-2.5 text-xs text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="ใส่ตัวเลขจำนวน..."
                />
                <span className="text-[11px] font-bold text-stone-600 whitespace-nowrap min-w-[50px] text-right">
                  {selectedRiceUnit === 'กิโล' ? 'กิโลกรัม' : selectedRiceUnit === 'ถัง' ? 'ถัง' : 'กระสอบ'}
                </span>
              </div>
            </div>

            {/* Result summary and add to cart */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] text-stone-400 block font-bold uppercase">ราคารวม ({selectedRiceQty} {selectedRiceUnit})</span>
                <span className="text-lg font-black text-emerald-800">
                  {(getProductPriceByUnitAndTier(selectedRiceProduct, selectedRiceUnit, selectedRiceTier) * selectedRiceQty).toLocaleString()} ฿
                </span>
                <span className="text-[9px] text-stone-500 block">
                  (หน่วยละ {getProductPriceByUnitAndTier(selectedRiceProduct, selectedRiceUnit, selectedRiceTier)} ฿)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  addToCart(selectedRiceProduct, selectedRiceUnit, selectedRiceTier, selectedRiceQty);
                  setShowRiceModal(false);
                }}
                className="py-2.5 px-6 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มลงตะกร้า</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal (ใบเสร็จรับเงิน) */}
      {showReceiptModal && lastSavedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <h3 className="text-center font-bold text-brand-green text-sm mb-4">
              พิมพ์ใบเสร็จรับเงิน
            </h3>
            
            {/* Printable Frame Area */}
            <div 
              id="printable-invoice" 
              className="bg-brand-light/20 border border-brand-border p-4 rounded-xl font-mono text-[11px] leading-relaxed text-brand-text"
            >
              <div className="text-center space-y-1">
                <Wheat className="h-6 w-6 text-brand-green mx-auto" />
                <h4 className="text-xs font-bold text-brand-text">ทรัพย์วราค้าข้าว</h4>
                <p className="text-[9px] text-stone-500">88/8 ม.4 ถ.บรมราชชนนี กรุงเทพฯ</p>
                <p className="text-[9px] text-stone-500">โทร: 081-234-5678</p>
              </div>

              <div className="border-t border-brand-border border-dashed my-2.5"></div>

              <div className="space-y-0.5">
                <p>เลขที่บิล: {lastSavedInvoice.bill_no}</p>
                <p>วันที่: {new Date(lastSavedInvoice.created_at).toLocaleString('th-TH')}</p>
                <p>พนักงาน: {lastSavedInvoice.created_by === 'admin' ? 'แอดมิน' : 'พนักงานขาย'}</p>
                <p>ลูกค้า: {lastSavedInvoice.customer_name}</p>
              </div>

              <div className="border-t border-brand-border border-dashed my-2.5"></div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-border font-bold">
                    <th className="pb-1">รายการ</th>
                    <th className="pb-1 text-center">จำนวน</th>
                    <th className="pb-1 text-right">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {lastSavedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">
                        {item.product_name}
                        <span className="block text-[9px] text-stone-500">({item.price}฿/{item.unit})</span>
                      </td>
                      <td className="py-1 text-center font-bold">{item.qty} {item.unit}</td>
                      <td className="py-1 text-right font-bold">{item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-brand-border border-dashed my-2.5"></div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>รวมเป็นเงิน:</span>
                  <span>{lastSavedInvoice.subtotal.toLocaleString()} ฿</span>
                </div>
                {lastSavedInvoice.discount > 0 && (
                  <div className="flex justify-between text-brand-brown">
                    <span>ส่วนลดพิเศษ:</span>
                    <span>-{lastSavedInvoice.discount.toLocaleString()} ฿</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs text-brand-text">
                  <span>ยอดสุทธิ:</span>
                  <span>{lastSavedInvoice.total.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between">
                  <span>ช่องทางจ่าย:</span>
                  <span>{
                    lastSavedInvoice.payment_method === 'cash' ? 'เงินสด' :
                    lastSavedInvoice.payment_method === 'qr' ? 'QR Code' :
                    lastSavedInvoice.payment_method === 'transfer' ? 'โอนเงิน' : 'บัตรเครดิต'
                  }</span>
                </div>
                {lastSavedInvoice.cash_received && (
                  <>
                    <div className="flex justify-between">
                      <span>รับเงินสดมา:</span>
                      <span>{lastSavedInvoice.cash_received.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between text-brand-green font-bold">
                      <span>เงินทอน:</span>
                      <span>{lastSavedInvoice.change?.toLocaleString()} ฿</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-brand-border border-dashed my-2.5"></div>
              
              {/* Printable QR Code on Receipt */}
              {lastSavedInvoice.payment_method === 'qr' && (
                <div className="text-center my-3 space-y-1">
                  <div className="bg-white p-1.5 inline-block rounded border border-brand-border">
                    <img 
                      src={`https://promptpay.io/${promptPayId.replace(/[^0-9]/g, '')}/${lastSavedInvoice.total}.png`}
                      alt="PromptPay QR Code"
                      className="w-28 h-28 mx-auto"
                    />
                  </div>
                  <p className="text-[9px] text-stone-600 font-bold">สแกนจ่าย {lastSavedInvoice.total.toLocaleString()} ฿</p>
                  <p className="text-[8px] text-stone-400">บัญชี: {promptPayName} ({promptPayId})</p>
                  <div className="border-t border-brand-border border-dashed my-2"></div>
                </div>
              )}

              <p className="text-center text-[9px] text-stone-500">ขอบคุณที่อุดหนุน ทรัพย์วราค้าข้าว!</p>
            </div>

            {/* Print trigger actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handlePrintInvoice}
                className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline rendering helper for notifications
function errorMessages(err: string, success: string) {
  if (err) {
    return (
      <div className="bg-orange-50/50 border-l-4 border-brand-brown text-brand-brown p-2.5 rounded-xl text-xs flex items-center gap-2 mt-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-brand-brown" />
        <span>{err}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div className="bg-brand-light/50 border-l-4 border-brand-green text-brand-green p-2.5 rounded-xl text-xs flex items-center gap-2 mt-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
        <span>{success}</span>
      </div>
    );
  }
  return null;
}
