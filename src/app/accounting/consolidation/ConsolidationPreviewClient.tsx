'use client';

import React, { useState, useEffect } from 'react';

interface Company {
  id: number;
  name: string;
  isParent: boolean;
  ownership: number | string;
}

interface ConsolidatedRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentId: number | null;
  balances: Record<number, number>; // companyId -> balance
  eliminationDebit: number;
  eliminationCredit: number;
  consolidatedNet: number;
}

interface IntercompanyMatch {
  ruleName: string;
  ruleType: string;
  sourceAccount: string;
  sourceAccountName: string;
  targetAccount: string;
  targetAccountName: string;
  receivableBalance: number;
  payableBalance: number;
  difference: number;
  eliminationAmount: number;
  status: 'MATCHED' | 'MISMATCHED' | 'NO_BALANCE';
}

interface CompanyBranchValidation {
  companyId: number;
  companyName: string;
  hasBranches: boolean;
  branchCount: number;
  hasTransactions: boolean;
  status: 'VALID' | 'WARNING_NO_BRANCHES' | 'WARNING_NO_TRANSACTIONS';
}

interface ConsolidationData {
  groupId: number;
  groupName: string;
  fiscalPeriodId: number;
  baseCurrency: string;
  rows: ConsolidatedRow[];
  companies: Company[];
  isBalanced: boolean;
  generatedAt: string;
  // F-13B extensions
  mappingCompletenessScore: number;
  intercompanyMatches: IntercompanyMatch[];
  companyBranchValidations: CompanyBranchValidation[];
}

