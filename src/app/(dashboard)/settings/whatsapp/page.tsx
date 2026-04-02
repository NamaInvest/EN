"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from "@/lib/i18n";

export default function WhatsAppSettingsPage() {
    const { t } = useTranslation();
    const [qr, setQr] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("disconnected");
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/settings/whatsapp');
            if (res.ok) {
                const data = await res.json();
                setQr(data.qr);
                setStatus(data.status);
            }
        } catch (error) {
            console.error("Failed to fetch WhatsApp status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Poll every 5 seconds for updates (e.g. scanning -> connected)
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('sys.str_2535')}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {t('sys.str_2536')}</p>
            </div>

            <div className="max-w-xl rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6 bg-gray-50 border-b">
                    <h3 className="font-semibold leading-none tracking-tight text-lg flex items-center gap-2">
                        <span className="text-green-500">💬</span> {t('sys.str_2537')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('sys.str_2538')}</p>
                </div>
                <div className="p-6 pt-6">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-white">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                <p className="text-sm text-gray-500">{t('sys.str_2539')}</p>
                            </div>
                        ) : status === 'connected' ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h3 className="text-xl font-semibold text-green-700">{t('sys.str_2540')}</h3>
                                <p className="text-gray-500 text-center text-sm">{t('sys.str_2541')}</p>
                            </div>
                        ) : status === 'scanning' && qr ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="bg-white p-4 rounded-xl shadow-sm border">
                                    <QRCodeSVG value={qr} size={256} className="w-64 h-64" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="font-semibold text-gray-800">{t('sys.str_2542')}</h3>
                                    <p className="text-sm text-gray-500 max-w-sm">
                                        {t('sys.str_2543')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                                <h3 className="font-semibold text-gray-800">{t('sys.str_2544')}</h3>
                                <p className="text-sm text-gray-500 max-w-sm">{t('sys.str_2545')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
