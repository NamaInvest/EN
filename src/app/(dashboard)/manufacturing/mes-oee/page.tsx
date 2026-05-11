'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Activity, RefreshCw, Cpu, AlertTriangle, PlayCircle, Settings, CheckCircle2 } from 'lucide-react';

interface OEEData {
  machineId: string;
  availability: number;
  performance: number;
  quality: number;
  oeeScore: number;
}

interface MachineStatus {
  machineId: string;
  name: string;
  status: string;
  currentJob: string | null;
  operator: string | null;
  uptimeMinutes: number;
  downtimeMinutes: number;
  producedUnits: number;
  defectiveUnits: number;
  targetUnits: number;
  oee: OEEData;
}

interface MESData {
  asOfDate: string;
  machines: MachineStatus[];
  factorySummary: {
    overallOEE: number;
    totalProduced: number;
    totalDefects: number;
    activeMachinesCount: number;
    downtimeAlerts: number;
  };
}

export default function MesOeePage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<MESData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/manufacturing/mes-oee`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to fetch MES Data');
      }
    } catch (err) {
      console.error(err);
      alert('Network error fetching MES data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMesData();
    // Auto refresh every 30 seconds for "real-time" feel
    const interval = setInterval(fetchMesData, 30000);
    return () => clearInterval(interval);
  }, [fetchMesData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(num);
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'RUNNING': return <span style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><PlayCircle size={14}/> {_t('يعمل', 'Running')}</span>;
      case 'DOWNTIME': return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14}/> {_t('متوقف', 'Downtime')}</span>;
      case 'MAINTENANCE': return <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><Settings size={14}/> {_t('صيانة', 'Maintenance')}</span>;
      default: return <span style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><Cpu size={14}/> {_t('خامل', 'Idle')}</span>;
    }
  };

  const getOeeColor = (score: number) => {
    if (score >= 85) return '#10B981'; // World class is 85%+
    if (score >= 60) return '#F59E0B'; // Typical is 60%
    return '#EF4444'; // Low
  };

  // Circular Progress Bar component for OEE
  const CircularProgress = ({ value, color, label }: { value: number, color: string, label: string }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ position: 'relative', width: '50px', height: '50px' }}>
          <svg width="50" height="50" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="25" cy="25" r={radius} fill="transparent" stroke="var(--border)" strokeWidth="4" />
            <circle cx="25" cy="25" r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            {value}%
          </div>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <Cpu size={32} color="#8B5CF6" />
            {_t('لوحة تحكم أرضية المصنع (MES & OEE)', 'MES Shopfloor & Realtime OEE')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '700px', lineHeight: '1.6' }}>
            {_t(
              'مراقبة حية للمعدات والآلات، وتحليل الفعالية الكلية للمعدات (OEE) من خلال قياس التوفر (Availability)، الأداء (Performance)، والجودة (Quality).',
              'Real-time monitoring of shop floor machines, analyzing Overall Equipment Effectiveness (OEE) via Availability, Performance, and Quality metrics.'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: '#8B5CF6', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
            {_t('تحديث حي: مفعل', 'Live Sync: Active')}
          </div>
          <button onClick={fetchMesData} style={{ padding: '10px 16px', background: '#8B5CF6', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('تحديث', 'Refresh')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: `4px solid ${getOeeColor(data.factorySummary.overallOEE)}`, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('متوسط كفاءة المصنع (OEE)', 'Overall Factory OEE')}</div>
              <Activity size={24} color={getOeeColor(data.factorySummary.overallOEE)} />
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: getOeeColor(data.factorySummary.overallOEE), fontFamily: 'monospace' }}>
              {data.factorySummary.overallOEE}%
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #10B981', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('الآلات قيد التشغيل', 'Active Machines')}</div>
              <PlayCircle size={24} color="#10B981" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', fontFamily: 'monospace' }}>
              {data.factorySummary.activeMachinesCount} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {data.machines.length}</span>
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #3B82F6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي الإنتاج', 'Total Produced')}</div>
              <CheckCircle2 size={24} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#3B82F6', fontFamily: 'monospace' }}>
              {formatNumber(data.factorySummary.totalProduced)}
            </div>
          </div>

          <div style={{ padding: '24px', background: data.factorySummary.downtimeAlerts > 0 ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' : 'var(--bg-card)', borderRadius: '16px', color: data.factorySummary.downtimeAlerts > 0 ? 'white' : 'var(--text)', borderLeft: data.factorySummary.downtimeAlerts === 0 ? '4px solid var(--border)' : 'none', boxShadow: data.factorySummary.downtimeAlerts > 0 ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: data.factorySummary.downtimeAlerts > 0 ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('تنبيهات التوقف', 'Downtime Alerts')}</div>
              <AlertTriangle size={24} color={data.factorySummary.downtimeAlerts > 0 ? 'white' : 'var(--text-muted)'} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace' }}>
              {data.factorySummary.downtimeAlerts}
            </div>
          </div>

        </div>
      )}

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {loading && !data ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '16px' }}>{_t('جاري الاتصال بالآلات...', 'Connecting to machines...')}</div>
          </div>
        ) : (
          data?.machines.map((m, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
              
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-muted)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{m.name}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{m.machineId}</div>
                </div>
                {renderStatus(m.status)}
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ textAlign: 'center', flex: 1, borderRight: lang === 'ar' ? 'none' : '1px solid var(--border)', borderLeft: lang === 'ar' ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: getOeeColor(m.oee.oeeScore), fontFamily: 'monospace' }}>{m.oee.oeeScore}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{_t('OEE', 'OEE')}</div>
                  </div>
                  
                  <div style={{ flex: 2, display: 'flex', justifyContent: 'space-evenly' }}>
                    <CircularProgress value={m.oee.availability} color="#3B82F6" label={_t('التوفر', 'Avail')} />
                    <CircularProgress value={m.oee.performance} color="#8B5CF6" label={_t('الأداء', 'Perf')} />
                    <CircularProgress value={m.oee.quality} color="#10B981" label={_t('الجودة', 'Qual')} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-muted)', padding: '12px', borderRadius: '8px', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>{_t('أمر التشغيل:', 'Job:')}</span> <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{m.currentJob || '-'}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{_t('المشغل:', 'Operator:')}</span> <span style={{ fontWeight: 'bold' }}>{m.operator || '-'}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{_t('زمن العمل:', 'Uptime:')}</span> <span style={{ fontWeight: 'bold', color: '#10B981' }}>{m.uptimeMinutes}m</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{_t('زمن التوقف:', 'Downtime:')}</span> <span style={{ fontWeight: 'bold', color: m.downtimeMinutes > 0 ? '#EF4444' : 'var(--text-muted)' }}>{m.downtimeMinutes}m</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{_t('الإنتاج السليم:', 'Good Units:')}</span> <span style={{ fontWeight: 'bold' }}>{formatNumber(m.producedUnits - m.defectiveUnits)}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{_t('العيوب:', 'Defects:')}</span> <span style={{ fontWeight: 'bold', color: m.defectiveUnits > 0 ? '#F59E0B' : 'var(--text-muted)' }}>{formatNumber(m.defectiveUnits)}</span></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(139, 92, 246, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); } }
      `}</style>
    </div>
  );
}
