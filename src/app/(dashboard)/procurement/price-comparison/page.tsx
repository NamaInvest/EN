'use client';
import React from 'react';
import { Scale, Search } from 'lucide-react';

export default function PriceComparisonPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Scale className="text-primary" /> Vendor Price Comparison
      </h1>
      
      <div className="card p-6 border border-[var(--border)] bg-[var(--bg-secondary)] mb-6 rounded-xl shadow-sm">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search items to compare (e.g. Laptops, Office Supplies)..." 
              className="w-full p-3 pr-10 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text)] outline-none"
              disabled
              dir="auto"
            />
          </div>
          <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg opacity-50 cursor-not-allowed">
            Compare
          </button>
        </div>
      </div>

      <div className="card p-16 border border-[var(--border)] bg-[var(--bg-primary)] rounded-xl text-center shadow-sm">
        <Scale size={64} className="mx-auto mb-6 text-gray-200" />
        <h2 className="text-xl font-bold mb-3">Comparison Engine Initializing</h2>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
          The automated price comparison tool is currently offline. This feature requires the updated Supplier Portal API to fetch real-time quotations effectively.
        </p>
      </div>
    </div>
  );
}
