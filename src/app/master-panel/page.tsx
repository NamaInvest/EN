'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Server, Users, Key, RefreshCcw, Power } from 'lucide-react';

export default function MasterPanelPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'SaaS' | 'Servers' | 'Desktop' | 'AuditLogs'>('SaaS');
    
    // SaaS State
    const [tenants, setTenants] = useState<any[]>([]);
    // Desktop State
    const [licenses, setLicenses] = useState<any[]>([]);
    // Server State
    const [serverStatus, setServerStatus] = useState<any[]>([]);
    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'SaaS') {
                const res = await fetch('/api/master-panel-data');
                if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }
                if (res.ok) {
                    const data = await res.json();
                    setTenants(Array.isArray(data.tenants) ? data.tenants : (Array.isArray(data.companies) ? data.companies : []));
                }
            } else if (activeTab === 'Servers') {
                const res = await fetch('/api/master-panel/servers');
                if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }
                if (res.ok) {
                    const data = await res.json();
                    setServerStatus(Array.isArray(data.processes) ? data.processes : []);
                }
            } else if (activeTab === 'Desktop') {
                const res = await fetch('/api/master-panel/licenses');
                if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }
                if (res.ok) {
                    const data = await res.json();
                    setLicenses(Array.isArray(data.licenses) ? data.licenses : []);
                }
            } else if (activeTab === 'AuditLogs') {
                const res = await fetch('/api/admin/audit-logs?action=SOFT_LOCK_OVERRIDE&limit=100');
                if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }
                if (res.ok) {
                    const data = await res.json();
                    setAuditLogs(data.data || []);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    const handleSaaSAction = async (tenantId: number, action: string, days: number = 0, userQuota: number = 0) => {
        if (action !== 'open' && !window.confirm(t('sys.str_177'))) return;
        const res = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, action, days, planLabel: 'PRO', userQuota })
        });
        if (res.ok) {
            const data = await res.json();
            if (action === 'open' && data.url) {
                window.open(data.url, '_blank');
            } else {
                fetchData();
            }
        } else {
            const data = await res.json();
            setErrorMsg(data.error || t('sys.str_178'));
            setTimeout(() => setErrorMsg(''), 5000);
        }
    };

    const handleServerAction = async (pm2Id: number, action: string) => {
        if (!window.confirm('Are you sure you want to restart this process?')) return;
        const res = await fetch('/api/master-panel/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pm2Id, action })
        });
        if (res.ok) fetchData();
        else alert('Failed to execute server command.');
    };

    const handleGenerateLicense = async () => {
        const name = prompt('Company Name for Desktop License:');
        if(!name) return;
        const res = await fetch('/api/master-panel/licenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CREATE', companyNameAr: name })
        });
        if (res.ok) fetchData();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
            {errorMsg && (
                <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.4)', color: '#dc2626', borderRadius: '8px', fontWeight: 600 }}>
                    ❌ {errorMsg}
                </div>
            )}
            
            <div className="flex justify-between items-center bg-[#1a1c23] p-6 rounded-xl border border-white/10">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">لوحة التحكم المركزية (الماستر)</h1>
                    <p className="text-neutral-400 font-bold">إدارة المنظومة: السحابية، السيرفرات، والمكتبية</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-[#1a1c23] p-2 rounded-xl border border-white/10 gap-2">
                <button onClick={() => setActiveTab('SaaS')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'SaaS' ? 'bg-[#0066cc] text-white shadow-lg' : 'text-neutral-400 hover:bg-white/5'}`}>
                    <Users className="w-5 h-5"/> المشتركين (SaaS)
                </button>
                <button onClick={() => setActiveTab('Servers')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'Servers' ? 'bg-[#0066cc] text-white shadow-lg' : 'text-neutral-400 hover:bg-white/5'}`}>
                    <Server className="w-5 h-5"/> السيرفرات
                </button>
                <button onClick={() => setActiveTab('Desktop')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'Desktop' ? 'bg-[#0066cc] text-white shadow-lg' : 'text-neutral-400 hover:bg-white/5'}`}>
                    <Key className="w-5 h-5"/> التراخيص المكتبية
                </button>
                <button onClick={() => setActiveTab('AuditLogs')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'AuditLogs' ? 'bg-[#0066cc] text-white shadow-lg' : 'text-neutral-400 hover:bg-white/5'}`}>
                    <Server className="w-5 h-5"/> سجلات التجاوز
                </button>
            </div>

            {/* TAB CONTENTS */}
            {loading ? (
                <div className="p-12 text-center text-white text-xl animate-pulse font-bold">جاري التحميل...</div>
            ) : (
                <>
                    {activeTab === 'SaaS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tenants.map((tenant, index) => {
                                const isActive = tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'trial';
                                const isValidDate = tenant.trialEndsAt && !isNaN(new Date(tenant.trialEndsAt).getTime());
                                const endDate = isValidDate ? new Date(tenant.trialEndsAt).toLocaleDateString('en-GB') : (tenant.subscriptionStatus || t('sys.str_179'));
                                const orgName = tenant.orgName || tenant.name || 'غير محدد';
                                
                                return (
                                    <div key={index} className="bg-[#1a1c23] rounded-xl border border-white/10 p-6 flex flex-col justify-between hover:border-[#0066cc]/50 transition-colors">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-bold text-white">{orgName} <span className="text-sm font-normal text-neutral-400">({tenant.subdomain})</span></h3>
                                                <span className={`px-3 py-1 text-sm rounded-full font-bold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {isActive ? (tenant.subscriptionStatus === 'trial' ? 'نسخة تجريبية' : t('sys.str_180')) : (tenant.subscriptionStatus || t('sys.str_181'))}
                                                </span>
                                            </div>
                                            <div className="text-neutral-400 text-sm space-y-2 mb-6 font-bold">
                                                <p>عدد الفروع والبيانات: <span className="text-white">منعزل</span></p>
                                                <p>{t('sys.str_173')}<span className="text-white">{endDate}</span></p>
                                                <p>{t('sys.str_174')}<span className="text-[#0066cc] font-bold">{tenant.plan || t('sys.str_182')}</span></p>
                                                <p>المستخدمين: <span className="text-purple-400">{tenant.userQuota || 1}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 border-t border-white/5 pt-4 mb-2">
                                            <button onClick={() => handleSaaSAction(tenant.id, 'open')} className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-1.5 rounded-lg font-bold transition-all text-xs border border-green-500/30">فتح النسخة والتحكم</button>
                                            <button onClick={() => {
                                                const u = prompt('أدخل الحد الأقصى للمستخدمين لهذه الشركة:', String(tenant.userQuota || 5));
                                                if(u && !isNaN(Number(u))) handleSaaSAction(tenant.id, 'update_quota', 0, Number(u));
                                            }} className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-1.5 rounded-lg font-bold transition-all text-xs border border-cyan-500/30">سعة المستخدمين</button>
                                        </div>
                                        <div className="flex gap-2 border-t border-white/5 pt-2">
                                            <button onClick={() => handleSaaSAction(tenant.id, 'extend', 30)} className="flex-1 bg-linear-to-r from-[#0066cc] to-[#0052a3] hover:from-[#0052a3] hover:to-[#004080] text-white py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 text-sm">
                                                {t('sys.str_175')}</button>
                                            <button onClick={() => handleSaaSAction(tenant.id, 'suspend')} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 text-sm border border-red-500/30">
                                                {t('sys.str_176')}</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'Servers' && (
                        <div className="bg-[#1a1c23] rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-right text-white font-bold">
                                <thead className="bg-white/5 border-b border-white/10 text-neutral-400 text-sm">
                                    <tr>
                                        <th className="p-4">Process Name</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Memory</th>
                                        <th className="p-4">CPU</th>
                                        <th className="p-4">Uptime</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {serverStatus.map((proc: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-4 flex items-center gap-2"><Server className="w-4 h-4 text-[#0066cc]"/> {proc.name}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 text-xs rounded-full ${proc.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {proc.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-neutral-300">{(proc.memory / 1024 / 1024).toFixed(1)} MB</td>
                                            <td className="p-4 text-neutral-300">{proc.cpu}%</td>
                                            <td className="p-4 text-neutral-300">{Math.floor(proc.uptime / 60000)} mins</td>
                                            <td className="p-4">
                                                <button onClick={() => handleServerAction(proc.pm_id, 'restart')} className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors" title="Restart">
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'Desktop' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={handleGenerateLicense} className="bg-[#0066cc] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#0052a3]">
                                    <Key className="w-4 h-4"/> إصدار ترخيص جديد
                                </button>
                            </div>
                            <div className="bg-[#1a1c23] rounded-xl border border-white/10 overflow-hidden">
                                <table className="w-full text-right text-white font-bold">
                                    <thead className="bg-white/5 border-b border-white/10 text-neutral-400 text-sm">
                                        <tr>
                                            <th className="p-4">الشركة</th>
                                            <th className="p-4">مفتاح الترخيص</th>
                                            <th className="p-4">الحالة</th>
                                            <th className="p-4">تاريخ الإنشاء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {licenses.map((lic: any, i: number) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-4">{lic.companyNameAr || 'غير محدد'}</td>
                                                <td className="p-4 font-mono text-[#0066cc] bg-[#0066cc]/10 px-2 py-1 inline-block rounded mt-3 ml-2">{lic.licenseKey}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 text-xs rounded-full ${lic.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                                        {lic.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-neutral-400">{new Date(lic.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {licenses.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-neutral-500">لا يوجد تراخيص حالياً</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'AuditLogs' && (
                        <div className="bg-[#1a1c23] rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-right text-white font-bold">
                                <thead className="bg-white/5 border-b border-white/10 text-neutral-400 text-sm">
                                    <tr>
                                        <th className="p-4">الشركة (Tenant)</th>
                                        <th className="p-4">المستخدم</th>
                                        <th className="p-4">تاريخ العملية</th>
                                        <th className="p-4">القسم (Module)</th>
                                        <th className="p-4">سبب التجاوز</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-4 text-[#0066cc]">{log.tenantId}</td>
                                            <td className="p-4">{log.user?.name || log.userId || 'غير محدد'}</td>
                                            <td className="p-4 text-neutral-400" dir="ltr">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="p-4 text-purple-400">{log.metadata?.module || 'N/A'}</td>
                                            <td className="p-4 text-yellow-400 max-w-xs truncate" title={log.metadata?.reason}>{log.metadata?.reason || 'بدون سبب'}</td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-neutral-500">لا يوجد تجاوزات مسجلة</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
