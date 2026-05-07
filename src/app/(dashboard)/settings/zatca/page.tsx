'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Key, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ZatcaSettingsDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [otp, setOtp] = useState('');

    const handleAction = async (action: string, payload: any = {}) => {
        setLoading(true);
        setMessage('Processing...');
        try {
            const endpoint = action === 'generate-keys' ? '/api/settings/generate-keys' : '/api/zatca';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setMessage(`Success: ${data.message || data.success}`);
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <QrCode className="w-8 h-8 text-green-600" />
                ZATCA Phase 2 E-Invoicing
            </h1>
            <p className="text-gray-500">Configure and onboard your ERP with ZATCA (Fatoora Portal).</p>

            {message && (
                <div className={`p-4 rounded font-semibold ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Key className="text-blue-500" /> 1. Generate Keys (CSR)</h2>
                    <p className="text-sm text-gray-500">Generates ECDSA Private Key and PKCS#10 CSR based on your company settings.</p>
                    <Button onClick={() => handleAction('generate-keys')} disabled={loading} className="w-full">
                        Generate Private Key & CSR
                    </Button>
                </Card>

                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><AlertCircle className="text-orange-500" /> 2. Compliance CSID</h2>
                    <p className="text-sm text-gray-500">Enter OTP from Fatoora Portal to get your initial Compliance Certificate.</p>
                    <input 
                        type="text" 
                        placeholder="Enter OTP (e.g. 123456)" 
                        className="w-full p-2 border rounded"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <Button onClick={() => handleAction('compliance-csid', { otp })} disabled={loading || !otp} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        Get Compliance CSID
                    </Button>
                </Card>

                <Card className="p-6 space-y-4 md:col-span-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="text-green-500" /> 3. Production CSID</h2>
                    <p className="text-sm text-gray-500">After successful compliance checks, request the permanent Production Certificate to sign Phase 2 invoices.</p>
                    <Button onClick={() => handleAction('production-csid')} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Activate Production CSID (Phase 2)
                    </Button>
                </Card>
            </div>
        </div>
    );
}
