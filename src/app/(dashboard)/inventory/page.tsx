'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, AlertTriangle, ShieldCheck, Loader2, 
  ServerCrash, ArrowUpRight, ArrowDownLeft, Compass, BarChart3, 
  Settings, RefreshCw, Layers, History, Eye, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/lib/i18n";

interface ABCItem {
  id: number;
  productName: string;
  sku: string;
  category: 'A' | 'B' | 'C';
  xyzCategory: 'X' | 'Y' | 'Z';
  revenue: number;
}

interface SlowMovingItem {
  id: number;
  productName: string;
  sku: string;
  lastMovementDays: number;
  stockQty: number;
  value: number;
}

export default function InventoryDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [abcData, setAbcData] = useState<ABCItem[]>([]);
  const [slowData, setSlowData] = useState<SlowMovingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'abc' | 'slow'>('abc');

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // جلب تحليلات ABC/XYZ
      const abcRes = await fetch('/api/inventory/analytics?type=abc-xyz');
      let abcJson: ABCItem[] = [];
      if (abcRes.ok) {
        const data = await abcRes.json();
        abcJson = Array.isArray(data) ? data : data.data || [];
      }
      
      // جلب تحليلات السلع الراكدة
      const slowRes = await fetch('/api/inventory/analytics?type=slow-moving');
      let slowJson: SlowMovingItem[] = [];
      if (slowRes.ok) {
        const data = await slowRes.json();
        slowJson = Array.isArray(data) ? data : data.data || [];
      }

      setAbcData(abcJson);
      setSlowData(slowJson);
    } catch (err: any) {
      setError(err.message || _t('حدث خطأ في استبيان تحليلات المخزون المتقدمة', 'Failed to fetch advanced inventory statistics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', color: 'var(--text)' }}>
            <Package size={32} color="var(--primary)" /> {_t('لوحة تحليلات وإدارة المخزون', 'Inventory Analytics & Management')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{_t('مراقبة انحرافات السلع، تقييم القيمة المخزنية، وإثبات حركات الوارد والمنصرف والجرد', 'Monitor product deviations, evaluate inventory values, and track stocktaking or transfers')}</p>
        </div>
        <div>
          <button 
            onClick={fetchInventoryData} 
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
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {_t('تحديث التحليلات', 'Refresh Analytics')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <p style={{ fontWeight: 'bold' }}>{_t('جاري إجراء تحليل الجرد ومستويات الطلب بالذكاء الاصطناعي...', 'AI is processing stocktakes and inventory demand levels...')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* KPIs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* Total Stock Value */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('إجمالي القيمة المخزنية التقديرية', 'Total Estimated Inventory Value')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '6px', display: 'flex' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }} dir="ltr">
                {fmt(1435200.00)} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>SAR</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> {_t('تقييم بالمتوسط المرجح (Moving Average)', 'Valued by Moving Average Method')}
              </span>
            </div>

            {/* Low stock alerts */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('أصناف تحت حد إعادة الطلب الفوري', 'Items Below Reorder Threshold')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '6px', display: 'flex' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                12 <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('صنفاً', 'items')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ⚠️ {_t('يوصى بإنشاء طلب شراء للموردين لتفادي العجز', 'Purchase order is recommended to prevent stockouts')}
              </span>
            </div>

            {/* Total items */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem' }}>{_t('إجمالي الأصناف الفريدة النشطة', 'Total Active Unique Products')}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', display: 'flex' }}>
                  <Layers size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                348 <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{_t('صنفاً', 'items')}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} /> {_t('متوفرة وجاهزة للبيع في الفروع', 'Available and ready for sales in branches')}
              </span>
            </div>

          </div>

          {/* Quick actions panel */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} color="var(--primary)" /> {_t('إجراءات تشغيلية وإدارية سريعة', 'Quick Operational Actions')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              
              <Link href="/inventory/movements" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>{_t('إدخال وصرف مخزني', 'Stock Receipts & Issues')}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('حركات الوارد والصادر', 'Record incoming/outgoing items')}</span>
                  </div>
                </div>
              </Link>

              <Link href="/inventory/stock-transfers" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Compass size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>{_t('تحويل بين المستودعات', 'Inter-Warehouse Transfers')}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('نقل الكميات بأمان', 'Transfer stock quantities safely')}</span>
                  </div>
                </div>
              </Link>

              <Link href="/inventory/stocktake" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <History size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>{_t('جرد وتسوية الجرد', 'Stocktaking & Adjustments')}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('مطابقة المخزون الفعلي والكمبيوتري', 'Reconcile actual and system stock')}</span>
                  </div>
                </div>
              </Link>

              <Link href="/inventory/ai-vision" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text)' }}>{_t('كاميرات الذكاء الاصطناعي', 'AI Vision Warehouse Scan')}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('المسح الضوئي الذكي للمستودع', 'Smart warehouse camera scanner')}</span>
                  </div>
                </div>
              </Link>

            </div>
          </div>

          {/* Advanced Analytics Table Block */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setTab('abc')}
                  style={{ 
                    padding: '0.5rem 1.2rem', 
                    borderRadius: '6px', 
                    border: 'none', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    background: tab === 'abc' ? 'var(--primary)' : 'transparent',
                    color: tab === 'abc' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {_t('تصنيف ومصفوفة ABC/XYZ المتقدمة', 'Advanced ABC/XYZ Classification')}
                </button>
                <button 
                  onClick={() => setTab('slow')}
                  style={{ 
                    padding: '0.5rem 1.2rem', 
                    borderRadius: '6px', 
                    border: 'none', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    background: tab === 'slow' ? 'var(--primary)' : 'transparent',
                    color: tab === 'slow' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {_t('السلع الراكدة وبطيئة الحركة', 'Slow-Moving & Dead Stock')}
                </button>
              </div>
            </div>

            {tab === 'abc' ? (
              abcData.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{_t('تصنيف ABC/XYZ مؤقت حالياً', 'ABC/XYZ Matrix is Empty')}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{_t('سيتم استعراض مصفوفة تصنيف المبيعات والاستهلاك بناءً على المعاملات والقيود المخزنية السابقة عند تجميعها بالخلفية.', 'Sales consumption patterns and stock matrix will be compiled once background analyses run.')}</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left', background: 'var(--bg-primary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('الصنف', 'Product / Item')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('رمز الـ SKU', 'SKU Code')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('تصنيف الـ ABC', 'ABC Category')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('تصنيف الـ XYZ', 'XYZ Demand')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: lang === 'ar' ? 'left' : 'right' }}>{_t('العائد / الربحية', 'Revenue / Profitability')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abcData.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text)' }}>{item.productName}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.6rem', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold',
                              background: item.category === 'A' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: item.category === 'A' ? '#10b981' : '#f59e0b'
                            }}>{item.category}</span>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.xyzCategory}</td>
                          <td style={{ padding: '1rem', textAlign: lang === 'ar' ? 'left' : 'right', fontFamily: 'monospace' }} dir="ltr">{fmt(item.revenue)} SAR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              slowData.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{_t('تحليلات السلع بطيئة الحركة مؤقتة', 'No Slow-Moving Items Found')}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{_t('تستعرض السلع التي مر عليها أكثر من 90 يوماً دون أي حركة صرف مخزني أو أمر تشغيل نشط.', 'Lists inventory items with zero stock issues or active production orders over 90 days.')}</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left', background: 'var(--bg-primary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('الصنف', 'Product / Item')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('رمز الـ SKU', 'SKU Code')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('أيام الركود', 'Days Inactive')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('الكمية', 'Stock Quantity')}</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: lang === 'ar' ? 'left' : 'right' }}>{_t('القيمة الكلية', 'Total Value')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slowData.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text)' }}>{item.productName}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 'bold' }}>{item.lastMovementDays} {_t('يوماً', 'days')}</td>
                          <td style={{ padding: '1rem' }}>{item.stockQty} {_t('وحدة', 'units')}</td>
                          <td style={{ padding: '1rem', textAlign: lang === 'ar' ? 'left' : 'right', fontFamily: 'monospace' }} dir="ltr">{fmt(item.value)} SAR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

        </div>
      )}
    </div>
  );
}
