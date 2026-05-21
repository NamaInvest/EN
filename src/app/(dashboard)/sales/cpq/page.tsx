'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CPQ Engine — `/sales/cpq` (Configure · Price · Quote)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  نظام CPQ = إنشاء عروض أسعار ذكية بناءً على:
 *   - تسعير حسب الكمية (Volume discount tiers)
 *   - خصومات تاريخية للعميل (loyalty)
 *   - VAT تلقائي
 *
 *  Endpoints:
 *   POST /api/cpq { action: 'price', productId, quantity, customerId? }
 *   POST /api/cpq { action: 'quote', customerId, lines[] }
 *
 *  Permission: admin / sales_manager / sales_rep
 *
 *  @see src/app/api/cpq/route.ts
 *  @see src/lib/cpq-engine.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { FileText, Calculator, Plus, Trash2, ShoppingCart, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceResult {
  productId: number;
  basePrice: number;
  finalPrice: number;
  totalPrice: number;
  discount: number;
  tier?: string;
  vat?: number;
}

interface QuoteLine {
  productId: string;
  quantity: string;
}

interface QuoteResult {
  customerId: number;
  lines: Array<{ productId: number; description?: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  vat: number;
  total: number;
}

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency', currency: 'SAR', maximumFractionDigits: 2,
  }).format(n);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function CpqPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [mode, setMode] = useState<'price' | 'quote'>('price');

  // Price mode
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customerId, setCustomerId] = useState('');
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Quote mode
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([{ productId: '', quantity: '1' }]);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const handleCalcPrice = async () => {
    const pid = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);
    if (!pid || !qty) { toastError(_t('معرّف المنتج والكمية مطلوبة', 'Product ID + quantity required')); return; }
    setPriceLoading(true);
    setPriceResult(null);
    try {
      const res = await fetch('/api/cpq', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'price',
          productId: pid,
          quantity: qty,
          customerId: customerId ? parseInt(customerId, 10) : undefined,
        }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      setPriceResult((await res.json()) as PriceResult);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleBuildQuote = async () => {
    const cid = parseInt(quoteCustomerId, 10);
    if (!cid) { toastError(_t('معرّف العميل مطلوب', 'Customer ID required')); return; }
    const lines = quoteLines
      .map((l) => ({ productId: parseInt(l.productId, 10), quantity: parseInt(l.quantity, 10) }))
      .filter((l) => l.productId > 0 && l.quantity > 0);
    if (lines.length === 0) { toastError(_t('أضف بند واحد على الأقل', 'Add at least 1 line')); return; }

    setQuoteLoading(true);
    setQuoteResult(null);
    try {
      const res = await fetch('/api/cpq', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote', customerId: cid, lines }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      setQuoteResult((await res.json()) as QuoteResult);
      toastSuccess(_t('تم بناء العرض', 'Quote built'));
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setQuoteLoading(false);
    }
  };

  const addLine = () => setQuoteLines([...quoteLines, { productId: '', quantity: '1' }]);
  const removeLine = (idx: number) => setQuoteLines(quoteLines.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof QuoteLine, value: string) => {
    const next = [...quoteLines];
    next[idx] = { ...next[idx], [field]: value };
    setQuoteLines(next);
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={28} color="#7C3AED" />
          {_t('CPQ — تسعير وعروض ذكية', 'CPQ — Smart Pricing & Quotes')}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
          {_t(
            'حساب الأسعار الديناميكية مع خصومات الكمية والولاء، وبناء عروض كاملة مع VAT',
            'Dynamic pricing with quantity/loyalty discounts + complete quote building with VAT',
          )}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <TabButton active={mode === 'price'} onClick={() => setMode('price')} icon={<Calculator size={16} />} label={_t('حساب سعر', 'Price Calc')} />
        <TabButton active={mode === 'quote'} onClick={() => setMode('quote')} icon={<FileText size={16} />} label={_t('بناء عرض كامل', 'Build Quote')} />
      </div>

      {mode === 'price' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {_t('حساب سعر منتج واحد', 'Calculate Price for One Product')}
          </h3>
          <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="cpq-pid">{_t('معرّف المنتج', 'Product ID')} *</label>
              <input id="cpq-pid" type="number" min={1} className="input" value={productId} onChange={(e) => setProductId(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="cpq-qty">{_t('الكمية', 'Quantity')} *</label>
              <input id="cpq-qty" type="number" min={1} className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label" htmlFor="cpq-cid">
                {_t('معرّف العميل (اختياري — لخصم الولاء)', 'Customer ID (optional — for loyalty discount)')}
              </label>
              <input id="cpq-cid" type="number" min={1} className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleCalcPrice} disabled={priceLoading}>
            {priceLoading ? _t('جاري الحساب...', 'Calculating...') : _t('احسب', 'Calculate')}
          </button>

          {priceResult && (
            <div className="card" style={{ marginTop: '20px', padding: '16px', background: '#F0FDF4', border: '1px solid #16A34A' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#15803D' }}>{_t('نتيجة الحساب', 'Result')}</h4>
              <div className="grid-2" style={{ gap: '8px' }}>
                <Field label={_t('السعر الأساس', 'Base Price')} value={fmtSAR(priceResult.basePrice, lang)} />
                <Field label={_t('السعر النهائي/وحدة', 'Final Price/unit')} value={fmtSAR(priceResult.finalPrice, lang)} />
                <Field label={_t('الخصم', 'Discount')} value={`${priceResult.discount.toFixed(1)}%`} />
                {priceResult.tier && <Field label={_t('الشريحة', 'Tier')} value={priceResult.tier} />}
                <Field label={_t('الإجمالي', 'Total')} value={fmtSAR(priceResult.totalPrice, lang)} highlight />
                {priceResult.vat !== undefined && <Field label="VAT (15%)" value={fmtSAR(priceResult.vat, lang)} />}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'quote' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {_t('بناء عرض سعر كامل', 'Build Complete Quote')}
          </h3>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label" htmlFor="qt-cid">
              <User size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
              {_t('معرّف العميل', 'Customer ID')} *
            </label>
            <input id="qt-cid" type="number" min={1} className="input" value={quoteCustomerId} onChange={(e) => setQuoteCustomerId(e.target.value)} style={{ maxWidth: '300px' }} />
          </div>

          <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{_t('البنود', 'Lines')}</h4>
          {quoteLines.map((line, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '20px' }}>{idx + 1}.</span>
              <input type="number" min={1} className="input" placeholder={_t('معرّف المنتج', 'Product ID')}
                value={line.productId} onChange={(e) => updateLine(idx, 'productId', e.target.value)} style={{ flex: 1 }} />
              <input type="number" min={1} className="input" placeholder={_t('الكمية', 'Qty')}
                value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} style={{ width: '100px' }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(idx)} disabled={quoteLines.length === 1} aria-label={_t('احذف', 'Remove')}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addLine} style={{ marginBottom: '16px' }}>
            <Plus size={14} /> {_t('بند جديد', 'Add Line')}
          </button>

          <div>
            <button type="button" className="btn btn-primary" onClick={handleBuildQuote} disabled={quoteLoading}>
              <ShoppingCart size={16} style={{ marginInlineEnd: '6px' }} />
              {quoteLoading ? _t('جاري البناء...', 'Building...') : _t('بناء العرض', 'Build Quote')}
            </button>
          </div>

          {quoteResult && (
            <div className="card" style={{ marginTop: '20px', padding: '16px', background: '#F0FDF4', border: '1px solid #16A34A', overflow: 'auto' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#15803D' }}>
                {_t(`عرض السعر للعميل #${quoteResult.customerId}`, `Quote for Customer #${quoteResult.customerId}`)}
              </h4>
              <table className="table" style={{ width: '100%', marginBottom: '12px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{_t('منتج', 'Product')}</th>
                    <th>{_t('الكمية', 'Qty')}</th>
                    <th>{_t('سعر الوحدة', 'Unit Price')}</th>
                    <th>{_t('الإجمالي', 'Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteResult.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontSize: '12px' }}>{line.description || `#${line.productId}`}</td>
                      <td>{line.quantity}</td>
                      <td style={{ fontFamily: 'monospace' }}>{fmtSAR(line.unitPrice, lang)}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtSAR(line.total, lang)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 600 }}>{_t('الفرعي:', 'Subtotal:')}</td>
                    <td style={{ fontFamily: 'monospace' }}>{fmtSAR(quoteResult.subtotal, lang)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 600 }}>VAT (15%):</td>
                    <td style={{ fontFamily: 'monospace' }}>{fmtSAR(quoteResult.vat, lang)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 700 }}>{_t('الإجمالي:', 'Grand Total:')}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#15803D' }}>{fmtSAR(quoteResult.total, lang)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
        marginBottom: '-1px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: highlight ? 'var(--primary)' : 'var(--text)', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}
