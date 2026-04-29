const fs = require('fs');
let file = fs.readFileSync('c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx', 'utf8');

if (!file.includes('import FeatureGuard')) {
    file = file.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport FeatureGuard from '@/hooks/FeatureGuard';");
}

file = file.replace(
    "{canDelete && <button className=\"btn\" onClick={() => deleteInvoice(selectedInvoice)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_806')}</button>}",
    "{canDelete && (<FeatureGuard featureKey=\"sales_delete_invoice_btn\"><button className=\"btn\" onClick={() => deleteInvoice(selectedInvoice)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_806')}</button></FeatureGuard>)}"
);

fs.writeFileSync('c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx', file);
console.log("Done");
