'use client';

import { useTranslation } from "@/lib/i18n";

export default function PurchasesOptionsPage() {
    const { t } = useTranslation();

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">خيارات المشتريات</h1>
            </div>
            <div className="page-content">
                <div className="card" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                    
                    <div style={{ paddingBottom: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                         <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>الإعدادات العامة لفواتير المشتريات</h2>
                         <p style={{ color: 'var(--text-muted)' }}>يمكنك من خلال هذه الصفحة التحكم بخصائص المشتريات وطرق الاحتساب الافتراضية.</p>
                    </div>

                    {/* Placeholder for future options */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>طريقة الإدخال الافتراضية</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                اختيار طريقة الفاتورة الافتراضية (متقدمة يدوية أم قياسية). يتم حالياً تحديدها من نافذة الفاتورة مباشرة بموجب التحديث الأخير.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
