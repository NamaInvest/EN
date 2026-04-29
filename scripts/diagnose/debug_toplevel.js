const fs = require('fs');

// Fix barcode page
{
    const p = 'src/app/(dashboard)/barcode/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    const firstFunc = code.indexOf('export default function') !== -1 ? code.indexOf('export default function') : code.indexOf('function ');
    const firstT = code.indexOf("t('");
    if (firstT !== -1 && firstT < firstFunc) {
        console.log('barcode: t() at top level. Context:');
        console.log(code.substring(Math.max(0,firstT-50), firstT+200));
    }
}

// Fix settings page
{
    const p = 'src/app/(dashboard)/settings/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    const firstFunc = code.indexOf('export default function') !== -1 ? code.indexOf('export default function') : code.indexOf('function ');
    const firstT = code.indexOf("t('");
    if (firstT !== -1 && firstT < firstFunc) {
        console.log('\nsettings: t() at top level. Context:');
        console.log(code.substring(Math.max(0,firstT-50), firstT+300));
    }
}
