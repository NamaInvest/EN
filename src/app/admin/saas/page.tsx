"use client";

import React, { useEffect, useState } from "react";
import { Server, Play, Square, RotateCw, Activity, ShieldAlert, CheckCircle, Search, Database } from "lucide-react";

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
};

export default function SaaSAdminDashboard() {
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
            alert("بيانات الدخول غير صحيحة");
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
                        <h1 className="text-2xl font-black text-slate-800">إمبراطورية الأقطاب</h1>
                        <p className="text-sm text-slate-500 mt-2">يرجى تأكيد هويتك للوصول إلى لوحة التحكم الرئيسية</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم</label>
                            <input autoFocus type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mt-2">
                            دخول آمن
                        </button>
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
                alert("فشل تنفيذ الأمر: " + data.error);
            }
        } catch (e) {
            alert("حدث خطأ في الاتصال بالخادم الرئيسي.");
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

    return (
        <div className="app-layout" dir="rtl">
            <div className="main-content" style={{ maxWidth: '100%', margin: 0 }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <div className="page-title">
                        <div className="sidebar-logo-icon" style={{ borderRadius: '50%' }}>
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        إمبراطورية الأقطاب (SaaS Master)
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                            onClick={async () => {
                                setActionLoading("syncing");
                                try {
                                    const res = await fetch("/api/admin/nodes/sync", { method: "POST" });
                                    const data = await res.json();
                                    if(data.success) {
                                        alert("✅ تمت المزامنة والاستعادة: " + data.count + " منشأة");
                                        await fetchNodes();
                                    } else {
                                        alert("خطأ: " + data.error);
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
                            <div className="kpi-label">إجمالي الخوادم المسجلة</div>
                        </div>
                        <div className="kpi-card success">
                            <CheckCircle className="kpi-icon text-white opacity-80" />
                            <div className="kpi-value">{nodes.filter(n => n.pm2Status === "online").length}</div>
                            <div className="kpi-label">تعمل الآن (Online)</div>
                        </div>
                        <div className="kpi-card warning" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Search className="w-6 h-6 text-white opacity-80 mb-2" />
                            <input 
                                placeholder="ابحث عن نظام..." 
                                className="input"
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
                            />
                        </div>
                    </div>

                    {/* Nodes Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4" /> 
                            <h3>جاري استجواب السيرفر الألماني...</h3>
                        </div>
                    ) : nodes.length === 0 && actionLoading === "syncing" ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <RotateCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" /> 
                            <h3>جاري مسح مجلدات السيرفر لاستخراج قواعد البيانات القديمة وتأتمتها...</h3>
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
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{formatUptime(node.uptimeSec)}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
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
                                            <RotateCw className="w-4 h-4" /> ريستارت
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
