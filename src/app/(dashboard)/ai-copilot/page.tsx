
'use client';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function AICopilotPage() {
    const { success, info } = useToast();

    const { t } = useTranslation();
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <span className="text-6xl">🤖</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">{t('sys.str_316')}</h1>
            <p className="text-xl text-gray-500 max-w-2xl">
                {t('sys.str_317')}<br/><br/>
                <b>{t('sys.str_318')}</b><br/>
                {t('sys.str_319')}</p>
            <div className="animate-bounce mt-8 p-4 bg-purple-50 rounded-2xl text-purple-600 font-medium">
                {t('sys.str_320')}</div>
        </div>
    );
}
