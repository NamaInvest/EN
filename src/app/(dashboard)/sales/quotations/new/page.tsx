'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

interface QuotationLine {
  productId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}

export default function NewSalesQuotationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<QuotationLine[]>([
    { productId: null, description: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 15 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const [cRes, pRes] = await Promise.all([
        fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (e: any) {
      toastError('فشل تحميل بيانات التهيئة');
    }
    setLoading(false);
  }

  // Pre-fill contact details when customer changes
  const handleCustomerChange = (cid: string) => {
    if (!cid) {
      setCustomerId('');
      return;
    }
    const numId = parseInt(cid, 10);
    setCustomerId(numId);
    const customer = customers.find((c) => c.id === numId);
    if (customer) {
      setContactName(customer.contactName || customer.name || '');
      setContactEmail(customer.email || '');
      setContactPhone(customer.phone || '');
    }
  };

  const handleProductChange = (index: number, pid: string) => {
    const newLines = [...lines];
    if (!pid) {
      newLines[index].productId = null;
      return;
    }
    const productId = parseInt(pid, 10);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      newLines[index].productId = productId;
      newLines[index].description = prod.name || prod.nameEn || '';
      newLines[index].unitPrice = Number(prod.sellPrice || prod.buyPrice || 0);
      newLines[index].taxRate = Number(prod.taxRate !== undefined ? prod.taxRate : 15);
    }
    setLines(newLines);
  };

  const handleLineValueChange = (index: number, field: keyof QuotationLine, val: string | number) => {
    const newLines = [...lines];
    const item = newLines[index];

    if (field === 'quantity') {
      item.quantity = Math.max(0.001, Number(val));
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(val));
    } else if (field === 'discountRate') {
      item.discountRate = Math.min(100, Math.max(0, Number(val)));
    } else if (field === 'taxRate') {
      item.taxRate = Math.max(0, Number(val));
    } else if (field === 'description') {
      item.description = String(val);
    }

    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { productId: null, description: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 15 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = lines.reduce((acc, line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmount = lineSubtotal * (line.discountRate / 100);
    return acc + (lineSubtotal - discountAmount);
  }, 0);

  const discountTotal = lines.reduce((acc, line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    return acc + (lineSubtotal * (line.discountRate / 100));
  }, 0);

  const taxTotal = lines.reduce((acc, line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmount = lineSubtotal * (line.discountRate / 100);
    const lineAfterDiscount = lineSubtotal - discountAmount;
    return acc + (lineAfterDiscount * (line.taxRate / 100));
  }, 0);

  const total = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.some((l) => !l.description.trim())) {
      toastError('يرجى كتابة وصف لجميع البنود');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/sales/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: customerId || null,
          contactName,
          contactEmail,
          contactPhone,
          validUntil: validUntil || null,
          currency,
          terms,
          notes,
          lines,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toastSuccess('تم حفظ عرض السعر مسودة بنجاح');
        router.push(`/sales/quotations/${data.id}`);
      } else {
        const err = await res.json();
        toastError(err.error || 'فشل حفظ عرض السعر');
      }
    } catch (e) {
      toastError('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل الصفحة...</div>;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>إنشاء عرض سعر جديد</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px' }}>
          قم بتعبئة بيانات العميل وبنود عرض السعر لإصدار مسودة العرض.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Customer Information Card */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', fontSize: '16px', fontWeight: 600 }}>بيانات العميل والمعلومات الأساسية</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>العميل</label>
              <select className="input" value={customerId || ''} onChange={(e) => handleCustomerChange(e.target.value)}>
                <option value="">-- عميل مجهول / عميل عام --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>اسم جهة الاتصال</label>
              <input type="text" className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="اسم الشخص المسؤول" />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>رقم الهاتف</label>
              <input type="text" className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="05xxxxxxxx" />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>البريد الإلكتروني</label>
              <input type="email" className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>تاريخ الصلاحية</label>
              <input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>العملة</label>
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="SAR">SAR - ريال سعودي</option>
                <option value="USD">USD - دولار أمريكي</option>
                <option value="EUR">EUR - يورو</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lines/Bends Card */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', fontSize: '16px', fontWeight: 600 }}>بنود عرض السعر</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ width: '250px', textAlign: 'right', padding: '10px' }}>المنتج</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>الوصف / البيان</th>
                  <th style={{ width: '90px', textAlign: 'right', padding: '10px' }}>الكمية</th>
                  <th style={{ width: '110px', textAlign: 'right', padding: '10px' }}>سعر الوحدة</th>
                  <th style={{ width: '90px', textAlign: 'right', padding: '10px' }}>الخصم (%)</th>
                  <th style={{ width: '90px', textAlign: 'right', padding: '10px' }}>الضريبة (%)</th>
                  <th style={{ width: '120px', textAlign: 'left', padding: '10px' }}>الإجمالي</th>
                  <th style={{ width: '50px', padding: '10px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const lineSubtotal = line.quantity * line.unitPrice;
                  const discVal = lineSubtotal * (line.discountRate / 100);
                  const afterDisc = lineSubtotal - discVal;
                  const taxVal = afterDisc * (line.taxRate / 100);
                  const lineTotal = afterDisc + taxVal;

                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>
                        <select
                          className="input"
                          value={line.productId || ''}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- بند يدوي / وصف عام --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          className="input"
                          value={line.description}
                          onChange={(e) => handleLineValueChange(index, 'description', e.target.value)}
                          placeholder="اكتب وصف البند"
                          style={{ width: '100%' }}
                          required
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          step="any"
                          className="input"
                          value={line.quantity}
                          onChange={(e) => handleLineValueChange(index, 'quantity', e.target.value)}
                          style={{ width: '100%', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          step="any"
                          className="input"
                          value={line.unitPrice}
                          onChange={(e) => handleLineValueChange(index, 'unitPrice', e.target.value)}
                          style={{ width: '100%', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="input"
                          value={line.discountRate}
                          onChange={(e) => handleLineValueChange(index, 'discountRate', e.target.value)}
                          style={{ width: '100%', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          className="input"
                          value={line.taxRate}
                          onChange={(e) => handleLineValueChange(index, 'taxRate', e.target.value)}
                          style={{ width: '100%', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>
                        {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                          title="حذف البند"
                          disabled={lines.length === 1}
                        >
                          ✖
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <button
            type="button"
            onClick={addLine}
            className="btn btn-outline"
            style={{ width: 'fit-content', marginTop: '10px', padding: '8px 16px', borderRadius: '8px' }}
          >
            + إضافة بند جديد
          </button>
        </div>

        {/* Notes and Terms & Totals Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Notes & Terms */}
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', fontSize: '15px', fontWeight: 600 }}>ملاحظات وشروط الدفع</h3>
            
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>شروط وأحكام العرض</label>
              <textarea
                className="input"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="شروط التسليم، الدفع، الضمان، إلخ..."
                style={{ height: '70px', minHeight: '60px', padding: '8px 12px', borderRadius: '8px' }}
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 500 }}>ملاحظات عامة</label>
              <textarea
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات داخلية أو إضافية للعميل..."
                style={{ height: '70px', minHeight: '60px', padding: '8px 12px', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', fontSize: '15px', fontWeight: 600, marginBottom: '15px' }}>خلاصة الحساب</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>المجموع الفرعي:</span>
                  <strong>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span style={{ color: 'var(--text-muted)' }}>إجمالي الخصم:</span>
                  <strong>-{discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ضريبة القيمة المضافة:</span>
                  <strong>{taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong>
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '15px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>المجموع الإجمالي:</span>
              <strong style={{ fontSize: '22px', color: 'var(--primary-color, #1e40af)' }}>
                {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <Link href="/sales/quotations">
            <button type="button" className="btn btn-ghost" style={{ padding: '10px 20px', borderRadius: '8px' }}>
              إلغاء
            </button>
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="primary-btn"
            style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
          </button>
        </div>
      </form>
    </div>
  );
}
