import { _t } from '@/lib/server-t';
'use client';
import { ShoppingBag, ClipboardList, Users, Truck, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function ProcurementDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const modules = [
    { href: '/purchases/requisitions', icon: ClipboardList, c: '#6366F1', title: _t('طلبات الشراء (PR)', 'Requisitions (PR)'), desc: _t('مراجعة واعتماد طلبات الشراء الداخلية قبل تحويلها لأوامر شراء', 'Review and approve internal purchase requests from departments before converting them to POs'), link: _t('عرض الطلبات', 'View Requests') },
    { href: '/purchase-orders', icon: ShoppingBag, c: '#3B82F6', title: _t('أوامر الشراء (PO)', 'Purchase Orders (PO)'), desc: _t('إنشاء وإرسال وتتبع أوامر الشراء للموردين', 'Create, send, and track purchase orders to suppliers'), link: _t('إدارة الأوامر', 'Manage Orders') },
    { href: '/customers', icon: Users, c: '#22C55E', title: _t('الموردون', 'Suppliers (Vendors)'), desc: _t('إدارة دليل الموردين وتتبع أرصدة الذمم الدائنة', 'Manage your vendor directory and track AP balances'), link: _t('عرض الموردين', 'View Suppliers') },
  ];
  const extras = [
    { href: '/stock', icon: Truck, title: _t('استلام بضاعة (GRN)', 'Goods Receipt (GRN)'), desc: _t('تسجيل البضاعة المستلمة من الموردين مقابل أوامر الشراء', 'Record goods received from suppliers against Purchase Orders'), link: _t('الذهاب للمخزون', 'Go to Inventory') },
    { href: '/reports/manual-purchases', icon: FileText, title: _t('فواتير الشراء', 'Purchase Invoices'), desc: _t('معالجة فواتير الموردين الواردة والمطابقة الثلاثية', 'Process incoming vendor invoices and perform 3-way matching'), link: _t('الذهاب لـ AP', 'Go to AP Module') },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={28} color="var(--primary)" /> {_t('المشتريات والتوريد', 'Procurement & Purchases')}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة الموردين وأوامر الشراء وطلبات الشراء الداخلية', 'Manage suppliers, purchase orders, and internal requisitions')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {modules.map((m, i) => (
          <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '24px', cursor: 'pointer', borderTop: `3px solid ${m.c}`, transition: 'box-shadow 0.2s' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: m.c, marginBottom: '12px' }}>
                <m.icon size={22} /> {m.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>{m.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: m.c }}>{m.link} <ArrowRight size={14} /></div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
        {extras.map((m, i) => (
          <Link key={i} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary, #f8fafc)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <m.icon size={20} color="var(--text-muted)" /> {m.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>{m.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{m.link} <ArrowRight size={14} /></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
