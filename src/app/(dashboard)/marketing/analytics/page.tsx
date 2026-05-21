'use client';
import React from 'react';
import { Megaphone, Activity, Users, MousePointerClick } from 'lucide-react';

export default function MarketingAnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Megaphone className="text-primary" /> Marketing Analytics
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-lg"><Activity size={24} /></div>
          <div>
            <div className="text-sm text-(--text-muted)">Active Campaigns</div>
            <div className="text-2xl font-bold text-(--text)">---</div>
          </div>
        </div>
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-lg"><Users size={24} /></div>
          <div>
            <div className="text-sm text-(--text-muted)">New Leads</div>
            <div className="text-2xl font-bold text-(--text)">---</div>
          </div>
        </div>
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-lg"><MousePointerClick size={24} /></div>
          <div>
            <div className="text-sm text-(--text-muted)">Conversion Rate</div>
            <div className="text-2xl font-bold text-(--text)">---</div>
          </div>
        </div>
      </div>

      <div className="card p-12 border border-(--border) bg-(--bg-primary) rounded-xl text-center shadow-sm">
        <Megaphone size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold mb-2">Marketing Engine Under Construction</h2>
        <p className="text-(--text-muted) max-w-lg mx-auto leading-relaxed">
          The marketing analytics dashboard is currently being integrated with ad networks and the CRM module. Data will appear here automatically once the API sync is complete.
        </p>
      </div>
    </div>
  );
}
