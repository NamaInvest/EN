'use client';
import { useState } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function AISCMPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const triggerSCM = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/predictive-scm');
            const data = await res.json();
            setResult(data.message || t('sys.str_327'));
        } catch (e) {
            setResult(t('sys.str_328'));
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    <span className="text-4xl">📦</span> {t('sys.str_321')}</h1>
                <p className="text-purple-100 text-lg">
                    {t('sys.str_4138')}</p>
                <button 
                    onClick={triggerSCM} 
                    disabled={loading}
                    className="mt-6 bg-white text-indigo-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition shadow-lg disabled:opacity-50"
                >
                    {loading ? t('sys.str_329') : t('sys.str_330')}
                </button>
                {result && (
                    <div className="mt-6 bg-black/20 p-4 rounded-xl border border-white/20">
                        <p>{result}</p>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">{t('sys.str_323')}</h2>
                <ul className="space-y-3 text-gray-600 list-disc list-inside">
                    <li>{t('sys.str_324')}</li>
                    <li>{t('sys.str_325')}</li>
                    <li>{t('sys.str_326')}</li>
                </ul>
            </div>
        </div>
    );
}
