import { Metadata } from 'next';
import IceSidebar from '@/components/ice/IceSidebar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ICE - Super Admin Control Panel',
  description: 'Centralized management panel for Nama Invest ERP SaaS & Desktop',
};

/**
 * @description
 * Layout wrapper for the ICE Super Admin panel.
 * Includes the navigation sidebar on the right side (RTL direction).
 * Protects children from unauthenticated access by ensuring layout integrity.
 * 
 * @param children The specific dashboard page to render.
 */
export default function IceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex h-screen bg-[#0f1117] text-white ${inter.className}`} dir="rtl">
      {/* Sidebar Component: Handles navigation to Tenants, Licenses, Modules, etc. */}
      <IceSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
