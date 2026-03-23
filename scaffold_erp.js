const fs = require('fs');
const path = require('path');

const pagesToCreate = [
    {
        path: 'src/app/(dashboard)/purchases/requisitions/page.tsx',
        title: 'طلبات الشراء الداخلية (PR)',
        desc: 'إدارة طلبات احتياجات الأقسام (Purchase Requisitions) قبل تحويلها إلى أوامر شراء.',
        icon: '📝'
    },
    {
        path: 'src/app/(dashboard)/purchases/rfq/page.tsx',
        title: 'عروض أسعار الموردين (RFQ)',
        desc: 'مقارنة وتسعير طلبات الشراء من عدة موردين (Request for Quotation) لاختيار الأنسب.',
        icon: '📩'
    },
    {
        path: 'src/app/(dashboard)/purchases/grn/page.tsx',
        title: 'سندات الاستلام المخزني (GRN)',
        desc: 'إثبات استلام كميات البضاعة الواردة للمستودع (Goods Receipt Note) بناءً على أوامر الشراء المعتمدة.',
        icon: '📥'
    },
    {
        path: 'src/app/(dashboard)/sales/delivery-notes/page.tsx',
        title: 'مذكرات التسليم المخزني (DN)',
        desc: 'إصدار مذكرات التسليم (Delivery Notes) لصرف البضاعة للعملاء قبل إصدار الفاتورة الضريبية.',
        icon: '🚚'
    },
    {
        path: 'src/app/(dashboard)/stock/movements/page.tsx',
        title: 'حركة الصنف التاريخية (Item Ledger)',
        desc: 'تتبع كارت الصنف التفصيلي والحركات بالكمية والتاريخ لكل مستودع.',
        icon: '⌚'
    },
    {
        path: 'src/app/(dashboard)/stock/adjustments/page.tsx',
        title: 'تسويات الجرد التعديلية',
        desc: 'إثبات العجز والزيادة المخزنية وتسويتها محاسبياً في حسابات الأرباح والخسائر.',
        icon: '⚖️'
    }
];

const template = (title, desc, icon) => `'use client';
import { Settings } from 'lucide-react';

export default function GenericERPView() {
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
                    <span>إضافة مستند جديد</span>
                </button>
            </div>

            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)' }}>
                <Settings size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', animation: 'spin 4s linear infinite' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>لم يتم العثور على سجلات بعد</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                    هذه واجهة مركزية تمت إضافتها ضمن مطابقة دورة العمل המؤسسية (Oracle ERP Lifecycle). 
                    يمكنك البدء قريباً في إنشاء المستندات وربطها بالدورة المستندية تلقائياً.
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
