'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  KeyRound, 
  CreditCard, 
  Boxes, 
  Users, 
  ShieldAlert, 
  LifeBuoy, 
  Settings,
  LogOut,
  Activity
} from 'lucide-react';

/**
 * @description
 * Navigation Sidebar for the ICE Super Admin Panel.
 * Uses Lucide icons for modern aesthetics.
 * Refactored to include dynamic user session management and a hardened logout routine.
 */
export default function IceSidebar() {
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<{ name: string; role: string }>({ name: 'Loading...', role: '...' });

  useEffect(() => {
    // Fetch super admin details from localStorage or Session
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.fullName) {
        setAdminUser({ name: u.fullName, role: u.role || 'Super Admin' });
      } else {
        setAdminUser({ name: 'System Admin', role: 'Super Admin' });
      }
    } catch {
      setAdminUser({ name: 'System Admin', role: 'Super Admin' });
    }
  }, []);

  const handleLogout = async () => {
    // Hardened secure logout sequence
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  // Navigation schema for dynamic rendering
  const navItems = [
    { name: 'الرئيسية (Dashboard)', href: '/ice', icon: LayoutDashboard },
    { name: 'إدارة الشركات (Tenants)', href: '/ice/tenants', icon: Building2 },
    { name: 'التراخيص والأجهزة (Licenses)', href: '/ice/licenses', icon: KeyRound },
    { name: 'الاشتراكات والمدفوعات', href: '/ice/billing', icon: CreditCard },
    { name: 'الوحدات والباقات (Modules)', href: '/ice/modules', icon: Boxes },
    { name: 'إدارة المديرين (Admins)', href: '/ice/admins', icon: Users },
    { name: 'سجل التدقيق (Audit Logs)', href: '/ice/audit', icon: ShieldAlert },
    { name: 'حالة النظام (Health)', href: '/ice/health', icon: Activity },
    { name: 'الدعم الفني (Tickets)', href: '/ice/support', icon: LifeBuoy },
    { name: 'إعدادات النظام', href: '/ice/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-[#14161c] border-l border-white/5 flex flex-col h-full shadow-2xl relative z-50">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-[#0066cc] to-cyan-500 rounded-xl shadow-[0_0_15px_rgba(0,102,204,0.3)] flex items-center justify-center transform hover:scale-105 transition-transform">
          <span className="font-black text-xl text-white tracking-tighter">I</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">ICE Control</h1>
          <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">Master Panel</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        <p className="px-3 text-[10px] font-black text-neutral-600 mb-4 uppercase tracking-widest">
          إدارة المنظومة
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm
                ${isActive 
                  ? 'bg-linear-to-r from-[#0066cc]/20 to-transparent text-[#0066cc] border-r-2 border-[#0066cc] shadow-[inset_0_0_20px_rgba(0,102,204,0.1)]' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5 hover:translate-x-[-4px]'}
              `}
            >
              <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-[#0066cc]' : 'text-neutral-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions (User Info & Logout) */}
      <div className="p-4 border-t border-white/5 bg-[#0f1117]/50 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 mb-3 shadow-inner">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0066cc] to-blue-800 flex items-center justify-center text-xs font-black text-white shadow-lg border border-white/10">
            {adminUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{adminUser.name}</p>
            <p className="text-[10px] text-green-400 font-bold truncate flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span> 
              {adminUser.role}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-300 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج الآمن
        </button>
      </div>
    </aside>
  );
}
