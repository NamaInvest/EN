'use client';

import { useState } from 'react';
import { School, User, GraduationCap, CheckCircle2, Download, AlertTriangle, Key } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function ParentPortalPage() {
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
      const res = await fetch('/api/portals/parent', {
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
      setError(t('sys.str_1643'));
    }
    setLoading(false);
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#fdf4ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <GraduationCap size={40} color="#d946ef" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px', color: '#111827' }}>{t('sys.str_1624')}</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>{t('sys.str_1625')}</p>
          
          <form onSubmit={handleLogin}>
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>{t('sys.str_1626')}</label>
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
              style={{ width: '100%', padding: '14px', backgroundColor: '#d946ef', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? t('sys.str_1644') : t('sys.str_1645')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { students } = data;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Noto Sans Arabic, sans-serif' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#86198f', color: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{t('sys.str_1627')}</h2>
          <span style={{ color: '#fbcfe8', fontSize: '13px' }}>{t('sys.str_1628')}{data.guardianPhone}</span>
        </div>
        <button onClick={() => setData(null)} style={{ background: '#701a75', border: '1px solid #4a044e', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{t('sys.str_1629')}</button>
      </div>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: '0', fontSize: '20px', color: '#111827' }}>{t('sys.str_1630')}{students.length})</h3>
        
        {students.map((student: any) => (
          <div key={student.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid #f3f4f6', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: '#fdf4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="#d946ef" />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827' }}>{student.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {t('sys.str_1631')}<strong style={{color:'#6366f1'}}>{student.studentCode}</strong>
                  </div>
                </div>
              </div>
              <div>
                {student.status === 'ENROLLED' ? <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{t('sys.str_1632')}</span> :
                 student.status === 'GRADUATED' ? <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{t('sys.str_1633')}</span> :
                 <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{t('sys.str_1634')}</span>}
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px', fontSize: '15px', color: '#374151' }}><School size={16} style={{display:'inline', marginRight:'6px'}}/> {t('sys.str_1635')}</h4>
              
              {student.enrollments?.length === 0 ? <p style={{ fontSize: '13px', color: '#9ca3af' }}>{t('sys.str_1636')}</p> : 
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {student.enrollments?.map((en: any) => (
                    <div key={en.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#111827' }}>{t('sys.str_1637')}{en.academicClass?.className}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{t('sys.str_1638')}{en.academicClass?.gradeLevel}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{t('sys.str_1639')}</div>
                        <div style={{ fontWeight: 'bold', color: '#d946ef', fontSize: '16px' }}>{en.tuitionFee.toLocaleString()} {t('sys.str_1640')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              }

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                 <button style={{ flex: 1, border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Download size={16} /> {t('sys.str_1641')}</button>
                 <button style={{ flex: 1, border: 'none', backgroundColor: '#1d4ed8', color: 'white', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {t('sys.str_1642')}</button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

