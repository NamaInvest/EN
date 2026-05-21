'use client';
import React from 'react';
import { Award, Star } from 'lucide-react';

export default function VendorScorecardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Award className="text-primary" /> Vendor Scorecard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 border border-(--) bg-(--) rounded-xl shadow-sm opacity-60">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-(--)">Supplier Placeholder {i}</h3>
                <div className="text-sm text-(--)">Category: General</div>
              </div>
              <div className="flex text-yellow-400" dir="ltr"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
            </div>
            <div className="space-y-3 text-sm text-(--)">
              <div className="flex justify-between border-b border-(--) pb-2"><span>Quality</span><span className="font-mono">--</span></div>
              <div className="flex justify-between border-b border-(--) pb-2"><span>Delivery</span><span className="font-mono">--</span></div>
              <div className="flex justify-between"><span>Pricing</span><span className="font-mono">--</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-10 border border-(--) bg-(--) rounded-xl text-center shadow-sm">
        <Award size={48} className="mx-auto mb-4 text-blue-300" />
        <h2 className="text-xl font-bold mb-3">KPI Engine Suspended</h2>
        <p className="text-(--) max-w-lg mx-auto leading-relaxed">
          Vendor scorecard metrics (Quality, Delivery Time, Issue Rate) rely on the advanced Three-Way Matching module which is currently undergoing stability checks.
        </p>
      </div>
    </div>
  );
}
