'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Activity, Stethoscope, FileText, Pill, CalendarDays, Video, Watch, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';

export default function ClinicEMR() {
  const { lang } = useTranslation();
  const { success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4">      {/* Global System Features Bar */} \n      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">\n        <div className="flex items-center gap-2">\n          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">{_t('GLOBAL ENTERPRISE FEATURES', 'GLOBAL ENTERPRISE FEATURES')}</span>\n        </div>\n        <div className="flex gap-3">\n        <Button className="bg-blue-500 text-white font-bold hover:opacity-90 shadow-lg"><Video className="w-4 h-4 mr-2"/>{_t('Start Telehealth Call', 'Start Telehealth Call')}</Button>\n        <Button className="bg-rose-500 text-white font-bold hover:opacity-90 shadow-lg"><Watch className="w-4 h-4 mr-2"/>{_t('Sync Apple Health', 'Sync Apple Health')}</Button>\n        <Button className="bg-emerald-600 text-white font-bold hover:opacity-90 shadow-lg"><ShieldCheck className="w-4 h-4 mr-2"/>{_t('AI Claim Scrubbing', 'AI Claim Scrubbing')}</Button>\n        </div>\n      </div>
      <div className="w-1/4 space-y-4 flex flex-col">
        <Card className="p-6 bg-indigo-600 text-white shadow-lg rounded-2xl">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-black text-indigo-600 text-xl border-4 border-indigo-300">SA</div>
            <div>
              <h2 className="font-bold text-xl">{_t('Sami Ahmed', 'Sami Ahmed')}</h2>
              <p className="text-indigo-200 text-sm">ID: PAT-99213 • 34Y Male</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm font-medium">
            <div className="bg-indigo-700/50 p-3 rounded-lg"><span className="text-indigo-300 block text-xs">{_t('Blood Type', 'Blood Type')}</span> O+</div>
            <div className="bg-indigo-700/50 p-3 rounded-lg"><span className="text-indigo-300 block text-xs">{_t('Allergies', 'Allergies')}</span>{_t('Penicillin', 'Penicillin')}</div>
          </div>
        </Card>
        <Card className="flex-1 p-4 bg-white shadow-sm overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4"/>{_t('Past Visits', 'Past Visits')}</h3>
          <div className="space-y-4 border-l-2 border-slate-100 ml-2 pl-4">
            <div className="relative"><div className="w-3 h-3 bg-indigo-500 rounded-full absolute -left-[23px] top-1"></div><p className="font-bold text-sm">12 Oct 2025</p><p className="text-xs text-slate-500">{_t('Hypertension Follow-up', 'Hypertension Follow-up')}</p></div>
            <div className="relative"><div className="w-3 h-3 bg-slate-300 rounded-full absolute -left-[23px] top-1"></div><p className="font-bold text-sm text-slate-600">05 Mar 2025</p><p className="text-xs text-slate-500">{_t('General Checkup', 'General Checkup')}</p></div>
          </div>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          <Card className="flex-1 p-6 flex items-center gap-4 shadow-sm border-t-4 border-t-rose-500">
            <Activity className="w-8 h-8 text-rose-500"/><div><p className="text-sm text-slate-500 font-bold">BP</p><p className="text-2xl font-black">120/80</p></div>
          </Card>
          <Card className="flex-1 p-6 flex items-center gap-4 shadow-sm border-t-4 border-t-blue-500">
            <Stethoscope className="w-8 h-8 text-blue-500"/><div><p className="text-sm text-slate-500 font-bold">HR</p><p className="text-2xl font-black">72 bpm</p></div>
          </Card>
        </div>

        <Card className="flex-1 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><FileText className="text-indigo-600"/>{_t('Clinical Notes (SOAP)', 'Clinical Notes (SOAP)')}</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2"><Pill className="w-4 h-4"/>{_t('e-Prescribe', 'e-Prescribe')}</Button>
              <Button onClick={() => { fetch("/api/v3/clinic/emr", { method: "POST", body: JSON.stringify({ patientName: "Sami Ahmed" }) }).then(()=>toastSuccess("Encounter Saved to DB!")); }} className="bg-slate-900 text-white">{_t('Save Encounter', 'Save Encounter')}</Button>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div><label className="font-bold text-sm text-slate-700 mb-1 block">{_t('Subjective', 'Subjective')}</label><textarea className="w-full h-24 p-3 border rounded-lg bg-slate-50 resize-none focus:ring-2 focus:ring-indigo-500" placeholder="Patient complains of..."></textarea></div>
            <div>
              <label className="font-bold text-sm text-slate-700 mb-1 block">{_t('Assessment (ICD-10)', 'Assessment (ICD-10)')}</label>
              <div className="p-3 border rounded-lg bg-slate-50 text-slate-600 flex items-center justify-between">
                <span>[I10] Essential (primary) hypertension</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-bold">{_t('Primary', 'Primary')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}