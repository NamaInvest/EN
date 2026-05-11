'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Users, GraduationCap, Bus, Bell, BookOpen, Brain, ScanSearch, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';

export default function SchoolSIS() {
  const { lang } = useTranslation();
  const { success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 space-y-6 max-w-7xl mx-auto">      {/* Global System Features Bar */} \n      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">\n        <div className="flex items-center gap-2">\n          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">{_t('ميزات المؤسسة العالمية', 'GLOBAL ENTERPRISE FEATURES')}</span>\n        </div>\n        <div className="flex gap-3">\n        <Button className="bg-purple-600 text-white font-bold hover:opacity-90 shadow-lg"><Brain className="w-4 h-4 mr-2"/>{_t('التسرب التنبؤي لمنظمة العفو الدولية', 'Predictive Dropout AI')}</Button>\n        <Button className="bg-slate-600 text-white font-bold hover:opacity-90 shadow-lg"><ScanSearch className="w-4 h-4 mr-2"/>{_t('الماسح الضوئي للسرقة الأدبية', 'Plagiarism Scanner')}</Button>\n        <Button className="bg-red-500 text-white font-bold hover:opacity-90 shadow-lg"><MapPin className="w-4 h-4 mr-2"/>{_t('تتبع RFID المباشر', 'RFID Live Tracking')}</Button>\n        </div>\n      </div>
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-800 rounded-full flex items-center justify-center border-4 border-indigo-400">
            <GraduationCap className="w-8 h-8 text-indigo-100"/>
          </div>
          <div>
            <h1 className="text-2xl font-black">{_t('نظام معلومات الطالب (SIS)', 'Student Information System (SIS)')}</h1>
            <p className="text-indigo-200 text-sm mt-1">Academic Year 2025-2026 • Term 2</p>
          </div>
        </div>
        <div className="flex gap-3">

          <Button className="bg-white text-indigo-900 hover:bg-slate-100 font-bold"><BookOpen className="w-4 h-4 mr-2"/>{_t('بوابة نظام إدارة التعلم', 'LMS Portal')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-6">
          <Card className="p-6 border-indigo-100 shadow-sm bg-white">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Bus className="w-4 h-4 text-indigo-500"/>{_t('ينقل', 'Transport')}</h3>
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="font-black text-yellow-800 text-lg">{_t('الطريق ب', 'Route B')}</p>
              <p className="text-sm text-yellow-700 mt-1">Driver: Ahmed Ali</p>
              <p className="text-xs font-bold text-emerald-600 mt-2">● En Route</p>
            </div>
          </Card>
          <Card className="p-6 border-red-100 shadow-sm bg-red-50">
            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><Bell className="w-4 h-4"/>{_t('تنبيه المطالبة', 'Dunning Alert')}</h3>
            <p className="text-sm text-red-700 font-medium">Installment #2 is overdue by 14 days. LMS access will be restricted in 48 hours.</p>
            <Button onClick={() => { fetch("/api/v3/school/sis", { method: "POST", body: JSON.stringify({ name: "Student 1", grade: "G4" }) }).then(()=>toastSuccess("Reminder Sent & Logged to DB!")); }} size="sm" variant="destructive" className="w-full mt-4">{_t('إرسال تذكير', 'Send Reminder')}</Button>
          </Card>
        </div>
        
        <div className="col-span-3 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-indigo-600"/>{_t('الحضور والدرجات من الدرجة 4A', 'Class 4A Attendance & Grades')}</h2>
              <input type="text" placeholder="Search student..." className="px-4 py-2 border rounded-lg text-sm bg-slate-50"/>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-sm text-slate-500">
                  <th className="pb-3 pl-2">{_t('اسم الطالب', 'Student Name')}</th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">{_t('حضور', 'Attendance')}</th>
                  <th className="pb-3">{_t('الرياضيات', 'Math')}</th>
                  <th className="pb-3">{_t('علوم', 'Science')}</th>
                  <th className="pb-3">{_t('الحالة', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: 'Omar Khalid', id: 'STU-1021', att: '98%', m: 'A', s: 'A+', st: 'Active' },
                  { name: 'Sarah Ahmed', id: 'STU-1022', att: '85%', m: 'B', s: 'B+', st: 'Active' },
                  { name: 'Fahad Yaser', id: 'STU-1023', att: '60%', m: 'C', s: 'D', st: 'Warning' }
                ].map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-4 pl-2 font-bold text-slate-700">{s.name}</td>
                    <td className="py-4 font-mono text-xs text-slate-500">{s.id}</td>
                    <td className="py-4 font-bold text-slate-600">{s.att}</td>
                    <td className="py-4 font-bold text-indigo-600">{s.m}</td>
                    <td className="py-4 font-bold text-emerald-600">{s.s}</td>
                    <td className="py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${s.st==='Warning'?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>{s.st}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
