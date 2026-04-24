'use client';

import { useState } from 'react';
import { Home, Phone, Upload, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function TenantPortalPage() {
    const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/portals/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(t('sys.str_1664'));
    }
    setLoading(false);
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#eef2ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Key size={40} color="#6366f1" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px', color: '#111827' }}>{t('sys.str_1646')}</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>{t('sys.str_1647')}</p>
          
          <form onSubmit={handleLogin}>
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>{t('sys.str_1648')}</label>
              <input 
                type="tel" 
                placeholder="05XXXXXXXX" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '16px', textAlign: 'left', direction: 'ltr' }}
                required
              />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? t('sys.str_1665') : t('sys.str_1666')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { tenant, leases } = data;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Noto Sans Arabic, sans-serif' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#fff', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>{t('sys.str_1562')}{tenant.name}</h2>
          <span style={{ color: '#6b7280', fontSize: '13px' }}>{t('sys.str_1649')}</span>
        </div>
        <button onClick={() => setData(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>{t('sys.str_1629')}</button>
      </div>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>{t('sys.str_1650')}</h3>
        
        {leases.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
            {t('sys.str_1651')}</div>
        ) : (
          leases.map((lease: any) => (
            <div key={lease.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ backgroundColor: lease.status === 'ACTIVE' ? '#10b981' : '#f59e0b', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={20} /> <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{lease.unit?.property?.name || t('sys.str_1667')} {t('sys.str_1652')}{lease.unit?.unitNumber}</span></div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px' }}>{t('sys.str_1653')}{lease.contractNumber}</div>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{t('sys.str_1654')}</div>
                    <div style={{ fontWeight: 'bold' }}>{new Date(lease.startDate).toLocaleDateString('ar-SA')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{t('sys.str_1655')}</div>
                    <div style={{ fontWeight: 'bold' }}>{new Date(lease.endDate).toLocaleDateString('ar-SA')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{t('sys.str_1656')}</div>
                    <div style={{ fontWeight: 'bold', color: '#6366f1' }}>{lease.rentAmount.toLocaleString('ar-SA')} {t('sys.str_1640')}</div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 15px', fontSize: '15px' }}>{t('sys.str_1657')}</h4>
                
                {lease.installments?.length === 0 ? <p style={{ fontSize: '13px', color: '#9ca3af' }}>{t('sys.str_1658')}</p> : 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lease.installments?.map((inst: any) => (
                      <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: inst.isPaid ? '#f0fdf4' : '#fff' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '15px', color: inst.isPaid ? '#15803d' : '#111827' }}>{inst.amount.toLocaleString()} {t('sys.str_1640')}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{t('sys.str_1659')}{new Date(inst.dueDate).toLocaleDateString('ar-SA')}</div>
                        </div>
                        <div>
                          {inst.isPaid ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#15803d', fontSize: '13px', fontWeight: 'bold' }}><CheckCircle2 size={16} /> {t('sys.str_1660')}</span>
                          ) : (
                            <button style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>{t('sys.str_1661')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                }

                <div style={{ marginTop: '30px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4b5563', fontSize: '14px', fontWeight: 'bold' }}><AlertTriangle size={18} color="#f59e0b" /> {t('sys.str_1662')}</div>
                   <button style={{ border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', padding: '8px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{t('sys.str_1663')}</button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

