'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Server, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function SystemHealthDashboard() {
    const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sys/health');
      if (res.ok) {
        setData(await res.json());
      }
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('sys.str_2683')}</div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={28} color="#ef4444" /> {t('sys.str_2684')}</h1>
        <button onClick={fetchHealth} disabled={loading} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> {t('sys.str_2685')}</button>
      </div>

      <div className="page-content animate-fade-in">
        
        {/* Master Database and System Core Health */}
        <div className="kpi-grid" style={{ marginBottom: '20px' }}>
          <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#eef2ff', borderColor: '#c7d2fe' }}>
            <div style={{ background: '#4f46e5', color: 'white', padding: '15px', borderRadius: '12px' }}>
              <Database size={32} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{t('sys.str_2686')}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                {data.database?.status} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#16a34a' }}>({data.database?.latency})</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#fffbeb', borderColor: '#fde68a' }}>
            <div style={{ background: '#d97706', color: 'white', padding: '15px', borderRadius: '12px' }}>
              <Cpu size={32} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{t('sys.str_2687')}{data.system?.cpus})</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                Load Avg: {data.system?.loadAvg}
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <div style={{ background: '#059669', color: 'white', padding: '15px', borderRadius: '12px' }}>
              <HardDrive size={32} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{t('sys.str_2688')}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                 {data.system?.freeMem} GB <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280' }}>/ {data.system?.totalMem} {t('sys.str_2689')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 10 Servers Master Array (PM2) */}
        <div className="card" style={{ padding: '0', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
              <Server size={18} /> {t('sys.str_2690')}</h3>
          </div>
          
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th>{t('sys.str_2691')}</th>
                <th>{t('sys.str_2692')}</th>
                <th>{t('sys.str_2693')}</th>
                <th>{t('sys.str_2694')}</th>
                <th>{t('sys.str_2695')}</th>
                <th>{t('sys.str_2696')}</th>
              </tr>
            </thead>
            <tbody>
              {!data.nodes || data.nodes.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>{t('sys.str_2697')}</td></tr>
              ) : data.nodes.map((node: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 'bold', color: '#475569' }}>
                     <Server size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                     {node.name.toUpperCase()}
                  </td>
                  <td>
                    {node.status === 'online' ? (
                      <span className="badge badge-success">{t('sys.str_2698')}</span>
                    ) : node.status === 'stopping' || node.status === 'stopped' ? (
                      <span className="badge badge-danger">{t('sys.str_2699')}</span>
                    ) : (
                      <span className="badge badge-warning">{node.status}</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{node.memory}</td>
                  <td style={{ color: parseFloat(node.cpu) > 80 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>{node.cpu}</td>
                  <td style={{ color: '#64748b' }}>{node.uptime}</td>
                  <td>
                    {node.restarts > 0 ? (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{node.restarts} {t('sys.str_2700')}</span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>{t('sys.str_2701')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '20px', padding: '15px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
          <strong>{t('sys.str_2702')}</strong> {t('sys.str_2703')}</div>

      </div>
    </>
  );
}
