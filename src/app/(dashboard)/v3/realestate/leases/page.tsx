'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Building, Key, Wallet, FileText, Wrench, KeyRound, Glasses, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';

export default function RealEstateLeases() {
  const { lang } = useTranslation();
  const { success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  return (
    <div className="p-6 bg-slate-100 min-h-screen text-slate-800 space-y-6 max-w-7xl mx-auto">      {/* Global System Features Bar */} \n      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">\n        <div className="flex items-center gap-2">\n          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">{_t('GLOBAL ENTERPRISE FEATURES', 'GLOBAL ENTERPRISE FEATURES')}</span>\n        </div>\n        <div className="flex gap-3">\n        <Button className="bg-teal-600 text-white font-bold hover:opacity-90 shadow-lg"><KeyRound className="w-4 h-4 mr-2"/>{_t('Generate Smart Lock PIN', 'Generate Smart Lock PIN')}</Button>\n        <Button className="bg-indigo-500 text-white font-bold hover:opacity-90 shadow-lg"><Glasses className="w-4 h-4 mr-2"/> 3D Virtual Tour</Button>\n        <Button className="bg-sky-500 text-white font-bold hover:opacity-90 shadow-lg"><MessageSquare className="w-4 h-4 mr-2"/>{_t('Tenant Social Portal', 'Tenant Social Portal')}</Button>\n        </div>\n      </div>
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800"><Building className="text-teal-600 w-8 h-8"/>{_t('Al-Faisaliah Tower', 'Al-Faisaliah Tower')}</h1>
          <p className="text-slate-500 mt-1 font-medium">Commercial Property • 45 Units • 92% Occupancy</p>
        </div>
        <Button onClick={() => { fetch("/api/v3/realestate/leases", { method: "POST", body: JSON.stringify({ propertyId: 1, tenantId: 1, rentAmount: 120000 }) }).then(()=>toastSuccess("Lease Contract Created in DB!")); }} className="bg-teal-600 hover:bg-teal-700 font-bold"><Key className="w-4 h-4 mr-2"/>{_t('New Lease Contract', 'New Lease Contract')}</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><Wallet className="text-teal-600"/>{_t('PDC Vault (Post-Dated Checks)', 'PDC Vault (Post-Dated Checks)')}</h2>
            <div className="space-y-4 font-medium">
              {[
                {unit: 'Office 401', date: '01 Nov 2025', amt: '120,000', bank: 'Al-Rajhi Bank', status: 'Due in 5 Days'},
                {unit: 'Retail 02', date: '15 Dec 2025', amt: '45,000', bank: 'SNB', status: 'Vaulted'},
                {unit: 'Office 205', date: '01 Jan 2026', amt: '90,000', bank: 'Riyad Bank', status: 'Vaulted'}
              ].map((c,i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-700">{c.unit}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.bank}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-teal-700">SAR {c.amt}</p>
                    <p className={`text-xs font-bold mt-1 ${i===0?'text-red-500':'text-slate-400'}`}>{c.date} • {c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-slate-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-teal-600"/>{_t('Maintenance Tickets', 'Maintenance Tickets')}</h2>
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-l-red-500 rounded-r-lg bg-slate-50 shadow-sm">
                <p className="font-bold text-sm">{_t('AC Leakage', 'AC Leakage')}</p>
                <p className="text-xs text-slate-500 mt-1">Office 401 • Reported 2h ago</p>
              </div>
              <div className="p-3 border-l-4 border-l-amber-500 rounded-r-lg bg-slate-50 shadow-sm">
                <p className="font-bold text-sm">Elevator #2 Stuck</p>
                <p className="text-xs text-slate-500 mt-1">Lobby • Reported 5h ago</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}