'use client';
import React from 'react';
import { Clock, Briefcase, FileText, CheckCircle, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServicesTimesheet() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 space-y-6 max-w-7xl mx-auto">      {/* Global System Features Bar */} \n      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">\n        <div className="flex items-center gap-2">\n          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">GLOBAL ENTERPRISE FEATURES</span>\n        </div>\n        <div className="flex gap-3">\n        <Button className="bg-indigo-600 text-white font-bold hover:opacity-90 shadow-lg"><Eye className="w-4 h-4 mr-2"/> Passive Time Tracker</Button>\n        <Button className="bg-purple-600 text-white font-bold hover:opacity-90 shadow-lg"><FileSearch className="w-4 h-4 mr-2"/> AI Contract Analysis</Button>\n        <Button className="bg-emerald-500 text-white font-bold hover:opacity-90 shadow-lg"><TrendingUp className="w-4 h-4 mr-2"/> Resource Forecast</Button>\n        </div>\n      </div>
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-indigo-900"><Briefcase className="text-indigo-600 w-8 h-8"/> Professional Services</h1>
          <p className="text-slate-500 mt-1 font-medium">Timesheets • Retainers • WIP Revenue</p>
        </div>
        <Button onClick={() => { fetch("/api/v3/services/timesheet", { method: "POST", body: JSON.stringify({ employeeId: 1, projectId: 1, hours: 7.5 }) }).then(()=>alert("Timesheet Logged in DB!")); }} className="bg-indigo-600 hover:bg-indigo-700 font-bold"><Clock className="w-4 h-4 mr-2"/> Log Hours</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><FileText className="text-indigo-600"/> Weekly Timesheet</h2>
            <div className="space-y-3 font-medium">
              <div className="grid grid-cols-12 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold text-sm text-slate-600 text-center">
                <div className="col-span-4 text-left">Client / Matter</div><div className="col-span-1">Mon</div><div className="col-span-1">Tue</div><div className="col-span-1">Wed</div><div className="col-span-1">Thu</div><div className="col-span-1">Fri</div><div className="col-span-1">Sat</div><div className="col-span-2">Total</div>
              </div>
              <div className="grid grid-cols-12 gap-4 p-3 border-b border-slate-100 items-center text-center text-sm">
                <div className="col-span-4 text-left font-bold text-slate-700">Aramco / Contract Review</div>
                <div className="col-span-1">2.5</div><div className="col-span-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-bold">4.0</div><div className="col-span-1">1.0</div><div className="col-span-1">-</div><div className="col-span-1">-</div><div className="col-span-1">-</div>
                <div className="col-span-2 font-black text-indigo-800">7.5 h</div>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-slate-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-emerald-600"/> Retainer Balances</h2>
            <div className="space-y-4">
              <div className="p-4 border border-emerald-100 bg-emerald-50 rounded-xl">
                <p className="font-bold text-emerald-900">Aramco Trust Account</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-2">$ 45,000</h3>
                <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Sufficient funds for WIP</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}