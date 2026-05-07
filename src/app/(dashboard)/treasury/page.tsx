import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { Building2, ArrowRightLeft, TrendingUp, Landmark, FileText, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function TreasuryDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ totalCash: 0, accounts: 0, pendingChecks: 0, pettyCash: 0 });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/treasury/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) {
          const d = await r.json();
          if (d.stats) setStats(d.stats);
          setBankAccounts(d.bankAccounts || []);
          setTransactions(d.transactions || []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kpis = [
    { l: _t('إجمالي النقدية', 'Total Cash Position'), v: `${fmt(stats.totalCash)} ${_t('ر.س', 'SAR')}`, s: _t(`عبر ${stats.accounts} حساب بنكي`, `Across ${stats.accounts} bank accounts`), c: '#6366F1', ic: Building2 },
    { l: _t('شيكات معلقة (PDC)', 'Pending Checks (PDC)'), v: stats.pendingChecks, s: _t('قيد التحصيل', 'Under collection'), c: '#F59E0B', ic: FileText, href: '/treasury/checks' },
    { l: _t('صناديق نثرية نشطة', 'Active Petty Cash'), v: stats.pettyCash, s: _t('صناديق تعمل', 'Active funds'), c: '#22C55E', ic: Landmark, href: '/treasury/petty-cash' },
  ];

  const TX_COLORS: Record<string, { bg: string; color: string }> = {
    DEPOSIT: { bg: '#22C55E20', color: '#22C55E' }, INCOME: { bg: '#22C55E20', color: '#22C55E' },
    TRANSFER: { bg: '#3B82F620', color: '#3B82F6' },
    WITHDRAWAL: { bg: '#EF444420', color: '#EF4444' }, EXPENSE: { bg: '#EF444420', color: '#EF4444' },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Landmark size={28} color="#6366F1" /> {_t('الخزينة وإدارة النقد', 'Treasury & Cash Management')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة الحسابات البنكية والمركز النقدي والشيكات والصناديق النثرية', 'Manage bank accounts, cash positions, checks, and petty cash')}</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowRightLeft size={16} /> {_t('تحويل بين حسابات', 'Inter-account Transfer')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => {
          const inner = (
            <div className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}`, cursor: (c as any).href ? 'pointer' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
                <c.ic size={18} color={c.c} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800' }}>{loading ? '...' : c.v}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.s}</div>
            </div>
          );
          return (c as any).href ? <Link key={i} href={(c as any).href} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link> : <div key={i}>{inner}</div>;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={18} color="var(--text-muted)" /> {_t('أرصدة الحسابات البنكية', 'Bank Accounts Balance')}</h3>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('عرض الكل', 'View All')}</button>
          </div>
          {bankAccounts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{_t('لا توجد حسابات', 'No accounts')}</div>
          ) : bankAccounts.map((a: any) => (
            <div key={a.id} style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{a.bankName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.accountNumber} • {a.accountName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800' }}>{fmt(a.currentBalance || 0)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.currency || 'SAR'}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} color="var(--text-muted)" /> {_t('آخر العمليات البنكية', 'Recent Bank Transactions')}</h3>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('تحديث', 'Refresh')}</button>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{_t('لا توجد عمليات', 'No transactions')}</div>
          ) : transactions.map((tx: any) => {
            const c = TX_COLORS[tx.type] || TX_COLORS.WITHDRAWAL;
            const isIncome = tx.type === 'DEPOSIT' || tx.type === 'INCOME';
            return (
              <div key={tx.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isIncome ? <ArrowDownRight size={18} /> : tx.type === 'TRANSFER' ? <RefreshCcw size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{tx.description || tx.type}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.bankAccount?.bankName} • {tx.transactionDate?.slice?.(0, 10)}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: c.color }}>{isIncome ? '+' : '-'}{fmt(tx.amount || 0)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.reference}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
