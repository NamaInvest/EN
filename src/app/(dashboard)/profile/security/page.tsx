'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/providers/auth-provider';
import Image from 'next/image';

export default function SecurityProfilePage() {
    const { user } = useAuth();
    const [totpEnabled, setTotpEnabled] = useState(false);
    const [qrUri, setQrUri] = useState('');
    const [secret, setSecret] = useState('');
    const [tokenInput, setTokenInput] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    
    // In a real app, you'd fetch the user's current MFA status from an API endpoint
    // We'll mock it for now since we just built the engine
    useEffect(() => {
        // Fetch user MFA status (mocked or actual endpoint)
        setTotpEnabled(false); 
    }, []);

    const handleEnableMFA = async () => {
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setQrUri(data.uri);
                setSecret(data.secret);
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('حدث خطأ');
        }
    };

    const handleVerifyAndEnable = async () => {
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenInput, userId: user?.id })
            });
            const data = await res.json();
            if (res.ok) {
                setTotpEnabled(true);
                toast.success('تم تفعيل التحقق الثنائي بنجاح');
                // Fetch backup codes
                handleGenerateBackupCodes();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('حدث خطأ');
        }
    };

    const handleDisableMFA = async () => {
        try {
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenInput }) // require current token to disable
            });
            const data = await res.json();
            if (res.ok) {
                setTotpEnabled(false);
                setQrUri('');
                setSecret('');
                setBackupCodes([]);
                toast.success('تم إيقاف التحقق الثنائي');
            } else {
                toast.error(data.error || 'رمز التحقق مطلوب لإيقاف الخدمة');
            }
        } catch (e) {
            toast.error('حدث خطأ');
        }
    };

    const handleGenerateBackupCodes = async () => {
        if (!confirm('سيتم إلغاء الرموز القديمة. هل أنت متأكد؟')) return;
        try {
            const res = await fetch('/api/auth/2fa/backup-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenInput })
            });
            const data = await res.json();
            if (res.ok) {
                setBackupCodes(data.codes);
                toast.success('تم إنشاء رموز احتياطية جديدة');
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('حدث خطأ');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-2xl font-bold">إعدادات الأمان</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        التحقق بخطوتين (2FA)
                        {totpEnabled ? (
                            <Badge variant="default" className="bg-green-600">مفعل</Badge>
                        ) : (
                            <Badge variant="destructive">غير مفعل</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                        استخدم تطبيق مصادقة مثل Google Authenticator أو Authy لإضافة طبقة أمان إضافية لحسابك.
                    </p>

                    {!totpEnabled && !qrUri && (
                        <Button onClick={handleEnableMFA}>إعداد التحقق الثنائي</Button>
                    )}

                    {!totpEnabled && qrUri && (
                        <div className="border p-4 rounded-md space-y-4 bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-semibold">امسح رمز الاستجابة السريعة (QR)</h3>
                            <div className="flex justify-center">
                                <Image src={qrUri} alt="QR Code" width={200} height={200} className="border bg-white" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">أو أدخل هذا الرمز يدوياً:</p>
                                <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded block mt-1">{secret}</code>
                            </div>
                            
                            <div className="flex gap-2 items-end pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex-1 space-y-1">
                                    <label className="text-sm font-medium">رمز التحقق</label>
                                    <Input 
                                        placeholder="أدخل الرمز المكون من 6 أرقام" 
                                        value={tokenInput} 
                                        onChange={(e) => setTokenInput(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                                <Button onClick={handleVerifyAndEnable}>تفعيل</Button>
                            </div>
                        </div>
                    )}

                    {totpEnabled && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="أدخل الرمز المكون من 6 أرقام للإيقاف" 
                                    value={tokenInput} 
                                    onChange={(e) => setTokenInput(e.target.value)}
                                    maxLength={6}
                                    className="max-w-xs"
                                />
                                <Button variant="destructive" onClick={handleDisableMFA}>إيقاف التحقق الثنائي</Button>
                            </div>

                            <div className="border-t pt-4 mt-4 space-y-4">
                                <h3 className="font-semibold">الرموز الاحتياطية (Backup Codes)</h3>
                                <p className="text-sm text-gray-500">استخدم هذه الرموز إذا فقدت الوصول إلى تطبيق المصادقة الخاص بك. كل رمز يستخدم لمرة واحدة فقط.</p>
                                
                                <Button variant="outline" onClick={handleGenerateBackupCodes}>
                                    إنشاء رموز جديدة
                                </Button>

                                {backupCodes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                                        {backupCodes.map((code, idx) => (
                                            <code key={idx} className="font-mono text-center">{code}</code>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
