'use client';
import { useState, useEffect } from 'react';

export default function MasterPanelPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/master-panel-data');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data.companies);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const handleAction = async (companyId: number, action: string, days: number = 0) => {
        if (!confirm('هل أنت متأكد من تنفيذ هذا الإجراء؟')) return;
        const res = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, action, days, planLabel: 'PRO' })
        });
        if (res.ok) {
            fetchCompanies();
        } else {
            const data = await res.json();
            alert(data.error || 'فشل تنفيذ الإجراء');
        }
    };

    if (loading) return <div className="p-8 text-center text-white">جاري التحميل...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
            <div className="flex justify-between items-center bg-[#1a1c23] p-6 rounded-xl border border-white/10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">لوحة الإدارة المركزية (Master Panel)</h1>
                    <p className="text-neutral-400">إدارة اشتراكات المتاجر والشركات (SaaS Billing)</p>
                </div>
                <div className="bg-[#ebf5ff] text-[#0066cc] px-6 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(0,102,204,0.3)] border border-[#0066cc]/30">
                    العدد الكلي للشركات: {companies.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company, index) => {
                    const latestSub = company.subscriptions?.[0];
                    const isActive = latestSub?.status === 'ACTIVE';
                    const isValidDate = latestSub?.endDate && !isNaN(new Date(latestSub.endDate).getTime());
                    const endDate = isValidDate ? new Date(latestSub.endDate).toLocaleDateString('ar-SA') : (latestSub?.status || 'غير محدد');
                    
                    return (
                        <div key={index} className="bg-[#1a1c23] rounded-xl border border-white/10 p-6 flex flex-col justify-between hover:border-[#0066cc]/50 transition-colors">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{company.name}</h3>
                                    <span className={`px-3 py-1 text-sm rounded-full font-bold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {isActive ? 'نشط' : (latestSub?.status || 'منتهي/معلق')}
                                    </span>
                                </div>
                                <div className="text-neutral-400 text-sm space-y-2 mb-6">
                                    <p>🏢 عدد الفروع: {company.branches?.length || 0}</p>
                                    <p>📅 صالح حتى: <span className="text-white">{endDate}</span></p>
                                    <p>🏷️ الباقة: <span className="text-[#0066cc] font-bold">{latestSub?.planLabel || 'لا يوجد'}</span></p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 border-t border-white/5 pt-4">
                                <button onClick={() => handleAction(company.id, 'extend', 30)} className="flex-1 bg-gradient-to-r from-[#0066cc] to-[#0052a3] hover:from-[#0052a3] hover:to-[#004080] text-white py-2 rounded-lg font-medium transition-all shadow-lg active:scale-95 text-sm">
                                    + تجديد 30 يوم
                                </button>
                                <button onClick={() => handleAction(company.id, 'suspend')} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg font-medium transition-all shadow-lg active:scale-95 text-sm border border-red-500/30">
                                    إيقاف فوري
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
