'use client';

import React, { useState, useEffect } from 'react';

const STAGES = ['APPLIED', 'SCREENED', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED'];

export default function RecruitmentPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    
    // UI state
    const [showNewJobModal, setShowNewJobModal] = useState(false);
    const [newJobForm, setNewJobForm] = useState({ title: '', department: '', description: '', requirements: '' });
    
    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hr/recruitment');
            const data = await res.json();
            if (data.success) {
                setJobs(data.data);
                if (!selectedJob && data.data.length > 0) {
                    setSelectedJob(data.data[0]);
                } else if (selectedJob) {
                    const updated = data.data.find((j: any) => j.id === selectedJob.id);
                    setSelectedJob(updated || null);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/hr/recruitment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_JOB', payload: newJobForm })
            });
            if (res.ok) {
                setShowNewJobModal(false);
                setNewJobForm({ title: '', department: '', description: '', requirements: '' });
                fetchJobs();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateStatus = async (applicantId: number, newStatus: string) => {
        try {
            const res = await fetch('/api/hr/recruitment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'UPDATE_APPLICANT_STATUS', payload: { applicantId, status: newStatus } })
            });
            if (res.ok) {
                fetchJobs();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading && jobs.length === 0) return <div className="p-8 text-indigo-600">جاري تحميل بيانات التوظيف...</div>;

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة التوظيف (ATS Pipeline)</h1>
                    <p className="text-gray-500 mt-1">تتبع الوظائف الشاغرة ومراحل المتقدمين عبر كانبان تفاعلي.</p>
                </div>
                <button 
                    onClick={() => setShowNewJobModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold shadow hover:bg-indigo-700"
                >
                    + إضافة وظيفة شاغرة
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Left Sidebar: Job List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[700px] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-lg text-gray-800 dark:text-gray-200">
                        الوظائف الشاغرة
                    </div>
                    <div className="p-2 space-y-2">
                        {jobs.map(job => (
                            <div 
                                key={job.id} 
                                onClick={() => setSelectedJob(job)}
                                className={`p-4 rounded-md cursor-pointer border-l-4 transition-all ${selectedJob?.id === job.id ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-900/30 shadow' : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                            >
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{job.title}</h3>
                                <p className="text-xs text-gray-500">{job.department || 'عام'}</p>
                                <div className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 rounded inline-block">
                                    {job.applicants.length} متقدم
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Area: Kanban Board for selected job */}
                {selectedJob ? (
                    <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-inner h-[700px] overflow-x-auto flex gap-4 items-start">
                        {STAGES.map(stage => {
                            const stageApplicants = selectedJob.applicants.filter((a: any) => a.status === stage);
                            return (
                                <div key={stage} className="min-w-[280px] bg-gray-100 dark:bg-gray-800 rounded-lg p-3 shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col max-h-full">
                                    <div className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex justify-between items-center">
                                        <span>{stage}</span>
                                        <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs shadow-sm">{stageApplicants.length}</span>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto flex-1 pb-2">
                                        {stageApplicants.map((app: any) => (
                                            <div key={app.id} className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm hover:shadow border border-gray-200 dark:border-gray-600 transition group">
                                                <div className="font-bold text-gray-900 dark:text-white text-sm">{app.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{app.email}</div>
                                                <div className="text-xs text-gray-500">{app.phone}</div>
                                                {app.resumeUrl && (
                                                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-indigo-500 text-xs mt-2 inline-block hover:underline">
                                                        📄 عرض السيرة الذاتية
                                                    </a>
                                                )}
                                                
                                                {/* Move actions */}
                                                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <select 
                                                        value="" 
                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                        className="w-full text-xs border-gray-300 rounded p-1 dark:bg-gray-800 dark:text-white"
                                                    >
                                                        <option value="" disabled>نقل إلى مرحلة...</option>
                                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow h-[700px] flex items-center justify-center text-gray-500">
                        الرجاء اختيار وظيفة شاغرة لعرض المتقدمين.
                    </div>
                )}
            </div>

            {/* New Job Modal */}
            {showNewJobModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2">إضافة وظيفة شاغرة جديدة</h2>
                        <form onSubmit={handleCreateJob} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المسمى الوظيفي</label>
                                <input required type="text" value={newJobForm.title} onChange={e => setNewJobForm({...newJobForm, title: e.target.value})} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">القسم</label>
                                <input type="text" value={newJobForm.department} onChange={e => setNewJobForm({...newJobForm, department: e.target.value})} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف الوظيفي</label>
                                <textarea rows={3} value={newJobForm.description} onChange={e => setNewJobForm({...newJobForm, description: e.target.value})} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المتطلبات (Requirements)</label>
                                <textarea rows={3} value={newJobForm.requirements} onChange={e => setNewJobForm({...newJobForm, requirements: e.target.value})} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setShowNewJobModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold">إنشاء الوظيفة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
