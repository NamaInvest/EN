'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Shield, Search, Download, BarChart3, RefreshCw, Filter, ChevronLeft, ChevronRight, FileText, Users, Database, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface AuditLog {
  id: number;
  tableName: string;
  recordId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: number;
  changedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userName?: string;
}

interface Stats {
  total: number;
  byTable: { table: string; count: number }[];
  byUser: { userId: number; name: string; count: number }[];
  recentActivity: any[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TABLE_COLORS: Record<string, string> = {
  Customer: '#3B82F6',
  Product: '#8B5CF6',
  JournalEntry: '#F59E0B',
  PurchaseInvoice: '#EF4444',
  SalesInvoice: '#22C55E',
  Account: '#06B6D4',
  Employee: '#EC4899',
  Vendor: '#F97316',
  Setting: '#64748B',
};

export default function FieldAuditTrailPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');

  // Filters
  const [tableFilter, setTableFilter] = useState('');
  const [recordFilter, setRecordFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (tableFilter) p.set('tableName', tableFilter);
    if (recordFilter) p.set('recordId', recordFilter);
    if (fieldFilter) p.set('fieldName', fieldFilter);
    if (userFilter) p.set('changedBy', userFilter);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    return p;
  }, [tableFilter, recordFilter, fieldFilter, userFilter, dateFrom, dateTo]);

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const p = buildParams();
      p.set('page', String(page));
      p.set('limit', '50');
      const r = await fetch(`/api/audit/field-trail?${p}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (r.ok) {
        const result = await r.json();
        setLogs(result.data || []);
        setPagination(result.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      }
    } catch (e: any) {
      toastError(e?.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadStats = useCallback(async () => {
    try {
      const p = buildParams();
      p.set('stats', 'true');
      const r = await fetch(`/api/audit/field-trail?${p}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (r.ok) setStats(await r.json());
    } catch (e: any) {
      toastError(e?.message);
    }
  }, [buildParams]);

  const exportCSV = async () => {
    try {
      const p = buildParams();
      p.set('export', 'csv');
      p.set('limit', '5000');
      const r = await fetch(`/api/audit/field-trail?${p}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toastSuccess(_t('تم التصدير بنجاح', 'Export completed'));
      }
    } catch (e: any) {
      toastError(e?.message);
    }
  };

  useEffect(() => {
    loadLogs(1);
    loadStats();
  }, []);

  const handleSearch = () => {
    loadLogs(1);
    loadStats();
  };

  const resetFilters = () => {
    setTableFilter(''); setRecordFilter(''); setFieldFilter('');
    setUserFilter(''); setDateFrom(''); setDateTo('');
    setTimeout(() => { loadLogs(1); loadStats(); }, 50);
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }); } catch { return d; }
  };

  const getTableColor = (table: string) => TABLE_COLORS[table] || '#94A3B8';

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Shield size={28} color="var(--primary)" />
            {_t('سجل التدقيق المتقدم', 'Advanced Audit Trail')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {_t('تتبع على مستوى الحقل — SOCPA / ZATCA Compliant', 'Field-level tracking — SOCPA / ZATCA Compliant')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setViewMode(viewMode === 'list' ? 'stats' : 'list')} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            {viewMode === 'list' ? <><BarChart3 size={14} /> {_t('إحصائيات', 'Stats')}</> : <><FileText size={14} /> {_t('قائمة', 'List')}</>}
          </button>
          <button className="btn" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Download size={14} /> {_t('تصدير CSV', 'Export CSV')}
          </button>
          <button className="btn" onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Filter size={14} /> {_t('فلاتر', 'Filters')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: _t('إجمالي التغييرات', 'Total Changes'), value: stats.total, icon: <Database size={16} />, color: '#3B82F6' },
            { label: _t('جداول نشطة', 'Active Tables'), value: stats.byTable.length, icon: <FileText size={16} />, color: '#8B5CF6' },
            { label: _t('مستخدمين', 'Users'), value: stats.byUser.length, icon: <Users size={16} />, color: '#22C55E' },
            { label: _t('آخر نشاط', 'Last Activity'), value: stats.recentActivity[0] ? formatDate(stats.recentActivity[0].changedAt) : '-', icon: <Clock size={16} />, color: '#F59E0B', small: true },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: '14px', textAlign: 'center', borderTop: `3px solid ${k.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px', color: k.color }}>{k.icon}</div>
              <div style={{ fontSize: k.small ? '11px' : '22px', fontWeight: '900', color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{_t('الجدول', 'Table')}</label>
              <select className="input" value={tableFilter} onChange={e => setTableFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="">{_t('الكل', 'All')}</option>
                {['Customer', 'Product', 'JournalEntry', 'PurchaseInvoice', 'SalesInvoice', 'Account', 'Employee', 'Vendor', 'Setting'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{_t('رقم السجل', 'Record ID')}</label>
              <input className="input" type="number" dir="ltr" value={recordFilter} onChange={e => setRecordFilter(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{_t('اسم الحقل', 'Field Name')}</label>
              <input className="input" value={fieldFilter} onChange={e => setFieldFilter(e.target.value)} placeholder="creditLimit..." style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{_t('رقم المستخدم', 'User ID')}</label>
              <input className="input" type="number" dir="ltr" value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{_t('من تاريخ', 'Date From')}</label>
              <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{_t('إلى تاريخ', 'Date To')}</label>
              <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={resetFilters} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={12} /> {_t('مسح', 'Reset')}
            </button>
            <button className="btn btn-primary" onClick={handleSearch} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Search size={14} /> {_t('بحث', 'Search')}
            </button>
          </div>
        </div>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* By Table */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
              {_t('حسب الجدول', 'By Table')}
            </h3>
            {stats.byTable.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTableColor(r.table), flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{r.table}</span>
                <div style={{ flex: 2, height: '6px', borderRadius: '3px', background: 'var(--bg-muted)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((r.count / stats.total) * 100, 100)}%`, height: '100%', borderRadius: '3px', background: getTableColor(r.table), transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: getTableColor(r.table), minWidth: '40px', textAlign: 'right' }}>{r.count}</span>
              </div>
            ))}
            {stats.byTable.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>{_t('لا توجد بيانات', 'No data')}</p>}
          </div>

          {/* By User */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
              {_t('حسب المستخدم', 'By User')}
            </h3>
            {stats.byUser.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `hsl(${r.userId * 137.5 % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{r.name}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>{r.count}</span>
              </div>
            ))}
            {stats.byUser.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>{_t('لا توجد بيانات', 'No data')}</p>}
          </div>
        </div>
      )}

      {/* Data Table */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <div>{_t('جاري التحميل...', 'Loading...')}</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-muted)' }}>
                    {[
                      _t('الجدول', 'Table'),
                      _t('السجل', 'Record'),
                      _t('الحقل', 'Field'),
                      _t('القيمة القديمة', 'Old Value'),
                      _t('القيمة الجديدة', 'New Value'),
                      _t('المستخدم', 'User'),
                      _t('التاريخ', 'Date'),
                      _t('IP', 'IP'),
                    ].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                          background: getTableColor(l.tableName) + '18', color: getTableColor(l.tableName),
                          border: `1px solid ${getTableColor(l.tableName)}30`
                        }}>
                          {l.tableName}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>#{l.recordId}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', fontSize: '12px' }}>
                        {l.fieldName === '__entity__'
                          ? <span style={{ color: l.oldValue ? '#EF4444' : '#22C55E', fontWeight: '700' }}>{l.oldValue ? _t('حذف كامل', 'Full Delete') : _t('إنشاء', 'Created')}</span>
                          : l.fieldName}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#EF4444', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}
                          title={l.oldValue || ''}>
                        {l.oldValue || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#22C55E', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}
                          title={l.newValue || ''}>
                        {l.newValue || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `hsl(${l.changedBy * 137.5 % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                            {(l.userName || '?').charAt(0).toUpperCase()}
                          </div>
                          <span>{l.userName || `#${l.changedBy}`}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(l.changedAt)}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-muted)' }}>{l.ipAddress || '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Shield size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                        <div>{_t('لا توجد سجلات تدقيق', 'No audit records found')}</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <button className="btn" disabled={pagination.page <= 1} onClick={() => loadLogs(pagination.page - 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <ChevronRight size={14} /> {_t('السابق', 'Previous')}
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {_t(`صفحة ${pagination.page} من ${pagination.totalPages}`, `Page ${pagination.page} of ${pagination.totalPages}`)}
                <span style={{ marginRight: '8px', fontSize: '11px' }}>({pagination.total} {_t('سجل', 'records')})</span>
              </span>
              <button className="btn" disabled={pagination.page >= pagination.totalPages} onClick={() => loadLogs(pagination.page + 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                {_t('التالي', 'Next')} <ChevronLeft size={14} />
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
