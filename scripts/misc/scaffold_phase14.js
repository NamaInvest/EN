const fs = require('fs');
const path = require('path');

const pagesToCreate = [
    {
        path: 'src/app/(dashboard)/crm/leads/page.tsx',
        title: 'الفرص البيعية والعملاء المحتملين (CRM)',
        desc: 'إدارة مسار مبيعات العملاء (Pipeline)، تتبع المواعيد، وقياس احتمالية إغلاق الصفقات (Win/Loss).',
        icon: '📊'
    },
    {
        path: 'src/app/(dashboard)/finance/assets/page.tsx',
        title: 'إدارة الأصول الثابتة والإهلاكات (Fixed Assets)',
        desc: 'سجل الأصول المملوكة للشركة، قيمتها التخريدية، واحتساب جداول الإهلاك الشهري الآلي (Depreciation).',
        icon: '🏢'
    },
    {
        path: 'src/app/(dashboard)/enterprise/quality/page.tsx',
        title: 'الجودة والفحص (Quality Control & Inspections)',
        desc: 'وضع معايير الفحص للواردات (GRN) ومراحل التصنيع (MO)، واعتماد فترات الصلاحية (Batches).',
        icon: '🔎'
    },
    {
        path: 'src/app/(dashboard)/enterprise/fleet/page.tsx',
        title: 'إدارة أسطول النقل (Fleet Management)',
        desc: 'تتبع سيارات التوزيع، سجلات الصيانات الدورية، استهلاك الوقود، وتجديد الاستمارات والتأمين.',
        icon: '🚚'
    },
    {
        path: 'src/app/(dashboard)/enterprise/property/page.tsx',
        title: 'إدارة الأملاك والعقارات (Real Estate)',
        desc: 'الهيكل المعماري للمباني، عقود إيجار المستأجرين، لوحة الإشغالات، وإشعارات الدفعات المستحقة.',
        icon: '🏠'
    }
];

const template = (title, desc, icon) => `'use client';
import { Settings } from 'lucide-react';

export default function GenericModuleView() {
    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>${icon}</span> ${title}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        ${desc}
                    </p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>إضافة سجل جديد</span>
                </button>
            </div>

            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)' }}>
                <Settings size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', animation: 'spin 4s linear infinite' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>الوحدة قيد التهيئة (Module Initialization)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                    لقد تم تسجيل هيكل جداول هذا القطاع (SQL Architecture) بنجاح في قاعدة البيانات (Prisma) ضمن المرحلة الختامية 14.
                    واجهات العمليات قيد الربط الفعلي مع السيرفر.
                </p>
            </div>
        </div>
    );
}`;

pagesToCreate.forEach(page => {
    const fullPath = path.join(__dirname, page.path);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, template(page.title, page.desc, page.icon));
    console.log('Created: ' + page.path);
});
