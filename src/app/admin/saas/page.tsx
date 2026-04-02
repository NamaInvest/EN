"use client";

import React, { useEffect, useState } from "react";
import { Server, Play, Square, RotateCw, Activity, ShieldAlert, CheckCircle, Search, Database } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type NodeData = {
    id: number;
    subdomain: string;
    email: string;
    orgName: string;
    status: string;
    pm2Status: string;
    memoryMb: number;
    cpuPercent: number;
    uptimeSec: number;
    paymentStatus: string;
    subscriptionDuration: string;
};

export default function SaaSAdminDashboard() {
    const { t } = useTranslation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchNodes = async () => {
        try {
            const res = await fetch("/api/admin/nodes");
            const data = await res.json();
            if (data.nodes) {
                setNodes(data.nodes);
            }
        } catch (e) {
            console.error("Failed to load nodes", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNodes();
        const interval = setInterval(fetchNodes, 5000); // Live refresh every 5s
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (loginUsername === "admin" && loginPassword === "nama2026") {
            setIsAuthenticated(true);
        } else {
            alert(t('sys.str_1548'));
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">{t('sys.str_1529')}</h1>
                        <p className="text-sm text-slate-500 mt-2">{t('sys.str_1530')}</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_1531')}</label>
                            <input autoFocus type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_1532')}</label>
                            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mt-2">
                            {t('sys.str_1533')}</button>
                    </form>
                </div>
            </div>
        );
    }

    const performAction = async (subdomain: string, action: "start" | "stop" | "restart") => {
        const confirmMsg = action === "stop" 
            ? `تحذير: إيقاف السيرفر ${subdomain} سيؤدي إلى انقطاع الخدمة (502 Gateway) عن العميل. هل أنت متأكد؟`
            : `هل أنت متأكد من رغبتك في ${action} السيرفر ${subdomain}؟`;
            
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(`${subdomain}-${action}`);
        try {
            const res = await fetch("/api/admin/nodes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, subdomain }),
            });
            const data = await res.json();
            if (data.success) {
                // Instantly re-fetch
                await fetchNodes();
            } else {
                alert(t('sys.str_1549') + data.error);
            }
        } catch (e) {
            alert(t('sys.str_1550'));
        } finally {
            setActionLoading(null);
        }
    };

    const formatUptime = (seconds: number) => {
        if (!seconds) return "0s";
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return d + "d " + h + "h " + m + "m";
    };

    // Auto-Sync if zeros
    useEffect(() => {
        if (!isAuthenticated) return;
        if (!loading && nodes.length === 0 && actionLoading !== "syncing") {
            const autoSync = async () => {
                setActionLoading("syncing");
                try {
                    console.log("Auto-triggering reverse sync...");
                    await fetch("/api/admin/nodes/sync", { method: "POST" });
                    await fetchNodes(); // Re-fetch immediately 
                } catch (e) {
                    console.error("Auto-sync failed");
                } finally {
                    setActionLoading(null);
                }
            };
            autoSync();
        }
    }, [isAuthenticated, loading, nodes.length, actionLoading]);

    const updateBilling = async (subdomain: string, field: string, value: string) => {
        try {
            await fetch("/api/admin/nodes/billing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subdomain, [field]: value })
            });
            await fetchNodes();
        } catch(e) {
            alert(t('sys.str_1551'));
        }
    };

    const triggerBackup = async (subdomain: string) => {
        if (!window.confirm(`تنبيه: سيتم ضغط وتصوير ملفات وقواعد بيانات ${subdomain} بالكامل وحفظها في سيرفر Hetzner الرئيسي. هل ترغب في المتابعة؟`)) return;
        
        setActionLoading(`${subdomain}-backup`);
        try {
            const res = await fetch("/api/admin/nodes/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subdomain })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ تم أخذ النسخة الاحتياطية بنجاح:\n${data.message}`);
            } else {
                alert(t('sys.str_1526') + data.error);
            }
        } catch (e) {
            alert(t('sys.str_1552'));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="app-layout" dir="rtl">
            <div className="main-content" style={{ maxWidth: '100%', margin: 0 }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <div className="page-title">
                        <div className="sidebar-logo-icon" style={{ borderRadius: '50%' }}>
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        {t('sys.str_1534')}</div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                            onClick={async () => {
                                setActionLoading("syncing");
                                try {
                                    const res = await fetch("/api/admin/nodes/sync", { method: "POST" });
                                    const data = await res.json();
                                    if(data.success) {
                                        alert(t('sys.str_1553') + data.count + t('sys.str_1554'));
                                        await fetchNodes();
                                    } else {
                                        alert(t('sys.str_1555') + data.error);
                                    }
                                } finally {
                                    setActionLoading(null);
                                }
                            }}
                            disabled={actionLoading === "syncing"}
                            className="btn btn-primary"
                        >
                            <RotateCw className={`w-4 h-4 ${actionLoading === "syncing" ? "animate-spin" : ""}`} />
                            {actionLoading === "syncing" ? "جاري الاسترجاع..." : "مزامنة الأنظمة القديمة"}
                        </button>
                    </div>
                </div>

                <div className="page-content">
                    {/* KPI Cards */}
                    <div className="kpi-grid">
                        <div className="kpi-card primary">
                            <Activity className="kpi-icon text-white opacity-80" />
                            <div className="kpi-value">{nodes.length}</div>
                            <div className="kpi-label">{t('sys.str_1535')}</div>
                        </div>
                        <div className="kpi-card success">
                            <CheckCircle className="kpi-icon text-white opacity-80" />
                            <div className="kpi-value">{nodes.filter(n => n.pm2Status === "online").length}</div>
                            <div className="kpi-label">{t('sys.str_1536')}</div>
                        </div>
                        <div className="kpi-card warning" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Search className="w-6 h-6 text-white opacity-80 mb-2" />
                            <input 
                                placeholder={t('sys.str_1558')} 
                                className="input"
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                            />
                        </div>
                    </div>

                    {/* Nodes Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4" /> 
                            <h3>{t('sys.str_1537')}</h3>
                        </div>
                    ) : nodes.length === 0 && actionLoading === "syncing" ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <RotateCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" /> 
                            <h3>{t('sys.str_1538')}</h3>
                        </div>
                    ) : (
                        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                            {nodes.map((node) => (
                                <div key={node.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: node.pm2Status === 'online' ? 'var(--success)' : 'var(--danger)', boxShadow: node.pm2Status === 'online' ? '0 0 10px var(--success)' : '' }} />
                                                {node.orgName}
                                            </h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{node.email}</p>
                                        </div>
                                        <div className="badge badge-info tracking-wider uppercase font-bold text-xs" style={{ display: 'flex', gap: '6px' }}>
                                            <Server className="w-3 h-3" />
                                            {node.subdomain}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px', background: 'var(--bg-card-hover)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RAM</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{node.memoryMb} <small>MB</small></div>
                                        </div>
                                        <div style={{ borderRight: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CPU</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{node.cpuPercent}%</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>UPTIME</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', direction: 'ltr' }}>{formatUptime(node.uptimeSec)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Billing Control */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{t('sys.str_1539')}</label>
                                            <select 
                                                className="input" 
                                                style={{ padding: '6px 10px', fontSize: '13px', background: node.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)', borderColor: node.paymentStatus === 'paid' ? 'var(--success)' : 'var(--border)' }}
                                                value={node.paymentStatus || "pending"}
                                                onChange={(e) => updateBilling(node.subdomain, "paymentStatus", e.target.value)}
                                            >
                                                <option value="pending">{t('sys.str_1540')}</option>
                                                <option value="paid">{t('sys.str_1541')}</option>
                                                <option value="cancelled">{t('sys.str_1542')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{t('sys.str_1543')}</label>
                                            <select 
                                                className="input" 
                                                style={{ padding: '6px 10px', fontSize: '13px' }}
                                                value={node.subscriptionDuration || "1_year"}
                                                onChange={(e) => updateBilling(node.subdomain, "subscriptionDuration", e.target.value)}
                                            >
                                                <option value="1_year">{t('sys.str_1544')}</option>
                                                <option value="6_months">{t('sys.str_1545')}</option>
                                                <option value="3_months">{t('sys.str_1546')}</option>
                                                <option value="1_month">{t('sys.str_1547')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => triggerBackup(node.subdomain)}
                                            disabled={actionLoading !== null}
                                            className="btn btn-primary" style={{ flex: 1, padding: '8px', background: 'var(--gradient-purple)' }}
                                            title={t('sys.str_1559')}
                                        >
                                            <Database className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => performAction(node.subdomain, "start")}
                                            disabled={node.pm2Status === "online" || actionLoading !== null}
                                            className="btn btn-success" style={{ flex: 1, padding: '8px' }}
                                        >
                                            <Play className="w-4 h-4" style={{ fill: 'currentColor' }} />
                                        </button>
                                        <button 
                                            onClick={() => performAction(node.subdomain, "restart")}
                                            disabled={node.pm2Status !== "online" || actionLoading !== null}
                                            className="btn btn-warning" style={{ flex: 1, padding: '8px' }}
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => performAction(node.subdomain, "stop")}
                                            disabled={node.pm2Status !== "online" || actionLoading !== null}
                                            className="btn btn-danger" style={{ flex: 1, padding: '8px' }}
                                        >
                                            <Square className="w-4 h-4" style={{ fill: 'currentColor' }} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
