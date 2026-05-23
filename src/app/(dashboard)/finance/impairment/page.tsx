'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n';
import { Shield, RefreshCw, AlertTriangle, ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

interface ImpairmentItem {
  assetId: string;
  assetName: string;
  carryingAmount: number;
  fairValueLessCosts: number;
  valueInUse: number;
  recoverableAmount: number;
  impairmentLoss: number;
  isImpaired: boolean;
}

interface ImpairmentData {
  asOfDate: string;
  items: ImpairmentItem[];
  summary: {
    totalCarryingAmount: number;
    totalRecoverableAmount: number;
    totalImpairmentLoss: number;
    impairedAssetsCount: number;
    safeAssetsCount: number;
  };
}

export default function ImpairmentPage() {
    const { error: toastError, success: toastSuccess } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ImpairmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchImpairmentData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/impairment?date=${asOfDate}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toastError(json.error || 'Failed to fetch Impairment Data');
      }
    } catch (err) {
      console.error(err);
      toastError('فشل الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    fetchImpairmentData();
  }, [fetchImpairmentData]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(num);
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <AlertTriangle size={32} color="#F59E0B" />
            {_t('انخفاض قيمة الأصول (IAS 36)', 'Impairment of Assets (IAS 36)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '600px', lineHeight: '1.6' }}>
            {_t(
              'محرك تقييم الأصول. يتحقق ما إذا كانت القيمة الدفترية للأصل تتجاوز قيمته الاستردادية (أيهما أعلى: القيمة العادلة ناقصاً تكاليف البيع، أو القيمة قيد الاستخدام).',
              'Asset evaluation engine. Checks if the carrying amount of an asset exceeds its recoverable amount (higher of fair value less costs to sell, or value in use).'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('تاريخ التقييم', 'Valuation Date')}</label>
            <input 
              type="date" 
              className="input" 
              value={asOfDate} 
              onChange={e => setAsOfDate(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text)' }}
            />
          </div>
          
          <button onClick={fetchImpairmentData} style={{ marginTop: '20px', padding: '10px', background: '#F59E0B', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('تحديث التقييم', 'Run Valuation')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #3B82F6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي القيمة الدفترية', 'Total Carrying Amount')}</div>
              <Activity size={24} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#3B82F6', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalCarryingAmount)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {_t('قبل احتساب أي انخفاض', 'Before impairment deduction')}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #EF4444', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي خسائر الانخفاض', 'Total Impairment Loss')}</div>
              <ArrowDownRight size={24} color="#EF4444" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#EF4444', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalImpairmentLoss)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {_t('الخسارة المعترف بها في قائمة الدخل', 'Loss recognized in P&L')}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600' }}>{_t('حالة الأصول', 'Assets Health')}</div>
              <Shield size={24} color="white" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', fontFamily: 'monospace', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              {data.summary.impairedAssetsCount} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{_t('منخفضة', 'Impaired')}</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
              {data.summary.safeAssetsCount} {_t('أصول سليمة', 'Healthy Assets')}
            </div>
          </div>

        </div>
      )}

      {/* Details Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} color="#F59E0B" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{_t('سجل التقييم', 'Valuation Log')}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الأصل', 'Asset')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('القيمة الدفترية', 'Carrying Amt')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('القيمة العادلة', 'Fair Value')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('قيد الاستخدام', 'Value in Use')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>{_t('القيمة الاستردادية', 'Recoverable Amt')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: '#EF4444' }}>{_t('خسارة الانخفاض', 'Impairment Loss')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '16px' }}>{_t('جاري التقييم المالي...', 'Running valuation models...')}</div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Shield size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '16px' }}>{_t('لا توجد أصول لتقييمها', 'No assets found to evaluate')}</div>
                  </td>
                </tr>
              ) : (
                data?.items.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: row.isImpaired ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text)' }}>
                      {row.assetName}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{_t('المعرف:', 'ID:')}{row.assetId}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {formatCurrency(row.carryingAmount)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500', color: 'var(--text-muted)' }}>
                      {formatCurrency(row.fairValueLessCosts)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500', color: 'var(--text-muted)' }}>
                      {formatCurrency(row.valueInUse)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '800', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)', color: '#3B82F6' }}>
                      {formatCurrency(row.recoverableAmount)}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {row.recoverableAmount === row.fairValueLessCosts ? _t('(القيمة العادلة اعلى)', '(Fair Value Used)') : _t('(قيد الاستخدام اعلى)', '(Value in Use Used)')}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '900', color: row.isImpaired ? '#EF4444' : 'var(--text-muted)' }}>
                      {row.isImpaired ? formatCurrency(row.impairmentLoss) : '-'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {row.isImpaired ? (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowDownRight size={14} /> {_t('منخفض', 'Impaired')}
                        </span>
                      ) : (
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUpRight size={14} /> {_t('سليم', 'Healthy')}
                        </span>
                      )}
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
