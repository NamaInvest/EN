'use client';
import React, { useState } from 'react';
import { ShoppingCart, Search, CreditCard, ScanLine, Printer, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RetailPOS() {
  const [cart, setCart] = useState([{ id: 1, name: 'Wireless Headphones', price: 299, qty: 1 }]);
  return (
    <div className="flex h-[85vh] gap-4 p-4 bg-slate-50">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Scan Barcode or Search Products..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-lg shadow-sm" />
          <ScanLine className="absolute right-3 top-3 w-6 h-6 text-indigo-500" />
        </div>
        <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20">
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <Card key={i} className="p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center justify-center h-40 bg-white">
              <div className="w-16 h-16 bg-slate-100 rounded-full mb-2 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <p className="font-semibold text-slate-700">Product Item {i}</p>
              <p className="text-indigo-600 font-bold mt-1">SAR {(Math.random() * 100 + 50).toFixed(2)}</p>
            </Card>
          ))}
        </div>
      </div>
      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col">
        <div className="p-4 border-b bg-slate-900 text-white rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> <h2 className="font-bold text-lg">Current Order</h2></div>
          <span className="text-sm bg-slate-800 px-2 py-1 rounded">Shift: 042</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
              <div><p className="font-semibold text-sm">{item.name}</p><p className="text-xs text-slate-500">SAR {item.price} x {item.qty}</p></div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-indigo-600">SAR {item.price * item.qty}</span>
                <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 rounded-b-xl space-y-3">
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>SAR 299.00</span></div>
          <div className="flex justify-between text-sm text-slate-600"><span>VAT (15%)</span><span>SAR 44.85</span></div>
          <div className="flex justify-between text-xl font-black text-slate-800 border-t pt-2 mt-2"><span>Total</span><span>SAR 343.85</span></div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" className="h-12 border-slate-300"><Printer className="w-4 h-4 mr-2"/> Print</Button>
            <Button className="h-12 bg-indigo-600 hover:bg-indigo-700"><CreditCard className="w-4 h-4 mr-2"/> Pay Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}