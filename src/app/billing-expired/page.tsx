'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";

export default function BillingExpiredPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-[#0f111a] flex flex-col items-center justify-center text-white" dir="rtl">
            <div className="bg-[#1a1c23] border border-red-500/30 p-10 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center max-w-lg w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                
                <h1 className="text-4xl font-black text-red-500 mb-4">{t('sys.str_128')}</h1>
                <p className="text-xl text-neutral-300 mb-6 leading-relaxed">
                    {t('sys.str_129')}</p>
                
                <div className="bg-red-500/10 rounded-lg p-4 mb-8 text-neutral-400 text-sm">
                    {t('sys.str_130')}</div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => window.open('https://wa.me/966XXXXXXXXX', '_blank')}
                        className="flex-1 bg-gradient-to-r from-[#0066cc] to-[#0052a3] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        {t('sys.str_131')}</button>
                    <button 
                        onClick={handleLogout}
                        className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition-all"
                    >
                        {t('sys.str_132')}</button>
                </div>
            </div>
        </div>
    );
}
