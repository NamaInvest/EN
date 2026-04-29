'use client';
import { useState } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function AIBankPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const triggerMatch = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/bank-reconciliation');
            const data = await res.json();
            setResult(data.summary || t('sys.str_291'));
        } catch (e) {
            setResult(t('sys.str_292'));
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-[85vh] p-6 w-full">
            <div className="w-full max-w-4xl card-glass border-t-4 border-t-primary shadow-lg p-10 relative overflow-hidden mx-auto text-center">
                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    <span className="text-4xl">🏦</span> {t('sys.str_289')}</h1>
                <p className="text-emerald-50 text-lg">
                    {t('sys.str_4118')}</p>
                <button 
                    onClick={triggerMatch} 
                    disabled={loading}
                    className="mt-6 bg-white text-teal-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition shadow-lg disabled:opacity-50"
                >
                    {loading ? t('sys.str_293') : t('sys.str_294')}
                </button>
                {result && (
                    <div className="mt-6 bg-black/20 p-4 rounded-xl border border-white/20">
                        <p>{result}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
