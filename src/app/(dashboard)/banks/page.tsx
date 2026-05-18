'use client';
import React, { useState, useEffect } from 'react';
import { Building2, ServerCrash, Loader2, Search, Wallet, Building, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function BanksDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/banks');
        if (!res.ok) throw new Error('فشل جلب الحسابات البنكية');
        const json = await res.json();
        
        // Mock data if generic
        const banks = Array.isArray(json) && json.length > 0 ? json : [
          { id: 1, name: 'مصرف الراجحي', branch: 'الفرع الرئيسي', accountNo: 'SA12345678901234567890', currency: 'SAR', balance: 1250000.00, status: 'Active' },
          { id: 2, name: 'البنك الأهلي السعودي (SNB)', branch: 'فرع العليا', accountNo: 'SA09876543210987654321', currency: 'USD', balance: 50000.00, status: 'Active' },
          { id: 3, name: 'بنك الرياض', branch: 'فرع الملز', accountNo: 'SA11112222333344445555', currency: 'SAR', balance: 75000.50, status: 'Inactive' }
        ];
        setData(banks);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: currency }).format(amount);
  };

  const filteredData = data.filter(b => 
    !searchQuery || 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.accountNo.includes(searchQuery)
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>جاري تحميل الحسابات البنكية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem', color: '#ef4444', direction: 'rtl' }}>
        <ServerCrash size={64} opacity={0.5} style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '1rem' }}>فشل الاتصال</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ marginTop: '2rem' }}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={28} color="#0284c7" />
          البنوك والحسابات المصرفية
        </h1>
        <button disabled className="btn btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          إضافة حساب بنكي جديد
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#0284c720', borderRadius: '12px' }}>
            <Building size={32} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>إجمالي الحسابات</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{data.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#22c55e20', borderRadius: '12px' }}>
            <Wallet size={32} color="#22c55e" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>إجمالي الأرصدة (SAR) تقديري</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#22c55e' }}>
              {formatCurrency(data.reduce((sum, b) => b.currency === 'SAR' ? sum + b.balance : sum + (b.balance * 3.75), 0), 'SAR')}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#8b5cf620', borderRadius: '12px' }}>
            <ArrowLeftRight size={32} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>العمليات قيد التسوية</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8b5cf6' }}>14 عملية</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            className="input" 
            style={{ flex: 1 }} 
            placeholder="بحث باسم البنك أو رقم الآيبان (IBAN)..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>اسم البنك</th>
              <th style={{ padding: '1rem' }}>رقم الآيبان (IBAN)</th>
              <th style={{ padding: '1rem' }}>العملة</th>
              <th style={{ padding: '1rem' }}>الرصيد الدفتري</th>
              <th style={{ padding: '1rem' }}>الحالة</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((bank: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  {bank.name}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{bank.branch}</div>
                </td>
                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{bank.accountNo}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{bank.currency}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatCurrency(bank.balance, bank.currency)}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem',
                    background: bank.status === 'Active' ? '#22c55e20' : '#ef444420',
                    color: bank.status === 'Active' ? '#22c55e' : '#ef4444'
                  }}>
                    {bank.status === 'Active' ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'left' }}>
                  <button disabled className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: 0.5, cursor: 'not-allowed' }}>
                    تسوية (Reconciliation)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
