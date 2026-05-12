'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n';
import { Network, RefreshCw, AlertCircle, TrendingUp, CheckCircle, Percent, AlertOctagon } from 'lucide-react';

interface IntercompanyTransaction {
  id: string;
  relatedPartyName: string;
  relationshipType: string;
  transactionType: string;
  costAmount: number;
  transferPrice: number;
  markupPercentage: number;
  isArmsLength: boolean;
  varianceFromBenchmark: number;
}

interface TransferPricingData {
  asOfDate: string;
  benchmarkMarkup: { min: number; max: number };
  transactions: IntercompanyTransaction[];
  summary: {
    totalIntercompanyVolume: number;
    totalAtRiskVolume: number;
    complianceScore: number;
    highRiskCount: number;
  };
}

export default function TransferPricingPage() {
    const { error: toastError, success: toastSuccess } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [minMarkup, setMinMarkup] = useState<number>(5);
  const [maxMarkup, setMaxMarkup] = useState<number>(15);
  const [data, setData] = useState<TransferPricingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransferPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/transfer-pricing?date=${asOfDate}&min=${minMarkup / 100}&max=${maxMarkup / 100}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toastError(json.error || 'Failed to fetch Transfer Pricing Data');
      }
    } catch (err) {
      console.error(err);
      toastError('فشل الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  }, [asOfDate, minMarkup, maxMarkup]);

  useEffect(() => {
    fetchTransferPricing();
  }, [fetchTransferPricing]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const getRelationshipLabel = (type: string) => {
    const map: Record<string, string> = {
      'SUBSIDIARY': _t('شركة تابعة', 'Subsidiary'),
      'PARENT': _t('الشركة الأم', 'Parent Company'),
      'JOINT_VENTURE': _t('مشروع مشترك', 'Joint Venture'),
      'KEY_MANAGEMENT': _t('إدارة عليا', 'Key Management')
    };
    return map[type] || type;
  };

  const getTxTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      'SALES': _t('مبيعات بضائع', 'Goods Sales'),
      'SERVICES': _t('تقديم خدمات', 'Services'),
      'LOAN': _t('قروض تمويلية', 'Loans'),
      'ROYALTY': _t('حقوق ملكية/امتياز', 'Royalties')
    };
    return map[type] || type;
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <Network size={32} color="#0EA5E9" />
            {_t('التسعير التحويلي (Transfer Pricing)', 'Transfer Pricing (IAS 24)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '650px', lineHeight: '1.6' }}>
            {_t(
              'محرك فحص تسعير المعاملات بين الأطراف ذات العلاقة. يضمن توافق هوامش الربح مع مبدأ "السعر المحايد" (Arm\'s Length Principle) لتجنب غرامات هيئة الزكاة والدريبة والجمارك (ZATCA).',
              'Intercompany transaction pricing engine. Ensures profit margins comply with the Arm\'s Length Principle (ALP) to mitigate tax authority audit risks.'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('الحد الأدنى للمارجن (%)', 'Min Margin (%)')}</label>
            <input 
              type="number" 
              className="input" 
              value={minMarkup} 
              onChange={e => setMinMarkup(Number(e.target.value))}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text)', width: '90px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('الحد الأقصى (%)', 'Max Margin (%)')}</label>
            <input 
              type="number" 
              className="input" 
              value={maxMarkup} 
              onChange={e => setMaxMarkup(Number(e.target.value))}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text)', width: '90px' }}
            />
          </div>
          
          <button onClick={fetchTransferPricing} style={{ marginTop: '20px', padding: '10px', background: '#0EA5E9', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('فحص الامتثال', 'Run Audit')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #8B5CF6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي المعاملات البينية', 'Total Intercompany Volume')}</div>
              <TrendingUp size={24} color="#8B5CF6" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#8B5CF6', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalIntercompanyVolume)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {_t('حجم التداول مع الأطراف ذات العلاقة', 'Volume with related parties')}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #EF4444', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('مبالغ عالية المخاطر', 'At-Risk Volume')}</div>
              <AlertOctagon size={24} color="#EF4444" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#EF4444', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalAtRiskVolume)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {_t('معاملات خارج النطاق المحايد', 'Transactions outside ALP range')}
            </div>
          </div>

          <div style={{ padding: '24px', background: `linear-gradient(135deg, ${data.summary.complianceScore >= 80 ? '#10B981' : (data.summary.complianceScore >= 50 ? '#F59E0B' : '#EF4444')} 0%, ${data.summary.complianceScore >= 80 ? '#059669' : (data.summary.complianceScore >= 50 ? '#D97706' : '#B91C1C')} 100%)`, borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>{_t('درجة الامتثال الضريبي', 'Tax Compliance Score')}</div>
              {data.summary.complianceScore >= 80 ? <CheckCircle size={24} color="white" /> : <AlertCircle size={24} color="white" />}
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: 'white', fontFamily: 'monospace' }}>
              {data.summary.complianceScore}%
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
              {data.summary.highRiskCount} {_t('مخالفات تم رصدها', 'Violations Detected')}
            </div>
          </div>

        </div>
      )}

      {/* Details Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Percent size={20} color="#0EA5E9" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{_t('سجل المعاملات البينية (Intercompany Ledger)', 'Intercompany Transactions Ledger')}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الطرف ذو العلاقة', 'Related Party')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('طبيعة العلاقة', 'Relationship')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('التكلفة الأصلية', 'Base Cost')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>{_t('سعر التحويل (المسجل)', 'Transfer Price')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('هامش الربح (Markup)', 'Markup Margin')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('التقييم المحايد (ALP)', 'ALP Status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '16px' }}>{_t('جاري التدقيق في سجلات المعاملات...', 'Auditing transaction ledgers...')}</div>
                  </td>
                </tr>
              ) : data?.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '16px' }}>{_t('لا توجد معاملات مع أطراف ذات علاقة', 'No intercompany transactions found')}</div>
                  </td>
                </tr>
              ) : (
                data?.transactions.map((row, idx) => {
                  const markupRender = (row.markupPercentage * 100).toFixed(1) + '%';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: !row.isArmsLength ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text)' }}>
                        {row.relatedPartyName}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>Tx: {row.id} • {getTxTypeLabel(row.transactionType)}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '4px 8px', borderRadius: '4px' }}>
                          {getRelationshipLabel(row.relationshipType)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500', color: 'var(--text-muted)' }}>
                        {formatCurrency(row.costAmount)}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '800', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)', color: !row.isArmsLength ? '#EF4444' : 'var(--text)' }}>
                        {formatCurrency(row.transferPrice)}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '900', color: !row.isArmsLength ? '#EF4444' : '#10B981' }}>
                        {markupRender}
                        {!row.isArmsLength && (
                          <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '4px' }}>
                            {row.markupPercentage < data.benchmarkMarkup.min ? _t('تحت الحد الأدنى', 'Below Min') : _t('فوق الحد الأقصى', 'Above Max')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {row.isArmsLength ? (
                          <span style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> {_t('آمن (متوافق)', 'ALP Compliant')}
                          </span>
                        ) : (
                          <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} /> {_t('مخاطرة ضريبية', 'Audit Risk')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
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
