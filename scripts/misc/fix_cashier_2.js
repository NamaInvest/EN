const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/components/InvoiceReceipt.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
    "fetch('/api/auth/session').then(r=>r.json()).then(s => { if(s?.user?.name) setCashierName(s.user.name); }).catch(()=>{});",
    "fetch('/api/auth/me').then(r=>r.json()).then(s => { if(s?.user?.fullName || s?.user?.username) setCashierName(s.user.fullName || s.user.username); }).catch(()=>{});"
);

// Second complaint implicitly inferred: 
// The RTL number for tax "الرقم الضريبي" has the colon and the number mixed up in LTR in print `311985620700003 :الرقم الضريبي`.
// Wait, the DOM says `{t('sys.str_55')} {getSetting('COMPANY_TAX_NUMBER', '311985620700003')}`.
// I will wrap the number in `<span dir="ltr">...</span>`.

c = c.replace(
    "{t('sys.str_55')} {getSetting('COMPANY_TAX_NUMBER', '311985620700003')}",
    "{t('sys.str_55')} <span dir=\"ltr\">{getSetting('COMPANY_TAX_NUMBER', '311985620700003')}</span>"
);

fs.writeFileSync(file, c);
console.log('Successfully fixed cashier endpoint and RTL tax number string');
