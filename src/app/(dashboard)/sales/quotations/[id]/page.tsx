'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function QuotationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const quoteId = params?.id;

  useEffect(() => {
    if (quoteId) {
      loadQuotation();
    }
  }, [quoteId]);

  async function loadQuotation() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/sales/quotations/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setQuotation(await res.json());
      } else {
        toastError('فشل تحميل تفاصيل عرض السعر');
      }
    } catch (e) {
      toastError('حدث خطأ أثناء تحميل البيانات');
    }
    setLoading(false);
  }

  const handleAction = async (action: 'send' | 'accept' | 'cancel' | 'convert-to-invoice') => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/sales/quotations/${quoteId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        toastSuccess(data.message || 'تم تحديث حالة عرض السعر بنجاح');
        loadQuotation();
      } else {
        toastError(data.error || 'فشل تنفيذ الإجراء المطلوب');
      }
    } catch (e) {
      toastError('حدث خطأ في الشبكة أثناء تنفيذ العملية');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/sales/quotations/${quoteId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (res.ok) {
        toastSuccess('تم رفض عرض السعر بنجاح');
        setShowRejectModal(false);
        setRejectReason('');
        loadQuotation();
      } else {
        toastError(data.error || 'فشل رفض عرض السعر');
      }
    } catch (e) {
      toastError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      DRAFT: { bg: '#e2e8f0', color: '#475569', label: 'مسودة' },
      SENT: { bg: '#dbeafe', color: '#1d4ed8', label: 'مرسل للعميل' },
      ACCEPTED: { bg: '#dcfce7', color: '#15803d', label: 'مقبول' },
      REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: 'مرفوض' },
      EXPIRED: { bg: '#fef3c7', color: '#b45309', label: 'منتهي الصلاحية' },
      CONVERTED: { bg: '#f3e8ff', color: '#7e22ce', label: 'محول لفاتورة مبيعات' },
      CANCELLED: { bg: '#f1f5f9', color: '#64748b', label: 'ملغي' },
    };

    const style = styles[status] || { bg: '#e2e8f0', color: '#475569', label: status };
    return (
      <span
        style={{
          padding: '6px 14px',
          backgroundColor: style.bg,
          color: style.color,
          borderRadius: '9999px',
          fontSize: '14px',
          fontWeight: 700,
          display: 'inline-block',
        }}
      >
        {style.label}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري التحميل...</div>;
  }

  if (!quotation) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>عرض السعر غير موجود أو غير مصرح لك بعرضه.</h3>
        <Link href="/sales/quotations" style={{ marginTop: '10px', display: 'inline-block' }}>
          العودة لعروض الأسعار
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Back link & Actions Toolbar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '15px',
        }}
      >
        <Link href="/sales/quotations" style={{ textDecoration: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>← العودة لعروض الأسعار</span>
        </Link>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handlePrint} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
            🖨 طباعة العرض
          </button>

          {quotation.status === 'DRAFT' && (
            <>
              <Link href={`/sales/quotations/${quoteId}/edit`}>
                <button className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                  ✏ تعديل العرض
                </button>
              </Link>
              <button
                onClick={() => handleAction('send')}
                disabled={processing}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white' }}
              >
                ✉ إرسال للعميل
              </button>
            </>
          )}

          {(quotation.status === 'DRAFT' || quotation.status === 'SENT') && (
            <>
              <button
                onClick={() => handleAction('accept')}
                disabled={processing}
                className="btn"
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white' }}
              >
                ✔ قبول العرض
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="btn"
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white' }}
              >
                ✖ رفض العرض
              </button>
            </>
          )}

          {quotation.status === 'ACCEPTED' && (
            <button
              onClick={() => handleAction('convert-to-invoice')}
              disabled={processing}
              className="btn"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#7e22ce',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(126, 34, 206, 0.2)',
              }}
            >
              ⚡ تحويل إلى فاتورة مبيعات مسودة
            </button>
          )}

          {quotation.status !== 'CONVERTED' && quotation.status !== 'CANCELLED' && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={processing}
              className="btn btn-ghost"
              style={{ padding: '8px 16px', borderRadius: '8px', color: '#64748b' }}
            >
              إلغاء العرض
            </button>
          )}
        </div>
      </div>

      {/* Main Quotation Sheet for viewing & printing */}
      <div
        className="card print-sheet"
        style={{
          padding: '40px',
          backgroundColor: 'var(--card-bg, white)',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Printable Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color, #1e40af)' }}>NamaInvest ERP</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>نظام محاسبي متكامل لإدارة الأعمال</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>عرض سعر مبيعات</h2>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '5px' }}>
              رقم العرض: {quotation.quotationNo}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          {/* Customer Side */}
          <div style={{ padding: '15px', backgroundColor: 'var(--bg, #f8fafc)', borderRadius: '10px' }}>
            <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>موجه إلى العميل:</h4>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {quotation.customer?.name || quotation.contactName || 'عميل عام'}
            </div>
            {quotation.contactName && <div style={{ fontSize: '13px', marginBottom: '4px' }}>المسؤول: {quotation.contactName}</div>}
            {quotation.contactPhone && <div style={{ fontSize: '13px', marginBottom: '4px' }}>الهاتف: {quotation.contactPhone}</div>}
            {quotation.contactEmail && <div style={{ fontSize: '13px' }}>البريد الإلكتروني: {quotation.contactEmail}</div>}
          </div>

          {/* Quotation Details */}
          <div style={{ padding: '15px', backgroundColor: 'var(--bg, #f8fafc)', borderRadius: '10px' }}>
            <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>تفاصيل العرض:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div>تاريخ العرض: <strong>{new Date(quotation.createdAt).toLocaleDateString('en-GB')}</strong></div>
              <div>صالح حتى: <strong>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-GB') : 'غير محدد'}</strong></div>
              <div>العملة: <strong>{quotation.currency}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span>حالة المستند:</span>
                {getStatusBadge(quotation.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Converted Alert Box */}
        {quotation.status === 'CONVERTED' && quotation.convertedInvoiceId && (
          <div
            className="no-print"
            style={{
              padding: '16px',
              backgroundColor: '#f3e8ff',
              color: '#6b21a8',
              borderRadius: '8px',
              border: '1px solid #e9d5ff',
              marginBottom: '30px',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            🎉 تم تحويل عرض السعر هذا إلى فاتورة مبيعات مسودة بنجاح!
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'normal', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span>يمكنك الانتقال مباشرة إلى الفاتورة المسودة:</span>
              <Link 
                href={`/invoice/${quotation.convertedInvoiceId}`}
                style={{
                  color: '#7e22ce',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                }}
              >
                عرض الفاتورة #{quotation.convertedInvoiceId} ↗
              </Link>
            </div>
          </div>
        )}

        {/* Lines Table */}
        <h4 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>بنود عرض السعر:</h4>
        <table className="table" style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '10px', textAlign: 'right', width: '50px' }}>#</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>بيان البند / الوصف</th>
              <th style={{ padding: '10px', textAlign: 'center', width: '80px' }}>الكمية</th>
              <th style={{ padding: '10px', textAlign: 'left', width: '120px' }}>سعر الوحدة</th>
              <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>الخصم</th>
              <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>الضريبة</th>
              <th style={{ padding: '10px', textAlign: 'left', width: '140px' }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {quotation.lines.map((line: any, idx: number) => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 10px' }}>{idx + 1}</td>
                <td style={{ padding: '12px 10px' }}>
                  <div>{line.description}</div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>{Number(line.quantity)}</td>
                <td style={{ padding: '12px 10px', textAlign: 'left' }}>
                  {Number(line.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'left', color: '#ef4444' }}>
                  {Number(line.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({line.discountRate}%)
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'left' }}>
                  {Number(line.taxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({line.taxRate}%)
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 'bold' }}>
                  {Number(line.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quotation.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Summary Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap-reverse', gap: '30px' }}>
          {/* Notes & Terms (Left) */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {quotation.terms && (
              <div>
                <h5 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px' }}>شروط وأحكام العرض:</h5>
                <p style={{ fontSize: '13px', whiteSpace: 'pre-line', margin: 0 }}>{quotation.terms}</p>
              </div>
            )}
            {quotation.notes && (
              <div>
                <h5 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px' }}>ملاحظات:</h5>
                <p style={{ fontSize: '13px', whiteSpace: 'pre-line', margin: 0 }}>{quotation.notes}</p>
              </div>
            )}
          </div>

          {/* Money Totals (Right) */}
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>المجموع الفرعي:</span>
              <strong>
                {Number(quotation.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quotation.currency}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ef4444' }}>
              <span style={{ color: 'var(--text-muted)' }}>إجمالي الخصم:</span>
              <strong>
                -{Number(quotation.discountTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quotation.currency}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>ضريبة القيمة المضافة:</span>
              <strong>
                {Number(quotation.taxTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quotation.currency}
              </strong>
            </div>
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '12px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>المجموع الإجمالي:</span>
              <strong style={{ fontSize: '22px', color: 'var(--primary-color, #1e40af)' }}>
                {Number(quotation.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} {quotation.currency}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal dialog */}
      {showRejectModal && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
          }}
        >
          <div style={{ maxWidth: '500px', width: '90%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>رفض عرض السعر</h3>
            <form onSubmit={handleRejectSubmit}>
              <div className="input-group">
                <label className="input-label">سبب الرفض (اختياري)</label>
                <textarea
                  className="input"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="يرجى كتابة سبب رفض العرض..."
                  style={{ height: '100px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                  تأكيد الرفض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printing Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-sheet,
          .print-sheet * {
            visibility: visible;
          }
          .print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
