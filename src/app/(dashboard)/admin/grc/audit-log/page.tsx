'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { 
  ClipboardList, Search, Eye, RefreshCw, AlertTriangle, 
  ChevronLeft, ChevronRight, Filter, Calendar, User, Database, 
  CornerDownLeft, ShieldAlert
} from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface AuditRecord {
  id: string;
  tenantId: string;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string;
  route: string | null;
  oldData: any;
  newData: any;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export default function AuditLogPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { user: currentUser, loading: authLoading, isAdmin } = useUserPermissions();

  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(15);
  
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // JSON Diff Modal
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const fetchAuditLogs = async () => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Build query string
      const url = new URL('/api/admin/audit-logs', window.location.origin);
      url.searchParams.append('page', String(page));
      url.searchParams.append('limit', String(limit));
      if (actionFilter) url.searchParams.append('action', actionFilter);
      if (entityFilter) url.searchParams.append('entityType', entityFilter);

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(_t('غير مصرح. يجب أن تكون مديراً للنظام لعرض هذه السجلات.', 'Access Denied. You must be an administrator to view audit logs.'));
        }
        throw new Error(_t('فشل تحميل سجلات التدقيق', 'Failed to load audit logs'));
      }

      const json = await res.json();
      if (json.ok) {
        setLogs(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalItems(json.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.message || _t('حدث خطأ أثناء تحميل سجل التدقيق', 'An error occurred while loading the audit log'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, entityFilter, authLoading]);

  // Filtering local logic for query search
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesUser = log.user?.name.toLowerCase().includes(query) || log.user?.email.toLowerCase().includes(query);
    const matchesEntityId = log.entityId.toLowerCase().includes(query);
    const matchesRoute = log.route?.toLowerCase().includes(query);
    return matchesUser || matchesEntityId || matchesRoute;
  });

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return { bg: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
    }
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('POST')) {
      return { bg: '#ECFDF5', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' };
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return { bg: '#FFFBEB', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' };
    }
    return { bg: '#EFF6FF', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.2)' };
  };

  if (authLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <LoaderSpinner _t={_t} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '4rem auto 0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <ShieldAlert size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '1rem' }}>
            {_t('غير مصرح بالدخول', 'Access Denied')}
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {_t(
              'عذراً، شاشة سجل تدقيق ورقابة النظام مخصصة فقط لمدراء النظام والمالكين. لا تمتلك حساباتك الصلاحية اللازمة لعرض هذه الحركات الحساسة.',
              'Sorry, the system audit log is restricted to system administrators and owners. Your account does not have the permissions required to view these transactions.'
            )}
          </p>
          <Link href="/"><button className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>{_t('العودة للرئيسية', 'Back to Home')}</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2.2rem', color: 'var(--text)' }}>
            <ClipboardList size={36} color="var(--primary)" /> {_t('سجل تدقيق ورقابة النظام', 'System Audit Trail & CDC')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {_t('مراقبة وتتبع جميع الحركات والتعديلات الميدانية على حقول ومستندات قاعدة البيانات الفورية', 'Audit and track database field edits, creations, and security events live')}
          </p>
        </div>
        <div>
          <button 
            onClick={fetchAuditLogs} 
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
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {_t('تحديث السجلات', 'Refresh Logs')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Left search */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder={_t('بحث عن مستخدم، معرف المستند، أو المسار...', 'Search actor name, entity ID, or path...')} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }}
            />
          </div>

          {/* Right Select filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Filter by Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select 
                value={actionFilter} 
                onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="">{_t('كل العمليات', 'All Actions')}</option>
                <option value="CREATE">{_t('إنشاء', 'Create')}</option>
                <option value="UPDATE">{_t('تعديل', 'Update')}</option>
                <option value="DELETE">{_t('حذف', 'Delete')}</option>
                <option value="LOGIN">{_t('تسجيل دخول', 'Login')}</option>
              </select>
            </div>

            {/* Filter by Entity type */}
            <select 
              value={entityFilter} 
              onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="">{_t('كل أنواع المستندات', 'All Document Entities')}</option>
              <option value="SalesInvoice">{_t('فاتورة مبيعات', 'Sales Invoice')}</option>
              <option value="PurchaseInvoice">{_t('فاتورة مشتريات', 'Purchase Invoice')}</option>
              <option value="PurchaseOrder">{_t('أمر شراء', 'Purchase Order')}</option>
              <option value="User">{_t('مستخدم', 'User')}</option>
              <option value="Shift">{_t('وردية كاشير', 'POS Shift')}</option>
              <option value="StockMovement">{_t('حركة مخزنية', 'Stock Movement')}</option>
              <option value="FixedAsset">{_t('أصل ثابت', 'Fixed Asset')}</option>
              <option value="Treasury">{_t('سند خزينة', 'Treasury Entry')}</option>
            </select>

          </div>
        </div>
      </div>

      {/* Main logs display area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <LoaderSpinner _t={_t} />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>{_t('فشل استرجاع سجلات التدقيق', 'Failed to retrieve GRC logs')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>{error}</p>
          <button onClick={fetchAuditLogs} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px' }}>{_t('إعادة المحاولة', 'Retry')}</button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <ClipboardList size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{_t('لا توجد حركات مسجلة', 'No audit logs captured')}</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{_t('لم نجد أي حركات تدقيق تطابق معايير التصفية والبحث الحالية.', 'No logged database records match your active query filters.')}</p>
        </div>
      ) : (
        <div>
          {/* Table Container */}
          <div className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left', background: 'var(--bg-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('تاريخ وتوقيت الحركة', 'Timestamp')}</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('المستخدم الفاعل', 'Actor')}</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('العملية', 'Action')}</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('المستند المتأثر', 'Affected Entity')}</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('رقم المستند', 'Entity ID')}</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{_t('عنوان الـ IP', 'IP Address')}</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>{_t('التفاصيل', 'Details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const badge = getActionBadgeStyle(log.action);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }} dir="ltr">
                          {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 0.15rem 0', fontWeight: 'bold', color: 'var(--text)' }}>{log.user?.name || _t('حساب آلي / نظام', 'System Event')}</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user?.email || `ID: ${log.userId || '-'}`}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            background: badge.bg,
                            color: badge.color,
                            border: badge.border
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Database size={15} color="var(--primary)" />
                            {log.entityType}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                          {log.entityId}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <button 
                            className="btn btn-outline"
                            onClick={() => setSelectedRecord(log)}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.4rem', 
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.8rem',
                              borderRadius: '6px'
                            }}
                          >
                            <Eye size={14} /> {_t('عرض التغيرات', 'View Diff')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {_t(`عرض سجلات التدقيق (إجمالي الحركات: ${totalItems})`, `Showing audit records (Total events: ${totalItems})`)}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  className="btn" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ display: 'flex', alignItems: 'center', padding: '0.5rem' }}
                >
                  <ChevronRight size={18} />
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', padding: '0 0.5rem' }}>
                  {page} {_t('من', 'of')} {totalPages}
                </span>
                <button 
                  className="btn" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ display: 'flex', alignItems: 'center', padding: '0.5rem' }}
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* JSON Diff Expandable Modal Drawer */}
      {selectedRecord && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ 
            background: 'var(--bg-primary)', 
            width: '100%', 
            maxWidth: '850px', 
            maxHeight: '85vh', 
            borderRadius: '12px', 
            border: '1px solid var(--border)',
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardList size={22} color="var(--primary)" /> {_t('سجل تفاصيل ومقارنة التعديل لقاعدة البيانات', 'Field Audit Comparison Details')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  ID: {selectedRecord.id}
                </span>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                {_t('إغلاق', 'Close')}
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Event Metadata row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('العملية الفاعلة', 'Operation')}</span>
                  <div style={{ fontWeight: 'bold', marginTop: '3px' }}>{selectedRecord.action}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('جدول قاعدة البيانات', 'DB Table')}</span>
                  <div style={{ fontWeight: 'bold', marginTop: '3px' }}>{selectedRecord.entityType}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('معرف المستند', 'Entity ID')}</span>
                  <div style={{ fontWeight: 'bold', marginTop: '3px', fontFamily: 'monospace' }}>{selectedRecord.entityId}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{_t('مسار الـ API', 'API Route')}</span>
                  <div style={{ fontWeight: 'bold', marginTop: '3px', fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{selectedRecord.route || '-'}</div>
                </div>
              </div>

              {/* JSON Data Old vs New */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                
                {/* Old Data */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CornerDownLeft size={16} /> {_t('البيانات الأصلية السابقة (Before)', 'Original Values (Old State)')}
                  </h4>
                  <pre style={{ 
                    margin: 0, 
                    padding: '1rem', 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    fontFamily: 'monospace', 
                    maxHeight: '260px', 
                    overflowY: 'auto',
                    textAlign: 'left',
                    direction: 'ltr',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {selectedRecord.oldData ? JSON.stringify(selectedRecord.oldData, null, 2) : _t('// لا توجد بيانات سابقة (إنشاء)', '// No historical data available (Create event)')}
                  </pre>
                </div>

                {/* New Data */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CornerDownLeft size={16} /> {_t('البيانات المحدثة الجديدة (After)', 'Updated Values (New State)')}
                  </h4>
                  <pre style={{ 
                    margin: 0, 
                    padding: '1rem', 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    fontFamily: 'monospace', 
                    maxHeight: '260px', 
                    overflowY: 'auto',
                    textAlign: 'left',
                    direction: 'ltr',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {selectedRecord.newData ? JSON.stringify(selectedRecord.newData, null, 2) : _t('// لا توجد بيانات محدثة (حذف)', '// No updated data available (Delete event)')}
                  </pre>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function LoaderSpinner({ _t }: { _t: (ar: string, en: string) => string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{_t('جاري جلب سجل التدقيق وحركات التغيير التاريخية...', 'Loading historical change-data-capture logs...')}</p>
    </div>
  );
}