export default function ConsolidationPreviewClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date and parameters state
  const [groupId, setGroupId] = useState<string>('1');
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  });

  const [activeTab, setActiveTab] = useState<'TRIAL_BALANCE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'ELIMINATIONS_MAPPING'>('TRIAL_BALANCE');
  const [data, setData] = useState<ConsolidationData | null>(null);

  // Group options mock for dropdown (in real environment populated from groups API)
  const groupOptions = [
    { id: '1', name: 'مجموعة نماء القابضة (الرئيسية + التوابع)' },
    { id: '2', name: 'مجموعة نماء للشركات الخدمية' },
    { id: '3', name: 'مجموعة نماء للتطوير العقاري المشتركة' }
  ];

  const handleFetchPreview = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/accounting/consolidation/preview?groupId=${groupId}&from=${dateFrom}&to=${dateTo}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(
          res.status === 400
            ? 'يرجى التحقق من المدخلات ومطابقة الخيارات المدخلة'
            : 'فشل جلب وتوحيد القوائم المالية لمجموعة الحسابات المحددة'
        );
      }
      
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'حدث خطأ أثناء إجراء معالجة التوحيد');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'فشل الاتصال بالخادم المحاسبي';
      setError(errMsg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, dateFrom, dateTo]);

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        if (active) {
          handleFetchPreview();
        }
      });
    }
    return () => {
      active = false;
    };
  }, [handleFetchPreview]);

  // Filter rows by sheet tab
  const getFilteredRows = () => {
    if (!data) return [];
    
    switch (activeTab) {
      case 'BALANCE_SHEET':
        // Assets: type 1xxx, Liabilities: type 2xxx, Equity: type 3xxx
        return data.rows.filter(r => {
          const firstChar = r.accountCode.charAt(0);
          return firstChar === '1' || firstChar === '2' || firstChar === '3';
        });
      case 'INCOME_STATEMENT':
        // Revenue: type 4xxx, Expenses/COGS: type 5xxx
        return data.rows.filter(r => {
          const firstChar = r.accountCode.charAt(0);
          return firstChar === '4' || firstChar === '5';
        });
      case 'TRIAL_BALANCE':
      default:
        return data.rows;
    }
  };

  const getFormatValue = (val: number | undefined) => {
    if (val === undefined) return '-';
    const num = Number(val);
    if (Math.abs(num) < 0.01) return '-';
    return num.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', color: '#1e293b', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 معاينة توحيد القوائم المالية (Financial Consolidation Preview)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            معاينة فورية لتجميع الأرصدة وإجراء الاستبعادات للعمليات البينية (Intercompany Eliminations) طبقاً لمعايير IFRS 10 / IAS 21 بشكل آمن تماماً.
          </p>
        </div>
      </div>

      {/* Settings & Filters Panel */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>مجموعة التوحيد</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155' }}
            >
              {groupOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>التاريخ من</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>التاريخ إلى</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155' }}
            />
          </div>

          <div>
            <button
              onClick={handleFetchPreview}
              disabled={loading}
              style={{ width: '100%', padding: '10px 16px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ جاري الحساب والتجميع...' : '🔄 معالجة وتحديث المعاينة'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '16px', color: '#b91c1c', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong style={{ fontSize: '14px', display: 'block' }}>حدث خطأ أثناء إجراء المعالجة:</strong>
            <span style={{ fontSize: '13px' }}>{error}</span>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Status & Metainfo Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                اسم المجموعة: <strong style={{ color: '#0f172a' }}>{data.groupName}</strong>
              </span>
              <span style={{ height: '14px', width: '1px', backgroundColor: '#cbd5e1' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                العملة الأساسية: <strong style={{ color: '#0f172a' }}>{data.baseCurrency}</strong>
              </span>
              <span style={{ height: '14px', width: '1px', backgroundColor: '#cbd5e1' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                مؤشر اكتمال الربط: <strong style={{ color: '#4f46e5' }}>{data.mappingCompletenessScore ?? 100}%</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {data.isBalanced ? (
                <span style={{ padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '700', border: '1px solid #bbf7d0' }}>
                  ✓ ميزان مجمع متوازن (Balanced)
                </span>
              ) : (
                <span style={{ padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: '700', border: '1px solid #fca5a5' }}>
                  ⚠️ ميزان غير متوازن (Out of Balance)
                </span>
              )}
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('TRIAL_BALANCE')}
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '700', border: 'none', borderBottom: activeTab === 'TRIAL_BALANCE' ? '3px solid #4f46e5' : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === 'TRIAL_BALANCE' ? '#4f46e5' : '#64748b', transition: 'all 0.2s' }}
            >
              📊 ميزان المراجعة الموحد
            </button>
            <button
              onClick={() => setActiveTab('INCOME_STATEMENT')}
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '700', border: 'none', borderBottom: activeTab === 'INCOME_STATEMENT' ? '3px solid #4f46e5' : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === 'INCOME_STATEMENT' ? '#4f46e5' : '#64748b', transition: 'all 0.2s' }}
            >
              💰 قائمة الدخل الموحدة
            </button>
            <button
              onClick={() => setActiveTab('BALANCE_SHEET')}
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '700', border: 'none', borderBottom: activeTab === 'BALANCE_SHEET' ? '3px solid #4f46e5' : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === 'BALANCE_SHEET' ? '#4f46e5' : '#64748b', transition: 'all 0.2s' }}
            >
              🏛️ الميزانية العمومية الموحدة
            </button>
            <button
              onClick={() => setActiveTab('ELIMINATIONS_MAPPING')}
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '700', border: 'none', borderBottom: activeTab === 'ELIMINATIONS_MAPPING' ? '3px solid #4f46e5' : '3px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === 'ELIMINATIONS_MAPPING' ? '#4f46e5' : '#64748b', transition: 'all 0.2s' }}
            >
              🔄 الاستبعادات ومطابقة الحسابات البينية
            </button>
          </div>

          {activeTab === 'ELIMINATIONS_MAPPING' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Mapping Completeness Score Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>مؤشر اكتمال مطابقة المجموعة</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#4f46e5' }}>{data.mappingCompletenessScore ?? 100}%</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>تكامل ربط الفروع وتوازن المعاملات البينية المقترنة.</p>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>عدد قواعد الاستبعاد الفعالة</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{data.intercompanyMatches?.length ?? 0}</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>القواعد النشطة لمطابقة الأرصدة المدينة والدائنة.</p>
                </div>
              </div>

              {/* Subsidiary Company health mapping validation */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>🔒 صحة وعزل الفروع التابعة للشركات</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {data.companyBranchValidations?.map(comp => (
                    <div key={comp.companyId} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{comp.companyName}</strong>
                        {comp.status === 'VALID' ? (
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d' }}>سليم</span>
                        ) : comp.status === 'WARNING_NO_BRANCHES' ? (
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>بلا فروع</span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#d97706' }}>بلا معاملات</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        <div>عدد الفروع المرتبطة: <strong>{comp.branchCount}</strong></div>
                        <div>حالة النشاط المالي: <strong>{comp.hasTransactions ? 'نشط مالياً' : 'راكد'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed intercompany pairings grid */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>🔄 تفاصيل مطابقة وتوازن العمليات المحاسبية البينية</h3>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', minWidth: '850px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155' }}>القاعدة والمحور البيني</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155' }}>حساب المدينين (AR)</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155', textAlign: 'left' }}>رصيد المدينين</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155' }}>حساب الدائنين (AP)</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155', textAlign: 'left' }}>رصيد الدائنين</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#1e40af', textAlign: 'left', backgroundColor: '#eff6ff' }}>قيمة الاستبعاد الآمن</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#b45309', textAlign: 'left', backgroundColor: '#fffbeb' }}>الفروقات غير المتوازنة</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155', textAlign: 'center' }}>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.intercompanyMatches?.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>لا توجد معاملات أو أرصدة بينية نشطة في هذه الفترة.</td>
                        </tr>
                      ) : (
                        data.intercompanyMatches?.map((match, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '600' }}>
                              {match.ruleName}
                              <span style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>
                                {match.ruleType === 'INTERCOMPANY_AR_AP' ? 'حسابات بينية ذمم' : 'إيرادات وتكاليف بينية'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>
                              {match.sourceAccountName}
                              <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{match.sourceAccount}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'left', color: '#334155' }}>{getFormatValue(match.receivableBalance)}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>
                              {match.targetAccountName}
                              <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{match.targetAccount}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'left', color: '#334155' }}>{getFormatValue(match.payableBalance)}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'left', color: '#1e40af', backgroundColor: '#eff6ff', fontWeight: '700' }}>{getFormatValue(match.eliminationAmount)}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'left', color: '#b45309', backgroundColor: '#fffbeb', fontWeight: '700' }}>{getFormatValue(match.difference)}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {match.status === 'MATCHED' ? (
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d' }}>متطابق</span>
                              ) : match.status === 'NO_BALANCE' ? (
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#64748b' }}>لا يوجد رصيد</span>
                              ) : (
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>غير متطابق</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warnings and audits alerts */}
              {data.intercompanyMatches?.some(m => m.status === 'MISMATCHED') && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '16px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>تنبيه بعدم توازن المعاملات البينية (Unbalanced Intercompany Matching):</strong>
                    <span style={{ fontSize: '13px' }}>
                      تم كشف اختلافات غير متطابقة في مطابقة أرصدة الحسابات البينية للشركات الشقيقة. يرجى مراجعة قيود التسوية أو تسريع ترحيل المعاملات العالقة قبل مرحلة الإغلاق النهائي.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Dynamic Table Card */
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155', width: '90px' }}>كود الحساب</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', color: '#334155' }}>اسم الحساب</th>
                    {data.companies.map(comp => (
                      <th key={comp.id} style={{ padding: '12px 16px', fontWeight: '700', color: '#334155', textAlign: 'left' }}>
                        {comp.name} 
                        <span style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>
                          {comp.isParent ? 'الشركة القابضة' : `نسبة الملكية: ${(Number(comp.ownership) * 100).toFixed(0)}%`}
                        </span>
                      </th>
                    ))}
                    <th style={{ padding: '12px 16px', fontWeight: '700', color: '#b45309', textAlign: 'left', backgroundColor: '#fffbeb' }}>استبعادات (مدين)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', color: '#b45309', textAlign: 'left', backgroundColor: '#fffbeb' }}>استبعادات (دائن)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', color: '#1e40af', textAlign: 'left', backgroundColor: '#eff6ff' }}>الصافي الموحد (SAR)</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredRows().map((row) => {
                    // Style highlights for parent header rows (length of code < 4 usually)
                    const isHeader = row.accountCode.length < 4;
                    
                    return (
                      <tr 
                        key={row.accountCode} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          backgroundColor: isHeader ? '#f8fafc' : '#ffffff',
                          fontWeight: isHeader ? '700' : 'normal',
                          transition: 'all 0.15s'
                        }}
                      >
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#64748b', fontWeight: '600' }}>{row.accountCode}</td>
                        <td style={{ padding: '10px 16px', color: isHeader ? '#0f172a' : '#334155' }}>{row.accountName}</td>
                        {data.companies.map(comp => (
                          <td key={comp.id} style={{ padding: '10px 16px', textAlign: 'left', color: '#334155' }}>
                            {getFormatValue(row.balances[comp.id])}
                          </td>
                        ))}
                        <td style={{ padding: '10px 16px', textAlign: 'left', color: '#b45309', backgroundColor: '#fffbeb', fontWeight: '600' }}>
                          {getFormatValue(row.eliminationDebit)}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'left', color: '#b45309', backgroundColor: '#fffbeb', fontWeight: '600' }}>
                          {getFormatValue(row.eliminationCredit)}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'left', color: '#1e40af', backgroundColor: '#eff6ff', fontWeight: '700', fontSize: '14px' }}>
                          {getFormatValue(row.consolidatedNet)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {loading && !data && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '80px 0', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #4f46e5', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>جاري تجميع الحسابات البينية وحساب الاستبعادات المحاسبية...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
        </div>
      )}
    </div>
  );
}
