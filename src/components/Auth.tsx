import React, { useState } from 'react';
import { User } from '../types';
import { dbService } from '../utils/db';
import { Wheat, ShieldAlert, KeyRound, UserRound, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulated authentications for standard mock accounts
    if (username === 'admin' && password === '123456') {
      const users = await dbService.getUsers();
      onLogin(users[0]);
    } else if (username === 'employee' && password === '123456') {
      const users = await dbService.getUsers();
      onLogin(users[1]);
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (กรุณาใช้ admin/123456 หรือ employee/123456)');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = async (role: 'admin' | 'employee') => {
    setIsLoading(true);
    const users = await dbService.getUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      onLogin(user);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-brand-green rounded-full flex items-center justify-center text-white">
            <Wheat className="h-9 w-9 text-brand-yellow" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-brand-text">
          ทรัพย์วราค้าข้าว
        </h2>
        <p className="mt-2 text-center text-xs text-stone-600">
          ระบบบริหารจัดการร้านค้าส่งข้าวสารและอาหารแห้ง
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-brand-border rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-orange-50 border-l-4 border-brand-brown p-3 rounded flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 text-brand-brown shrink-0 mt-0.5" />
                <span className="text-xs text-brand-brown">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-medium text-stone-700">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <UserRound className="h-5 w-5" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-brand-border py-2.5 px-3 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green text-brand-text text-sm"
                  placeholder="admin หรือ employee"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-stone-700">
                รหัสผ่าน (Password)
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-brand-border py-2.5 px-3 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green text-brand-text text-sm"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>
          </form>

          {/* Quick Login Section */}
          <div className="mt-8 border-t border-brand-border pt-6">
            <span className="block text-center text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-4">
              ทดสอบระบบด้วยบัญชีแนะนำ (Quick Login)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-between p-3 border border-brand-border bg-brand-light/30 hover:bg-brand-light/70 rounded-xl text-left cursor-pointer transition-all duration-200 group"
              >
                <div>
                  <span className="block text-xs font-bold text-brand-green">บัญชีผู้จัดการ</span>
                  <span className="block text-[10px] text-stone-500">Admin (เต็มระบบ)</span>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-green group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee')}
                className="flex items-center justify-between p-3 border border-brand-border bg-brand-light/30 hover:bg-brand-light/70 rounded-xl text-left cursor-pointer transition-all duration-200 group"
              >
                <div>
                  <span className="block text-xs font-bold text-brand-brown">บัญชีพนักงานขาย</span>
                  <span className="block text-[10px] text-stone-500">Employee (ขาย+สต๊อก)</span>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-brown group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
