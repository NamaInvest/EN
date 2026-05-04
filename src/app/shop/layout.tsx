import React from 'react';
import Link from 'next/link';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/shop" className="text-2xl font-bold text-indigo-600">
                NamaShop
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8 space-x-reverse">
              <Link href="/shop/electronics" className="text-gray-600 hover:text-indigo-600">إلكترونيات</Link>
              <Link href="/shop/clothing" className="text-gray-600 hover:text-indigo-600">أزياء</Link>
              <Link href="/shop/home" className="text-gray-600 hover:text-indigo-600">المنزل</Link>
              <Link href="/shop/offers" className="text-red-600 font-semibold hover:text-red-700">العروض</Link>
            </nav>

            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/shop/cart" className="text-gray-600 hover:text-indigo-600 relative p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {/* Badge example */}
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">0</span>
              </Link>
              <Link href="/shop/account" className="text-gray-600 hover:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 text-center">
        <p>© 2026 NamaShop. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
