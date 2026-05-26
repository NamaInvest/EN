'use client';

import React, { useState, useEffect } from 'react';
import { 
  Landmark, TrendingUp, TrendingDown, Search, ArrowUpRight, 
  ArrowDownLeft, Wallet, History, Loader2, ServerCrash, 
  PlusCircle, RefreshCw, FileText, CheckCircle2, DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: number;
  date: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
}

interface TreasuryData {
  totalIn: number;
  totalOut: number;
  netBalance: number;
  recentTransactions: Transaction[];
}

export default function TreasuryDashboardPage() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/treasury/dashboard');
      if (!res.ok) throw new Error('فشل جلب بيانات الخزينة من الخادم');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredTransactions = data?.recentTransactions?.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.amount.toString().includes(searchQuery);
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesFilter;
  }) || [];

  const fmt = (n: number) => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', color: 'var(--text)' }}>
            <Landmark size={32} color="var(--primary)" /> لوحة معلومات الخزينة والبنوك
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>مراقبة التدفقات النقدية، إدارة الأرصدة البنكية، والأنشطة المالية الفورية</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={fetchDashboardData} 
            disabled={loading}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1.2rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <p style={{ fontWeight: 'bold' }}>جاري تحميل مؤشرات الخزينة...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <ServerCrash size={64} color="#ef4444" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>فشل الاتصال بخدمات الخزينة</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px' }}>إعادة المحاولة</button>
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          لا توجد بيانات خزينة متوفرة حالياً
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* KPIs Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Total Balance Card */}
            <div className="card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(99, 102, 241, 0.05) 100%)', border: '1px solid var(--border)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>صافي الأرصدة المتوفرة</span>
                <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                  <Wallet size={20} />
                </div>
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: data.netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                {fmt(data.netBalance)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>SAR</span>
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} color="#10b981" /> وضع الملاءة المالية سليم ونشط
              </div>
            </div>

            {/* Inflows Card */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>إجمالي المقبوضات (المقبوض)</span>
                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981', display: 'flex', alignItems: 'center' }}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {fmt(data.totalIn)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>SAR</span>
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpRight size={14} /> التدفقات النقدية الواردة نشطة
              </div>
            </div>

            {/* Outflows Card */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>إجمالي المدفوعات (المصروف)</span>
                <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                  <TrendingDown size={20} />
                </div>
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                {fmt(data.totalOut)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>SAR</span>
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowDownLeft size={14} /> مدفوعات تشغيلية واستثمارية
              </div>
            </div>

          </div>

          {/* Quick Actions Panel */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} color="var(--primary)" /> إجراءات تشغيلية سريعة (Quick Actions)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              
              <Link href="/treasury/cash-in" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>سند قبض جديد</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إثبات تدفق وارد نقدى</span>
                  </div>
                </div>
              </Link>

              <Link href="/treasury/cash-out" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDownLeft size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>سند صرف جديد</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إثبات تدفق خارج نقدى</span>
                  </div>
                </div>
              </Link>

              <Link href="/treasury/bank-reconciliation" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>تسوية بنكية</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مطابقة الأرصدة البنكية</span>
                  </div>
                </div>
              </Link>

              <Link href="/treasury/cash-forecast" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>توقع التدفق النقدي</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>استشراف السيولة بالـ AI</span>
                  </div>
                </div>
              </Link>

            </div>
          </div>

          {/* Transactions Table & Filters */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <History size={20} color="var(--primary)" /> أحدث الحركات المالية المسجلة (Recent Transactions)
              </h3>
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="بحث..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: '0.85rem' }}
                  />
                </div>
                {/* Filters */}
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value as any)}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <option value="all">كل الحركات</option>
                  <option value="in">المقبوضات فقط</option>
                  <option value="out">المدفوعات فقط</option>
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ margin: 0, fontWeight: 'bold' }}>لا توجد حركات مالية مطابقة للمعايير المحددة</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', background: 'var(--bg-primary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>تاريخ الحركة</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>النوع</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>البيان / الوصف</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'left' }}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {new Date(tx.date).toLocaleDateString('en-SA')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            background: tx.type === 'in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: tx.type === 'in' ? '#10b981' : '#ef4444',
                            border: tx.type === 'in' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            {tx.type === 'in' ? 'مقبوضات' : 'مدفوعات'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text)' }}>
                          {tx.description}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.95rem', fontWeight: 'bold', textAlign: 'left', fontFamily: 'monospace', color: tx.type === 'in' ? '#10b981' : '#ef4444' }} dir="ltr">
                          {tx.type === 'in' ? '+' : '-'}{fmt(tx.amount)} SAR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
