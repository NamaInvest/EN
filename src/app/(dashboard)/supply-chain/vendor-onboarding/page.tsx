'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { UserCheck, RefreshCw, FileText, ShieldAlert, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

interface VendorComplianceDoc {
  docType: string;
  isUploaded: boolean;
  isValid: boolean;
  expiryDate?: string;
}

interface VendorScoring {
  vendorId: string;
  vendorName: string;
  category: string;
  yearsInBusiness: number;
  financialScore: number;
  qualityScore: number;
  docs: VendorComplianceDoc[];
  overallRiskScore: number;
  approvalStatus: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'PROBATION';
}

interface VendorOnboardingData {
  asOfDate: string;
  vendors: VendorScoring[];
  summary: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    highRiskVendors: number;
  };
}

export default function VendorOnboardingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<VendorOnboardingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supply-chain/vendor-onboarding`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to fetch Vendor Data');
      }
    } catch (err) {
      console.error(err);
      alert('Network error fetching Vendor data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const getDocLabel = (type: string) => {
    const map: Record<string, string> = {
      'CR': _t('سجل تجاري', 'CR'),
      'ZATCA_CERT': _t('شهادة الزكاة', 'ZATCA'),
      'GOSI': _t('تأمينات اجتماعية', 'GOSI'),
      'MUDAD': _t('منصة مدد', 'MUDAD'),
      'BANK_LETTER': _t('آيبان بنكي', 'IBAN')
    };
    return map[type] || type;
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> {_t('معتمد', 'Approved')}</span>;
      case 'REJECTED': return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14}/> {_t('مرفوض', 'Rejected')}</span>;
      case 'PROBATION': return <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14}/> {_t('فترة تجربة', 'Probation')}</span>;
      default: return <span style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {_t('قيد المراجعة', 'Pending')}</span>;
    }
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <UserCheck size={32} color="#10B981" />
            {_t('بوابة تأهيل الموردين', 'Vendor Onboarding Portal')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '650px', lineHeight: '1.6' }}>
            {_t(
              'محرك ذكي لتقييم الموردين الجدد واعتمادهم بناءً على امتثالهم للوثائق الرسمية (الزكاة، مدد، التأمينات) وتحليل المخاطر المالية والتشغيلية.',
              'Smart vendor evaluation engine. Approves new vendors based on official compliance docs (ZATCA, MUDAD, GOSI) and financial/operational risk analysis.'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchVendorData} style={{ padding: '10px 16px', background: '#10B981', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('تحديث السجلات', 'Refresh Records')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #10B981', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('موردون معتمدون', 'Approved Vendors')}</div>
              <CheckCircle size={24} color="#10B981" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', fontFamily: 'monospace' }}>
              {data.summary.totalApproved}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #F59E0B', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('تحت التجربة', 'On Probation')}</div>
              <Activity size={24} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>
              {data.summary.totalPending}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #EF4444', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('طلبات مرفوضة', 'Rejected Applications')}</div>
              <XCircle size={24} color="#EF4444" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#EF4444', fontFamily: 'monospace' }}>
              {data.summary.totalRejected}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>{_t('عالي المخاطر', 'High Risk Detected')}</div>
              <ShieldAlert size={24} color="white" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'monospace' }}>
              {data.summary.highRiskVendors}
            </div>
          </div>

        </div>
      )}

      {/* Details Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={20} color="#10B981" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{_t('قائمة الموردين المتقدمين', 'Vendor Applicant List')}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('اسم المورد', 'Vendor Name')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('التصنيف', 'Category')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('نقاط القوة', 'Strength Scores')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('وثائق الامتثال', 'Compliance Docs')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>{_t('مؤشر الخطر', 'Risk Score')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('القرار الآلي', 'System Decision')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '16px' }}>{_t('جاري جلب وفحص المستندات...', 'Fetching and validating documents...')}</div>
                  </td>
                </tr>
              ) : data?.vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <UserCheck size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '16px' }}>{_t('لا توجد طلبات تسجيل حالية', 'No registration requests')}</div>
                  </td>
                </tr>
              ) : (
                data?.vendors.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text)' }}>
                      {row.vendorName}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{row.vendorId} • {_t('تأسس منذ', 'Est. years:')} {row.yearsInBusiness}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '4px 8px', borderRadius: '4px' }}>
                        {row.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', width: '30px' }}>{_t('مالي:', 'Fin:')}</span>
                        <div style={{ flex: 1, background: 'var(--bg-muted)', height: '6px', borderRadius: '3px', overflow: 'hidden', minWidth: '50px' }}>
                          <div style={{ background: row.financialScore > 70 ? '#10B981' : '#F59E0B', width: `${row.financialScore}%`, height: '100%' }}></div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{row.financialScore}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', width: '30px' }}>{_t('جودة:', 'QA:')}</span>
                        <div style={{ flex: 1, background: 'var(--bg-muted)', height: '6px', borderRadius: '3px', overflow: 'hidden', minWidth: '50px' }}>
                          <div style={{ background: row.qualityScore > 70 ? '#3B82F6' : '#F59E0B', width: `${row.qualityScore}%`, height: '100%' }}></div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{row.qualityScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                        {row.docs.map((doc, dIdx) => (
                          <span key={dIdx} title={doc.isValid ? 'Valid' : 'Missing/Invalid'} style={{ 
                            fontSize: '10px', 
                            fontWeight: 'bold', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            background: doc.isValid ? '#DCFCE7' : '#FEE2E2',
                            color: doc.isValid ? '#166534' : '#991B1B',
                            textDecoration: doc.isValid ? 'none' : 'line-through'
                          }}>
                            {getDocLabel(doc.docType)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'monospace', color: row.overallRiskScore < 30 ? '#10B981' : (row.overallRiskScore < 75 ? '#F59E0B' : '#EF4444') }}>
                        {row.overallRiskScore}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{_t('من 100', '/ 100')}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {renderStatus(row.approvalStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
