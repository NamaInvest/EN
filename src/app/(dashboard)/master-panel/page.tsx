"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

export default function MasterPanelPage() {
    const { t } = useTranslation();
    const [tenantId, setTenantId] = useState("n4");
    const [port, setPort] = useState("3004");
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const lastPort = localStorage.getItem('lastTenantPort');
        if (lastPort) {
            const nextPort = parseInt(lastPort) + 1;
            setPort(nextPort.toString());
            const tenantNum = nextPort - 3000;
            if (tenantNum > 0) {
                setTenantId(`n${tenantNum}`);
            }
        }
    }, []);

    const handleDeploy = async () => {
        if (!tenantId || !port) {
            alert("يرجى إدخال اسم الشركة ورقم المنفذ (Port)");
            return;
        }

        setLoading(true);
        setLogs(prev => [...prev, `🚀 بدء إنشاء البيئة للشركة: ${tenantId}.namainvist.com على المنفذ ${port}...`]);
        setSuccess(false);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/master-panel/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tenantId, port })
            });

            const data = await res.json();
            
            if (res.ok) {
                setLogs(prev => [...prev, ...data.logs, "✅ اكتمل تفعيل الشركة بنجاح! السيرفر يقوم بالبناء في الخلفية."]);
                setSuccess(true);
                localStorage.setItem('lastTenantPort', port);
                
                // تحديث الـ state للشركة القادمة فوراً
                const nextPort = parseInt(port) + 1;
                setPort(nextPort.toString());
                const tenantNum = nextPort - 3000;
                if (tenantNum > 0) {
                    setTenantId(`n${tenantNum}`);
                }
            } else {
                setLogs(prev => [...prev, "❌ فشل الإنشاء:", data.error || "خطأ غير معروف"]);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, "❌ خطأ في الاتصال بالخادم: " + error.message]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header text-center md:text-right">
                <h1 className="page-title flex items-center justify-center md:justify-start gap-2">
                    <span className="text-primary text-2xl">🌐</span> 
                    محرك الشركات (SaaS Master Panel)
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    لوحة تحكم (Super Admin) لإنشاء نسخ معزولة من النظام للشركات الجديدة بضغطة زر.
                </p>
            </div>

            <div className="bg-card border rounded-xl shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label">اختار معرّف الشركة (مثال: n3)</label>
                        <input 
                            type="text" 
                            className="input" 
                            value={tenantId}
                            onChange={e => setTenantId(e.target.value)}
                            placeholder="n3"
                        />
                        <span className="text-xs text-slate-500 mt-1">النطاق سيكون: {tenantId || 'xxx'}.namainvist.com</span>
                    </div>

                    <div className="form-control">
                        <label className="label">رقم المنفذ (Port)</label>
                        <input 
                            type="number" 
                            className="input" 
                            value={port}
                            onChange={e => setPort(e.target.value)}
                            placeholder="3003"
                        />
                        <span className="text-xs text-slate-500 mt-1">يجب أن يكون منفذاً غير مستخدم في السيرفر</span>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
                    <span className="text-xl">ℹ️</span>
                    <div>
                        <strong>ماذا سيحدث عند الضغط؟</strong>
                        <ul className="list-disc list-inside mt-1 opacity-90 space-y-1">
                            <li>بناء قاعدة بيانات جديدة اسمها <code className="bg-white px-1 rounded">{tenantId}_db</code>.</li>
                            <li>نسخ ملفات النظام الحالية وإنشاء ملف <code className="bg-white px-1 rounded">.env</code> مستقل.</li>
                            <li>تهيئة سيرفر (Nginx) لربط النطاق الجديد.</li>
                            <li>تشغيل بيئة العمل عبر PM2.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button 
                        className="btn btn-primary btn-lg shadow-lg flex items-center gap-2"
                        onClick={handleDeploy}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                                جاري بناء الشركة...
                            </>
                        ) : (
                            <>🚀 إنشاء وتشغيل الشركة الجديدة الآن</>
                        )}
                    </button>
                </div>
            </div>

            {/* Terminal Logs */}
            {logs.length > 0 && (
                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-slate-700 shadow-xl">
                    <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-xs text-slate-400 font-mono ml-2">Terminal / SaaS Engine</span>
                    </div>
                    <div className="p-4 font-mono text-sm space-y-1 max-h-[300px] overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className={
                                log.includes('✅') ? 'text-green-400' :
                                log.includes('❌') ? 'text-red-400' : 'text-slate-300'
                            }>
                                {log}
                            </div>
                        ))}
                        {success && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400">
                                النظام قيد التشغيل! الرابط متاح عبر: 
                                <br/>
                                <a href={`http://${tenantId}.namainvist.com`} target="_blank" rel="noreferrer" className="underline font-bold">
                                    http://{tenantId}.namainvist.com
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
