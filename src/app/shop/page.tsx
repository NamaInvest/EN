import React from 'react';
import Link from 'next/link';
import { getPrisma } from '@/lib/prisma';
import Image from 'next/image';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.shop' });

export default async function ShopHomePage() {
  const prisma = getPrisma();
  
  // Fetch some featured products
  const products = await prisma.product.findMany({
    where: { active: true },
    take: 8,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-indigo-600 rounded-2xl overflow-hidden shadow-xl text-white">
        <div className="px-8 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">اكتشف أحدث المنتجات</h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            تسوق براحة وأمان مع متجرنا الإلكتروني المتكامل. أسرع توصيل بأفضل الأسعار.
          </p>
          <Link href="/shop/offers" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
            تسوق العروض الآن
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">تسوق حسب الفئة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['إلكترونيات', 'أزياء', 'المنزل', 'العطور'].map((cat, i) => (
            <Link key={i} href={`/shop/${cat}`} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow text-center border">
              <h3 className="font-semibold text-lg text-gray-800">{cat}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">المنتجات المميزة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-100 relative">
                {product.imagePath ? (
                  <img src={product.imagePath} alt={product.nameEn || product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">لا توجد صورة</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{product.nameEn || product.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-indigo-600 font-bold">{product.sellPrice.toFixed(2)} ر.س</span>
                  <button className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-full p-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              لا توجد منتجات متاحة حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
