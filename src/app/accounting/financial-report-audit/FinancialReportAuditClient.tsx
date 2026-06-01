'use client';

import React, { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  route: string;
  ipAddress: string;
  createdAt: string;
  userId: number;
  userName: string;
  metadata: {
    reportType: string;
    format: string;
    from?: string;
    to?: string;
    compare?: boolean;
    hasExport?: boolean;
    source?: string;
    filters?: {
      branchId?: number;
      costCenterId?: number;
      projectId?: number;
      segmentId?: number;
    };
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function FinancialReportAuditClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [reportType, setReportType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  
  // Selected log entry for details drawer
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/accounting/financial-report-audit?page=${page}&limit=15`;
        if (reportType !== 'ALL') url += `&reportType=${reportType}`;
        if (dateFrom) url += `&dateFrom=${dateFrom}`;
        if (dateTo) url += `&dateTo=${dateTo}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(res.status === 401 ? 'غير مصرح للوصول - يرجى تسجيل الدخول' : 'فشل جلب سجلات التدقيق');
        }
        const data = await res.json();
        if (active) {
          setLogs(data.data || []);
          setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      active = false;
    };
  }, [page, reportType, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setReportType('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const getReportName = (type: string) => {
    switch (type) {
      case 'INCOME_STATEMENT': return 'قائمة الدخل (P&L)';
      case 'BALANCE_SHEET': return 'الميزانية العمومية';
      case 'CASH_FLOW': return 'التدفقات النقدية';
      case 'TRIAL_BALANCE': return 'ميزان المراجعة';
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🛡️ سجل تدقيق التقارير المالية (Financial Audit Trail)</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>مراجعة وتتبع جميع عمليات توليد وتصدير وتنزيل التقارير المالية لشركتك بشكل آمن وقابل للتحقق.</p>
        </div>
      </div>

      {/* Filters Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>نوع التقرير المحاسبي</label>
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' }}
            >
              <option value="ALL">الكل (All Reports)</option>
              <option value="INCOME_STATEMENT">قائمة الدخل (Income Statement)</option>
              <option value="BALANCE_SHEET">الميزانية العمومية (Balance Sheet)</option>
              <option value="CASH_FLOW">التدفقات النقدية (Cash Flow)</option>
              <option value="TRIAL_BALANCE">ميزان المراجعة (Trial Balance)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>التاريخ من</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>التاريخ إلى</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleClearFilters}
              style={{ width: '100%', padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              🔄 إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #4f46e5', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
            <p style={{ fontSize: '14px' }}>جاري تحميل سجلات التدقيق...</p>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{error}</p>
            <button onClick={() => setPage(1)} style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>إعادة المحاولة</button>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
            <p style={{ fontSize: '15px', fontWeight: '600' }}>لا توجد سجلات تدقيق متطابقة مع خيارات البحث.</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>يتم تسجيل حركات توليد التقارير وتصديرها تلقائياً عند إجراء أي عملية.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700' }}>العملية</th>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700' }}>التقرير</th>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700' }}>بواسطة</th>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700' }}>تاريخ الحركة</th>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700' }}>IP Address</th>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700' }}>صيغة التصدير</th>
                  <th style={{ padding: '14px 20px', color: '#475569', fontWeight: '700', textAlign: 'center' }}>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((logEntry) => (
                  <tr key={logEntry.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.15s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#0f172a' }}>
                      <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                        {logEntry.action}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '700', color: '#334155' }}>
                      {getReportName(logEntry.entityId)}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>
                      👤 {logEntry.userName}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontFamily: 'monospace' }}>
                      {formatDate(logEntry.createdAt)}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontFamily: 'monospace' }}>
                      🖥️ {logEntry.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        backgroundColor: logEntry.metadata?.format === 'pdf' ? '#fff1f2' : logEntry.metadata?.format === 'xlsx' ? '#f0fdf4' : '#f8fafc',
                        color: logEntry.metadata?.format === 'pdf' ? '#e11d48' : logEntry.metadata?.format === 'xlsx' ? '#16a34a' : '#475569',
                        padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'
                      }}>
                        {logEntry.metadata?.format || 'JSON'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedEntry(logEntry)}
                        style={{ padding: '6px 12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#4f46e5', transition: 'all 0.2s' }}
                      >
                        🔍 عرض المعاملات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              عرض الفئات {logs.length} من أصل {pagination.total} سجل تدقيق محاسبي
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', color: page === 1 ? '#cbd5e1' : '#475569', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                السابق
              </button>
              <span style={{ alignSelf: 'center', fontSize: '13px', color: '#475569', padding: '0 8px' }}>
                صفحة {pagination.page} من {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', color: page === pagination.totalPages ? '#cbd5e1' : '#475569', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Side-Drawer / Modal */}
      {selectedEntry && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', transition: 'all 0.3s' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#ffffff', height: '100%', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease-out' }}>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }' }} />
            
            {/* Drawer Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>🔍 تفاصيل عملية التوليد والتدقيق</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>معاملات وخيارات التصفية المستخدمة لاستخراج هذا التقرير</p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                
                {/* Meta details */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>📊 البيانات الأساسية للعملية</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>التقرير:</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{getReportName(selectedEntry.entityId)}</span>
                    
                    <span style={{ color: '#64748b' }}>نوع الإجراء:</span>
                    <span style={{ fontWeight: '700', color: '#2563eb' }}>{selectedEntry.action}</span>
                    
                    <span style={{ color: '#64748b' }}>صيغة التصدير:</span>
                    <span style={{ fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>{selectedEntry.metadata?.format || 'JSON'}</span>
                    
                    <span style={{ color: '#64748b' }}>المنفذ:</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>👤 {selectedEntry.userName} (مستخدم #{selectedEntry.userId})</span>
                    
                    <span style={{ color: '#64748b' }}>تاريخ الطلب:</span>
                    <span style={{ fontFamily: 'monospace' }}>{formatDate(selectedEntry.createdAt)}</span>
                    
                    <span style={{ color: '#64748b' }}>IP Address:</span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedEntry.ipAddress || '127.0.0.1'}</span>

                    <span style={{ color: '#64748b' }}>رابط الـ API:</span>
                    <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '11px', wordBreak: 'break-all' }}>{selectedEntry.route}</span>
                  </div>
                </div>

                {/* Filter metadata */}
                {selectedEntry.metadata && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>⚙️ خيارات التصفية والمدد (Report Parameters)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '13px' }}>
                      <span style={{ color: '#64748b' }}>الفترة من:</span>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{selectedEntry.metadata.from || 'بدون تحديد'}</span>
                      
                      <span style={{ color: '#64748b' }}>الفترة إلى:</span>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{selectedEntry.metadata.to || 'بدون تحديد'}</span>
                      
                      <span style={{ color: '#64748b' }}>مقارنة فترات:</span>
                      <span style={{ color: selectedEntry.metadata.compare ? '#2563eb' : '#64748b', fontWeight: 'bold' }}>
                        {selectedEntry.metadata.compare ? '✅ نعم (مقارن مع العام السابق)' : '❌ لا'}
                      </span>

                      {selectedEntry.metadata.filters && (
                        <>
                          <span style={{ color: '#64748b' }}>فلتر الفرع:</span>
                          <span>{selectedEntry.metadata.filters.branchId !== undefined ? `فرع #${selectedEntry.metadata.filters.branchId}` : 'الكل'}</span>
                          
                          <span style={{ color: '#64748b' }}>مركز التكلفة:</span>
                          <span>{selectedEntry.metadata.filters.costCenterId !== undefined ? `مركز تكلفة #${selectedEntry.metadata.filters.costCenterId}` : 'الكل'}</span>

                          <span style={{ color: '#64748b' }}>المشروع:</span>
                          <span>{selectedEntry.metadata.filters.projectId !== undefined ? `مشروع #${selectedEntry.metadata.filters.projectId}` : 'الكل'}</span>

                          <span style={{ color: '#64748b' }}>القطاع المحاسبي:</span>
                          <span>{selectedEntry.metadata.filters.segmentId !== undefined ? `قطاع #${selectedEntry.metadata.filters.segmentId}` : 'الكل'}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Security and Integrity note */}
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '16px', marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '6px' }}>🔐 حماية وسلامة المعاملات</div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>تم عزل وتسجيل هذه المعاملة بدقة متناهية تحت سياق tenant isolation الصارم لمنع أي تسريب. عمليات الاستعلام والتوليد لا تؤثر أبداً على سلامة الحسابات وميزان المراجعة، وهي حركات قراءة آمنة بالكامل (Read-only).</p>
                </div>

              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ padding: '8px 16px', backgroundColor: '#64748b', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
