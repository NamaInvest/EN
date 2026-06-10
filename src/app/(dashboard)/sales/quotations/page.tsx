'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function SalesQuotationsPage() {
  const { t } = useTranslation();
  const { error: toastError } = useToast();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter, customerFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      let url = '/api/sales/quotations?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (customerFilter) url += `customerId=${customerFilter}&`;

      const [qRes, cRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (qRes.ok) setQuotations(await qRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
    } catch (e: any) {
      toastError(e?.message || 'حدث خطأ أثناء تحميل البيانات');
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      DRAFT: { bg: '#e2e8f0', color: '#475569', label: 'مسودة' },
      SENT: { bg: '#dbeafe', color: '#1d4ed8', label: 'مرسل' },
      ACCEPTED: { bg: '#dcfce7', color: '#15803d', label: 'مقبول' },
      REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: 'مرفوض' },
      EXPIRED: { bg: '#fef3c7', color: '#b45309', label: 'منتهي الصلاحية' },
      CONVERTED: { bg: '#f3e8ff', color: '#7e22ce', label: 'محول لفاتورة' },
      CANCELLED: { bg: '#f1f5f9', color: '#64748b', label: 'ملغي' },
    };

    const style = styles[status] || { bg: '#e2e8f0', color: '#475569', label: status };
    return (
      <span
        style={{
          padding: '4px 10px',
          backgroundColor: style.bg,
          color: style.color,
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          display: 'inline-block',
        }}
      >
        {style.label}
      </span>
    );
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>عروض الأسعار / التقديرات</h1>
        <Link href="/sales/quotations/new">
          <button className="primary-btn" style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            إنشاء عرض سعر جديد
          </button>
        </Link>
      </div>

      <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Filters Toolbar */}
        <div
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            alignItems: 'center',
            backgroundColor: 'var(--card-bg, white)',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>تصفية حسب الحالة</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', height: '40px', padding: '8px 12px', borderRadius: '8px' }}
            >
              <option value="">كل الحالات</option>
              <option value="DRAFT">مسودة (DRAFT)</option>
              <option value="SENT">مرسل (SENT)</option>
              <option value="ACCEPTED">مقبول (ACCEPTED)</option>
              <option value="REJECTED">مرفوض (REJECTED)</option>
              <option value="EXPIRED">منتهي (EXPIRED)</option>
              <option value="CONVERTED">محول (CONVERTED)</option>
              <option value="CANCELLED">ملغي (CANCELLED)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>تصفية حسب العميل</label>
            <select
              className="input"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ width: '100%', height: '40px', padding: '8px 12px', borderRadius: '8px' }}
            >
              <option value="">كل العملاء</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="card" style={{ padding: '0', overflowX: 'auto', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>رقم العرض</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>تاريخ الإصدار</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>العميل</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>صالح حتى</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>القيمة الإجمالية</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>الحالة</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>العمليات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    جاري تحميل عروض الأسعار...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    لا توجد عروض أسعار متطابقة مع التصفية الحالية.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/sales/quotations/${q.id}`} style={{ fontWeight: 'bold', color: 'var(--primary-color, #1e40af)', textDecoration: 'none' }}>
                        {q.quotationNo}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{new Date(q.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {q.customer?.name || q.contactName || '-'}
                      {(q.contactEmail || q.contactPhone) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {q.contactPhone} {q.contactEmail && `| ${q.contactEmail}`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>
                      {Number(q.total).toLocaleString()} {q.currency}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(q.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Link href={`/sales/quotations/${q.id}`}>
                        <button
                          className="btn btn-outline"
                          style={{
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          عرض التفاصيل
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
