'use client';

import { useState, useEffect, useCallback } from 'react';

const REPORT_TYPES = [
    { key: 'daily-report', label: 'التقارير اليومية', icon: '📅', description: 'ملخص يومي بالتاريخ والمستخدم', special: true },
    { key: 'sales', label: 'تقرير المبيعات', icon: '💳', description: 'كل فواتير المبيعات مع الإجماليات' },
    { key: 'purchases', label: 'تقرير المشتريات', icon: '🛒', description: 'فواتير الموردين' },
    { key: 'profit', label: 'تقرير الأرباح', icon: '📈', description: 'إيرادات - تكلفة يومياً' },
    { key: 'stock', label: 'تقرير المخزون', icon: '📦', description: 'كل المنتجات + كميات + قيمة' },
    { key: 'stock-audit', label: 'تعديلات المخزون', icon: '🔍', description: 'من عدّل المخزون ومتى وكم', special: true },
    { key: 'expenses', label: 'تقرير المصروفات', icon: '💸', description: 'حسب الفئة' },
    { key: 'customers', label: 'تقرير العملاء', icon: '👥', description: 'أرصدة + أنواع' },
    { key: 'tax', label: 'تقرير الضريبة', icon: '🏛️', description: 'ضريبة محصّلة - مدفوعة = مستحقة' },
    { key: 'discounts-audit', label: 'تدقيق التخفيضات', icon: '🏷️', description: 'من عمل التخفيض وكم ومتى', special: true },
    { key: 'least-selling', label: 'الأقل مبيعاً', icon: '📉', description: 'منتجات لم تُباع خلال 30/60/90 يوم', special: true },
    { key: 'daily-summary', label: 'ملخص يومي', icon: '📊', description: 'مبيعات + مشتريات + مصروفات' },
    { key: 'income-statement', label: 'قائمة الدخل', icon: '📊', description: 'إيرادات - تكلفة = صافي ربح' },
    { key: 'top-sellers', label: 'الأكثر مبيعاً', icon: '🏆', description: 'أعلى 20 منتج' },
    { key: 'profit-margin', label: 'هامش الربح', icon: '📉', description: 'لكل صنف' },
    { key: 'aging', label: 'أعمار الديون', icon: '⏰', description: 'تصنيف 30/60/90+ يوم' },
];

