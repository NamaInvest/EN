'use client';
import { useState, useEffect } from 'react';
import { Calculator, FileText, CheckCircle2, UserCheck, AlertTriangle, Landmark, ShieldCheck, DollarSign, ArrowRight, Ban } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/lib/i18n";

import SensitiveValue from '@/components/security/SensitiveValue';
import PermissionGate from '@/components/security/PermissionGate';

interface PayrollPreview {
  employeeId: number;
  name: string;
  basic: number;
  additions: number;
  gosiDeduction: number;
  netSalary: number;
}

interface GosiEmployee {
  employeeId: number;
  name: string;
  isSaudi: boolean;
  baseSalary: number;
  employeeDeduction: number;
  employerContribution: number;
  totalGosi: number;
}

interface GosiTotals {
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  totalGosi: number;
  saudiCount: number;
  expatCount: number;
}

interface WPSBatch {
  id: number;
  batchNumber: string;
  totalAmount: number;
  totalEmployees: number;
  status: string;
  fileGeneratedAt: string;
}

interface WPSSummary {
  totalBatches: number;
  acceptedCount: number;
  pendingCount: number;
  ibanErrors: number;
}

export default function PayrollDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data States
  const [payrollData, setPayrollData] = useState<{
    preview: PayrollPreview[];
    configReady: boolean;
    alreadyProcessed: boolean;
  } | null>(null);

  const [gosiData, setGosiData] = useState<{
    employees: GosiEmployee[];
    totals: GosiTotals;
  } | null>(null);

  const [wpsData, setWpsData] = useState<{
    batches: WPSBatch[];
    summary: WPSSummary;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch dynamic stats based on month/year query
      const [payrollRes, gosiRes, wpsRes] = await Promise.all([
        fetch(`/api/hr/payroll/run?month=${selectedMonth}&year=${selectedYear}`, { headers }),
        fetch(`/api/hr/gosi?month=${selectedMonth}&year=${selectedYear}`, { headers }),
        fetch('/api/hr/wps', { headers }) // WPS batches
      ]);

      if (payrollRes.ok) {
        const p = await payrollRes.json();
        setPayrollData(p.data || null);
      }
      if (gosiRes.ok) {
        const g = await gosiRes.json();
        setGosiData(g || null);
      }
      if (wpsRes.ok) {
        const w = await wpsRes.json();
        setWpsData(w || null);
      }

    } catch (e: any) {
      setError(e?.message || _t('حدث خطأ أثناء تحميل بيانات مسيرات الرواتب', 'Failed to fetch payroll statistics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // Derived metrics
  const previewList = payrollData?.preview || [];
  const employeesCountInRun = previewList.length;
  const totalNetSalary = previewList.reduce((sum, item) => sum + item.netSalary, 0);
  
  const gosiTotals = gosiData?.totals || { totalEmployeeDeductions: 0, totalEmployerContributions: 0, totalGosi: 0, saudiCount: 0, expatCount: 0 };
  const wpsSummary = wpsData?.summary || { totalBatches: 0, acceptedCount: 0, pendingCount: 0, ibanErrors: 0 };

  const fmt = (n: number) => (n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2 });

  const kpis = [
    { l: _t('صافي رواتب المسير المعاين', 'Estimated Net Payroll'), v: `${fmt(totalNetSalary)} ${_t('ر.س', 'SAR')}`, s: _t('إجمالي رواتب المستحقين', 'Total net salary of active employees'), c: '#4F46E5', ic: DollarSign },
    { l: _t('الموظفون بمسير الرواتب', 'Employees in Payroll'), v: employeesCountInRun, s: _t('موظف نشط بالدورة الحالية', 'Active headcount in payroll cycle'), c: '#10B981', ic: UserCheck },
    { l: _t('إجمالي اشتراكات التأمينات (GOSI)', 'Total Social Insurance'), v: `${fmt(gosiTotals.totalGosi)} ${_t('ر.س', 'SAR')}`, s: _t('حصص الموظفين وأصحاب العمل', 'Employee and employer contributions'), c: '#06B6D4', ic: ShieldCheck },
    { l: _t('ملفات حماية الأجور (WPS)', 'Wage Protection (WPS)'), v: wpsSummary.totalBatches, s: `${wpsSummary.acceptedCount} ${_t('مقبول', 'accepted')} | ${wpsSummary.pendingCount} ${_t('معلق', 'pending')}`, c: '#F59E0B', ic: Landmark },
  ];

  const quickActions = [
    { href: '/salaries', label: _t('توليد مسير الرواتب', 'Generate Payroll'), desc: _t('تشغيل عملية احتساب الرواتب وإصدار القيد المحاسبي', 'Run payroll processing and auto-post journals'), c: '#4F46E5' },
    { href: '/hr/gosi', label: _t('اشتراكات التأمينات', 'GOSI Contributions'), desc: _t('مراجعة نسب الاستقطاع وإدارة اشتراكات الموظفين سعوديين ووافدين', 'Review deductions and manage GOSI allocations'), c: '#06B6D4' },
    { href: '/hr/wps', label: _t('ملفات حماية الأجور', 'Wage Protection System'), desc: _t('تحميل ملفات SIF المعتمدة من الوزارة وإدارة البنوك', 'Download ministry-approved SIF payroll bank files'), c: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: '#4F46E5', borderRadius: '50%', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>{_t('جاري تحميل كشف إحصائيات الرواتب والتأمينات...', 'Loading payroll, GOSI, and WPS stats...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '32px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#991B1B', marginBottom: '8px' }}>{_t('فشل تحميل لوحة تحكم الرواتب والأجور', 'Failed to load Payroll Dashboard')}</h3>
          <p style={{ color: '#B91C1C', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>{_t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header with filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calculator size={28} color="#4F46E5" /> {_t('لوحة تحكم الرواتب والأجور (Payroll)', 'Payroll & Salaries Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('معاينة مسيرات الرواتب واشتراكات التأمينات الاجتماعية GOSI وملفات حماية الأجور WPS', 'Review payroll previews, Saudi GOSI insurance, and WPS bank transfer statuses')}</p>
        </div>

        {/* Date Selector Filter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '2px' }}>{_t('الشهر', 'Month')}</label>
            <input 
              type="number" 
              min="1" 
              max="12" 
              style={{ width: '60px', padding: '6px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-main)' }} 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(parseInt(e.target.value) || 1)} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '2px' }}>{_t('السنة', 'Year')}</label>
            <input 
              type="number" 
              min="2020" 
              max="2050" 
              style={{ width: '85px', padding: '6px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-main)' }} 
              value={selectedYear} 
              onChange={e => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())} 
            />
          </div>
        </div>
      </div>

      {/* Process state notification */}
      {payrollData?.alreadyProcessed ? (
        <div style={{ padding: '16px', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#065F46', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
          <CheckCircle2 size={20} color="#10B981" />
          <span>{_t(`تم اعتماد وترحيل مسير رواتب شهر ${selectedMonth}/${selectedYear} بنجاح إلى القيود الدفترية.`, `Payroll run for month ${selectedMonth}/${selectedYear} has been approved, posted, and finalized to ledger entries.`)}</span>
        </div>
      ) : (
        <div style={{ padding: '16px', background: '#FFFBEB', border: '1px solid #FEF3C7', color: '#92400E', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
          <AlertTriangle size={20} color="#F59E0B" />
          <span>{_t(`تنبيه: مسير الرواتب لشهر ${selectedMonth}/${selectedYear} هو كشف معاينة حالياً ولم يتم ترحيله واعتماده بعد.`, `Notice: Payroll run for month ${selectedMonth}/${selectedYear} is currently a draft/preview and has not been finalized yet.`)}</span>
        </div>
      )}

      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `4px solid ${c.c}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.l}</span>
              <c.ic size={20} color={c.c} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {i === 0 ? (
                <SensitiveValue value={`${fmt(totalNetSalary)}`} currency={_t('ر.س', 'SAR')} module="payroll" />
              ) : i === 2 ? (
                <SensitiveValue value={`${fmt(gosiTotals.totalGosi)}`} currency={_t('ر.س', 'SAR')} module="payroll" />
              ) : (
                c.v
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.s}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Preview Table & WPS Batches */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Preview of Payroll Run */}
        <PermissionGate
          module="payroll"
          fallback={
            <div className="card" style={{ borderRadius: '12px', padding: '40px', textAlign: 'center', background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border)' }}>
              <Ban size={40} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
                {_t('غير مصرح لك بمعاينة تفاصيل مسير الرواتب', 'Unauthorized to view payroll details')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {_t('يرجى التواصل مع مسؤول النظام لتحديث صلاحيات الوصول الخاصة بك.', 'Please contact your system administrator to request access permissions.')}
              </p>
            </div>
          }
        >
          <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#4F46E5" /> {_t('كشف معاينة مسير الرواتب المفتوح', 'Draft Payroll Preview List')}
              </h3>
              <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: payrollData?.configReady ? '#ECFDF5' : '#FEF2F2', color: payrollData?.configReady ? '#065F46' : '#991B1B', fontWeight: 'bold' }}>
                {payrollData?.configReady ? _t('الحسابات المحاسبية مهيأة', 'GL Configured') : _t('الحسابات غير مهيأة', 'GL Not Configured')}
              </span>
            </div>
            {previewList.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('اسم الموظف', 'Employee Name')}</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{_t('الأساسي', 'Basic')}</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{_t('البدلات', 'Additions')}</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{_t('خصم التأمينات (GOSI)', 'GOSI')}</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left', background: 'rgba(16,185,129,0.05)' }}>{_t('صافي الراتب المستحق', 'Net Salary')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewList.map(h => (
                      <tr key={h.employeeId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px' }}>{h.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'monospace' }} dir="ltr">{fmt(h.basic)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#10B981', textAlign: 'left', fontWeight: 'bold', fontFamily: 'monospace' }} dir="ltr">+{fmt(h.additions)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#EF4444', textAlign: 'left', fontWeight: 'bold', fontFamily: 'monospace' }} dir="ltr">-{fmt(h.gosiDeduction)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#047857', textAlign: 'left', fontWeight: '800', background: 'rgba(16,185,129,0.02)', fontFamily: 'monospace' }} dir="ltr">{fmt(h.netSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Ban size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p>{_t(`لا توجد رواتب مسجلة أو مستحقة لشهر ${selectedMonth}/${selectedYear} في قاعدة البيانات.`, `No draft salary allocations found for month ${selectedMonth}/${selectedYear}.`)}</p>
              </div>
            )}
          </div>
        </PermissionGate>

        {/* Quick Actions Panel */}
        <div className="card" style={{ borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {_t('بوابات ومصادر الرواتب والشركاء', 'Salaries Portals & Partners')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {quickActions.map((q, i) => (
              <Link key={i} href={q.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s', height: '100%', boxSizing: 'border-box' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: q.c, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {q.label} <ArrowRight size={14} />
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{q.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
