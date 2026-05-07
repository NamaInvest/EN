'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { ShoppingCart, Package, TrendingUp, DollarSign, Truck, Clock, Eye, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

const statusColors: any = { PENDING: '#EAB308', CONFIRMED: '#3B82F6', PROCESSING: '#8B5CF6', SHIPPED: '#F97316', DELIVERED: '#22C55E', CANCELLED: '#EF4444' };
const payColors: any = { UNPAID: '#EF4444', PAID: '#22C55E', REFUNDED: '#94A3B8' };

export default function EcommerceDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const q = filter ? `?status=${filter}` : '';
      const r = await fetch(`/api/ecommerce/orders${q}`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setOrders(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    const t = localStorage.getItem('token');
    await fetch('/api/ecommerce/orders', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id, status })
    });
    load();
  };

  const totalRevenue = orders.filter(o => o.paymentStatus === 'PAID').reduce((a, o) => a + o.total, 0);
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const shipped = orders.filter(o => o.status === 'SHIPPED').length;

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><ShoppingCart size={28} color="var(--primary)" /> لوحة التجارة الإلكترونية</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>إدارة الطلبات الإلكترونية والمتاجر</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: ShoppingCart, label: 'إجمالي الطلبات', value: orders.length, color: '#3B82F6' },
          { icon: DollarSign, label: 'الإيرادات', value: `${totalRevenue.toLocaleString()} SAR`, color: '#22C55E' },
          { icon: Clock, label: 'قيد الانتظار', value: pending, color: '#EAB308' },
          { icon: Truck, label: 'تم الشحن', value: shipped, color: '#F97316' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: k.color + '15', color: k.color, borderRadius: '10px' }}><k.icon size={20} /></div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.label}</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '900' }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', fontSize: '12px', fontWeight: filter === s ? '700' : '500', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: filter === s ? 'var(--primary)' : 'var(--bg-body)', color: filter === s ? '#fff' : 'var(--text-muted)'
          }}>{s || 'الكل'}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['رقم الطلب', 'المتجر', 'المبلغ', 'الحالة', 'الدفع', 'التاريخ', 'الإجراء'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '700', fontFamily: 'monospace' }}>{o.orderNo}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{o.store?.name || '-'}</td>
                  <td style={{ padding: '12px', fontWeight: '700' }}>{o.total?.toLocaleString()} SAR</td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (statusColors[o.status] || '#94A3B8') + '20', color: statusColors[o.status] }}>{o.status}</span></td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (payColors[o.paymentStatus] || '#94A3B8') + '20', color: payColors[o.paymentStatus] }}>{o.paymentStatus}</span></td>
                  <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {o.status === 'PENDING' && <button className="btn btn-ghost btn-sm" title="تأكيد" onClick={() => updateStatus(o.id, 'CONFIRMED')} style={{ color: '#3B82F6' }}><CheckCircle size={15} /></button>}
                      {o.status === 'CONFIRMED' && <button className="btn btn-ghost btn-sm" title="بدء التجهيز" onClick={() => updateStatus(o.id, 'PROCESSING')} style={{ color: '#8B5CF6' }}><Package size={15} /></button>}
                      {o.status === 'PROCESSING' && <button className="btn btn-ghost btn-sm" title="شحن" onClick={() => updateStatus(o.id, 'SHIPPED')} style={{ color: '#F97316' }}><Truck size={15} /></button>}
                      {o.status === 'SHIPPED' && <button className="btn btn-ghost btn-sm" title="تم التسليم" onClick={() => updateStatus(o.id, 'DELIVERED')} style={{ color: '#22C55E' }}><CheckCircle size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد طلبات</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