const DAILY_TABS = [
    { key: 'sales', label: 'المبيعات', icon: '💳' },
    { key: 'purchases', label: 'المشتريات', icon: '🛒' },
    { key: 'expenses', label: 'المصروفات', icon: '💸' },
    { key: 'treasury', label: 'الخزينة', icon: '💰' },
    { key: 'salesReturns', label: 'مرتجعات مبيعات', icon: '↩️' },
    { key: 'purchaseReturns', label: 'مرتجعات مشتريات', icon: '↩️' },
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState('all');
    const [dailyTab, setDailyTab] = useState('sales');
    const [leastDays, setLeastDays] = useState(30);

    const fetchFilters = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [usersRes, branchesRes] = await Promise.all([
                fetch('/api/reports/users-list', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (usersRes.ok) setUsers(await usersRes.json());
            if (branchesRes.ok) setBranches(await branchesRes.json());
        } catch { }
    }, []);

    useEffect(() => {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setDateFrom(today);
        setDateTo(today);
        fetchFilters();
    }, [fetchFilters]);

    const fetchReport = async (key: string, overrides?: { days?: number }) => {
        setSelectedReport(key);
        setLoading(true);
        setDailyTab('sales');
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            // user filter for special reports
            if (['daily-report', 'stock-audit', 'discounts-audit'].includes(key)) {
                params.set('userId', selectedUserId);
            }
            if (key === 'least-selling') {
                params.set('days', String(overrides?.days || leastDays));
            }
            if (selectedBranchId && selectedBranchId !== 'all') {
                params.set('branchId', selectedBranchId);
            }
            const res = await fetch(`/api/reports/${key}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setReportData(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

    const handlePrint = () => {
        const reportTitle = REPORT_TYPES.find(r => r.key === selectedReport)?.label || 'تقرير';
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Determine which data array to use
        let dataArr = reportData?.data;
        if (selectedReport === 'daily-report' && reportData) {
            dataArr = reportData[dailyTab] || [];
        }

        let tableHtml = '';
        if (dataArr && Array.isArray(dataArr) && dataArr.length > 0) {
            const headers = Object.keys(dataArr[0]);
            tableHtml = `<table style="width:100%;border-collapse:collapse;margin-top:20px;">
                <thead><tr>${headers.map(h => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:right;">${h}</th>`).join('')}</tr></thead>
                <tbody>${dataArr.map((row: Record<string, unknown>) =>
                `<tr>${Object.values(row).map(v => `<td style="border:1px solid #ddd;padding:8px;text-align:right;">${typeof v === 'number' ? fmt(v) : String(v || '-')}</td>`).join('')}</tr>`
            ).join('')}</tbody></table>`;
        }

        let summaryHtml = '';
        if (reportData?.summary) {
            summaryHtml = `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
                ${Object.entries(reportData.summary).map(([key, value]) =>
                `<div style="background:#f8f9fa;padding:12px 20px;border-radius:8px;text-align:center;min-width:120px;">
                    <div style="font-size:12px;color:#666;margin-bottom:4px;">${key}</div>
                    <div style="font-size:18px;font-weight:700;">${typeof value === 'number' ? fmt(value) : String(value)}</div>
                </div>`
            ).join('')}</div>`;
        }

        const userName = selectedUserId === 'all' ? 'كل المستخدمين' : users.find(u => u.id === parseInt(selectedUserId))?.fullName || '';
        printWindow.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
            <title>${reportTitle}</title>
            <style>body{font-family:Arial,sans-serif;padding:30px;direction:rtl;}
            h1{text-align:center;color:#333;} .date{text-align:center;color:#666;font-size:14px;margin-bottom:20px;}
            @media print{button{display:none !important;}}</style></head><body>
            <h1>${reportTitle}</h1>
            <div class="date">${dateFrom || dateTo ? `من ${dateFrom || '-'} إلى ${dateTo || '-'}` : new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}${userName ? ` | المستخدم: ${userName}` : ''}</div>
            ${summaryHtml}${tableHtml}
            <button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">🖨️ طباعة</button>
        </body></html>`);
        printWindow.document.close();
    };

    const handleExportExcel = async () => {
        let dataArr = reportData?.data;
        if (selectedReport === 'daily-report' && reportData) {
            dataArr = reportData[dailyTab] || [];
        }
        if (!dataArr || dataArr.length === 0) return;
        try {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(dataArr);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Report');
            const reportTitle = REPORT_TYPES.find(r => r.key === selectedReport)?.label || 'report';
            XLSX.writeFile(wb, `${reportTitle}.xlsx`);
        } catch (err) {
            console.error('Excel export error:', err);
            alert('خطأ في تصدير Excel');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTable = (data: any[]) => {
        if (!data || data.length === 0) return <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">لا توجد بيانات</div></div>;
        const headers = Object.keys(data[0]);
        return (
            <div className="table-container">
                <table className="table">
                    <thead><tr>{headers.map(k => <th key={k}>{k}</th>)}</tr></thead>
                    <tbody>
                        {data.map((row: Record<string, unknown>, i: number) => (
                            <tr key={i}>{Object.values(row).map((v, j) => (
                                <td key={j}>{typeof v === 'number' ? fmt(v) : String(v || '-')}</td>
                            ))}</tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderSummaryCards = () => {
        if (!reportData?.summary) return null;
        return (
            <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="card-glass" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{key}</div>
                        <div style={{ fontSize: '20px', fontWeight: '700' }}>{typeof value === 'number' ? fmt(value) : String(value)}</div>
                    </div>
                ))}
            </div>
        );
    };

    // Render user filter dropdown
    const renderUserFilter = () => (
        <select
            className="input"
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            style={{ width: '200px' }}
        >
            <option value="all">👥 كل المستخدمين</option>
            {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.role === 'admin' ? 'مدير' : u.role === 'cashier' ? 'كاشير' : u.role})</option>
            ))}
        </select>
    );

    const renderBranchFilter = () => (
        <select className="input" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} style={{ width: '200px' }}>
            <option value="all">🏢 كل الفروع</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
    );

    // Daily report view
    const renderDailyReport = () => (
        <div>
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <button className="btn btn-ghost" onClick={() => { setSelectedReport(''); setReportData(null); }}>⬅️ رجوع للتقارير</button>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>📅 التقارير اليومية</h2>
                <div className="toolbar-spacer" />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '155px' }} dir="ltr" />
                    <span style={{ color: 'var(--text-muted)' }}>إلى</span>
                    <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '155px' }} dir="ltr" />
                    {renderBranchFilter()}
                    {renderUserFilter()}
                    <button className="btn btn-primary" onClick={() => fetchReport('daily-report')}>🔍 عرض التقرير</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
            ) : reportData ? (
                <>
                    {renderSummaryCards()}
                    {/* Tab buttons */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {DAILY_TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`btn btn-sm ${dailyTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setDailyTab(tab.key)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {tab.icon} {tab.label}
                                {reportData[tab.key] && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', marginRight: '4px' }}>{reportData[tab.key].length}</span>}
                            </button>
                        ))}
                    </div>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontWeight: '700', margin: 0 }}>{DAILY_TABS.find(t => t.key === dailyTab)?.icon} {DAILY_TABS.find(t => t.key === dailyTab)?.label}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-ghost btn-sm" onClick={handlePrint}>🖨️ طباعة</button>
                                <button className="btn btn-ghost btn-sm" onClick={handleExportExcel}>📥 Excel</button>
                            </div>
                        </div>
                        {renderTable(reportData[dailyTab] || [])}
                    </div>
                </>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                    <div style={{ color: 'var(--text-muted)' }}>اختر التاريخ والمستخدم ثم اضغط "عرض التقرير"</div>
                </div>
            )}
        </div>
    );

    // Stock audit / discounts audit view (with user filter)
    const renderFilteredReport = (title: string, icon: string, reportKey: string) => (
        <div>
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <button className="btn btn-ghost" onClick={() => { setSelectedReport(''); setReportData(null); }}>⬅️ رجوع للتقارير</button>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{icon} {title}</h2>
                <div className="toolbar-spacer" />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '155px' }} dir="ltr" />
                    <span style={{ color: 'var(--text-muted)' }}>إلى</span>
                    <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '155px' }} dir="ltr" />
                    {renderBranchFilter()}
                    {renderUserFilter()}
                    <button className="btn btn-primary" onClick={() => fetchReport(reportKey)}>🔍 عرض</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
            ) : reportData ? (
                <div className="card">
                    {renderSummaryCards()}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={handlePrint}>🖨️ طباعة</button>
                        {reportData.data?.length > 0 && <button className="btn btn-ghost btn-sm" onClick={handleExportExcel}>📥 Excel</button>}
                    </div>
                    {renderTable(reportData.data || [])}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{icon}</div>
                    <div style={{ color: 'var(--text-muted)' }}>اختر الفترة والمستخدم ثم اضغط "عرض"</div>
                </div>
            )}
        </div>
    );

    // Least selling products view
    const renderLeastSelling = () => (
        <div>
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <button className="btn btn-ghost" onClick={() => { setSelectedReport(''); setReportData(null); }}>⬅️ رجوع للتقارير</button>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>📉 المنتجات الأقل مبيعاً</h2>
                <div className="toolbar-spacer" />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {renderBranchFilter()}
                    {[30, 60, 90].map(d => (
                        <button
                            key={d}
                            className={`btn btn-sm ${leastDays === d ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => { setLeastDays(d); fetchReport('least-selling', { days: d }); }}
                        >
                            {d} يوم
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
            ) : reportData ? (
                <div className="card">
                    {renderSummaryCards()}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={handlePrint}>🖨️ طباعة</button>
                        {reportData.data?.length > 0 && <button className="btn btn-ghost btn-sm" onClick={handleExportExcel}>📥 Excel</button>}
                    </div>
                    {renderTable(reportData.data || [])}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📉</div>
                    <div style={{ color: 'var(--text-muted)' }}>اختر المدة لعرض المنتجات الأقل مبيعاً</div>
                </div>
            )}
        </div>
    );

    // Standard report view (existing reports like sales, purchases, etc)
    const renderStandardReport = () => (
        <>
            <div className="toolbar">
                <button className="btn btn-ghost" onClick={() => { setSelectedReport(''); setReportData(null); }}>⬅️ رجوع للتقارير</button>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
                    {REPORT_TYPES.find(r => r.key === selectedReport)?.icon} {REPORT_TYPES.find(r => r.key === selectedReport)?.label}
                </h2>
                <div style={{ marginRight: '16px' }}>{renderBranchFilter()}</div>
                <div className="toolbar-spacer" />
                {reportData && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🖨️ طباعة
                        </button>
                        {reportData.data && reportData.data.length > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                📥 تصدير Excel
                            </button>
                        )}
                    </div>
                )}
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
            ) : reportData ? (
                <div className="card">
                    {renderSummaryCards()}
                    {renderTable(reportData.data || [])}
                    {(!reportData.data || reportData.data.length === 0) && !reportData.summary && (
                        <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">لا توجد بيانات لهذه الفترة</div></div>
                    )}
                </div>
            ) : null}
        </>
    );

    // Determine which view to render
    const renderReportView = () => {
        switch (selectedReport) {
            case 'daily-report': return renderDailyReport();
            case 'stock-audit': return renderFilteredReport('تعديلات المخزون', '🔍', 'stock-audit');
            case 'discounts-audit': return renderFilteredReport('تدقيق التخفيضات', '🏷️', 'discounts-audit');
            case 'least-selling': return renderLeastSelling();
            default: return renderStandardReport();
        }
    };

    return (
        <>
            <div className="page-header"><h1 className="page-title">📊 التقارير</h1></div>
            <div className="page-content animate-fade-in">
                {!selectedReport ? (
                    <>
                        <div className="toolbar" style={{ marginBottom: '24px' }}>
                            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                            <span style={{ color: 'var(--text-muted)' }}>إلى</span>
                            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                            {renderBranchFilter()}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {REPORT_TYPES.map(r => (
                                <div
                                    key={r.key}
                                    className="card"
                                    onClick={() => {
                                        if (['daily-report', 'stock-audit', 'discounts-audit', 'least-selling'].includes(r.key)) {
                                            setSelectedReport(r.key);
                                            setReportData(null);
                                            fetchFilters(); // refresh users and branches list each time
                                        } else {
                                            fetchReport(r.key);
                                        }
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        ...(r.special ? { border: '2px solid var(--primary)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))' } : {}),
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ fontSize: '32px' }}>{r.icon}</div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: '700' }}>{r.label}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.description}</div>
                                        </div>
                                        {r.special && <span style={{ marginRight: 'auto', fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>جديد</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : renderReportView()}
            </div>
        </>
    );
}
