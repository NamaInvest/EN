const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/components/InvoiceReceipt.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inject the state variable
if (!content.includes('const [cashierName, setCashierName] = useState')) {
    content = content.replace(
        "const [companyName, setCompanyName] = useState('');",
        "const [companyName, setCompanyName] = useState('');\n    const [cashierName, setCashierName] = useState('الكاشير');"
    );

    // Inject the fetch session call into the init block
    const initBlockOriginal = `        const init = async () => {
            const settings = await loadSettings();`;
            
    const initBlockNew = `        const init = async () => {
            fetch('/api/auth/session').then(r=>r.json()).then(s => { if(s?.user?.name) setCashierName(s.user.name); }).catch(()=>{});
            const settings = await loadSettings();`;
            
    content = content.replace(initBlockOriginal, initBlockNew);

    // Inject the renderer
    // We explicitly wrote: <strong>{t('sys.str_62')}</strong> {new Date(data.date).toLocaleTimeString('ar-SA')}
    // We change it to:     <strong>{t('sys.str_62')}</strong> {new Date(data.date).toLocaleTimeString('ar-SA')} | <strong>الكاشير:</strong> {cashierName}
    
    content = content.replace(
        "<strong>{t('sys.str_62')}</strong> {new Date(data.date).toLocaleTimeString('ar-SA')}",
        "<strong>الوقت:</strong> {new Date(data.date).toLocaleTimeString('ar-SA')} | <strong>الكاشير:</strong> {cashierName}"
    );

    fs.writeFileSync(file, content);
    console.log("Successfully injected Cashier Name!");
} else {
    console.log("Already injected");
}
