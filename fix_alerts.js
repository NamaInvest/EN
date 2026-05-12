const fs = require('fs');

function fixFile(filePath, isComponent) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add useToast import if not exists
    if (!content.includes('useToast')) {
        content = content.replace(/(import .* from ['"]react['"];?)/, `$1\nimport { useToast } from '@/components/Toast';`);
    }

    // Inject hook inside component
    if (!content.includes('const { error: toastError, success: toastSuccess } = useToast();')) {
        content = content.replace(/(export default function [a-zA-Z0-9_]+\([^)]*\)\s*\{)/, `$1\n    const { error: toastError, success: toastSuccess } = useToast();`);
    }

    // Replace alerts
    content = content.replace(/alert\('تم حفظ المرتجع بنجاح'\)/g, "toastSuccess('تم حفظ المرتجع بنجاح')");
    content = content.replace(/alert\('Error fetching data'\)/g, "toastError('خطأ في جلب البيانات')");
    content = content.replace(/alert\('Network error fetching .*'\)/g, "toastError('فشل الاتصال بالخادم، يرجى المحاولة لاحقاً')");
    content = content.replace(/alert\((.*)\)/g, "toastError($1)");

    fs.writeFileSync(filePath, content);
}

fixFile('src/components/pos/SalesReturnModal.tsx', true);
fixFile('src/app/(dashboard)/accounting/aging-report/page.tsx', true);
fixFile('src/app/(dashboard)/finance/deferred-tax/page.tsx', true);
fixFile('src/app/(dashboard)/finance/transfer-pricing/page.tsx', true);
fixFile('src/app/(dashboard)/finance/impairment/page.tsx', true);
fixFile('src/app/(dashboard)/manufacturing/mes-oee/page.tsx', true);
fixFile('src/app/(dashboard)/hr/succession/page.tsx', true);

