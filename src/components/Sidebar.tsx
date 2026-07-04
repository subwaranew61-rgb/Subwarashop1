import { User } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackagePlus, 
  Package, 
  Users, 
  Coins, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Wheat,
  UserCircle2
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentUser, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'pos', label: 'ขายสินค้า (POS)', icon: ShoppingCart },
    { id: 'stockin', label: 'รับสินค้าเข้าสต็อก', icon: PackagePlus },
    { id: 'products', label: 'จัดการคลังสินค้า', icon: Package },
    { id: 'customers', label: 'ข้อมูลลูกค้า', icon: Users },
    { id: 'accounting', label: 'บัญชีรายรับ-จ่าย', icon: Coins },
    { id: 'reports', label: 'รายงานยอดขาย', icon: BarChart3 },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-brand-green text-white py-4 px-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <Wheat className="h-6 w-6 text-brand-yellow" />
          <span className="font-bold tracking-tight text-lg">ทรัพย์วราค้าข้าว</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-brand-green-hover rounded-md focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-stone-950/40 z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-brand-green text-white border-r border-brand-border/10 transition-transform duration-300 ease-in-out transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen lg:z-auto shrink-0
      `}>
        {/* Sidebar Brand Header */}
        <div className="flex items-center gap-3 py-6 px-6 border-b border-white/10">
          <div className="w-10 h-10 bg-brand-yellow rounded-lg flex items-center justify-center text-brand-green font-bold text-xl">
            SW
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">ทรัพย์วราค้าข้าว</h1>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">Wholesale Rice</p>
          </div>
        </div>

        {/* Current User Card */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <UserCircle2 className="h-9 w-9 text-brand-yellow shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-white/50">
                {currentUser.role === 'admin' ? 'ผู้จัดการ (Admin)' : 'พนักงาน (Employee)'}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  flex items-center gap-3 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-yellow' : 'text-white/60'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Action Button */}
        <div className="p-4 mt-auto border-t border-white/10">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-white/60" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
