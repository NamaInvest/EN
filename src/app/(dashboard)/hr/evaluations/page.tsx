'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function EmployeeEvaluationsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState(new Date().getFullYear().toString());
  const [score, setScore] = useState(100);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/evaluations');
      const data = await res.json();
      if (Array.isArray(data)) setEvaluations(data);

      const empRes = await fetch('/api/employees');
      const empData = await empRes.json();
      if (Array.isArray(empData)) setEmployees(empData);
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: parseInt(employeeId),
          period,
          score: parseInt(score.toString()),
          notes,
          evaluationDate: new Date().toISOString()
        })
      });
      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        alert(t('sys.str_4627'));
      }
    } catch (error: any) { toastError(error?.message || 'حدث خطأ'); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 HR - Employee Appraisals</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Start Evaluation Map
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">New Appraisal</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4622')}</label>
                  <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600">
                    <option value="">{t('sys.str_2106')}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4623')}</label>
                  <input required type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" placeholder="e.g. Q1 2026" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4624')}</label>
                  <input required type="number" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" />
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${score}%`}}></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4625')}</label>
                  <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600"></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md shadow-blue-600/20">Submit Appraisal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{t('sys.str_168')}</div>
        ) : evaluations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('sys.str_4626')}</div>
        ) : (
          <table className="w-full text-left border-collapse" dir="ltr">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Date / Period</th>
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Evaluator</th>
                <th className="p-4 font-semibold">Score Overview</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map(e => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 text-sm text-slate-600">
                    <span className="font-bold">{e.period}</span> <br/>
                    {new Date(e.evaluationDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{e.employee?.name || 'Unknown'}</td>
                  <td className="p-4 text-slate-500">{e.evaluator?.name || 'Manager'}</td>
                  <td className="p-4">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[150px] mb-1">
                      <div className={`h-2.5 rounded-full ${e.score >= 80 ? 'bg-green-500' : e.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${e.score}%`}}></div>
                    </div>
                    <span className="text-xs font-bold">{e.score}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
