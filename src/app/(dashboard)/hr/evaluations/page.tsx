'use client';

import { useState, useEffect } from 'react';

export default function EmployeeEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hr/evaluations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEvaluations(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 HR - Employee Appraisals</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Start Evaluation Map
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading evaluations...</div>
        ) : evaluations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No evaluations recorded.</div>
        ) : (
          <table className="w-full text-left border-collapse">
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
                  <td className="p-4 text-slate-500">{e.evaluator?.name || 'Unknown'}</td>
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
