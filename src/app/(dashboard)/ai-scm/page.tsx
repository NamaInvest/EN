'use client';
import { useState } from 'react';

export default function AISCMPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const triggerSCM = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/predictive-scm');
            const data = await res.json();
            setResult(data.message || 'تم فحص المخزون بنجاح.');
        } catch (e) {
            setResult('حدث خطأ أثناء الاتصال بعقل الذكاء الاصطناعي.');
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    <span className="text-4xl">📦</span> المخزون الاستباقي الذكي (AI SCM)
                </h1>
                <p className="text-purple-100 text-lg">
                    هذا النظام المتطور يقوم بمراقبة أرصدة مستودعاتك في الخلفية. 
                    عندما تقترب كمية أي منتج من النفاذ، سيقوم العقل الاصطناعي بإنشاء (أمر شراء) تلقائياً من المورد الافتراضي.
                </p>
                <button 
                    onClick={triggerSCM} 
                    disabled={loading}
                    className="mt-6 bg-white text-indigo-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition shadow-lg disabled:opacity-50"
                >
                    {loading ? 'جاري فحص المستودعات وعمل أوامر شراء...' : 'تشغيل الذكاء الاصطناعي الآن 🚀'}
                </button>
                {result && (
                    <div className="mt-6 bg-black/20 p-4 rounded-xl border border-white/20">
                        <p>{result}</p>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">كيف يعمل هذا النظام؟</h2>
                <ul className="space-y-3 text-gray-600 list-disc list-inside">
                    <li>يعمل تلقائياً كل ليلة لمسح آلاف الأصناف.</li>
                    <li>يحلل سرعة بيع كل منتج (Velocity) ويتوقع تاريخ نفاده.</li>
                    <li>يُنشئ أوامر شراء بحالة "مسودة" لتوافق عليها الإدارة.</li>
                </ul>
            </div>
        </div>
    );
}
