'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function HRJobsPage() {
    const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '' });

  useEffect(() => {
    fetch('/api/hr/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddJob = async () => {
    if (!newJob.title || !newJob.department) {
        alert(t('hr.str_2165'));
        return;
    }
    try {
        const res = await fetch('/api/hr/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newJob)
        });
        if (res.ok) {
            const added = await res.json();
            setJobs([added, ...jobs]);
            setShowAddModal(false);
            setNewJob({ title: '', department: '' });
        } else {
            alert(t('hr.str_2166'));
        }
    } catch {
        alert(t('sys.str_446'));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('hr.str_2156')}</h1>
        <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            onClick={() => setShowAddModal(true)}
        >
          {t('hr.str_2157')}</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{t('hr.str_2158')}</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('hr.str_2159')}</div>
        ) : (
          <table className="w-full text-right border-collapse" dir="rtl">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold text-right">{t('hr.str_2160')}</th>
                <th className="p-4 font-semibold text-right">{t('hr.str_2161')}</th>
                <th className="p-4 font-semibold text-right">{t('fin.str_227')}</th>
                <th className="p-4 font-semibold text-right">{t('hr.str_2162')}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{job.title}</td>
                  <td className="p-4">{job.department || t('sys.str_733')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {job.status === 'OPEN' ? 'مفتوح' : 'مغلق'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-emerald-600">
                    {job.applicants?.length || 0} {t('hr.str_2163')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-96 p-6 rounded-xl animate-fade-in" dir="rtl">
                <h3 className="text-xl font-bold mb-4">{t('hr.str_2164')}</h3>
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">{t('hr.str_2160')}</label>
                    <input 
                        type="text" 
                        value={newJob.title}
                        onChange={e => setNewJob({...newJob, title: e.target.value})}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder={t('hr.str_2167')}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">{t('hr.str_2161')}</label>
                    <input 
                        type="text" 
                        value={newJob.department}
                        onChange={e => setNewJob({...newJob, department: e.target.value})}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder={t('hr.str_2168')}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                        {t('fin.str_206')}</button>
                    <button 
                        onClick={handleAddJob}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        {t('fin.str_205')}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
