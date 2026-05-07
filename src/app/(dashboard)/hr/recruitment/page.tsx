'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function RecruitmentPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [jobs, setJobs] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/hr/recruitment').then(r => r.json()).then(d => setJobs(d.jobs || [])).catch(() => {});
  }, []);

  const loadPipeline = async (jobId: number) => {
    setSelectedJob(jobId);
    const res = await fetch(`/api/hr/recruitment?jobId=${jobId}`);
    const d = await res.json();
    setPipeline(d.pipeline || []);
  };

  const stageColors: Record<string, string> = { NEW: '#2196F3', SCREENING: '#FF9800', INTERVIEW: '#9C27B0', OFFER: '#4CAF50', HIRED: '#00BCD4', REJECTED: '#757575' };
  const stageLabels: Record<string, string> = { NEW: isAr ? 'جديد' : 'New', SCREENING: isAr ? 'فرز' : 'Screening', INTERVIEW: isAr ? 'مقابلة' : 'Interview', OFFER: isAr ? 'عرض' : 'Offer', HIRED: isAr ? 'تم التوظيف' : 'Hired', REJECTED: isAr ? 'مرفوض' : 'Rejected' };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '👤 التوظيف' : '👤 Recruitment'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginBottom: 12 }}>{isAr ? 'الوظائف المفتوحة' : 'Open Jobs'}</h3>
          {jobs.map((j: any) => (
            <div key={j.id} onClick={() => loadPipeline(j.id)} style={{ padding: 12, borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selectedJob === j.id ? '#E3F2FD' : '#f9f9f9', border: selectedJob === j.id ? '2px solid #2196F3' : '1px solid #eee' }}>
              <div style={{ fontWeight: 600 }}>{j.title}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{j.department}</div>
            </div>
          ))}
          {jobs.length === 0 && <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>{isAr ? 'لا توجد وظائف' : 'No jobs'}</div>}
        </div>
        <div>
          {selectedJob ? (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
              {pipeline.map((stage: any) => (
                <div key={stage.stage} style={{ minWidth: 200, background: '#fff', borderRadius: 12, padding: 12, borderTop: `3px solid ${stageColors[stage.stage] || '#999'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{stageLabels[stage.stage] || stage.stage}</span>
                    <span style={{ background: stageColors[stage.stage], color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11 }}>{stage.count}</span>
                  </div>
                  {(stage.applications || []).map((app: any) => (
                    <div key={app.id} style={{ background: '#f9f9f9', borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{app.applicantName}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{app.email}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>{isAr ? 'اختر وظيفة لعرض المتقدمين' : 'Select a job to view applicants'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
