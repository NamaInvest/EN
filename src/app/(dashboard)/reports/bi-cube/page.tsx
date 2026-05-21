'use client';
import React from 'react';
import { LayoutDashboard, BarChart, LineChart, PieChart, Info } from 'lucide-react';

export default function BICubePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <LayoutDashboard className="text-primary" /> BI Cube Analytics
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl text-center shadow-sm">
          <BarChart size={48} className="mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-bold">Revenue Growth</h3>
          <p className="text-sm text-(--text-muted) mt-2">Data syncing...</p>
        </div>
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl text-center shadow-sm">
          <LineChart size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-bold">Cash Flow Trends</h3>
          <p className="text-sm text-(--text-muted) mt-2">Data syncing...</p>
        </div>
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl text-center shadow-sm">
          <PieChart size={48} className="mx-auto mb-4 text-purple-500" />
          <h3 className="text-lg font-bold">Expense Distribution</h3>
          <p className="text-sm text-(--text-muted) mt-2">Data syncing...</p>
        </div>
      </div>
      
      <div className="card p-12 border border-(--border) bg-(--bg-primary) rounded-xl text-center shadow-sm">
        <Info size={48} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold mb-3">Interactive BI Cube</h2>
        <p className="text-(--text-muted) max-w-lg mx-auto leading-relaxed">
          The Business Intelligence Cube is currently aggregating real-time data across all branches and tenants. Full interactive charts will be available once the OLAP engine finishes processing.
        </p>
      </div>
    </div>
  );
}
