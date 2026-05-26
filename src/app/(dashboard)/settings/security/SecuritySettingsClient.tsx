'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, Smartphone, Monitor, Key, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTranslation } from "@/lib/i18n";

export default function SecuritySettingsClient({ initialData }: { initialData: any }) {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
    const [data, setData] = useState(initialData);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollData, setEnrollData] = useState<any>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [backupConfirmed, setBackupConfirmed] = useState(false);

    const startEnrollment = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/auth/mfa/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId, method: 'TOTP' })
            });
            const result = await res.json();
            if (result.success) {
                setEnrollData(result.data);
                setIsEnrolling(true);
            } else {
                setError(result.message || _t('فشل بدء الإعداد', 'Failed to start enrollment'));
            }
        } catch (e) {
            setError(_t('حدث خطأ غير متوقع', 'An error occurred'));
        }
        setIsSubmitting(false);
    };

    const confirmEnrollment = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/auth/mfa/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId, code: verificationCode })
            });
            const result = await res.json();
            if (result.success) {
                setBackupCodes(result.backupCodes);
                setData({ ...data, mfaEnabled: true, mfaMethod: 'TOTP' });
            } else {
                setError(result.message || _t('رمز التحقق غير صالح', 'Invalid verification code'));
            }
        } catch (e) {
            setError(_t('حدث خطأ غير متوقع', 'An error occurred'));
        }
        setIsSubmitting(false);
    };

    const finishEnrollment = () => {
        setIsEnrolling(false);
        setBackupCodes([]);
        setEnrollData(null);
        setVerificationCode('');
        setBackupConfirmed(false);
    };

    const disableMfa = async () => {
        const code = prompt(_t('يرجى إدخال رمز المصادقة الثنائية الحالي المكون من 6 أرقام لتعطيل المصادقة الثنائية:', 'Please enter your current 6-digit MFA code to disable Two-Factor Authentication:'));
        if (!code || code.length !== 6) {
            toastWarning(_t('رمز غير صالح. لم يتم تعطيل المصادقة الثنائية.', 'Invalid code. MFA was not disabled.'));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/mfa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId, code })
            });
            const result = await res.json();
            if (result.success) {
                setData({ ...data, mfaEnabled: false, mfaMethod: null, backupCodesCount: 0 });
                toastSuccess(_t('تم تعطيل المصادقة الثنائية بنجاح.', 'MFA disabled successfully.'));
            } else {
                toastError(result.error || _t('فشل تعطيل المصادقة الثنائية. الرمز غير صحيح.', 'Failed to disable MFA. Incorrect code.'));
            }
        } catch (e) {
            console.error(e);
            toastError(_t('حدث خطأ غير متوقع.', 'An error occurred.'));
        }
        setIsSubmitting(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{_t('إعدادات الأمان وحماية الحساب', 'Security Settings')}</h1>
                <p className="text-gray-500 mt-2">{_t('إدارة أمان حسابك، المصادقة متعددة العوامل، والأجهزة الموثوقة لتأمين بياناتك.', 'Manage your account security, multi-factor authentication, and trusted devices.')}</p>
            </div>

            {/* Multi-Factor Authentication */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${data.mfaEnabled ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {data.mfaEnabled ? <Shield className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                        </div>
                        <div>
                            <CardTitle>{_t('المصادقة الثنائية (2FA)', 'Two-Factor Authentication (2FA)')}</CardTitle>
                            <CardDescription>
                                {data.mfaEnabled 
                                    ? _t('حسابك آمن للغاية. المصادقة الثنائية نشطة الآن.', 'Your account is highly secure. Two-factor authentication is active.') 
                                    : _t('أضف طبقة أمان إضافية لحسابك عن طريق تفعيل المصادقة الثنائية (2FA).', 'Add an extra layer of security to your account by enabling 2FA.')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {data.mfaEnabled ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{_t('تطبيق المصادقة (TOTP)', 'Authenticator App (TOTP)')}</p>
                                        <p className="text-xs text-gray-500">{_t('تمت التهيئة في', 'Configured on')} {data.mfaEnrolledAt ? new Date(data.mfaEnrolledAt).toLocaleDateString() : _t('مؤخراً', 'recently')}</p>
                                    </div>
                                </div>
                                <Button variant="destructive" size="sm" onClick={disableMfa} disabled={isSubmitting}>{_t('تعطيل المصادقة', 'Disable')}</Button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Key className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{_t('رموز الاسترداد الاحتياطية', 'Recovery Codes')}</p>
                                        <p className="text-xs text-gray-500">{data.backupCodesCount} {_t('رموز متبقية. تم توليدها في', 'codes remaining. Generated on')} {data.backupCodesGeneratedAt ? new Date(data.backupCodesGeneratedAt).toLocaleDateString() : _t('مؤخراً', 'recently')}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" disabled={isSubmitting}>{_t('إعادة توليد الرموز', 'Regenerate')}</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end">
                            <Button onClick={startEnrollment} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? _t('جاري البدء...', 'Starting...') : _t('تفعيل المصادقة الثنائية (Authenticator)', 'Enable 2FA (Authenticator)')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Trusted Devices */}
            {data.mfaEnabled && (
                <Card>
                    <CardHeader>
                        <CardTitle>{_t('الأجهزة الموثوقة', 'Trusted Devices')}</CardTitle>
                        <CardDescription>{_t('الأجهزة التي تتخطى مطالبة المصادقة الثنائية (2FA) لمدة 30 يوماً.', 'Devices that skip the 2FA prompt for 30 days.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.trustedDevices.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">{_t('لا توجد أجهزة موثوقة نشطة حالياً.', 'No trusted devices active.')}</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {data.trustedDevices.filter((d: any) => !d.revokedAt).map((device: any) => (
                                    <div key={device.id} className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-3">
                                            <Monitor className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{device.deviceName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {device.ipAddress} • {device.city ? `${device.city}, ${device.countryCode}` : _t('موقع غير معروف', 'Unknown Location')}
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">{_t('موثوق به حتى', 'Trusted until')} {new Date(device.trustedUntil).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4 mr-2" /> {_t('إلغاء الموثوقية', 'Revoke')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Enrollment Modal */}
            {isEnrolling && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md shadow-xl">
                        <CardHeader>
                            <CardTitle>{_t('إعداد المصادقة الثنائية (2FA)', 'Set up Two-Factor Authentication')}</CardTitle>
                            <CardDescription>{_t('امسح رمز الاستجابة السريعة (QR Code) باستخدام تطبيق Google Authenticator أو Microsoft Authenticator أو Authy.', 'Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
                            
                            {backupCodes.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-green-800">{_t('تم تفعيل المصادقة الثنائية بنجاح!', '2FA Enabled Successfully!')}</p>
                                            <p className="text-xs text-green-600 mt-1">{_t('يرجى حفظ رموز الاسترداد الخاصة بك بأمان. إنها الطريقة الوحيدة للوصول إلى حسابك إذا فقدت هاتفك.', 'Please save your recovery codes. They are the ONLY way to access your account if you lose your phone.')}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm text-center">
                                        {backupCodes.map((code, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded border shadow-sm">{code}</div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <input 
                                            type="checkbox" 
                                            id="saved-codes" 
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            checked={backupConfirmed}
                                            onChange={(e) => setBackupConfirmed(e.target.checked)}
                                        />
                                        <label htmlFor="saved-codes" className="text-sm text-gray-700 cursor-pointer">
                                            {_t('لقد قمت بحفظ رموز الاسترداد هذه بأمان في مكان موثوق', 'I have safely stored these recovery codes')}
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {enrollData?.qrCodeImage && (
                                        <div className="flex justify-center p-4 bg-white border rounded-xl">
                                            <img src={enrollData.qrCodeImage} alt="QR Code" className="w-48 h-48" />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{_t('لا تستطيع المسح الضوئي؟ استخدم مفتاح الإعداد هذا:', "Can't scan? Use this setup key:")}</label>
                                        <code className="block p-3 text-sm text-center bg-gray-50 border rounded-lg break-all text-gray-900">
                                            {enrollData?.secret}
                                        </code>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t">
                                        <label className="text-sm font-medium text-gray-700">{_t('أدخل الرمز المكون من 6 أرقام من تطبيقك لتفعيل الحماية:', 'Enter the 6-digit code from your app:')}</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="000000"
                                            className="w-full text-center text-2xl tracking-widest p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                            {backupCodes.length > 0 ? (
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={!backupConfirmed} onClick={finishEnrollment}>
                                    {_t('إنهاء الإعداد الموثق', 'Finish Setup')}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={() => setIsEnrolling(false)} disabled={isSubmitting}>{_t('إلغاء', 'Cancel')}</Button>
                                    <Button 
                                        className="bg-blue-600 hover:bg-blue-700 text-white" 
                                        onClick={confirmEnrollment} 
                                        disabled={verificationCode.length !== 6 || isSubmitting}
                                    >
                                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {_t('التحقق والتفعيل', 'Verify & Enable')}
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
