'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

interface DashboardData {
    todaySales: number;
    todayPurchases: number;
    todayProfit: number;
    todayExpenses: number;
    totalProducts: number;
    lowStockCount: number;
    treasuryBalance: number;
    totalCustomers: number;
    salesChart: { date: string; total: number }[];
    topProducts: { name: string; quantity: number }[];
    recentInvoices: { invoiceNo: number; date: string; total: number; paymentType: string; customerName: string }[];
}

interface AiAlert {
    type: string;
    title: string;
    message: string;
}

export default function DashboardPage() {
    
    const [data, setData] = useState<DashboardData | null>(null);
    const { error: toastError, success: toastSuccess } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // AI CFO State
    const [aiAlerts, setAiAlerts] = useState<AiAlert[] | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    const { t, lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    // ── حماية لوحة القيادة — فقط مالك/admin/مدير نظام ──
    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const ADMIN_ROLES = ['admin', 'owner', 'system_admin'];
            if (u.role && !ADMIN_ROLES.includes(u.role)) {
                window.location.href = u.defaultPage || '/pos';
            }
        } catch {}
    }, []);

    const fetchDashboard = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setData(await res.json());
            }
        } catch (err: any) { toastError(err?.message || 'حدث خطأ'); } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(() => fetchDashboard(true), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchDashboard]);

    const fetchAiCfo = async () => {
        if (!data || loadingAi) return;
        setLoadingAi(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ai-cfo', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ metrics: data })
            });
            if (res.ok) {
                const result = await res.json();
                if (result.alerts) setAiAlerts(result.alerts);
            }
        } catch (err: any) { toastError(err?.message || 'حدث خطأ'); } finally {
            setLoadingAi(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value) + ' ' + t('common.sar');
    };

    const paymentKey: Record<string, string> = {
        cash: 'payment.cash', card: 'payment.card', transfer: 'payment.transfer',
        credit: 'payment.credit', installment: 'payment.installment',
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">{t('dashboard.title')}</h1>
                </div>
                <div className="page-content">
                    <div className="kpi-grid">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="kpi-card primary" style={{
                                opacity: 0.5, minHeight: '120px',
                                background: 'var(--bg-card)', border: '1px solid var(--border)'
                            }}>
                                <div style={{
                                    width: '60%', height: '14px', background: 'var(--bg-card-hover)',
                                    borderRadius: '4px', marginBottom: '12px'
                                }} />
                                <div style={{
                                    width: '40%', height: '28px', background: 'var(--bg-card-hover)',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    const d = data || {
        todaySales: 0, todayPurchases: 0, todayProfit: 0,
        todayExpenses: 0, totalProducts: 0, lowStockCount: 0,
        treasuryBalance: 0, totalCustomers: 0, salesChart: [], topProducts: [], recentInvoices: []
    };

    const dateLocale = lang === 'ar' || false ? 'ar-SA' : false ? 'hi-IN' : false ? 'bn-BD' : 'en-US';

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{t('dashboard.title')}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date().toLocaleDateString('en-GB')}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => fetchDashboard(true)}
                        disabled={refreshing}
                        style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
                        {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
                    </button>
                </div>
            </div>

            <div className="page-content animate-fade-in">
                {/* KPI Cards */}
                <div className="kpi-grid">
                    <div className="kpi-card primary">
                        <div className="kpi-icon">💳</div>
                        <div className="kpi-value">{formatCurrency(d.todaySales)}</div>
                        <div className="kpi-label">{t('dashboard.today_sales')}</div>
                    </div>
                    <div className="kpi-card info">
                        <div className="kpi-icon">🛒</div>
                        <div className="kpi-value">{formatCurrency(d.todayPurchases)}</div>
                        <div className="kpi-label">{t('dashboard.today_purchases')}</div>
                    </div>
                    <div className="kpi-card success">
                        <div className="kpi-icon">📈</div>
                        <div className="kpi-value">{formatCurrency(d.todayProfit)}</div>
                        <div className="kpi-label">{t('dashboard.today_profit')}</div>
                    </div>
                    <div className="kpi-card danger">
                        <div className="kpi-icon">💸</div>
                        <div className="kpi-value">{formatCurrency(d.todayExpenses)}</div>
                        <div className="kpi-label">{t('dashboard.today_expenses')}</div>
                    </div>
                    <div className="kpi-card purple">
                        <div className="kpi-icon">📦</div>
                        <div className="kpi-value">{d.totalProducts}</div>
                        <div className="kpi-label">{t('dashboard.total_products')}</div>
                    </div>
                    <div className="kpi-card warning">
                        <div className="kpi-icon">⚠️</div>
                        <div className="kpi-value">{d.lowStockCount}</div>
                        <div className="kpi-label">{t('dashboard.low_stock')}</div>
                    </div>
                    <div className="kpi-card cyan">
                        <div className="kpi-icon">💰</div>
                        <div className="kpi-value">{formatCurrency(d.treasuryBalance)}</div>
                        <div className="kpi-label">{t('dashboard.treasury_balance')}</div>
                    </div>
                    <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff' }}>
                        <div className="kpi-icon">👥</div>
                        <div className="kpi-value">{d.totalCustomers}</div>
                        <div className="kpi-label">{t('dashboard.total_customers')}</div>
                    </div>
                </div>

                {/* AI CFO Widget */}
                <div className="chart-container" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #f8fafc, #eff6ff)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <span>🤖</span> {t('sys.str_549')}</div>
                        <button 
                            className="btn btn-primary btn-sm" 
                            onClick={fetchAiCfo} 
                            disabled={loadingAi || !data}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {loadingAi ? t('sys.str_551') : t('sys.str_552')}
                        </button>
                    </div>
                    
                    {aiAlerts && aiAlerts.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }} className="animate-fade-in">
                            {aiAlerts.map((aiCfoAlert, idx) => {
                                const isDanger = aiCfoAlert.type === 'danger';
                                const isWarning = aiCfoAlert.type === 'warning';
                                const bg = isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4';
                                const borderColor = isDanger ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0';
                                const color = isDanger ? '#991b1b' : isWarning ? '#92400e' : '#166534';
                                const icon = isDanger ? '⚠️' : isWarning ? '⚡' : '✅';
                                
                                return (
                                    <div key={idx} style={{ padding: '16px', borderRadius: '8px', border: '1px solid ' + borderColor, backgroundColor: bg, color }}>
                                        <h4 style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '14px' }}>
                                            {icon} {aiCfoAlert.title}
                                        </h4>
                                        <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>{aiCfoAlert.message}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {!aiAlerts && !loadingAi && (
                        <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed #bfdbfe', borderRadius: '8px', color: '#60a5fa', fontSize: '14px' }}>
                            {t('sys.str_550')}</div>
                    )}
                </div>

                {/* Charts Row */}
                <div className="grid-2" style={{ marginBottom: '24px' }}>
                    {/* Sales Chart */}
                    <div className="chart-container">
                        <div className="chart-title">{t('dashboard.sales_chart')}</div>
                        <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 8px' }}>
                            {(d.salesChart.length > 0 ? d.salesChart :
                                Array.from({ length: 7 }, (_, i) => ({
                                    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-GB'),
                                    total: 0
                                }))
                            ).map((item, i) => {
                                const maxVal = Math.max(...d.salesChart.map(s => s.total), 1);
                                const height = d.salesChart.length > 0 ? (item.total / maxVal) * 200 : 20;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <div style={{
                                            fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600'
                                        }}>
                                            {item.total > 0 ? formatCurrency(item.total) : '-'}
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: `${height}px`,
                                            background: 'var(--gradient-primary)',
                                            borderRadius: '6px 6px 0 0',
                                            minHeight: '8px',
                                            transition: 'height 0.5s ease',
                                            opacity: item.total > 0 ? 1 : 0.2,
                                        }} />
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {typeof item.date === 'string' ? item.date : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="chart-container" style={{ flex: 1 }}>
                            <div className="chart-title">{t('dashboard.top_selling')}</div>
                            {d.topProducts.length === 0 ? (
                                <div className="empty-state" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '14px' }}>{t('dashboard.no_data')}</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {d.topProducts.slice(0, 5).map((p, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '8px 12px', background: 'var(--bg-card-hover)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}>
                                            <span style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: i === 0 ? 'var(--gradient-primary)' :
                                                    i === 1 ? 'var(--gradient-info)' : 'var(--bg-card)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: '700', flexShrink: 0,
                                            }}>{i + 1}</span>
                                            <span style={{ flex: 1, fontSize: '13px', fontWeight: '500' }}>{p.name}</span>
                                            <span className="badge badge-info">{p.quantity} {t('dashboard.sold')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Invoices */}
                {d.recentInvoices.length > 0 && (
                    <div className="chart-container">
                        <div className="chart-title">{t('dashboard.recent_invoices')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {d.recentInvoices.map((inv, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 14px', background: 'var(--bg-card-hover)',
                                    borderRadius: 'var(--radius-sm)',
                                }}>
                                    <span style={{
                                        fontSize: '12px', fontFamily: 'monospace', color: 'var(--primary-light)',
                                        fontWeight: '700', minWidth: '60px',
                                    }}>#{inv.invoiceNo}</span>
                                    <span style={{ flex: 1, fontSize: '13px' }}>{inv.customerName}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {new Date(inv.date).toLocaleDateString('en-GB')}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {t(paymentKey[inv.paymentType] || '') || inv.paymentType}
                                    </span>
                                    <span style={{ fontWeight: '700', fontSize: '13px', fontFamily: 'monospace' }}>
                                        {formatCurrency(inv.total)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
