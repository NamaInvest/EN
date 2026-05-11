'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Users, TrendingUp, AlertOctagon, RefreshCw, Award, Target, UserX } from 'lucide-react';

export default function SuccessionNineBoxPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  const fetchNineBox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/succession`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to fetch 9-Box Data');
      }
    } catch (err) {
      console.error(err);
      alert('Network error fetching 9-Box data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNineBox();
  }, [fetchNineBox]);

  const boxTitles: Record<string, { ar: string, en: string, color: string, desc: string }> = {
    'high_high': { ar: 'نجوم المستقبل', en: 'Future Stars', color: '#10B981', desc: 'High Perf / High Pot' },
    'high_med': { ar: 'أداء متميز', en: 'High Performers', color: '#34D399', desc: 'High Perf / Med Pot' },
    'high_low': { ar: 'محترفون متمرسون', en: 'Seasoned Pros', color: '#6EE7B7', desc: 'High Perf / Low Pot' },
    'med_high': { ar: 'كفاءات واعدة', en: 'Emerging Talent', color: '#60A5FA', desc: 'Med Perf / High Pot' },
    'med_med': { ar: 'الأداء الأساسي', en: 'Core Players', color: '#93C5FD', desc: 'Med Perf / Med Pot' },
    'med_low': { ar: 'أداء مستقر', en: 'Solid Performers', color: '#BFDBFE', desc: 'Med Perf / Low Pot' },
    'low_high': { ar: 'لغز غير محلول', en: 'Enigmas', color: '#FCD34D', desc: 'Low Perf / High Pot' },
    'low_med': { ar: 'تحت التقييم', en: 'Inconsistent', color: '#FBBF24', desc: 'Low Perf / Med Pot' },
    'low_low': { ar: 'مخاطرة بالأداء', en: 'Underperformers', color: '#EF4444', desc: 'Low Perf / Low Pot' },
  };

  const getFlightRiskColor = (risk: string) => {
    if (risk === 'HIGH') return '#EF4444';
    if (risk === 'MEDIUM') return '#F59E0B';
    return '#10B981';
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <Target size={32} color="#EC4899" />
            {_t('تخطيط التعاقب الوظيفي (9-Box Grid)', 'Succession Planning (9-Box)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '700px', lineHeight: '1.6' }}>
            {_t(
              'أداة استراتيجية لتقييم المواهب بناءً على الأداء الحالي والإمكانات المستقبلية لتحديد القادة المستقبليين.',
              'Strategic talent evaluation tool based on current performance and future potential to identify future leaders.'
            )}
          </p>
        </div>
        
        <button onClick={fetchNineBox} style={{ padding: '10px 16px', background: '#EC4899', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {_t('تحديث', 'Refresh')}
        </button>
      </div>

      {loading && !data ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '16px' }}>{_t('جاري تحليل المواهب...', 'Analyzing talent pool...')}</div>
        </div>
      ) : data && (
        <>
          {/* KPI Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #3B82F6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي المقيَّمين', 'Evaluated')}</div>
                <Users size={24} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#3B82F6', fontFamily: 'monospace' }}>
                {data.summary.totalEmployeesEvaluated}
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #10B981', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('كفاءات عالية (نجوم)', 'High Potentials')}</div>
                <Award size={24} color="#10B981" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', fontFamily: 'monospace' }}>
                {data.summary.highPotentials}
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #EF4444', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('خطر التسرب الوظيفي', 'High Flight Risk')}</div>
                <AlertOctagon size={24} color="#EF4444" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#EF4444', fontFamily: 'monospace' }}>
                {data.summary.highFlightRisk}
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #F59E0B', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('أداء متدني', 'Underperformers')}</div>
                <UserX size={24} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>
                {data.summary.underperformers}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* 9-Box Grid */}
            <div style={{ flex: '1 1 600px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', position: 'relative' }}>
              
              {/* Axes Labels */}
              <div style={{ position: 'absolute', left: '-30px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '2px' }}>
                {_t('الإمكانات المستقبلية ➔', 'POTENTIAL ➔')}
              </div>
              <div style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '2px' }}>
                {_t('الأداء الحالي ➔', 'PERFORMANCE ➔')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '8px', height: '500px', paddingLeft: '20px' }}>
                {/* Row 1: High Potential */}
                <Box keyId="low_high" data={data.matrix} title={boxTitles['low_high']} onClick={() => setSelectedBox('low_high')} isSelected={selectedBox === 'low_high'} />
                <Box keyId="med_high" data={data.matrix} title={boxTitles['med_high']} onClick={() => setSelectedBox('med_high')} isSelected={selectedBox === 'med_high'} />
                <Box keyId="high_high" data={data.matrix} title={boxTitles['high_high']} onClick={() => setSelectedBox('high_high')} isSelected={selectedBox === 'high_high'} />

                {/* Row 2: Medium Potential */}
                <Box keyId="low_med" data={data.matrix} title={boxTitles['low_med']} onClick={() => setSelectedBox('low_med')} isSelected={selectedBox === 'low_med'} />
                <Box keyId="med_med" data={data.matrix} title={boxTitles['med_med']} onClick={() => setSelectedBox('med_med')} isSelected={selectedBox === 'med_med'} />
                <Box keyId="high_med" data={data.matrix} title={boxTitles['high_med']} onClick={() => setSelectedBox('high_med')} isSelected={selectedBox === 'high_med'} />

                {/* Row 3: Low Potential */}
                <Box keyId="low_low" data={data.matrix} title={boxTitles['low_low']} onClick={() => setSelectedBox('low_low')} isSelected={selectedBox === 'low_low'} />
                <Box keyId="med_low" data={data.matrix} title={boxTitles['med_low']} onClick={() => setSelectedBox('med_low')} isSelected={selectedBox === 'med_low'} />
                <Box keyId="high_low" data={data.matrix} title={boxTitles['high_low']} onClick={() => setSelectedBox('high_low')} isSelected={selectedBox === 'high_low'} />
              </div>
            </div>

            {/* List Details */}
            <div style={{ flex: '1 1 400px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', maxHeight: '600px', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text)' }}>
                {selectedBox ? _t(boxTitles[selectedBox].ar, boxTitles[selectedBox].en) : _t('الرجاء اختيار مربع', 'Select a box to view')}
              </h2>

              {!selectedBox ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <TrendingUp size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>{_t('اضغط على أحد المربعات في المصفوفة لرؤية تفاصيل الموظفين', 'Click on a box in the matrix to view employee details.')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.matrix[selectedBox]?.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-muted)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                      {_t('لا يوجد موظفين في هذه الفئة حالياً.', 'No employees in this category.')}
                    </div>
                  ) : (
                    data.matrix[selectedBox]?.map((emp: any) => (
                      <div key={emp.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text)' }}>{emp.name}</h4>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.role} • {emp.department}</div>
                          </div>
                          <span style={{ background: getFlightRiskColor(emp.flightRisk) + '22', color: getFlightRiskColor(emp.flightRisk), padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>
                            {_t('خطر التسرب:', 'Risk:')} {emp.flightRisk}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginBottom: '8px' }}>
                          <div><span style={{ color: 'var(--text-muted)' }}>{_t('الأداء:', 'Perf:')}</span> <b>{emp.performanceScore}/5</b></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>{_t('الإمكانات:', 'Pot:')}</span> <b>{emp.potentialScore}/5</b></div>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {_t('نقاط القوة:', 'Strengths:')} <span style={{ color: 'var(--text)' }}>{emp.keyStrengths.join(', ')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function Box({ keyId, data, title, onClick, isSelected }: { keyId: string, data: any, title: any, onClick: () => void, isSelected: boolean }) {
  const employees = data[keyId] || [];
  const count = employees.length;
  
  return (
    <div 
      onClick={onClick}
      style={{ 
        background: isSelected ? title.color : `${title.color}22`,
        border: `2px solid ${title.color}`,
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.2s',
        transform: isSelected ? 'scale(0.98)' : 'scale(1)',
        color: isSelected ? 'white' : 'var(--text)'
      }}
    >
      <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '4px', color: isSelected ? 'white' : title.color }}>{count}</div>
      <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>{title.ar}</div>
      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px', textAlign: 'center' }}>{title.desc}</div>
    </div>
  );
}
